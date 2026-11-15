import React, { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { createSeedState } from '../data/seed';
import {
  AppSettings,
  AttendanceRecord,
  CalendarEvent,
  Circular,
  Department,
  Exam,
  Holiday,
  Leave,
  LeaveStatus,
  Mark,
  Notification,
  SmartErpState,
  Staff,
  Student,
  TimetableSlot,
  UserSession,
} from '../data/types';
import { formatNowTime12, toDateKey } from '../utils/date';

const STORAGE_KEY = 'smarterp_v1';
const SESSION_KEY = 'smarterp_session_v1';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Action =
  | { type: 'ADD_STUDENT'; payload: Omit<Student, 'id'> }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'DELETE_STUDENT'; payload: number }
  | { type: 'ADD_STAFF'; payload: Omit<Staff, 'id'> }
  | { type: 'UPDATE_STAFF'; payload: Staff }
  | { type: 'DELETE_STAFF'; payload: number }
  | {
      type: 'SAVE_ATTENDANCE_BATCH';
      payload: {
        date: string;
        subject: string;
        period: number;
        records: Array<{ studentId: number; status: 'Present' | 'Absent' | 'Late' }>;
        method?: 'Manual' | 'QR' | 'Face';
        activityText?: string;
      };
    }
  | {
      type: 'UPSERT_SINGLE_ATTENDANCE';
      payload: {
        date: string;
        studentId: number;
        subject: string;
        period: number;
        method: 'Manual' | 'QR' | 'Face';
        status: 'Present' | 'Absent' | 'Late';
        activityText?: string;
      };
    }
  | { type: 'SUBMIT_LEAVE'; payload: Omit<Leave, 'id' | 'status' | 'appliedAt'> }
  | { type: 'DECIDE_LEAVE'; payload: { id: number; status: LeaveStatus; decidedBy: string } }
  | { type: 'ADD_CIRCULAR'; payload: Omit<Circular, 'id'> }
  | { type: 'DELETE_CIRCULAR'; payload: number }
  | { type: 'ADD_HOLIDAY'; payload: Omit<Holiday, 'id'> }
  | { type: 'DELETE_HOLIDAY'; payload: number }
  | { type: 'ADD_EVENT'; payload: Omit<CalendarEvent, 'id'> }
  | { type: 'DELETE_EVENT'; payload: number }
  | { type: 'UPSERT_TIMETABLE'; payload: Omit<TimetableSlot, 'id'> & { id?: number } }
  | { type: 'DELETE_TIMETABLE'; payload: number }
  | { type: 'ADD_DEPARTMENT'; payload: Department }
  | { type: 'DELETE_DEPARTMENT'; payload: string }
  | { type: 'ADD_SUBJECT'; payload: { deptCode: string; subject: string } }
  | { type: 'DELETE_SUBJECT'; payload: { deptCode: string; subject: string } }
  | { type: 'ADD_SECTION'; payload: string }
  | { type: 'ADD_EXAM'; payload: Omit<Exam, 'id'> }
  | { type: 'DELETE_EXAM'; payload: number }
  | { type: 'SAVE_MARKS'; payload: { examId: number; marks: Mark[] } }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'ADD_ACTIVITY'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'TOGGLE_DEMO_OVERRIDE' }
  | { type: 'RESET_DEMO_DATA' }
  | { type: 'RESTORE_BACKUP'; payload: SmartErpState }
  | {
      type: 'IMPORT_BATCH';
      payload: {
        category: 'students' | 'marks' | 'staff' | 'departments' | 'subjects' | 'calendar';
        items: Array<Record<string, unknown>>;
      };
    };

function nextId<T extends { id: number }>(arr: T[]): number {
  return arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;
}

function loadInitialState(): SmartErpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SmartErpState;
      if (parsed && Array.isArray(parsed.students) && parsed.settings) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed
  }
  const seed = createSeedState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    // Ignore storage quota errors
  }
  return seed;
}

function loadInitialSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      return JSON.parse(raw) as UserSession;
    }
  } catch {
    // Ignore
  }
  return null;
}

function reducer(state: SmartErpState, action: Action): SmartErpState {
  const nowTime = formatNowTime12();

  switch (action.type) {
    case 'ADD_STUDENT': {
      const id = nextId(state.students);
      const newStudent: Student = { ...action.payload, id };
      return {
        ...state,
        students: [newStudent, ...state.students],
        recentActivity: [
          { id: nextId(state.recentActivity), text: `Added student ${newStudent.name} (${newStudent.roll})`, time: nowTime },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'UPDATE_STUDENT':
      return {
        ...state,
        students: state.students.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };

    case 'DELETE_STUDENT':
      return {
        ...state,
        students: state.students.filter((s) => s.id !== action.payload),
        attendance: state.attendance.filter((a) => a.studentId !== action.payload),
        leaves: state.leaves.filter((l) => l.studentId !== action.payload),
        marks: state.marks.filter((m) => m.studentId !== action.payload),
      };

    case 'ADD_STAFF': {
      const id = nextId(state.staff);
      const staffMember: Staff = { ...action.payload, id, status: action.payload.status ?? 'Present' };
      return {
        ...state,
        staff: [staffMember, ...state.staff],
        recentActivity: [
          { id: nextId(state.recentActivity), text: `Added staff ${staffMember.name}`, time: nowTime },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'UPDATE_STAFF':
      return {
        ...state,
        staff: state.staff.map((st) => (st.id === action.payload.id ? action.payload : st)),
      };

    case 'DELETE_STAFF':
      return {
        ...state,
        staff: state.staff.filter((st) => st.id !== action.payload),
      };

    case 'SAVE_ATTENDANCE_BATCH': {
      const { date, subject, period, records, method = 'Manual', activityText } = action.payload;
      const studentSet = new Set(records.map((r) => r.studentId));
      const filtered = state.attendance.filter(
        (a) => !(a.date === date && a.subject === subject && a.period === period && studentSet.has(a.studentId))
      );
      const newRows: AttendanceRecord[] = records.map((r, i) => ({
        id: `att_${Date.now()}_${i}_${r.studentId}`,
        date,
        studentId: r.studentId,
        subject,
        period,
        time: nowTime,
        method,
        status: r.status,
      }));
      return {
        ...state,
        attendance: [...newRows, ...filtered],
        recentActivity: [
          {
            id: nextId(state.recentActivity),
            text: activityText || `${method} Attendance saved for ${subject} (P${period}) - ${nowTime}`,
            time: nowTime,
          },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'UPSERT_SINGLE_ATTENDANCE': {
      const { date, studentId, subject, period, method, status, activityText } = action.payload;
      const filtered = state.attendance.filter(
        (a) => !(a.date === date && a.studentId === studentId && a.subject === subject && a.period === period)
      );
      const newRec: AttendanceRecord = {
        id: `att_${Date.now()}_${studentId}`,
        date,
        studentId,
        subject,
        period,
        time: nowTime,
        method,
        status,
      };
      const stu = state.students.find((s) => s.id === studentId);
      return {
        ...state,
        attendance: [newRec, ...filtered],
        recentActivity: [
          {
            id: nextId(state.recentActivity),
            text: activityText || `${method} Attendance marked for ${stu?.name ?? studentId} (${stu?.roll ?? ''}) - ${nowTime}`,
            time: nowTime,
          },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'SUBMIT_LEAVE': {
      const id = nextId(state.leaves);
      const stu = state.students.find((s) => s.id === action.payload.studentId);
      const newLeave: Leave = {
        ...action.payload,
        id,
        status: 'Pending',
        appliedAt: toDateKey(),
      };
      return {
        ...state,
        leaves: [newLeave, ...state.leaves],
        notifications: [
          {
            id: nextId(state.notifications),
            text: `New ${newLeave.reason} request from ${stu?.name ?? 'Student'} (${newLeave.from}).`,
            read: false,
            time: nowTime,
            audience: 'Faculty',
          },
          ...state.notifications,
        ],
        recentActivity: [
          {
            id: nextId(state.recentActivity),
            text: `Leave applied by ${stu?.name ?? 'Student'} (${newLeave.reason})`,
            time: nowTime,
          },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'DECIDE_LEAVE': {
      const target = state.leaves.find((l) => l.id === action.payload.id);
      const stu = target ? state.students.find((s) => s.id === target.studentId) : undefined;
      return {
        ...state,
        leaves: state.leaves.map((l) =>
          l.id === action.payload.id
            ? { ...l, status: action.payload.status, decidedBy: action.payload.decidedBy }
            : l
        ),
        notifications: [
          {
            id: nextId(state.notifications),
            text: `Your ${target?.reason ?? 'leave'} request (${target?.from ?? ''}) was ${action.payload.status} by ${action.payload.decidedBy}.`,
            read: false,
            time: nowTime,
            audience: 'Student',
            studentId: target?.studentId,
          },
          ...state.notifications,
        ],
        recentActivity: [
          {
            id: nextId(state.recentActivity),
            text: `Leave request ${action.payload.status.toLowerCase()} - ${action.payload.decidedBy} (${stu?.name ?? ''})`,
            time: nowTime,
          },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'ADD_CIRCULAR': {
      const id = nextId(state.circulars);
      const circular: Circular = { ...action.payload, id };
      return {
        ...state,
        circulars: [circular, ...state.circulars],
        notifications: [
          {
            id: nextId(state.notifications),
            text: `Circular (${circular.audience}): ${circular.title}`,
            read: false,
            time: nowTime,
            audience: 'All',
          },
          ...state.notifications,
        ],
        recentActivity: [
          {
            id: nextId(state.recentActivity),
            text: `Circular sent to ${circular.audience}: "${circular.title}"`,
            time: nowTime,
          },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'DELETE_CIRCULAR':
      return {
        ...state,
        circulars: state.circulars.filter((c) => c.id !== action.payload),
      };

    case 'ADD_HOLIDAY': {
      const id = nextId(state.holidays);
      return {
        ...state,
        holidays: [...state.holidays, { ...action.payload, id }].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    }

    case 'DELETE_HOLIDAY':
      return {
        ...state,
        holidays: state.holidays.filter((h) => h.id !== action.payload),
      };

    case 'ADD_EVENT': {
      const id = nextId(state.events);
      return {
        ...state,
        events: [...state.events, { ...action.payload, id }].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      };
    }

    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter((e) => e.id !== action.payload),
      };

    case 'UPSERT_TIMETABLE': {
      const slot = action.payload;
      const filtered = state.timetable.filter(
        (t) =>
          !(
            t.day === slot.day &&
            t.period === slot.period &&
            t.dept === slot.dept &&
            t.year === slot.year &&
            t.section === slot.section
          )
      );
      const id = slot.id ?? nextId(state.timetable);
      return {
        ...state,
        timetable: [...filtered, { ...slot, id }],
      };
    }

    case 'DELETE_TIMETABLE':
      return {
        ...state,
        timetable: state.timetable.filter((t) => t.id !== action.payload),
      };

    case 'ADD_DEPARTMENT':
      return {
        ...state,
        departments: [...state.departments, { ...action.payload, sections: action.payload.sections ?? state.settings.sections }],
      };

    case 'DELETE_DEPARTMENT':
      return {
        ...state,
        departments: state.departments.filter((d) => d.code !== action.payload),
      };

    case 'ADD_SUBJECT':
      return {
        ...state,
        departments: state.departments.map((d) =>
          d.code === action.payload.deptCode
            ? { ...d, subjects: [...d.subjects, action.payload.subject] }
            : d
        ),
      };

    case 'DELETE_SUBJECT':
      return {
        ...state,
        departments: state.departments.map((d) =>
          d.code === action.payload.deptCode
            ? { ...d, subjects: d.subjects.filter((s) => s !== action.payload.subject) }
            : d
        ),
      };

    case 'ADD_SECTION': {
      const sec = action.payload.trim().toUpperCase();
      if (!sec || state.settings.sections.includes(sec)) return state;
      const sections = [...state.settings.sections, sec].sort();
      return {
        ...state,
        settings: { ...state.settings, sections },
        departments: state.departments.map((d) => ({
          ...d,
          sections: Array.from(new Set([...(d.sections ?? state.settings.sections), sec])).sort(),
        })),
      };
    }

    case 'ADD_EXAM': {
      const id = nextId(state.exams);
      return {
        ...state,
        exams: [{ ...action.payload, id }, ...state.exams],
      };
    }

    case 'DELETE_EXAM':
      return {
        ...state,
        exams: state.exams.filter((e) => e.id !== action.payload),
        marks: state.marks.filter((m) => m.examId !== action.payload),
      };

    case 'SAVE_MARKS': {
      const { examId, marks } = action.payload;
      const remaining = state.marks.filter((m) => m.examId !== examId);
      return {
        ...state,
        marks: [...remaining, ...marks],
        recentActivity: [
          { id: nextId(state.recentActivity), text: `Marks updated for exam #${examId} (${marks.length} students)`, time: nowTime },
          ...state.recentActivity.slice(0, 19),
        ],
      };
    }

    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [{ ...action.payload, id: nextId(state.notifications) }, ...state.notifications],
      };

    case 'ADD_ACTIVITY':
      return {
        ...state,
        recentActivity: [
          { id: nextId(state.recentActivity), text: action.payload, time: nowTime },
          ...state.recentActivity.slice(0, 19),
        ],
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case 'TOGGLE_DEMO_OVERRIDE':
      return {
        ...state,
        settings: {
          ...state.settings,
          demoWindowOverride: !state.settings.demoWindowOverride,
        },
      };

    case 'RESET_DEMO_DATA':
      return createSeedState();

    case 'RESTORE_BACKUP':
      return action.payload;

    case 'IMPORT_BATCH': {
      const { category, items } = action.payload;
      let nextState = { ...state };
      if (category === 'students') {
        let sId = nextId(nextState.students);
        const added: Student[] = items.map((p) => ({
          id: sId++,
          roll: String(p.roll),
          name: String(p.name),
          dob: String(p.dob),
          dept: String(p.dept),
          year: Number(p.year),
          section: String(p.section || 'A'),
          phone: p.phone ? String(p.phone) : undefined,
        }));
        nextState.students = [...added, ...nextState.students];
      } else if (category === 'staff') {
        let stId = nextId(nextState.staff);
        const added: Staff[] = items.map((p) => ({
          id: stId++,
          name: String(p.name),
          email: String(p.email),
          dept: String(p.dept),
          designation: String(p.designation),
          status: 'Present',
        }));
        nextState.staff = [...added, ...nextState.staff];
      } else if (category === 'departments') {
        const added: Department[] = items.map((p) => ({
          code: String(p.code),
          name: String(p.name),
          subjects: Array.isArray(p.subjects) ? (p.subjects as string[]) : [],
          sections: nextState.settings.sections,
        }));
        nextState.departments = [...nextState.departments, ...added];
      } else if (category === 'subjects') {
        const map = new Map<string, string[]>();
        items.forEach((p) => {
          const d = String(p.dept);
          const s = String(p.subject);
          map.set(d, [...(map.get(d) ?? []), s]);
        });
        nextState.departments = nextState.departments.map((d) =>
          map.has(d.code) ? { ...d, subjects: [...d.subjects, ...(map.get(d.code) ?? [])] } : d
        );
      } else if (category === 'calendar') {
        let evId = nextId(nextState.events);
        const added: CalendarEvent[] = items.map((p) => ({
          id: evId++,
          date: String(p.date),
          title: String(p.title),
          type: p.type as CalendarEvent['type'],
        }));
        nextState.events = [...nextState.events, ...added].sort((a, b) => a.date.localeCompare(b.date));
      } else if (category === 'marks') {
        let exId = nextId(nextState.exams);
        const exams = [...nextState.exams];
        const marks = [...nextState.marks];
        items.forEach((p) => {
          const dept = String(p.dept);
          const year = Number(p.year);
          const section = String(p.section);
          const subject = String(p.subject);
          const examType = String(p.examType);
          const max = Number(p.max);
          const date = String(p.date);
          const studentId = Number(p.studentId);
          const marksVal = Number(p.marks);

          let exam = exams.find(
            (e) =>
              e.dept === dept &&
              e.year === year &&
              e.section === section &&
              e.subject.toLowerCase() === subject.toLowerCase() &&
              e.type.toLowerCase() === examType.toLowerCase()
          );
          if (!exam) {
            exam = { id: exId++, type: examType, dept, year, section, subject, max, date };
            exams.push(exam);
          }
          const idx = marks.findIndex((m) => m.examId === exam!.id && m.studentId === studentId);
          if (idx >= 0) marks[idx] = { examId: exam.id, studentId, marks: marksVal };
          else marks.push({ examId: exam.id, studentId, marks: marksVal });
        });
        nextState.exams = exams;
        nextState.marks = marks;
      }

      nextState.recentActivity = [
        { id: nextId(nextState.recentActivity), text: `Imported ${items.length} ${category} record(s) via Excel`, time: nowTime },
        ...nextState.recentActivity.slice(0, 19),
      ];
      return nextState;
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: SmartErpState;
  dispatch: React.Dispatch<Action>;
  session: UserSession | null;
  login: (session: UserSession) => void;
  logout: () => void;
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: number) => void;
  selectedStudentProfileId: number | null;
  openStudentProfile: (studentId: number) => void;
  closeStudentProfile: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);
  const [session, setSession] = useState<UserSession | null>(loadInitialSession);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const login = useCallback((newSession: UserSession) => {
    setSession(newSession);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    } catch {
      // Ignore
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setSelectedStudentProfileId(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const openStudentProfile = useCallback((studentId: number) => {
    setSelectedStudentProfileId(studentId);
  }, []);

  const closeStudentProfile = useCallback(() => {
    setSelectedStudentProfileId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        session,
        login,
        logout,
        toasts,
        showToast,
        dismissToast,
        selectedStudentProfileId,
        openStudentProfile,
        closeStudentProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
