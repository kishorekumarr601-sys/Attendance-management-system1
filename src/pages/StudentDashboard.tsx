import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Home,
  LogOut,
  Megaphone,
  Palmtree,
  Printer,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import { IdCardPreview } from '../components/IdCardPreview';
import { Logo } from '../components/Logo';
import { useApp } from '../store/AppContext';
import {
  classesNeededForTarget,
  computeStudentAttendanceStats,
  computeStudentExamSummary,
  computeSubjectAttendance,
} from '../utils/attendance';
import { computeStudentCoachTip } from '../utils/ai';
import { formatDisplayDate, getGreetingName, toDateKey } from '../utils/date';
import { downloadAttendanceCertificatePdf } from '../utils/pdf';

type StudentTab = 'home' | 'attendance' | 'results' | 'leave' | 'profile';

export const StudentDashboard: React.FC = () => {
  const { state, dispatch, session, logout, showToast } = useApp();
  const navigate = useNavigate();

  const student = useMemo(() => {
    return (
      state.students.find((s) => s.id === session?.userId) ??
      state.students.find((s) => s.roll.toUpperCase() === session?.emailOrRoll.toUpperCase()) ??
      state.students.find((s) => s.roll === '267325205039') ??
      state.students[0]
    );
  }, [state.students, session]);

  const [tab, setTab] = useState<StudentTab>('home');
  const [subModal, setSubModal] = useState<'idcard' | 'timetable' | 'calendar' | null>(null);

  // History filter
  const [histSubject, setHistSubject] = useState('All');

  // Leave form state
  const [leaveFrom, setLeaveFrom] = useState(toDateKey());
  const [leaveTo, setLeaveTo] = useState(toDateKey());
  const [leaveReason, setLeaveReason] = useState('Sick');
  const [leaveNote, setLeaveNote] = useState('');
  const [leaveError, setLeaveError] = useState('');

  const deptObj = useMemo(
    () => state.departments.find((d) => d.code === student.dept),
    [state.departments, student.dept]
  );

  const stats = useMemo(
    () => computeStudentAttendanceStats(student.id, state.attendance),
    [student.id, state.attendance]
  );

  const subjects = useMemo(
    () => computeSubjectAttendance(student.id, state.attendance),
    [student.id, state.attendance]
  );

  const lowSubjects = useMemo(
    () => subjects.filter((s) => s.pct < state.settings.lowAttendanceThreshold),
    [subjects, state.settings.lowAttendanceThreshold]
  );

  const coachTip = useMemo(() => computeStudentCoachTip(student, state), [student, state]);

  const studentHistory = useMemo(() => {
    return state.attendance
      .filter((r) => r.studentId === student.id && (histSubject === 'All' || r.subject === histSubject))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.attendance, student.id, histSubject]);

  const studentLeaves = useMemo(
    () => state.leaves.filter((l) => l.studentId === student.id),
    [state.leaves, student.id]
  );

  const examSummary = useMemo(
    () => computeStudentExamSummary(student, state.exams, state.marks),
    [student, state.exams, state.marks]
  );

  const classRank = useMemo(() => {
    const classmates = state.students.filter(
      (s) => s.dept === student.dept && s.year === student.year && s.section === student.section
    );
    const ranked = classmates
      .map((c) => ({ id: c.id, pct: computeStudentExamSummary(c, state.exams, state.marks).overallPct }))
      .sort((a, b) => b.pct - a.pct);
    const idx = ranked.findIndex((r) => r.id === student.id);
    return { rank: idx >= 0 ? idx + 1 : 1, total: classmates.length };
  }, [state.students, state.exams, state.marks, student]);

  const notices = useMemo(() => {
    const circulars = state.circulars
      .filter((c) => c.audience === 'All' || c.audience === 'Students')
      .map((c) => ({ id: `c_${c.id}`, title: c.title, body: c.message, date: c.date }));
    const personal = state.notifications
      .filter((n) => n.studentId === student.id)
      .map((n) => ({ id: `n_${n.id}`, title: 'Personal Alert', body: n.text, date: n.time }));
    return [...personal, ...circulars].slice(0, 6);
  }, [state.circulars, state.notifications, student.id]);

  const classTimetable = useMemo(() => {
    return state.timetable.filter(
      (t) => t.dept === student.dept && t.year === student.year && t.section === student.section
    );
  }, [state.timetable, student]);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo) {
      setLeaveError('Please select both From and To dates.');
      return;
    }
    if (leaveTo < leaveFrom) {
      setLeaveError('To date cannot be earlier than From date.');
      return;
    }
    if (!leaveNote.trim()) {
      setLeaveError('Please provide a short reason note for your leave.');
      return;
    }
    setLeaveError('');
    dispatch({
      type: 'SUBMIT_LEAVE',
      payload: {
        studentId: student.id,
        from: leaveFrom,
        to: leaveTo,
        reason: leaveReason,
        note: leaveNote.trim(),
      },
    });
    setLeaveNote('');
    showToast('Leave Applied', 'success');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = student.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (Math.min(100, Math.max(0, stats.pct)) / 100) * ringCircumference;

  return (
    <div className="min-h-screen bg-[#FFF5F5] pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 bg-[#7A0000] plus-pattern text-white px-4 py-3 shadow-md no-print">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Logo variant="compact" tone="on-red" size="sm" customLogoUrl={state.settings.logo} />
          <div className="text-center hidden sm:block">
            <div className="text-xs font-bold text-[#FFD700] uppercase tracking-wide">
              {state.settings.institutionName}
            </div>
            <div className="text-[11px] text-white/80">Student Portal</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSubModal('calendar')}
              aria-label="Academic calendar"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#FFD700]"
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-full bg-white/15 hover:bg-white/25 text-xs font-semibold text-white"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-5 space-y-5 page-transition">
        {tab === 'home' && (
          <>
            {/* Welcome Maroon Card */}
            <section className="rounded-2xl red-gradient-bg plus-pattern text-white p-5 shadow-lg">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wider text-[#FFD700] font-semibold">
                    {state.settings.institutionName}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    Welcome back, {getGreetingName(student.name)}!
                  </h1>
                  <p className="text-xs sm:text-sm text-white/90 mt-1">
                    {deptObj?.name ?? student.dept} · Year {student.year} · Sec {student.section}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#5A0000] border border-[#FFD700]/40 text-[#FFD700]">
                      Roll: {student.roll}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white">
                      ID: SSEC-{student.id}
                    </span>
                  </div>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-[#5A0000] border-2 border-[#FFD700] flex items-center justify-center shrink-0 overflow-hidden">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#FFD700]">{initials}</span>
                  )}
                </div>
              </div>
            </section>

            {/* Low Attendance Red Alert Banner */}
            {lowSubjects.length > 0 && (
              <section
                role="alert"
                className="rounded-2xl bg-[#C0000C] text-white p-4 shadow-md flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <div className="font-bold">
                    Low Attendance Alert — {lowSubjects[0].subject} {lowSubjects[0].pct}%
                  </div>
                  <p className="text-white/90 mt-0.5">
                    Attend next{' '}
                    <span className="font-bold text-[#FFD700]">
                      {classesNeededForTarget(
                        lowSubjects[0].attended,
                        lowSubjects[0].total,
                        state.settings.lowAttendanceThreshold
                      )}
                    </span>{' '}
                    classes to reach {state.settings.lowAttendanceThreshold}% and stay exam-eligible.
                  </p>
                </div>
              </section>
            )}

            {/* Circular Progress Ring + Quick Action Buttons */}
            <section className="erp-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center">
              <div className="flex items-center gap-4">
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
                    <circle
                      cx="56"
                      cy="56"
                      r={ringRadius}
                      fill="none"
                      stroke="#FFF5F5"
                      strokeWidth="11"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r={ringRadius}
                      fill="none"
                      stroke={stats.pct >= state.settings.lowAttendanceThreshold ? '#FFD700' : '#C0000C'}
                      strokeWidth="11"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[#7A0000] tabular-nums">{stats.pct}%</span>
                    <span className="text-[10px] font-semibold text-[#5A0000]">Overall</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#7A0000]">
                    Overall Attendance - This Semester
                  </h2>
                  <p className="text-xs text-[#5A0000] mt-1 tabular-nums">
                    {stats.attended} attended of {stats.total} sessions
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded-full bg-[#1E9E4A]/10 text-[#1E9E4A]">
                      {stats.present} Present
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FF8A00]/15 text-[#FF8A00]">
                      {stats.late} Late
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#C0000C]/10 text-[#C0000C]">
                      {stats.absent} Absent
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTab('leave')}
                  className="btn-gold px-3 py-2.5 min-h-[44px] text-xs flex items-center justify-center gap-1.5"
                >
                  <Palmtree className="w-4 h-4" />
                  Apply for Leave
                </button>
                <button
                  type="button"
                  onClick={() => setTab('attendance')}
                  className="px-3 py-2.5 min-h-[44px] rounded-full border border-[#7A0000] text-[#7A0000] text-xs font-bold hover:bg-[#FFF5F5] flex items-center justify-center gap-1.5"
                >
                  <History className="w-4 h-4" />
                  View History
                </button>
                <button
                  type="button"
                  onClick={() => setSubModal('idcard')}
                  className="px-3 py-2.5 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-[#5A0000] text-xs font-bold hover:bg-[#FFF5F5] flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4 text-[#7A0000]" />
                  My ID Card
                </button>
                <button
                  type="button"
                  onClick={() => setSubModal('timetable')}
                  className="px-3 py-2.5 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-[#5A0000] text-xs font-bold hover:bg-[#FFF5F5] flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-4 h-4 text-[#7A0000]" />
                  Timetable
                </button>
              </div>
            </section>

            {/* Subject-wise Bars */}
            <section className="erp-card p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#7A0000]">Subject-wise Attendance</h2>
                <span className="text-xs font-semibold text-[#5A0000]">
                  Target: {state.settings.lowAttendanceThreshold}%
                </span>
              </div>
              <div className="space-y-3">
                {subjects.map((sub) => {
                  const isOk = sub.pct >= state.settings.lowAttendanceThreshold;
                  return (
                    <div key={sub.subject} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#1A0000]">{sub.subject}</span>
                        <span
                          className={`font-bold tabular-nums inline-flex items-center gap-1 ${
                            isOk ? 'text-[#1E9E4A]' : 'text-[#C0000C]'
                          }`}
                        >
                          {sub.pct}% ({sub.attended}/{sub.total}) · {isOk ? 'Safe' : 'Low'}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-[#FFF5F5] border border-[#E8CFCF] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOk ? 'bg-[#1E9E4A]' : 'bg-[#C0000C]'
                          }`}
                          style={{ width: `${Math.min(100, sub.pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* AI Attendance Coach */}
            <section className="rounded-2xl border-2 border-[#FFD700] bg-white p-5 shadow-md space-y-2">
              <div className="flex items-center gap-2 text-[#7A0000] font-bold text-sm">
                <span className="w-7 h-7 rounded-full bg-[#FFD700] text-[#7A0000] flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </span>
                AI Attendance Coach
              </div>
              <p className="text-xs sm:text-sm text-[#333333] leading-relaxed">{coachTip}</p>
            </section>

            {/* Recent Notices */}
            <section className="erp-card p-5 space-y-3">
              <h2 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#D4A017]" />
                Recent Notices & Alerts
              </h2>
              <div className="space-y-2.5">
                {notices.length === 0 ? (
                  <p className="text-xs text-[#5A0000]">No active circulars.</p>
                ) : (
                  notices.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#7A0000]">{n.title}</div>
                        <p className="text-xs text-[#333333] mt-0.5">{n.body}</p>
                      </div>
                      <span className="text-[11px] text-[#5A0000] whitespace-nowrap shrink-0">
                        {n.date.includes('-') ? formatDisplayDate(n.date) : n.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}

        {tab === 'attendance' && (
          <div className="space-y-5">
            <section className="erp-card p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-[#7A0000]">My Attendance History</h1>
                  <p className="text-xs text-[#5A0000]">
                    Overall: {stats.pct}% ({stats.attended}/{stats.total} sessions)
                  </p>
                </div>
                <select
                  aria-label="Filter attendance history by subject"
                  value={histSubject}
                  onChange={(e) => setHistSubject(e.target.value)}
                  className="px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs font-semibold text-[#1A0000] bg-white"
                >
                  <option value="All">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.subject} value={s.subject}>
                      {s.subject} ({s.pct}%)
                    </option>
                  ))}
                </select>
              </div>

              {studentHistory.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5A0000]">No attendance records found.</div>
              ) : (
                <div className="divide-y divide-[#E8CFCF]">
                  {studentHistory.slice(0, 40).map((rec) => (
                    <div key={rec.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-[#1A0000]">{rec.subject}</div>
                        <div className="text-[#5A0000] mt-0.5">
                          {formatDisplayDate(rec.date)} · Period {rec.period} · {rec.time} · {rec.method}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${
                          rec.status === 'Present'
                            ? 'bg-[#1E9E4A]/10 text-[#1E9E4A]'
                            : rec.status === 'Late'
                            ? 'bg-[#FF8A00]/15 text-[#FF8A00]'
                            : 'bg-[#C0000C]/10 text-[#C0000C]'
                        }`}
                      >
                        {rec.status === 'Present' && <CheckCircle2 className="w-3 h-3" />}
                        {rec.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        {rec.status === 'Late' && <Clock className="w-3 h-3" />}
                        {rec.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Holidays Preview */}
            <section className="erp-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D4A017]" />
                  Upcoming Holidays & Events
                </h2>
                <button
                  type="button"
                  onClick={() => setSubModal('calendar')}
                  className="text-xs font-bold text-[#7A0000] hover:underline"
                >
                  Open Month Grid
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {state.holidays.slice(0, 4).map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#1A0000]">{h.title}</span>
                    <span className="text-[#7A0000] font-semibold">{formatDisplayDate(h.date)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'results' && (
          <section className="erp-card p-5 space-y-4 print-container">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#7A0000]">Examination Results</h1>
                <p className="text-xs text-[#5A0000]">
                  {state.settings.institutionName} · View-only official marksheet
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1.5 no-print"
              >
                <Printer className="w-4 h-4" />
                Print Marksheet
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] text-center">
                <div className="text-xs text-[#5A0000]">Overall %</div>
                <div className="text-xl font-bold text-[#7A0000] tabular-nums mt-0.5">
                  {examSummary.overallPct}%
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] text-center">
                <div className="text-xs text-[#5A0000]">Grade</div>
                <div className="text-xl font-bold text-[#1E9E4A] mt-0.5">{examSummary.grade}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] text-center">
                <div className="text-xs text-[#5A0000]">Class Rank</div>
                <div className="text-xl font-bold text-[#7A0000] tabular-nums mt-0.5">
                  #{classRank.rank} / {classRank.total}
                </div>
              </div>
            </div>

            {examSummary.entries.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl">
                No exam marks published yet for {student.dept} Year {student.year} Section{' '}
                {student.section}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8CFCF] text-[#7A0000] bg-[#FFF5F5]">
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Exam</th>
                      <th className="py-2.5 px-3">Marks</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8CFCF]">
                    {examSummary.entries.map((row) => (
                      <tr key={row.exam.id}>
                        <td className="py-2.5 px-3 font-bold text-[#1A0000]">{row.exam.subject}</td>
                        <td className="py-2.5 px-3 text-[#5A0000]">{row.exam.type}</td>
                        <td className="py-2.5 px-3 font-mono font-bold tabular-nums">
                          {row.marks} / {row.exam.max}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#7A0000]">{row.grade}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              row.passed
                                ? 'bg-[#1E9E4A]/10 text-[#1E9E4A]'
                                : 'bg-[#C0000C]/10 text-[#C0000C]'
                            }`}
                          >
                            {row.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {tab === 'leave' && (
          <div className="space-y-5">
            <section className="erp-card p-5 space-y-4">
              <h1 className="text-lg font-bold text-[#7A0000]">Apply for Leave</h1>
              <form onSubmit={handleApplyLeave} className="space-y-3.5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="lv-from">
                      From Date
                    </label>
                    <input
                      id="lv-from"
                      type="date"
                      value={leaveFrom}
                      onChange={(e) => setLeaveFrom(e.target.value)}
                      className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="lv-to">
                      To Date
                    </label>
                    <input
                      id="lv-to"
                      type="date"
                      value={leaveTo}
                      onChange={(e) => setLeaveTo(e.target.value)}
                      className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="lv-reason">
                    Reason
                  </label>
                  <select
                    id="lv-reason"
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
                  >
                    <option value="Sick">Sick</option>
                    <option value="Personal">Personal</option>
                    <option value="Family">Family</option>
                    <option value="Casual Leave">Casual Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="lv-note">
                    Note
                  </label>
                  <textarea
                    id="lv-note"
                    rows={3}
                    value={leaveNote}
                    onChange={(e) => setLeaveNote(e.target.value)}
                    placeholder="Enter supporting details..."
                    className="w-full px-3 py-2 rounded-xl border border-[#E8CFCF] text-xs"
                  />
                </div>

                {leaveError && (
                  <p className="text-xs font-semibold text-[#C0000C]" role="alert">
                    {leaveError}
                  </p>
                )}

                <button type="submit" className="btn-gold px-6 py-2.5 min-h-[44px] text-xs">
                  Submit Leave
                </button>
              </form>
            </section>

            <section className="erp-card p-5 space-y-3">
              <h2 className="text-base font-bold text-[#7A0000]">My Leave Applications</h2>
              {studentLeaves.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#5A0000]">No leave requests submitted yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {studentLeaves.map((lv) => (
                    <div
                      key={lv.id}
                      className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#1A0000]">
                          {lv.reason} · {formatDisplayDate(lv.from)}
                          {lv.to !== lv.from ? ` – ${formatDisplayDate(lv.to)}` : ''}
                        </div>
                        <div className="text-[#5A0000] mt-0.5">{lv.note}</div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 shrink-0 ${
                          lv.status === 'Approved'
                            ? 'bg-[#1E9E4A]/10 text-[#1E9E4A]'
                            : lv.status === 'Rejected'
                            ? 'bg-[#C0000C]/10 text-[#C0000C]'
                            : 'bg-[#FF8A00]/15 text-[#FF8A00]'
                        }`}
                      >
                        {lv.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                        {lv.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {lv.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {lv.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-5">
            <section className="erp-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-[#7A0000]">Student Profile (Read-Only)</h1>
                  <p className="text-xs text-[#5A0000]">
                    Contact the college admin office for any profile corrections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadAttendanceCertificatePdf(student, stats, state.settings);
                    showToast('PDF Downloaded', 'success');
                  }}
                  className="btn-gold px-4 py-2 min-h-[44px] text-xs"
                >
                  Certificate PDF
                </button>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]">
                  <dt className="text-[#5A0000] font-semibold">Full Name</dt>
                  <dd className="font-bold text-[#1A0000] mt-0.5">{student.name}</dd>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]">
                  <dt className="text-[#5A0000] font-semibold">Roll Number</dt>
                  <dd className="font-mono font-bold text-[#7A0000] mt-0.5">{student.roll}</dd>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]">
                  <dt className="text-[#5A0000] font-semibold">Department / Class</dt>
                  <dd className="font-bold text-[#1A0000] mt-0.5">
                    {deptObj?.name ?? student.dept} · Year {student.year} · Sec {student.section}
                  </dd>
                </div>
                <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]">
                  <dt className="text-[#5A0000] font-semibold">Date of Birth</dt>
                  <dd className="font-bold text-[#1A0000] mt-0.5">{formatDisplayDate(student.dob)}</dd>
                </div>
              </dl>
            </section>

            <section className="erp-card p-5">
              <h2 className="text-base font-bold text-[#7A0000] text-center mb-4">
                Official Digital Student ID Card
              </h2>
              <IdCardPreview student={student} showActions />
            </section>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-6 py-2.5 min-h-[44px] rounded-full bg-[#C0000C] text-white text-xs font-bold hover:opacity-90"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Mobile App Navigation Bar */}
      <nav
        aria-label="Student bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E8CFCF] shadow-lg no-print"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-5">
          {[
            { id: 'home' as StudentTab, label: 'Home', icon: Home },
            { id: 'attendance' as StudentTab, label: 'Attendance', icon: CheckCircle2 },
            { id: 'results' as StudentTab, label: 'Results', icon: Award },
            { id: 'leave' as StudentTab, label: 'Leave', icon: Palmtree },
            { id: 'profile' as StudentTab, label: 'Profile', icon: User },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center justify-center py-2 min-h-[56px] text-[11px] font-bold transition-colors ${
                  active
                    ? 'text-[#7A0000] border-t-2 border-[#7A0000] bg-[#FFF5F5]'
                    : 'text-[#5A0000]/75 hover:text-[#7A0000]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-[#7A0000]' : 'text-[#5A0000]/70'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sub-modal for ID Card / Timetable / Calendar */}
      {subModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSubModal(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E8CFCF] max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8CFCF] pb-3">
              <h2 className="text-base font-bold text-[#7A0000]">
                {subModal === 'idcard'
                  ? 'Digital Student ID Card'
                  : subModal === 'timetable'
                  ? `${student.dept} Year ${student.year} Sec ${student.section} Timetable`
                  : 'Academic Calendar & Holidays'}
              </h2>
              <button
                type="button"
                onClick={() => setSubModal(null)}
                className="px-3 py-1.5 min-h-[40px] rounded-full border border-[#E8CFCF] text-xs font-bold text-[#7A0000]"
              >
                Close
              </button>
            </div>

            {subModal === 'idcard' && <IdCardPreview student={student} showActions />}

            {subModal === 'timetable' && (
              <div className="space-y-2">
                {classTimetable.length === 0 ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-[#5A0000]">Standard daily schedule for {student.dept}:</p>
                    {['09:00 AM', '10:00 AM', '11:15 AM', '01:30 PM'].map((tm, i) => (
                      <div
                        key={tm}
                        className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex justify-between"
                      >
                        <span className="font-bold text-[#7A0000]">{tm}</span>
                        <span className="font-semibold text-[#1A0000]">
                          {deptObj?.subjects[i % (deptObj.subjects.length || 1)] ?? 'Core Lecture'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  classTimetable.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#7A0000]">{slot.day}</span> · Period {slot.period}
                        <div className="font-semibold text-[#1A0000] mt-0.5">{slot.subject}</div>
                      </div>
                      <span className="text-[#5A0000] font-semibold">{slot.room}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {subModal === 'calendar' && (
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="font-bold text-[#7A0000] mb-2 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#D4A017]" />
                    Academic Events
                  </h3>
                  <div className="space-y-2">
                    {state.events.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-[#1A0000]">{ev.title}</div>
                          <div className="text-[11px] text-[#5A0000]">{ev.type}</div>
                        </div>
                        <span className="font-semibold text-[#7A0000]">{formatDisplayDate(ev.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-[#7A0000] mb-2">Holidays</h3>
                  <div className="space-y-2">
                    {state.holidays.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl bg-white border border-[#E8CFCF] flex items-center justify-between"
                      >
                        <span className="font-bold text-[#1A0000]">{h.title}</span>
                        <span className="font-semibold text-[#C0000C]">{formatDisplayDate(h.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
