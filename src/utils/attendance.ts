import { AttendanceRecord, Department, Exam, Mark, Student } from '../data/types';
import { addDaysKey, toDateKey } from './date';

export interface StudentAttendanceStats {
  present: number;
  late: number;
  absent: number;
  attended: number; // present + late
  total: number;
  pct: number;
  absentLast7Days: number;
  lateCount: number;
}

export function computeStudentAttendanceStats(
  studentId: number,
  attendance: AttendanceRecord[]
): StudentAttendanceStats {
  const recs = attendance.filter((r) => r.studentId === studentId);
  const total = recs.length;
  let present = 0;
  let late = 0;
  let absent = 0;
  let absentLast7Days = 0;
  const sevenDaysAgo = addDaysKey(new Date(), -6);

  for (const r of recs) {
    if (r.status === 'Present') present++;
    else if (r.status === 'Late') late++;
    else {
      absent++;
      if (r.date >= sevenDaysAgo) absentLast7Days++;
    }
  }
  const attended = present + late;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
  return { present, late, absent, attended, total, pct, absentLast7Days, lateCount: late };
}

export function computeSubjectAttendance(
  studentId: number,
  attendance: AttendanceRecord[]
): Array<{ subject: string; attended: number; total: number; pct: number }> {
  const map = new Map<string, { attended: number; total: number }>();
  for (const r of attendance) {
    if (r.studentId !== studentId) continue;
    const prev = map.get(r.subject) ?? { attended: 0, total: 0 };
    prev.total += 1;
    if (r.status === 'Present' || r.status === 'Late') prev.attended += 1;
    map.set(r.subject, prev);
  }
  return Array.from(map.entries()).map(([subject, val]) => ({
    subject,
    attended: val.attended,
    total: val.total,
    pct: val.total > 0 ? Math.round((val.attended / val.total) * 100) : 0,
  }));
}

export function classesNeededForTarget(
  attended: number,
  total: number,
  targetPct: number = 75
): number {
  if (total === 0) return 0;
  const target = targetPct / 100;
  if (attended / total >= target) return 0;
  const needed = Math.ceil((target * total - attended) / (1 - target));
  return Math.max(1, needed);
}

export function classesCanMiss(
  attended: number,
  total: number,
  targetPct: number = 75
): number {
  if (total === 0) return 0;
  const target = targetPct / 100;
  if (attended / total < target) return 0;
  return Math.max(0, Math.floor(attended / target - total));
}

export function computeTodaySummary(
  students: Student[],
  attendance: AttendanceRecord[],
  dateKey: string = toDateKey()
) {
  const todayRecs = attendance.filter((r) => r.date === dateKey);
  const statusByStudent = new Map<number, 'Present' | 'Absent' | 'Late'>();
  for (const r of todayRecs) {
    // If multiple periods today, Present/Late takes precedence or latest period
    const existing = statusByStudent.get(r.studentId);
    if (!existing || r.status === 'Present') {
      statusByStudent.set(r.studentId, r.status);
    }
  }
  let presentToday = 0;
  let lateToday = 0;
  let absentToday = 0;
  for (const stu of students) {
    const st = statusByStudent.get(stu.id);
    if (st === 'Present') presentToday++;
    else if (st === 'Late') lateToday++;
    else if (st === 'Absent') absentToday++;
  }
  return {
    presentToday: presentToday + lateToday,
    presentStrict: presentToday,
    lateToday,
    absentToday,
    markedCount: statusByStudent.size,
    unmarkedCount: Math.max(0, students.length - statusByStudent.size),
  };
}

export function computeDepartmentBreakdown(
  students: Student[],
  departments: Department[],
  attendance: AttendanceRecord[]
): Array<{ code: string; name: string; pct: number; studentCount: number; atRiskCount: number }> {
  const stuMap = new Map(students.map((s) => [s.id, s]));
  const statsByDept = new Map<string, { attended: number; total: number }>();

  for (const r of attendance) {
    const stu = stuMap.get(r.studentId);
    if (!stu) continue;
    const prev = statsByDept.get(stu.dept) ?? { attended: 0, total: 0 };
    prev.total += 1;
    if (r.status === 'Present' || r.status === 'Late') prev.attended += 1;
    statsByDept.set(stu.dept, prev);
  }

  return departments.map((d) => {
    const deptStudents = students.filter((s) => s.dept === d.code);
    const agg = statsByDept.get(d.code) ?? { attended: 0, total: 0 };
    const pct = agg.total > 0 ? Math.round((agg.attended / agg.total) * 100) : 0;
    const atRiskCount = deptStudents.filter((s) => {
      const st = computeStudentAttendanceStats(s.id, attendance);
      return st.total > 0 && st.pct < 75;
    }).length;
    return { code: d.code, name: d.name, pct, studentCount: deptStudents.length, atRiskCount };
  });
}

export function computeAttendanceTrend(
  attendance: AttendanceRecord[],
  daysCount: 7 | 14 | 30
): Array<{ date: string; label: string; pct: number; present: number; total: number }> {
  const today = new Date();
  const points: Array<{ date: string; label: string; pct: number; present: number; total: number }> = [];
  const byDate = new Map<string, { attended: number; total: number }>();

  for (const r of attendance) {
    const prev = byDate.get(r.date) ?? { attended: 0, total: 0 };
    prev.total += 1;
    if (r.status === 'Present' || r.status === 'Late') prev.attended += 1;
    byDate.set(r.date, prev);
  }

  for (let i = daysCount - 1; i >= 0; i--) {
    const dk = addDaysKey(today, -i);
    const entry = byDate.get(dk);
    const dObj = new Date(`${dk}T00:00:00`);
    const label = dObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const pct = entry && entry.total > 0 ? Math.round((entry.attended / entry.total) * 100) : 84;
    points.push({
      date: dk,
      label,
      pct,
      present: entry?.attended ?? 0,
      total: entry?.total ?? 0,
    });
  }
  return points;
}

export function computeGrade(pct: number): string {
  if (pct >= 90) return 'O';
  if (pct >= 80) return 'A+';
  if (pct >= 70) return 'A';
  if (pct >= 60) return 'B+';
  if (pct >= 50) return 'B';
  if (pct >= 40) return 'C';
  return 'U';
}

export function computeStudentExamSummary(
  student: Student,
  exams: Exam[],
  marks: Mark[]
) {
  const classExams = exams.filter(
    (e) => e.dept === student.dept && e.year === student.year && e.section === student.section
  );
  let totalGot = 0;
  let totalMax = 0;
  let count = 0;
  let fails = 0;

  const entries = classExams
    .map((exam) => {
      const m = marks.find((x) => x.examId === exam.id && x.studentId === student.id);
      if (!m) return null;
      const pct = Math.round((m.marks / exam.max) * 100);
      totalGot += m.marks;
      totalMax += exam.max;
      count++;
      if (pct < 40) fails++;
      return {
        exam,
        marks: m.marks,
        pct,
        grade: computeGrade(pct),
        passed: pct >= 40,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const overallPct = totalMax > 0 ? Math.round((totalGot / totalMax) * 1000) / 10 : 0;
  return {
    entries,
    totalGot,
    totalMax,
    count,
    fails,
    overallPct,
    grade: count > 0 ? computeGrade(overallPct) : '—',
  };
}
