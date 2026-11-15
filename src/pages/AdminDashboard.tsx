import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Lightbulb,
  UserX,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../store/AppContext';
import { computeAiInsights } from '../utils/ai';
import { computeAttendanceTrend, computeTodaySummary } from '../utils/attendance';
import { formatDisplayDate, formatLongDate, toDateKey } from '../utils/date';

export const AdminDashboard: React.FC = () => {
  const { state, dispatch, openStudentProfile, showToast } = useApp();
  const navigate = useNavigate();
  const [trendRange, setTrendRange] = useState<7 | 14 | 30>(14);

  const todaySummary = useMemo(
    () => computeTodaySummary(state.students, state.attendance),
    [state.students, state.attendance]
  );

  const insights = useMemo(() => computeAiInsights(state), [state]);

  const trendData = useMemo(
    () => computeAttendanceTrend(state.attendance, trendRange),
    [state.attendance, trendRange]
  );

  const upcomingEvents = useMemo(() => {
    const todayStr = toDateKey();
    const combined = [
      ...state.events.map((e) => ({ id: `ev-${e.id}`, date: e.date, title: e.title, type: e.type })),
      ...state.holidays.map((h) => ({ id: `hol-${h.id}`, date: h.date, title: h.title, type: 'Holiday' })),
    ];
    return combined
      .filter((x) => x.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [state.events, state.holidays]);

  const handleSendReminders = () => {
    const count = insights.eceAtRiskCount > 0 ? insights.eceAtRiskCount : insights.atRiskStudents.length;
    dispatch({
      type: 'ADD_CIRCULAR',
      payload: {
        title: 'Attendance Reminder: Minimum 75% Required',
        message: `Automated AI alert: ${count} students currently below ${state.settings.lowAttendanceThreshold}% attendance are advised to attend all upcoming sessions to stay eligible for exams.`,
        date: toDateKey(),
        audience: 'Students',
      },
    });
    showToast(`Attendance reminder circular sent (${count} flagged students notified)`, 'success');
  };

  const presentPct =
    state.students.length > 0
      ? Math.round((todaySummary.presentToday / state.students.length) * 100)
      : 0;
  const absentPct =
    state.students.length > 0
      ? Math.round((todaySummary.absentToday / state.students.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner + Upcoming Academic Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 red-gradient-bg plus-pattern rounded-2xl p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-[#FFD700] uppercase tracking-wider">
              {formatLongDate()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Welcome back, Dr. Raj
            </h2>
            <p className="text-sm text-white/90 mt-1.5 max-w-xl">
              {state.settings.institutionName} · Live overview across {state.departments.length}{' '}
              departments and {state.students.length} enrolled students.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/attendance-window')}
              className="px-5 py-2.5 min-h-[44px] btn-gold text-xs inline-flex items-center gap-2"
            >
              <ClipboardCheck className="w-4 h-4" />
              Mark Attendance
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              className="px-5 py-2.5 min-h-[44px] rounded-full border border-white text-white text-xs font-bold hover:bg-white/10 inline-flex items-center gap-2 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Mini Upcoming Academic Events */}
        <div className="erp-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#7A0000] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#D4A017]" />
              Upcoming Academic Events
            </h3>
            <button
              type="button"
              onClick={() => navigate('/admin/calendar')}
              className="text-xs font-bold text-[#7A0000] hover:underline"
            >
              View All
            </button>
          </div>
          {upcomingEvents.length === 0 ? (
            <div className="text-xs text-[#5A0000] py-6 text-center">No upcoming events.</div>
          ) : (
            <div className="divide-y divide-[#E8CFCF] flex-1">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1A0000] truncate">{ev.title}</div>
                    <div className="text-[11px] text-[#5A0000]">{ev.type}</div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-[#7A0000] tabular-nums">
                    {formatDisplayDate(ev.date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Computed Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="erp-card erp-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A0000]">Total Students</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center text-[#7A0000]">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1A0000] tabular-nums">
              {state.students.length}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#1E9E4A]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {state.departments.length} Depts
            </span>
          </div>
        </div>

        <div className="erp-card erp-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A0000]">Total Staff</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center text-[#7A0000]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1A0000] tabular-nums">
              {state.staff.length}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#1E9E4A]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Active
            </span>
          </div>
        </div>

        <div className="erp-card erp-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A0000]">Present Today</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center text-[#1E9E4A]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#1E9E4A] tabular-nums">
              {todaySummary.presentToday}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#1E9E4A] tabular-nums">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {presentPct}%
            </span>
          </div>
        </div>

        <div className="erp-card erp-card-hover p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5A0000]">Absent Today</span>
            <div className="w-9 h-9 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center text-[#C0000C]">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#C0000C] tabular-nums">
              {todaySummary.absentToday}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#C0000C] tabular-nums">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {absentPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Trend Chart + Students with Low Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 erp-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#7A0000]">
                Attendance Trend - Last {trendRange} Days
              </h3>
              <p className="text-xs text-[#5A0000]">
                Daily campus-wide attendance rate computed from logged sessions
              </p>
            </div>
            <div
              className="inline-flex p-1 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]"
              role="group"
              aria-label="Chart date range"
            >
              {(
                [
                  { label: 'This Week', days: 7 },
                  { label: 'Last 14 Days', days: 14 },
                  { label: 'This Month', days: 30 },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setTrendRange(opt.days)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    trendRange === opt.days
                      ? 'bg-[#7A0000] text-white'
                      : 'text-[#5A0000] hover:text-[#7A0000]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8CFCF" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A0000' }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#5A0000' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#E8CFCF',
                    fontSize: '12px',
                  }}
                  formatter={(value: unknown) => [`${value}%`, 'Attendance']}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#A50000"
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: '#FFD700', stroke: '#7A0000', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#7A0000' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students with Low Attendance */}
        <div className="lg:col-span-5 erp-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-bold text-[#7A0000]">Students with Low Attendance</h3>
              <p className="text-xs text-[#5A0000]">
                Below {state.settings.lowAttendanceThreshold}% ({insights.atRiskStudents.length}{' '}
                students flagged)
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="text-xs font-bold text-[#7A0000] hover:underline"
            >
              See All
            </button>
          </div>

          {insights.atRiskStudents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#5A0000]">
              All students are currently above {state.settings.lowAttendanceThreshold}% attendance.
            </div>
          ) : (
            <div className="divide-y divide-[#E8CFCF] overflow-y-auto max-h-64 pr-1">
              {insights.atRiskStudents.slice(0, 8).map((item) => {
                const detail =
                  item.absentLast7Days >= 4
                    ? `Absent ${item.absentLast7Days}/7 days`
                    : item.lateCount >= 2
                      ? `Late ${item.lateCount} times`
                      : `${item.attended}/${item.total} sessions`;
                return (
                  <button
                    key={item.student.id}
                    type="button"
                    onClick={() => openStudentProfile(item.student.id)}
                    className="w-full text-left py-2.5 px-2 rounded-xl hover:bg-[#FFF5F5] flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#1A0000] truncate">
                        {item.student.name}
                      </div>
                      <div className="text-xs text-[#5A0000] font-mono tabular-nums truncate">
                        {item.student.roll} · {item.student.dept} · {detail}
                      </div>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-lg bg-[#FFF5F5] border border-[#C0000C]/30 text-xs font-extrabold text-[#C0000C] tabular-nums">
                      Low {item.pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 3: AI Insights + Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 erp-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FFD700] text-[#7A0000] flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#7A0000]">
                    AI-Generated Attendance Insights
                  </h3>
                  <p className="text-xs text-[#5A0000]">
                    Real-time analysis of department and student patterns
                  </p>
                </div>
              </div>
            </div>

            <ul className="space-y-2.5 mt-3">
              {insights.bullets.map((bullet, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-[#1A0000] bg-[#FFF5F5] border border-[#E8CFCF] rounded-xl px-3.5 py-2.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#D4A017] mt-1.5 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8CFCF] flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-[#5A0000]">
              Send an automated circular notice to students below{' '}
              {state.settings.lowAttendanceThreshold}%
            </span>
            <button
              type="button"
              onClick={handleSendReminders}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] btn-gold text-xs"
            >
              <BellRing className="w-4 h-4" />
              Send reminders
            </button>
          </div>
        </div>

        {/* Quick Actions + Recent Activity */}
        <div className="lg:col-span-6 erp-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-[#7A0000]">Quick Actions &amp; Recent Activity</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/attendance-window')}
                className="px-3.5 py-2 min-h-[40px] btn-gold text-xs"
              >
                Mark Attendance
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/reports')}
                className="px-3.5 py-2 min-h-[40px] rounded-full border border-[#7A0000] text-[#7A0000] text-xs font-bold hover:bg-[#FFF5F5]"
              >
                Generate Report
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#E8CFCF] max-h-64 overflow-y-auto">
            {state.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#5A0000]">No recent activity yet.</div>
            ) : (
              state.recentActivity.slice(0, 8).map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#1A0000] font-medium">{act.text}</span>
                  <span className="shrink-0 text-[11px] font-mono text-[#5A0000] tabular-nums">
                    {act.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
