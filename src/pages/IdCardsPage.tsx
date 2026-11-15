import React, { useMemo, useState } from 'react';
import { CreditCard, Download, Search } from 'lucide-react';
import { IdCardPreview } from '../components/IdCardPreview';
import { useApp } from '../store/AppContext';
import { downloadAllIdCardsPdf } from '../utils/pdf';

const PAGE_SIZE = 12;

export const IdCardsPage: React.FC = () => {
  const { state, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [page, setPage] = useState(1);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.students.filter((s) => {
      if (deptFilter !== 'All' && s.dept !== deptFilter) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.roll.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [state.students, search, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = useMemo(
    () => filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredStudents, page]
  );

  const handleDownloadAll = () => {
    if (filteredStudents.length === 0) return;
    downloadAllIdCardsPdf(filteredStudents, state.settings);
    showToast(`PDF Downloaded (${filteredStudents.length} cards)`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#D4A017]" />
            Digital Student ID Cards
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            Local QR codes · Reflects live institution profile ({state.settings.institutionName})
          </p>
        </div>

        <button
          type="button"
          disabled={filteredStudents.length === 0}
          onClick={handleDownloadAll}
          className="btn-gold px-5 py-2.5 min-h-[44px] text-xs inline-flex items-center gap-1.5 disabled:opacity-40 self-start lg:self-center"
        >
          <Download className="w-4 h-4" />
          Download all as PDF ({filteredStudents.length})
        </button>
      </div>

      {/* Filters */}
      <div className="erp-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#5A0000] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name or roll number..."
            aria-label="Search ID cards"
            className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
          />
        </div>
        <select
          aria-label="Filter ID cards by department"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs font-semibold bg-white"
        >
          <option value="All">All Departments</option>
          {state.departments.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Cards Grid */}
      {pagedStudents.length === 0 ? (
        <div className="erp-card p-8 text-center text-xs text-[#5A0000]">
          No student ID cards match your search filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pagedStudents.map((stu) => (
            <div key={stu.id} className="erp-card p-4 flex justify-center">
              <IdCardPreview student={stu} showActions compact />
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="erp-card px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-[#5A0000]">
            Page {page} of {totalPages} ({filteredStudents.length} students)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 min-h-[40px] rounded-full border border-[#E8CFCF] font-bold text-[#7A0000] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 min-h-[40px] rounded-full border border-[#E8CFCF] font-bold text-[#7A0000] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
