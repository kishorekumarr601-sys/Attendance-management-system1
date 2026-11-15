import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Palmtree, XCircle } from 'lucide-react';
import { LeaveStatus } from '../data/types';
import { useApp } from '../store/AppContext';
import { formatDisplayDate } from '../utils/date';

type TabFilter = 'All' | LeaveStatus;

export const LeaveRequestsPage: React.FC = () => {
  const { state, dispatch, session, showToast, openStudentProfile } = useApp();
  const [filter, setFilter] = useState<TabFilter>('All');

  const counts = useMemo(() => {
    const pending = state.leaves.filter((l) => l.status === 'Pending').length;
    const approved = state.leaves.filter((l) => l.status === 'Approved').length;
    const rejected = state.leaves.filter((l) => l.status === 'Rejected').length;
    return { all: state.leaves.length, pending, approved, rejected };
  }, [state.leaves]);

  const visibleLeaves = useMemo(() => {
    if (filter === 'All') return state.leaves;
    return state.leaves.filter((l) => l.status === filter);
  }, [state.leaves, filter]);

  const handleDecision = (id: number, status: 'Approved' | 'Rejected') => {
    const actor = session?.role === 'admin' ? 'Dr. Raj (Admin)' : session?.name ?? 'Faculty';
    dispatch({ type: 'DECIDE_LEAVE', payload: { id, status, decidedBy: actor } });
    showToast(`Leave request ${status.toLowerCase()}`, status === 'Approved' ? 'success' : 'info');
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-[#D4A017]" />
            Student Leave Requests
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter leave requests">
          {(['All', 'Pending', 'Approved', 'Rejected'] as TabFilter[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={filter === tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 min-h-[44px] rounded-full text-xs font-bold transition-colors ${
                filter === tab
                  ? 'bg-[#7A0000] text-[#FFD700]'
                  : 'bg-[#FFF5F5] text-[#5A0000] border border-[#E8CFCF] hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="erp-card p-5">
        {visibleLeaves.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl">
            No {filter.toLowerCase()} leave requests found.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleLeaves.map((lv) => {
              const stu = state.students.find((s) => s.id === lv.studentId);
              return (
                <div
                  key={lv.id}
                  className="p-4 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => stu && openStudentProfile(stu.id)}
                        className="text-sm font-bold text-[#7A0000] hover:underline"
                      >
                        {stu?.name ?? `Student #${lv.studentId}`}
                      </button>
                      <span className="text-xs font-mono text-[#5A0000]">
                        {stu?.roll} · {stu?.dept} Y{stu?.year}-{stu?.section}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
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
                    <div className="text-xs font-semibold text-[#1A0000]">
                      {lv.reason} · {formatDisplayDate(lv.from)}
                      {lv.to !== lv.from ? ` to ${formatDisplayDate(lv.to)}` : ''}
                    </div>
                    {lv.note && <p className="text-xs text-[#333333]">{lv.note}</p>}
                    {lv.decidedBy && (
                      <p className="text-[11px] text-[#5A0000]">Decision by: {lv.decidedBy}</p>
                    )}
                  </div>

                  {lv.status === 'Pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDecision(lv.id, 'Approved')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-[#1E9E4A] text-white text-xs font-bold hover:opacity-90"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(lv.id, 'Rejected')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full bg-[#C0000C] text-white text-xs font-bold hover:opacity-90"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
