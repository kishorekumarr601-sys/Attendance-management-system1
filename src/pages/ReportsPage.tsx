import React, { useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../store/AppContext';
import { downloadCsv } from '../utils/csv';
import { addDaysKey, toDateKey } from '../utils/date';
import { exportRowsToExcel } from '../utils/excel';
import { downloadAttendanceReportPdf } from '../utils/pdf';

const PAGE_SIZE = 15;

export const ReportsPage: React.FC = () => {
  const { state, showToast, openStudentProfile } = useApp();

  const [fromDate, setFromDate] = useState(addDaysKey(new Date(), -13));
  const [toDate, setToDate] = useState(toDateKey());
  const [deptFilter, setDeptFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filteredAttendance = useMemo(() => {
    return state.attendance.filter((r) => r.date >= fromDate && r.date <= toDate);
  }, [state.attendance, fromDate, toDate]);

  const filteredStudents = useMemo(() => {
    return state.students.filter((s) => {
      if (deptFilter !== 'All' && s.dept !== deptFilter) return false;
      if (yearFilter !== 'All' && s.year !== Number(yearFilter)) return false;
      if (sectionFilter !== 'All' && s.section !== sectionFilter) return false;
      return true;
    });
  }, [state.students, deptFilter, yearFilter, sectionFilter]);

  const studentRows = useMemo(() => {
    const byStudent = new Map<number, { attended: number; total: number; present: number; late: number; absent: number }>();
    for (const r of filteredAttendance) {
      const prev = byStudent.get(r.studentId) ?? { attended: 0, total: 0, present: 0, late: 0, absent: 0 };
      prev.total += 1;
      if (r.status === 'Present') {
        prev.present += 1;
        prev.attended += 1;
      } else if (r.status === 'Late') {
        prev.late += 1;
        prev.attended += 1;
      } else {
        prev.absent += 1;
      }
      byStudent.set(r.studentId, prev);
    }

    return filteredStudents
      .map((student) => {
        const agg = byStudent.get(student.id) ?? { attended: 0, total: 0, present: 0, late: 0, absent: 0 };
        const pct = agg.total > 0 ? Math.round((agg.attended / agg.total) * 100) : 0;
        return {
          student,
          ...agg,
          pct,
        };
      })
      .sort((a, b) => a.pct - b.pct);
  }, [filteredStudents, filteredAttendance]);

  const deptChartData = useMemo(() => {
    const map = new Map<string, { attended: number; total: number }>();
    const stuDept = new Map(filteredStudents.map((s) => [s.id, s.dept]));
    for (const r of filteredAttendance) {
      const dept = stuDept.get(r.studentId);
      if (!dept) continue;
      const prev = map.get(dept) ?? { attended: 0, total: 0 };
      prev.total += 1;
      if (r.status === 'Present' || r.status === 'Late') prev.attended += 1;
      map.set(dept, prev);
    }
    return state.departments.map((d) => {
      const agg = map.get(d.code) ?? { attended: 0, total: 0 };
      const pct = agg.total > 0 ? Math.round((agg.attended / agg.total) * 100) : 0;
      return { dept: d.code, pct };
    });
  }, [filteredStudents, filteredAttendance, state.departments]);

  const summary = useMemo(() => {
    const withData = studentRows.filter((r) => r.total > 0);
    const avgPct =
      withData.length > 0
        ? Math.round(withData.reduce((s, r) => s + r.pct, 0) / withData.length)
        : 0;
    const atRisk = withData.filter((r) => r.pct < state.settings.lowAttendanceThreshold).length;
    const eligible = withData.length - atRisk;
    return {
      totalStudents: studentRows.length,
      avgPct,
      atRisk,
      eligible,
    };
  }, [studentRows, state.settings.lowAttendanceThreshold]);

  const totalPages = Math.max(1, Math.ceil(studentRows.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => studentRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [studentRows, page]
  );

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['Roll No', 'Name', 'Department', 'Year', 'Section', 'Present', 'Late', 'Absent', 'Attended', 'Total', 'Attendance %'],
      ...studentRows.map((r) => [
        r.student.roll,
        r.student.name,
        r.student.dept,
        r.student.year,
        r.student.section,
        r.present,
        r.late,
        r.absent,
        r.attended,
        r.total,
        `${r.pct}%`,
      ]),
    ];
    downloadCsv(rows, `attendance_report_${fromDate}_to_${toDate}.csv`);
    showToast('CSV Downloaded', 'success');
  };

  const handleExportExcel = () => {
    exportRowsToExcel(
      ['Roll No', 'Name', 'Department', 'Year', 'Section', 'Present', 'Late', 'Absent', 'Attended', 'Total', 'Attendance %'],
      studentRows.map((r) => [
        r.student.roll,
        r.student.name,
        r.student.dept,
        r.student.year,
        r.student.section,
        r.present,
        r.late,
        r.absent,
        r.attended,
        r.total,
        r.pct,
      ]),
      `attendance_report_${fromDate}_to_${toDate}.xlsx`,
      'Attendance Report'
    );
    showToast('Excel Downloaded', 'success');
  };

  const handleExportPdf = () => {
    downloadAttendanceReportPdf(
      studentRows.map((r) => ({
        roll: r.student.roll,
        name: r.student.name,
        dept: r.student.dept,
        year: r.student.year,
        section: r.student.section,
        attended: r.attended,
        total: r.total,
        pct: r.pct,
      })),
      `${fromDate} to ${toDate} (${deptFilter})`,
      state.settings
    );
    showToast('PDF Downloaded', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header & Exports */}
      <div className="erp-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#D4A017]" />
            Attendance Analytics & Reports
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {state.settings.institutionName} · Threshold: {state.settings.lowAttendanceThreshold}%
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-bold text-[#7A0000] hover:bg-[#FFF5F5]"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-bold text-[#7A0000] hover:bg-[#FFF5F5]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="erp-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="rep-from">
            From Date
          </label>
          <input
            id="rep-from"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="rep-to">
            To Date
          </label>
          <input
            id="rep-to"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="rep-dept">
            Department
          </label>
          <select
            id="rep-dept"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="All">All Departments</option>
            {state.departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="rep-year">
            Year
          </label>
          <select
            id="rep-year"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="All">All Years</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="rep-sec">
            Section
          </label>
          <select
            id="rep-sec"
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="All">All Sections</option>
            {state.settings.sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="erp-card p-4">
          <div className="text-xs font-semibold text-[#5A0000]">Students in Scope</div>
          <div className="text-2xl font-bold text-[#7A0000] mt-1 tabular-nums">{summary.totalStudents}</div>
        </div>
        <div className="erp-card p-4">
          <div className="text-xs font-semibold text-[#5A0000]">Average Attendance</div>
          <div className="text-2xl font-bold text-[#7A0000] mt-1 tabular-nums">{summary.avgPct}%</div>
        </div>
        <div className="erp-card p-4">
          <div className="text-xs font-semibold text-[#5A0000]">Exam Eligible (&ge;{state.settings.lowAttendanceThreshold}%)</div>
          <div className="text-2xl font-bold text-[#1E9E4A] mt-1 tabular-nums">{summary.eligible}</div>
        </div>
        <div className="erp-card p-4">
          <div className="text-xs font-semibold text-[#5A0000]">At-Risk (&lt;{state.settings.lowAttendanceThreshold}%)</div>
          <div className="text-2xl font-bold text-[#C0000C] mt-1 tabular-nums">{summary.atRisk}</div>
        </div>
      </div>

      {/* Department Bar Chart */}
      <section className="erp-card p-5">
        <h3 className="text-base font-bold text-[#7A0000] mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#D4A017]" />
          Department Attendance Percentage ({fromDate} to {toDate})
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8CFCF" />
              <XAxis dataKey="dept" tick={{ fontSize: 12, fill: '#5A0000' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#5A0000' }} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Attendance']}
                contentStyle={{ borderRadius: 12, borderColor: '#E8CFCF', fontSize: 12 }}
              />
              <Bar dataKey="pct" fill="#A50000" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Student Percentage Table */}
      <section className="erp-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8CFCF] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#7A0000]">Student Attendance Breakdown</h3>
          <span className="text-xs text-[#5A0000]">
            Showing {pagedRows.length} of {studentRows.length}
          </span>
        </div>

        {pagedRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5A0000]">
            No students match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF5F5] text-[#7A0000] border-b border-[#E8CFCF]">
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Present</th>
                  <th className="py-3 px-4">Late</th>
                  <th className="py-3 px-4">Absent</th>
                  <th className="py-3 px-4">Attended / Total</th>
                  <th className="py-3 px-4">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CFCF]">
                {pagedRows.map((row) => {
                  const isOk = row.pct >= state.settings.lowAttendanceThreshold;
                  return (
                    <tr key={row.student.id} className="hover:bg-[#FFF5F5]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#7A0000]">
                        {row.student.roll}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => openStudentProfile(row.student.id)}
                          className="font-bold text-[#1A0000] hover:text-[#7A0000] hover:underline text-left"
                        >
                          {row.student.name}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-[#5A0000]">
                        {row.student.dept} Yr {row.student.year}-{row.student.section}
                      </td>
                      <td className="py-3 px-4 tabular-nums">{row.present}</td>
                      <td className="py-3 px-4 tabular-nums">{row.late}</td>
                      <td className="py-3 px-4 tabular-nums">{row.absent}</td>
                      <td className="py-3 px-4 tabular-nums font-semibold">
                        {row.attended} / {row.total}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold tabular-nums ${
                            row.total === 0
                              ? 'bg-gray-100 text-gray-600'
                              : isOk
                              ? 'bg-[#1E9E4A]/10 text-[#1E9E4A]'
                              : 'bg-[#C0000C]/10 text-[#C0000C]'
                          }`}
                        >
                          {row.total === 0 ? 'No data' : `${row.pct}% · ${isOk ? 'Safe' : 'At Risk'}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#E8CFCF] flex items-center justify-between text-xs">
            <span className="text-[#5A0000]">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 min-h-[40px] rounded-full border border-[#E8CFCF] font-bold text-[#7A0000] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 min-h-[40px] rounded-full border border-[#E8CFCF] font-bold text-[#7A0000] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
