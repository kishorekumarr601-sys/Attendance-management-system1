import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, History, Search, XCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { downloadCsv } from '../utils/csv';
import { addDaysKey, formatDisplayDate, toDateKey } from '../utils/date';

const PAGE_SIZE = 20;

export const AttendanceHistoryPage: React.FC = () => {
  const { state, showToast, openStudentProfile } = useApp();

  const [fromDate, setFromDate] = useState(addDaysKey(new Date(), -13));
  const [toDate, setToDate] = useState(toDateKey());
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);

  const studentMap = useMemo(() => new Map(state.students.map((s) => [s.id, s])), [state.students]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.attendance
      .filter((rec) => {
        if (rec.date < fromDate || rec.date > toDate) return false;
        if (methodFilter !== 'All' && rec.method !== methodFilter) return false;
        if (statusFilter !== 'All' && rec.status !== statusFilter) return false;
        const stu = studentMap.get(rec.studentId);
        if (!stu) return false;
        if (deptFilter !== 'All' && stu.dept !== deptFilter) return false;
        if (q) {
          const match =
            stu.name.toLowerCase().includes(q) ||
            stu.roll.toLowerCase().includes(q) ||
            rec.subject.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date === b.date ? b.period - a.period : b.date.localeCompare(a.date)));
  }, [state.attendance, studentMap, fromDate, toDate, methodFilter, statusFilter, deptFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paged = useMemo(
    () => filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRecords, page]
  );

  const handleExportCsv = () => {
    const rows: Array<Array<string | number>> = [
      ['Date', 'Roll No', 'Student Name', 'Department', 'Subject', 'Period', 'Time', 'Method', 'Status'],
      ...filteredRecords.map((r) => {
        const stu = studentMap.get(r.studentId);
        return [
          r.date,
          stu?.roll ?? '',
          stu?.name ?? '',
          stu?.dept ?? '',
          r.subject,
          r.period,
          r.time,
          r.method,
          r.status,
        ];
      }),
    ];
    downloadCsv(rows, `attendance_history_${fromDate}_to_${toDate}.csv`);
    showToast('CSV Downloaded', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <History className="w-5 h-5 text-[#D4A017]" />
            Full Attendance History Log
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {filteredRecords.length} record(s) matching current filters
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="erp-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2 relative">
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="hist-search">
            Search Student / Subject
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[#5A0000] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="hist-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Name, Roll, Subject..."
              className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="hist-from">
            From
          </label>
          <input
            id="hist-from"
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
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="hist-to">
            To
          </label>
          <input
            id="hist-to"
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
          <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="hist-dept">
            Department
          </label>
          <select
            id="hist-dept"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="All">All Depts</option>
            {state.departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="hist-method">
              Method
            </label>
            <select
              id="hist-method"
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              <option value="All">All</option>
              <option value="Manual">Manual</option>
              <option value="QR">QR</option>
              <option value="Face">Face</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="hist-status">
              Status
            </label>
            <select
              id="hist-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              <option value="All">All</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="erp-card overflow-hidden">
        {paged.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5A0000]">
            No attendance history records match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF5F5] text-[#7A0000] border-b border-[#E8CFCF]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Dept</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Period & Time</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8CFCF]">
                {paged.map((rec) => {
                  const stu = studentMap.get(rec.studentId);
                  return (
                    <tr key={rec.id} className="hover:bg-[#FFF5F5]/50">
                      <td className="py-3 px-4 font-semibold text-[#1A0000] whitespace-nowrap">
                        {formatDisplayDate(rec.date)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => stu && openStudentProfile(stu.id)}
                          className="font-bold text-[#7A0000] hover:underline text-left"
                        >
                          {stu?.name ?? `#${rec.studentId}`}
                        </button>
                        <div className="text-[11px] font-mono text-[#5A0000]">{stu?.roll}</div>
                      </td>
                      <td className="py-3 px-4 text-[#5A0000]">{stu?.dept}</td>
                      <td className="py-3 px-4 font-medium text-[#1A0000]">{rec.subject}</td>
                      <td className="py-3 px-4 text-[#5A0000] whitespace-nowrap">
                        P{rec.period} · {rec.time}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF5F5] border border-[#E8CFCF] font-semibold text-[#7A0000]">
                          {rec.method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
      </div>
    </div>
  );
};
