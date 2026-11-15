import React, { useMemo, useState } from 'react';
import { CreditCard, Edit2, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { IdCardPreview } from '../components/IdCardPreview';
import { StudentFormModal } from '../components/StudentFormModal';
import { Student } from '../data/types';
import { useApp } from '../store/AppContext';
import { computeStudentAttendanceStats } from '../utils/attendance';

const PAGE_SIZE = 18;

export const StudentsPage: React.FC = () => {
  const { state, dispatch, session, openStudentProfile, showToast } = useApp();
  const canEdit = session?.role === 'admin' || session?.role === 'faculty';

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'above' | 'below'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'roll' | 'high' | 'low'>('name');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  const threshold = state.settings.lowAttendanceThreshold;

  const enriched = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.students
      .map((s) => ({
        student: s,
        stats: computeStudentAttendanceStats(s.id, state.attendance),
      }))
      .filter(({ student, stats }) => {
        if (q && !student.name.toLowerCase().includes(q) && !student.roll.toLowerCase().includes(q)) {
          return false;
        }
        if (deptFilter && student.dept !== deptFilter) return false;
        if (yearFilter && student.year !== Number(yearFilter)) return false;
        if (sectionFilter && student.section !== sectionFilter) return false;
        if (attendanceFilter === 'above' && stats.pct < threshold) return false;
        if (attendanceFilter === 'below' && stats.pct >= threshold) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'roll') return a.student.roll.localeCompare(b.student.roll);
        if (sortBy === 'high') return b.stats.pct - a.stats.pct;
        if (sortBy === 'low') return a.stats.pct - b.stats.pct;
        return a.student.name.localeCompare(b.student.name);
      });
  }, [
    state.students,
    state.attendance,
    search,
    deptFilter,
    yearFilter,
    sectionFilter,
    attendanceFilter,
    sortBy,
    threshold,
  ]);

  const totalPages = Math.max(1, Math.ceil(enriched.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = enriched.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch({ type: 'DELETE_STUDENT', payload: deleteTarget.id });
    showToast(`Deleted ${deleteTarget.name}`, 'info');
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="erp-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#7A0000]">Student Directory</h2>
            <p className="text-xs text-[#5A0000]">
              Showing {enriched.length} of {state.students.length} students
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditingStudent(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] btn-gold text-xs"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-[#5A0000] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or roll no..."
              aria-label="Search students"
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs focus:border-[#7A0000] outline-none"
            />
          </div>

          <select
            aria-label="Filter by department"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="">All Departments</option>
            {state.departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by year"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="">All Years</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by section"
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
          >
            <option value="">All Sections</option>
            {state.settings.sections.map((s) => (
              <option key={s} value={s}>
                Section {s}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              aria-label="Filter by attendance"
              value={attendanceFilter}
              onChange={(e) => {
                setAttendanceFilter(e.target.value as 'all' | 'above' | 'below');
                setPage(1);
              }}
              className="px-2.5 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              <option value="all">All %</option>
              <option value="above">≥ {threshold}%</option>
              <option value="below">&lt; {threshold}%</option>
            </select>

            <select
              aria-label="Sort students"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'roll' | 'high' | 'low')}
              className="px-2.5 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              <option value="name">A–Z</option>
              <option value="roll">Roll No</option>
              <option value="high">High %</option>
              <option value="low">Low %</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {visible.length === 0 ? (
        <div className="erp-card p-10 text-center">
          <p className="text-sm font-semibold text-[#7A0000]">No students match the current filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setDeptFilter('');
              setYearFilter('');
              setSectionFilter('');
              setAttendanceFilter('all');
            }}
            className="mt-3 px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] text-xs font-semibold text-[#5A0000] hover:bg-[#FFF5F5]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(({ student, stats }) => {
            const initials = student.name
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0].toUpperCase())
              .join('');
            const isGood = stats.pct >= threshold;

            return (
              <div key={student.id} className="erp-card erp-card-hover p-5 flex flex-col justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center shrink-0 overflow-hidden">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#7A0000]">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#1A0000] truncate">{student.name}</h3>
                    <div className="text-xs font-mono text-[#7A0000] font-semibold tabular-nums">
                      {student.roll}
                    </div>
                    <div className="text-xs text-[#5A0000] mt-0.5">
                      {student.dept}-{student.section} · Year {student.year}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(student);
                          setFormOpen(true);
                        }}
                        aria-label={`Edit ${student.name}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5A0000] hover:bg-[#FFF5F5]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(student)}
                        aria-label={`Delete ${student.name}`}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#C0000C] hover:bg-[#FFF5F5]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Attendance Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#5A0000] font-medium">
                      Attendance ({stats.attended}/{stats.total})
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        isGood ? 'text-[#1E9E4A]' : 'text-[#C0000C]'
                      }`}
                    >
                      {stats.pct}% · {isGood ? 'Eligible' : 'Low'}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#FFF5F5] border border-[#E8CFCF] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${stats.pct}%`,
                        backgroundColor: isGood ? '#1E9E4A' : '#C0000C',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openStudentProfile(student.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] rounded-full bg-[#7A0000] text-white text-xs font-bold hover:bg-[#A50000] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdCardStudent(student)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] btn-gold text-xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    ID Card
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between erp-card px-5 py-3">
          <span className="text-xs text-[#5A0000] tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] text-xs font-semibold text-[#7A0000] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] text-xs font-semibold text-[#7A0000] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal */}
      <StudentFormModal
        open={formOpen}
        editingStudent={editingStudent}
        onClose={() => {
          setFormOpen(false);
          setEditingStudent(null);
        }}
      />

      {/* ID Card Modal */}
      {idCardStudent && (
        <div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Student ID Card"
        >
          <div className="bg-white rounded-2xl border border-[#E8CFCF] shadow-2xl p-6 max-w-md w-full page-transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#7A0000]">Student Digital ID Card</h3>
              <button
                type="button"
                onClick={() => setIdCardStudent(null)}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-[#7A0000] hover:bg-[#FFF5F5]"
              >
                Close
              </button>
            </div>
            <IdCardPreview student={idCardStudent} />
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Student Record?"
        message={`Remove ${deleteTarget?.name} (${deleteTarget?.roll}) and all associated attendance, leave, and mark records?`}
        confirmLabel="Delete Student"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
