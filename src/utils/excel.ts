import * as XLSX from 'xlsx';
import { CalendarEventType, SmartErpState } from '../data/types';
import { normalizeImportDate, toDateKey } from './date';

export type ImportCategory =
  | 'students'
  | 'marks'
  | 'staff'
  | 'departments'
  | 'subjects'
  | 'calendar';

export interface ParsedPreviewRow {
  rowNum: number;
  valid: boolean;
  reason?: string;
  displayCells: string[];
  payload?: Record<string, unknown>;
}

export interface ImportTemplateMeta {
  key: ImportCategory;
  label: string;
  headers: string[];
  sampleRows: Array<Array<string | number>>;
}

export const IMPORT_TEMPLATES: Record<ImportCategory, ImportTemplateMeta> = {
  students: {
    key: 'students',
    label: 'Students',
    headers: ['Roll No', 'Name', 'DOB (dd-mm-yyyy)', 'Department', 'Year', 'Section', 'Phone'],
    sampleRows: [
      ['CSE24001', 'Karthik Subramanian', '15-08-2006', 'CSE', 2, 'A', '+91 98765 00001'],
      ['IT24002', 'Meera Krishnan', '22-03-2006', 'IT', 2, 'B', '+91 98765 00002'],
    ],
  },
  marks: {
    key: 'marks',
    label: 'Marks',
    headers: ['Roll No', 'Exam', 'Subject', 'Max Marks', 'Marks', 'Date (dd-mm-yyyy)'],
    sampleRows: [
      ['267325205039', 'Internal Test 2', 'Data Structures', 100, 89, '15-11-2026'],
      ['CSE21055', 'Internal Test 2', 'Data Structures', 100, 92, '15-11-2026'],
    ],
  },
  staff: {
    key: 'staff',
    label: 'Staff',
    headers: ['Name', 'Email', 'Department', 'Designation'],
    sampleRows: [['Dr. N. Prakash', 'prakash@ssec.edu.in', 'CSE', 'Associate Professor']],
  },
  departments: {
    key: 'departments',
    label: 'Departments',
    headers: ['Code', 'Full Name', 'Subjects (comma-separated)'],
    sampleRows: [['AIDS', 'Artificial Intelligence & Data Science', 'Machine Learning, Deep Learning, NLP']],
  },
  subjects: {
    key: 'subjects',
    label: 'Subjects',
    headers: ['Department', 'Subject Name'],
    sampleRows: [['CSE', 'Compiler Design'], ['ECE', 'Embedded Systems']],
  },
  calendar: {
    key: 'calendar',
    label: 'Academic Calendar',
    headers: ['Date (dd-mm-yyyy)', 'Title', 'Type (Exam/Event/Semester)'],
    sampleRows: [['18-12-2026', 'Model Theory Examinations', 'Exam']],
  },
};

export function exportRowsToExcel(
  headers: string[],
  rows: Array<Array<string | number>>,
  filename: string,
  sheetName = 'Sheet1'
): void {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function downloadImportTemplate(category: ImportCategory): void {
  const tpl = IMPORT_TEMPLATES[category];
  exportRowsToExcel(
    tpl.headers,
    tpl.sampleRows,
    `${category}_import_template.xlsx`,
    tpl.label
  );
}

function normalizeHeaderKey(header: string): string {
  return String(header || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function pickValue(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }
  return '';
}

export async function parseAndValidateImportFile(
  file: File,
  category: ImportCategory,
  state: SmartErpState
): Promise<ParsedPreviewRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded workbook has no sheets.');
  }
  const sheet = workbook.Sheets[firstSheetName];
  const rawMatrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  const nonEmpty = rawMatrix.filter((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ''));
  if (nonEmpty.length < 2) {
    throw new Error('The file must contain a header row and at least one data row.');
  }

  const rawHeaders = nonEmpty[0].map((h) => normalizeHeaderKey(String(h)));
  const seenKeys = new Set<string>();
  const deptCodes = new Set(state.departments.map((d) => d.code.toUpperCase()));
  const existingRolls = new Set(state.students.map((s) => s.roll.toUpperCase()));
  const existingStaffEmails = new Set(state.staff.map((st) => st.email.toLowerCase()));

  return nonEmpty.slice(1).map((arr, idx) => {
    const rowNum = idx + 2;
    const obj: Record<string, unknown> = {};
    rawHeaders.forEach((h, cIdx) => {
      if (h) obj[h] = arr[cIdx];
    });

    if (category === 'students') {
      const roll = String(pickValue(obj, 'rollno', 'roll', 'rollnumber')).trim().toUpperCase();
      const name = String(pickValue(obj, 'name', 'studentname')).trim();
      const dob = normalizeImportDate(pickValue(obj, 'dobddmmyyyy', 'dob', 'dateofbirth'));
      const dept = String(pickValue(obj, 'department', 'dept')).trim().toUpperCase();
      const yearNum = Number(String(pickValue(obj, 'year')).replace(/[^0-9]/g, ''));
      const section = String(pickValue(obj, 'section', 'sec') || 'A').trim().toUpperCase();
      const phone = String(pickValue(obj, 'phone', 'mobile') || '').trim();

      if (!roll || !name) {
        return { rowNum, valid: false, reason: 'Roll No and Name are required', displayCells: [roll || '—', name || '—', dept || '—', '—'] };
      }
      if (existingRolls.has(roll) || seenKeys.has(roll)) {
        return { rowNum, valid: false, reason: `Duplicate roll number (${roll})`, displayCells: [roll, name, dept, String(yearNum || '—')] };
      }
      if (!dob) {
        return { rowNum, valid: false, reason: 'Invalid date of birth (use dd-mm-yyyy)', displayCells: [roll, name, dept, String(yearNum || '—')] };
      }
      if (!deptCodes.has(dept)) {
        return { rowNum, valid: false, reason: `Unknown department "${dept || 'blank'}"`, displayCells: [roll, name, dept || '—', String(yearNum || '—')] };
      }
      if (!Number.isInteger(yearNum) || yearNum < 1 || yearNum > 4) {
        return { rowNum, valid: false, reason: 'Year must be between 1 and 4', displayCells: [roll, name, dept, String(yearNum || '—')] };
      }
      seenKeys.add(roll);
      return {
        rowNum,
        valid: true,
        displayCells: [roll, name, `${dept}-${section}`, `Yr ${yearNum}`],
        payload: { roll, name, dob, dept, year: yearNum, section, phone },
      };
    }

    if (category === 'marks') {
      const roll = String(pickValue(obj, 'rollno', 'roll')).trim().toUpperCase();
      const examType = String(pickValue(obj, 'exam', 'examtype')).trim();
      const subject = String(pickValue(obj, 'subject')).trim();
      const max = Number(pickValue(obj, 'maxmarks', 'max'));
      const marksVal = Number(pickValue(obj, 'marks', 'mark', 'score'));
      const rawDate = pickValue(obj, 'dateddmmyyyy', 'date');
      const parsedDate = rawDate ? normalizeImportDate(rawDate) : toDateKey();

      const stu = state.students.find((s) => s.roll.toUpperCase() === roll);
      if (!stu) {
        return { rowNum, valid: false, reason: `Unknown student roll "${roll || 'blank'}"`, displayCells: [roll || '—', subject || '—', String(marksVal || '—'), '—'] };
      }
      if (!examType || !subject) {
        return { rowNum, valid: false, reason: 'Exam and Subject are required', displayCells: [roll, subject || '—', String(marksVal), examType || '—'] };
      }
      if (!Number.isFinite(max) || max <= 0) {
        return { rowNum, valid: false, reason: 'Max Marks must be > 0', displayCells: [roll, subject, String(marksVal), examType] };
      }
      if (!Number.isFinite(marksVal) || marksVal < 0 || marksVal > max) {
        return { rowNum, valid: false, reason: `Marks (${marksVal}) exceed max (${max}) or negative`, displayCells: [roll, subject, `${marksVal}/${max}`, examType] };
      }
      if (!parsedDate) {
        return { rowNum, valid: false, reason: 'Invalid date (use dd-mm-yyyy)', displayCells: [roll, subject, `${marksVal}/${max}`, examType] };
      }
      return {
        rowNum,
        valid: true,
        displayCells: [stu.roll, stu.name, subject, `${marksVal}/${max}`],
        payload: { studentId: stu.id, dept: stu.dept, year: stu.year, section: stu.section, examType, subject, max, marks: marksVal, date: parsedDate },
      };
    }

    if (category === 'staff') {
      const name = String(pickValue(obj, 'name', 'staffname')).trim();
      const email = String(pickValue(obj, 'email')).trim().toLowerCase();
      const dept = String(pickValue(obj, 'department', 'dept')).trim().toUpperCase();
      const designation = String(pickValue(obj, 'designation', 'role') || 'Assistant Professor').trim();

      if (!name || !email) {
        return { rowNum, valid: false, reason: 'Name and Email are required', displayCells: [name || '—', email || '—', dept || '—', designation] };
      }
      if (existingStaffEmails.has(email) || seenKeys.has(email)) {
        return { rowNum, valid: false, reason: `Duplicate email (${email})`, displayCells: [name, email, dept, designation] };
      }
      if (!deptCodes.has(dept)) {
        return { rowNum, valid: false, reason: `Unknown department "${dept || 'blank'}"`, displayCells: [name, email, dept || '—', designation] };
      }
      seenKeys.add(email);
      return {
        rowNum,
        valid: true,
        displayCells: [name, email, dept, designation],
        payload: { name, email, dept, designation },
      };
    }

    if (category === 'departments') {
      const code = String(pickValue(obj, 'code', 'departmentcode')).trim().toUpperCase();
      const name = String(pickValue(obj, 'fullname', 'name')).trim();
      const subjectsRaw = String(pickValue(obj, 'subjectscommaseparated', 'subjects') || '').trim();
      const subjects = subjectsRaw ? subjectsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

      if (!code || !name) {
        return { rowNum, valid: false, reason: 'Code and Full Name are required', displayCells: [code || '—', name || '—', subjectsRaw || '—', '—'] };
      }
      if (deptCodes.has(code) || seenKeys.has(code)) {
        return { rowNum, valid: false, reason: `Department "${code}" already exists`, displayCells: [code, name, String(subjects.length), '—'] };
      }
      seenKeys.add(code);
      return {
        rowNum,
        valid: true,
        displayCells: [code, name, `${subjects.length} subjects`, 'A, B, C'],
        payload: { code, name, subjects },
      };
    }

    if (category === 'subjects') {
      const dept = String(pickValue(obj, 'department', 'dept')).trim().toUpperCase();
      const subject = String(pickValue(obj, 'subjectname', 'subject', 'name')).trim();
      if (!deptCodes.has(dept)) {
        return { rowNum, valid: false, reason: `Unknown department "${dept || 'blank'}"`, displayCells: [dept || '—', subject || '—', '—', '—'] };
      }
      if (!subject) {
        return { rowNum, valid: false, reason: 'Subject Name is required', displayCells: [dept, '—', '—', '—'] };
      }
      const key = `${dept}:${subject.toLowerCase()}`;
      const existingDept = state.departments.find((d) => d.code === dept);
      if (existingDept?.subjects.some((s) => s.toLowerCase() === subject.toLowerCase()) || seenKeys.has(key)) {
        return { rowNum, valid: false, reason: `Subject "${subject}" already exists in ${dept}`, displayCells: [dept, subject, '—', '—'] };
      }
      seenKeys.add(key);
      return {
        rowNum,
        valid: true,
        displayCells: [dept, subject, 'Active', '—'],
        payload: { dept, subject },
      };
    }

    // calendar
    const date = normalizeImportDate(pickValue(obj, 'dateddmmyyyy', 'date'));
    const title = String(pickValue(obj, 'title', 'event')).trim();
    const rawType = String(pickValue(obj, 'typeexameventsemester', 'type') || 'Event').trim();
    const validType: CalendarEventType =
      (['Exam', 'Event', 'Semester'].find((t) => t.toLowerCase() === rawType.toLowerCase()) as CalendarEventType) ||
      'Event';

    if (!date) {
      return { rowNum, valid: false, reason: 'Invalid date (use dd-mm-yyyy)', displayCells: [String(pickValue(obj, 'dateddmmyyyy', 'date') || '—'), title || '—', validType, '—'] };
    }
    if (!title) {
      return { rowNum, valid: false, reason: 'Event title is required', displayCells: [date, '—', validType, '—'] };
    }
    return {
      rowNum,
      valid: true,
      displayCells: [date, title, validType, 'Calendar'],
      payload: { date, title, type: validType },
    };
  });
}
