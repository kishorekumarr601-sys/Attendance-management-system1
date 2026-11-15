import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  Palmtree,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { computeStudentAttendanceStats, computeTodaySummary } from '../utils/attendance';
import { formatDisplayDate, toDateKey } from '../utils/date';
import { useWindowStatus } from '../hooks/useWindowStatus';

interface FacultyDashboardProps {
  view?: 'dashboard' | 'profile';
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ view = 'dashboard' }) => {
  const { state, dispatch, session, showToast, openStudentProfile } = useApp();
  const navigate = useNavigate();
  const windowStatus = useWindowStatus();

  const faculty = useMemo(() => {
    return (
      state.staff.find((s) => s.id === session?.userId) ??
      state.staff.find((s) => s.email.toLowerCase() === session?.emailOrRoll.toLowerCase()) ??
      state.staff[0]
    );
  }, [state.staff, session]);

  const deptObj = useMemo(
    () => state.departments.find((d) => d.code === faculty.dept),
    [state.departments, faculty.dept]
  );

  const eceYear2Students = useMemo(
    () => state.students.filter((s) => s.dept === 'ECE' && s.year === 2),
    [state.students]
  );

  const assignedClassSummary = useMemo(() => {
    const todayKey = toDateKey();
    const eceSummary = computeTodaySummary(eceYear2Students, state.attendance, todayKey);
    const cseStudents = state.students.filter((s) => s.dept === 'CSE' && s.year === 2);
    const cseSummary = computeTodaySummary(cseStudents, state.attendance, todayKey);

    return [
      {
        code: 'ECE302',
        subject: 'Digital Systems',
        dept: 'ECE',
        year: 2,
        section: 'A',
        present: eceSummary.presentToday,
        total: eceYear2Students.length,
        room: 'Room 204',
      },
      {
        code: 'ECE101',
        subject: 'Signals & Systems',
        dept: 'ECE',
        year: 1,
        section: 'A',
        present: cseSummary.presentToday,
        total: cseStudents.length,
        room: 'Room 102',
      },
    ];
  }, [eceYear2Students, state.students, state.attendance]);

  const todaysSchedule = useMemo(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[new Date().getDay()];
    const facultySlots = state.timetable.filter(
      (t) => t.facultyId === faculty.id && (t.day === todayName || t.day === 'Monday')
    );
    if (facultySlots.length > 0 && todayName !== 'Sunday' && todayName !== 'Saturday') {
      return [
        { time: '09:00 AM', code: 'ECE302', title: 'Digital Systems (Yr 2)', room: 'Room 204' },
        { time: '11:00 AM', code: 'ECE101', title: 'Signals & Systems (Yr 1)', room: 'Room 102' },
        { time: '02:00 PM', code: 'ECE308', title: 'Lab Session — Microprocessors', room: 'Lab 3' },
      ];
    }
    return [
      { time: '09:00 AM', code: 'ECE302', title: 'Digital Systems (Yr 2)', room: 'Room 204' },
      { time: '11:00 AM', code: 'ECE101', title: 'Signals & Systems (Yr 1)', room: 'Room 102' },
      { time: '02:00 PM', code: 'ECE308', title: 'Lab Session — Microprocessors', room: 'Lab 3' },
    ];
  }, [state.timetable, faculty.id]);

  const pendingLeaves = useMemo(
    () => state.leaves.filter((l) => l.status === 'Pending'),
    [state.leaves]
  );

  const lowAttendanceInDept = useMemo(() => {
    const threshold = state.settings.lowAttendanceThreshold;
    return state.students
      .filter((s) => s.dept === faculty.dept)
      .map((s) => ({ student: s, stats: computeStudentAttendanceStats(s.id, state.attendance) }))
      .filter((x) => x.stats.total > 0 && x.stats.pct < threshold)
      .sort((a, b) => a.stats.pct - b.stats.pct)
      .slice(0, 5);
  }, [state.students, state.attendance, state.settings.lowAttendanceThreshold, faculty.dept]);

  const handleLeaveDecision = (id: number, status: 'Approved' | 'Rejected') => {
    dispatch({
      type: 'DECIDE_LEAVE',
      payload: { id, status, decidedBy: faculty.name },
    });
    showToast(`Leave ${status}`, status === 'Approved' ? 'success' : 'info');
  };

  const toggleMyStatus = () => {
    const nextStatus = faculty.status === 'On Leave' ? 'Present' : 'On Leave';
    dispatch({
      type: 'UPDATE_STAFF',
      payload: { ...faculty, status: nextStatus },
    });
    showToast(`Status updated to ${nextStatus}`, 'info');
  };

  if (view === 'profile') {
    return (
      <div className="space-y-6">
        <div className="erp-card p-6 red-gradient-bg plus-pattern text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#5A0000] border-2 border-[#FFD700] flex items-center justify-center text-2xl font-bold text-[#FFD700]">
              {faculty.name
                .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, '')
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{faculty.name}</h2>
              <p className="text-sm text-[#FFD700] font-semibold">
                {faculty.designation} · {deptObj?.name ?? faculty.dept}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/85">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#FFD700]" />
                  {faculty.email}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                  <UserCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                  {faculty.status ?? 'Present'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMyStatus}
            className="btn-gold px-5 py-2.5 min-h-[44px] text-xs self-start sm:self-center"
          >
            Switch to {faculty.status === 'On Leave' ? 'Present' : 'On Leave'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="erp-card p-5 space-y-3">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#D4A017]" />
              Department & Assigned Subjects
            </h3>
            <p className="text-xs text-[#5A0000]">
              {deptObj?.name ?? faculty.dept} ({faculty.dept})
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(deptObj?.subjects ?? ['Digital Systems', 'Signals & Systems']).map((sub) => (
                <span
                  key={sub}
                  className="px-3 py-1.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] text-xs font-semibold text-[#7A0000]"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="erp-card p-5 space-y-3">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D4A017]" />
              Assigned Classes
            </h3>
            <div className="space-y-2">
              {assignedClassSummary.map((cls) => (
                <div
                  key={cls.code}
                  className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-sm font-bold text-[#1A0000]">
                      {cls.code} · {cls.subject}
                    </div>
                    <div className="text-xs text-[#5A0000]">
                      {cls.dept} Year {cls.year} · Section {cls.section} · {cls.room}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/faculty/attendance?dept=${cls.dept}&year=${cls.year}&section=${cls.section}&subject=${encodeURIComponent(
                          cls.subject
                        )}`
                      )
                    }
                    className="btn-gold px-3.5 py-2 min-h-[44px] text-xs"
                  >
                    Mark Attendance
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Faculty Profile Banner */}
      <div className="erp-card p-5 sm:p-6 red-gradient-bg plus-pattern text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#5A0000] border-2 border-[#FFD700] flex items-center justify-center text-xl font-bold text-[#FFD700] shrink-0">
            {faculty.name
              .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.)\s*/i, '')
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0])
              .join('')}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">{faculty.name}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1E9E4A] text-white text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {faculty.status ?? 'Present'}
              </span>
            </div>
            <p className="text-sm text-[#FFD700] font-semibold mt-0.5">
              {deptObj?.name ?? faculty.dept} · {faculty.designation}
            </p>
            <p className="text-xs text-white/80 mt-1">
              Attendance Window: {windowStatus.label} ·{' '}
              <span className="font-bold text-[#FFD700]">
                {windowStatus.isOpen ? 'OPEN NOW' : 'CLOSED'}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Link
            to="/faculty/students"
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-white/50 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-[#FFD700]" />
            View Student Records
          </Link>
          <Link
            to="/faculty/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-white/50 text-white text-xs font-semibold hover:bg-white/15 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-[#FFD700]" />
            View Reports
          </Link>
          <Link
            to="/faculty/exams"
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] btn-gold text-xs"
          >
            <Award className="w-4 h-4" />
            Enter Marks
          </Link>
        </div>
      </div>

      {/* Assigned Classes + Today's Timetable */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Classes */}
        <section className="erp-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#D4A017]" />
              Assigned Classes
            </h3>
            <span className="text-xs font-semibold text-[#5A0000]">Today's Status</span>
          </div>

          <div className="space-y-3">
            {assignedClassSummary.map((cls) => {
              const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0;
              return (
                <div
                  key={cls.code}
                  className="p-4 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-bold text-[#1A0000]">
                      {cls.code} {cls.subject} Yr {cls.year}
                    </div>
                    <div className="text-xs text-[#5A0000] mt-0.5">
                      {cls.dept} Section {cls.section} · {cls.room}
                    </div>
                    <div className="text-xs font-bold text-[#7A0000] mt-1.5 tabular-nums">
                      {cls.present}/{cls.total} marked present today ({pct}%)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/faculty/attendance?dept=${cls.dept}&year=${cls.year}&section=${cls.section}&subject=${encodeURIComponent(
                          cls.subject
                        )}`
                      )
                    }
                    className="btn-gold px-4 py-2 min-h-[44px] text-xs shrink-0"
                  >
                    Mark Attendance
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Today's Timetable */}
        <section className="erp-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A017]" />
              Today's Timetable
            </h3>
            <Link to="/faculty/timetable" className="text-xs font-bold text-[#7A0000] hover:underline">
              Full Timetable →
            </Link>
          </div>

          <div className="space-y-3">
            {todaysSchedule.map((slot) => (
              <div
                key={slot.code}
                className="p-3.5 rounded-xl border border-[#E8CFCF] bg-white flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-3 py-1.5 rounded-lg bg-[#7A0000] text-[#FFD700] text-xs font-bold font-mono tabular-nums shrink-0">
                    {slot.time}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#1A0000] truncate">
                      {slot.code} · {slot.title}
                    </div>
                    <div className="text-xs text-[#5A0000]">{slot.room}</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#FFF5F5] border border-[#E8CFCF] text-[11px] font-bold text-[#7A0000] shrink-0">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Pending Leave Requests + Department At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <section className="erp-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Palmtree className="w-4 h-4 text-[#D4A017]" />
              Pending Leave Requests ({pendingLeaves.length})
            </h3>
            <Link to="/faculty/leaves" className="text-xs font-bold text-[#7A0000] hover:underline">
              Manage All →
            </Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl border border-[#E8CFCF]">
              No pending leave applications right now.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((lv) => {
                const stu = state.students.find((s) => s.id === lv.studentId);
                return (
                  <div
                    key={lv.id}
                    className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#1A0000] flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => stu && openStudentProfile(stu.id)}
                          className="text-left hover:underline text-[#7A0000]"
                        >
                          {stu?.name ?? `Student #${lv.studentId}`}
                        </button>
                        <span className="text-xs font-normal text-[#5A0000]">
                          - {lv.reason} - {formatDisplayDate(lv.from)}
                          {lv.to !== lv.from ? ` to ${formatDisplayDate(lv.to)}` : ''}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#FF8A00]/15 text-[#FF8A00] text-[11px] font-bold">
                          Pending
                        </span>
                      </div>
                      {lv.note && <p className="text-xs text-[#333333] mt-1">{lv.note}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLeaveDecision(lv.id, 'Approved')}
                        className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full bg-[#1E9E4A] text-white text-xs font-bold hover:opacity-90"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLeaveDecision(lv.id, 'Rejected')}
                        className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full bg-[#C0000C] text-white text-xs font-bold hover:opacity-90"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Department At-Risk Students */}
        <section className="erp-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#7A0000]">
              {faculty.dept} Students Below {state.settings.lowAttendanceThreshold}%
            </h3>
            <Link to="/faculty/reports" className="text-xs font-bold text-[#7A0000] hover:underline">
              Full Report →
            </Link>
          </div>

          {lowAttendanceInDept.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#1E9E4A] bg-[#FFF5F5] rounded-xl border border-[#E8CFCF]">
              All students in {faculty.dept} meet the {state.settings.lowAttendanceThreshold}% threshold.
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowAttendanceInDept.map(({ student, stats }) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => openStudentProfile(student.id)}
                  className="w-full text-left p-3.5 rounded-xl border border-[#E8CFCF] hover:bg-[#FFF5F5] flex items-center justify-between gap-3 transition-colors"
                >
                  <div>
                    <div className="text-sm font-bold text-[#1A0000]">{student.name}</div>
                    <div className="text-xs text-[#5A0000] font-mono">
                      {student.roll} · Yr {student.year} Sec {student.section}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C0000C]/10 text-[#C0000C] text-xs font-bold tabular-nums">
                      {stats.pct}% · At Risk
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
