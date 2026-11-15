import React, { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useApp } from '../store/AppContext';
import { formatDisplayDate, toDateKey } from '../utils/date';

export const HolidayCalendarPage: React.FC = () => {
  const { state, dispatch, session, showToast } = useApp();
  const isAdmin = session?.role === 'admin';

  const [date, setDate] = useState(toDateKey());
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title.trim()) {
      setError('Both date and holiday title are required.');
      return;
    }
    setError('');
    dispatch({ type: 'ADD_HOLIDAY', payload: { date, title: title.trim() } });
    setTitle('');
    showToast('Holiday added', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4A017]" />
            Institutional Holiday Calendar
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {state.holidays.length} declared holiday(s) for {state.settings.institutionName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <section className="erp-card p-5 space-y-4 h-fit">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#D4A017]" />
              Add Holiday
            </h3>
            <form onSubmit={handleAdd} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="hol-date">
                  Date
                </label>
                <input
                  id="hol-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="hol-title">
                  Holiday Name
                </label>
                <input
                  id="hol-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Republic Day"
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
              {error && <p className="text-xs font-semibold text-[#C0000C]">{error}</p>}
              <button type="submit" className="btn-gold w-full py-2.5 min-h-[44px] text-xs">
                Add Holiday
              </button>
            </form>
          </section>
        )}

        <section className={`erp-card p-5 space-y-3 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-base font-bold text-[#7A0000]">Declared Holidays</h3>
          {state.holidays.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl">
              No holidays declared yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-[#7A0000] text-[#FFD700] text-xs font-bold whitespace-nowrap">
                      {formatDisplayDate(h.date)}
                    </span>
                    <span className="text-sm font-bold text-[#1A0000]">{h.title}</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setDeleteId(h.id)}
                      aria-label={`Delete holiday ${h.title}`}
                      className="w-10 h-10 rounded-full hover:bg-[#C0000C]/10 text-[#C0000C] flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        title="Delete Holiday"
        message="Are you sure you want to remove this holiday from the institutional calendar?"
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) {
            dispatch({ type: 'DELETE_HOLIDAY', payload: deleteId });
            showToast('Holiday deleted', 'info');
          }
          setDeleteId(null);
        }}
      />
    </div>
  );
};
