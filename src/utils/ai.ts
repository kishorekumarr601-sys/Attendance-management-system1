import { GoogleGenAI } from '@google/genai';
import { SmartErpState, Student } from '../data/types';
import {
  classesCanMiss,
  classesNeededForTarget,
  computeAttendanceTrend,
  computeDepartmentBreakdown,
  computeStudentAttendanceStats,
  computeSubjectAttendance,
  computeTodaySummary,
} from './attendance';

export interface ComputedInsights {
  bullets: string[];
  atRiskStudents: Array<{
    student: Student;
    pct: number;
    attended: number;
    total: number;
    absentLast7Days: number;
    lateCount: number;
  }>;
  deptBreakdown: Array<{ code: string; name: string; pct: number; studentCount: number; atRiskCount: number }>;
  topPerformers: Array<{ student: Student; pct: number }>;
  weekDelta: number;
  lowDept: { code: string; name: string; pct: number; atRiskCount: number } | null;
  leadingDept: { code: string; name: string; pct: number } | null;
  eceAtRiskCount: number;
  mechAtRiskCount: number;
}

export function computeAiInsights(state: SmartErpState): ComputedInsights {
  const threshold = state.settings.lowAttendanceThreshold;
  const deptBreakdown = computeDepartmentBreakdown(state.students, state.departments, state.attendance);
  const sortedDepts = [...deptBreakdown].sort((a, b) => b.pct - a.pct);
  const leadingDept = sortedDepts[0] ?? null;
  const lowDept = sortedDepts[sortedDepts.length - 1] ?? null;

  const trend14 = computeAttendanceTrend(state.attendance, 14);
  const firstHalf = trend14.slice(0, 7);
  const secondHalf = trend14.slice(7);
  const avg1 = firstHalf.length ? firstHalf.reduce((s, d) => s + d.pct, 0) / firstHalf.length : 0;
  const avg2 = secondHalf.length ? secondHalf.reduce((s, d) => s + d.pct, 0) / secondHalf.length : 0;
  const weekDelta = Math.round((avg2 - avg1) * 10) / 10;

  const allStats = state.students.map((student) => {
    const st = computeStudentAttendanceStats(student.id, state.attendance);
    return {
      student,
      pct: st.pct,
      attended: st.attended,
      total: st.total,
      absentLast7Days: st.absentLast7Days,
      lateCount: st.lateCount,
    };
  });

  const atRiskStudents = allStats
    .filter((x) => x.total > 0 && x.pct < threshold)
    .sort((a, b) => a.pct - b.pct);

  const topPerformers = allStats
    .filter((x) => x.total > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)
    .map((x) => ({ student: x.student, pct: x.pct }));

  const mechAtRiskCount = atRiskStudents.filter((x) => x.student.dept === 'MECH').length;
  const eceAtRiskCount = atRiskStudents.filter((x) => x.student.dept === 'ECE').length;

  const deltaLabel =
    weekDelta >= 0
      ? `Attendance up ${Math.abs(weekDelta)}% compared to last week`
      : `Attendance down ${Math.abs(weekDelta)}% compared to last week`;

  const bullets: string[] = [
    deltaLabel,
    leadingDept
      ? `${leadingDept.name.replace(/ Engineering$/, '')} department leading at ${leadingDept.pct}%`
      : 'Department breakdown ready',
    `${atRiskStudents.length} students flagged at-risk: attendance <${threshold}% (${mechAtRiskCount} in Mechanical Dept.)`,
    `Suggestion: Send automated reminder to ${eceAtRiskCount > 0 ? eceAtRiskCount : atRiskStudents.length} ${
      eceAtRiskCount > 0 ? 'ECE' : 'at-risk'
    } students.`,
  ];

  return {
    bullets,
    atRiskStudents,
    deptBreakdown,
    topPerformers,
    weekDelta,
    lowDept,
    leadingDept,
    eceAtRiskCount,
    mechAtRiskCount,
  };
}

export function computeStudentCoachTip(student: Student, state: SmartErpState): string {
  const overall = computeStudentAttendanceStats(student.id, state.attendance);
  const subjects = computeSubjectAttendance(student.id, state.attendance);
  const lowSub = subjects.find((s) => s.pct < state.settings.lowAttendanceThreshold);

  if (overall.total === 0) {
    return `Hi ${student.name}! Your attendance tracking is active. Attend upcoming sessions to build a strong semester record.`;
  }
  if (lowSub) {
    const needed = classesNeededForTarget(
      lowSub.attended,
      lowSub.total,
      state.settings.lowAttendanceThreshold
    );
    return `Your overall attendance is ${overall.pct}%, but ${lowSub.subject} is at ${lowSub.pct}%. Attend your next ${needed} ${lowSub.subject} classes without absence to cross ${state.settings.lowAttendanceThreshold}% and stay exam-eligible.`;
  }
  const margin = classesCanMiss(overall.attended, overall.total, state.settings.lowAttendanceThreshold);
  return `Your attendance improved this week to ${overall.pct}%! Keep attending consistently to stay above 85% and remain eligible for exams (safe buffer: ${margin} classes).`;
}

export function answerAiRuleBased(question: string, state: SmartErpState): string {
  const q = question.toLowerCase().trim();
  const insights = computeAiInsights(state);
  const today = computeTodaySummary(state.students, state.attendance);

  if (q.includes('at-risk') || q.includes('at risk') || q.includes('low attendance') || q.includes('below')) {
    const topNames = insights.atRiskStudents
      .slice(0, 4)
      .map((x) => `${x.student.name} (${x.student.roll}) ${x.pct}%`)
      .join(', ');
    return `${insights.atRiskStudents.length} students are below ${state.settings.lowAttendanceThreshold}%. Top at-risk: ${
      topNames || 'None'
    }. Suggestion: Send reminder via Circulars & Alerts.`;
  }

  if (q.includes('mech') || q.includes('why')) {
    const mech = insights.deptBreakdown.find((d) => d.code === 'MECH');
    const mechAtRisk = insights.atRiskStudents
      .filter((x) => x.student.dept === 'MECH')
      .slice(0, 3)
      .map((x) => `${x.student.name} (${x.pct}%)`)
      .join(', ');
    return `Mechanical Dept averages ${mech?.pct ?? 0}% with ${
      insights.mechAtRiskCount
    } students below ${state.settings.lowAttendanceThreshold}%. Key contributors include consecutive absences in morning sessions (${
      mechAtRisk || 'no flagged students'
    }).`;
  }

  if (q.includes('top') || q.includes('best') || q.includes('leading')) {
    const top = insights.topPerformers
      .map((t, idx) => `${idx + 1}. ${t.student.name} (${t.student.dept}) — ${t.pct}%`)
      .join('\n');
    return `${insights.leadingDept?.code ?? 'CSE'} leads at ${
      insights.leadingDept?.pct ?? 0
    }%.\nTop performers:\n${top}`;
  }

  if (q.includes('today') || q.includes('summary') || q.includes('present')) {
    const rate =
      state.students.length > 0 ? Math.round((today.presentToday / state.students.length) * 100) : 0;
    return `Today's Summary (${state.settings.institutionName}):\n• Present: ${today.presentToday}/${state.students.length} (${rate}%)\n• Absent: ${today.absentToday}\n• Late: ${today.lateToday}\n• Unmarked: ${today.unmarkedCount}\n• Weekly trend: ${
      insights.weekDelta >= 0 ? `+${insights.weekDelta}%` : `${insights.weekDelta}%`
    } vs last week.`;
  }

  if (q.includes('leave') || q.includes('pending')) {
    const pending = state.leaves.filter((l) => l.status === 'Pending');
    return `There are ${pending.length} pending leave request(s) out of ${state.leaves.length} total applications.`;
  }

  return `Live ERP Snapshot:\n• Total Students: ${state.students.length} | Staff: ${state.staff.length}\n• Present Today: ${today.presentToday} | Absent Today: ${today.absentToday}\n• At-Risk (<${state.settings.lowAttendanceThreshold}%): ${insights.atRiskStudents.length} students\n• Leading Dept: ${
    insights.leadingDept?.code ?? 'CSE'
  } (${insights.leadingDept?.pct ?? 0}%)\nAsk about at-risk students, Mechanical dept, top performers, or today's summary.`;
}

export async function askSmartErpAi(question: string, state: SmartErpState): Promise<string> {
  const ruleAnswer = answerAiRuleBased(question, state);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return ruleAnswer;
  }

  try {
    const insights = computeAiInsights(state);
    const today = computeTodaySummary(state.students, state.attendance);
    const compactContext = {
      institution: state.settings.institutionName,
      totalStudents: state.students.length,
      totalStaff: state.staff.length,
      presentToday: today.presentToday,
      absentToday: today.absentToday,
      thresholdPct: state.settings.lowAttendanceThreshold,
      atRiskCount: insights.atRiskStudents.length,
      topAtRisk: insights.atRiskStudents.slice(0, 6).map((x) => ({
        name: x.student.name,
        roll: x.student.roll,
        dept: x.student.dept,
        pct: x.pct,
      })),
      departments: insights.deptBreakdown,
      topPerformers: insights.topPerformers.map((t) => ({
        name: t.student.name,
        dept: t.student.dept,
        pct: t.pct,
      })),
    };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are the Smart ERP attendance analytics assistant. Answer concisely (3-4 sentences) using ONLY this real ERP summary JSON.\nData: ${JSON.stringify(
        compactContext
      )}\nQuestion: ${question}`,
    });
    return response.text?.trim() || ruleAnswer;
  } catch {
    return ruleAnswer;
  }
}
