import React, { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { CalendarEventType } from '../data/types';
import { useApp } from '../store/AppContext';
import { formatDisplayDate, toDateKey } from '../utils/date';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AcademicCalendarPage: React.FC = () => {
  const { state, dispatch, session, showToast } = useApp();
  const isAdmin = session?.role === 'admin';

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0..11

  const [evDate, setEvDate] = useState(toDateKey());
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState<CalendarEventType>('Exam');
  const [evError, setEvError] = useState('');

  const todayKey = toDateKey();

  const monthLabel = useMemo(
    () =>
      new Date(viewYear, viewMonth, 1).toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    [viewYear, viewMonth]
  );

  const cells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const items: Array<{ day: number | null; dateKey?: string }> = [];
    for (let i = 0; i < firstDay; i++) items.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      items.push({ day: d, dateKey: `${viewYear}-${mStr}-${dStr}` });
    }
    return items;
  }, [viewYear, viewMonth]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, Array<{ id: number; title: string; kind: CalendarEventType | 'Holiday' }>>();
    for (const ev of state.events) {
      const arr = map.get(ev.date) ?? [];
      arr.push({ id: ev.id, title: ev.title, kind: ev.type });
      map.set(ev.date, arr);
    }
    for (const hol of state.holidays) {
      const arr = map.get(hol.date) ?? [];
      arr.push({ id: hol.id, title: hol.title, kind: 'Holiday' });
      map.set(hol.date, arr);
    }
    return map;
  }, [state.events, state.holidays]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evDate || !evTitle.trim()) {
      setEvError('Date and event title are required.');
      return;
    }
    setEvError('');
    dispatch({
      type: 'ADD_EVENT',
      payload: { date: evDate, title: evTitle.trim(), type: evType },
    });
    setEvTitle('');
    showToast('Academic event added', 'success');
  };

  const badgeClass = (kind: CalendarEventType | 'Holiday') => {
    if (kind === 'Exam') return 'bg-[#C0000C] text-white';
    if (kind === 'Semester') return 'bg-[#7A0000] text-[#FFD700]';
    if (kind === 'Holiday') return 'bg-[#FF8A00] text-white';
    return 'bg-[#1E9E4A] text-white';
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#D4A017]" />
            Academic Calendar
          </h2>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px] font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-[#C0000C] text-white">Exam</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1E9E4A] text-white">Event</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#7A0000] text-[#FFD700]">Semester</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#FF8A00] text-white">Holiday</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-10 h-10 rounded-full border border-[#E8CFCF] bg-white hover:bg-[#FFF5F5] flex items-center justify-center text-[#7A0000]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[140px] text-center text-sm font-bold text-[#7A0000]">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="w-10 h-10 rounded-full border border-[#E8CFCF] bg-white hover:bg-[#FFF5F5] flex items-center justify-center text-[#7A0000]"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Grid */}
      <div className="erp-card p-4 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 min-w-[640px]">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-xs font-bold text-[#7A0000] bg-[#FFF5F5] rounded-lg">
              {day}
            </div>
          ))}
          {cells.map((cell, idx) => {
            if (!cell.day || !cell.dateKey) {
              return <div key={`empty_${idx}`} className="min-h-[86px] rounded-xl bg-[#F8F8F8]" />;
            }
            const dayItems = itemsByDate.get(cell.dateKey) ?? [];
            const isToday = cell.dateKey === todayKey;
            return (
              <div
                key={cell.dateKey}
                className={`min-h-[86px] rounded-xl border p-1.5 flex flex-col gap-1 ${
                  isToday
                    ? 'border-2 border-[#FFD700] bg-[#FFF5F5]'
                    : 'border-[#E8CFCF] bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isToday
                        ? 'px-1.5 py-0.5 rounded-full bg-[#7A0000] text-[#FFD700]'
                        : 'text-[#1A0000]'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {isToday && <span className="text-[10px] font-bold text-[#7A0000]">Today</span>}
                </div>
                <div className="space-y-1">
                  {dayItems.map((it, i) => (
                    <div
                      key={`${it.kind}_${it.id}_${i}`}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate ${badgeClass(it.kind)}`}
                      title={`${it.kind}: ${it.title}`}
                    >
                      {it.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Add Event + Upcoming Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <section className="erp-card p-5 space-y-4 h-fit">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#D4A017]" />
              Add Calendar Event
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="ev-date">
                  Date
                </label>
                <input
                  id="ev-date"
                  type="date"
                  value={evDate}
                  onChange={(e) => setEvDate(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="ev-title">
                  Title
                </label>
                <input
                  id="ev-title"
                  type="text"
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="e.g., Internal Assessment II"
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="ev-type">
                  Type
                </label>
                <select
                  id="ev-type"
                  value={evType}
                  onChange={(e) => setEvType(e.target.value as CalendarEventType)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
                >
                  <option value="Exam">Exam</option>
                  <option value="Event">Event</option>
                  <option value="Semester">Semester</option>
                </select>
              </div>
              {evError && <p className="text-xs font-semibold text-[#C0000C]">{evError}</p>}
              <button type="submit" className="btn-gold w-full py-2.5 min-h-[44px] text-xs">
                Add Event
              </button>
            </form>
          </section>
        )}

        <section className={`erp-card p-5 space-y-3 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <h3 className="text-base font-bold text-[#7A0000]">Scheduled Academic Events</h3>
          {state.events.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl">
              No academic events scheduled.
            </div>
          ) : (
            <div className="space-y-2.5">
              {state.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${badgeClass(ev.type)}`}>
                      {ev.type}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#1A0000] truncate">{ev.title}</div>
                      <div className="text-xs text-[#5A0000]">{formatDisplayDate(ev.date)}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'DELETE_EVENT', payload: ev.id });
                        showToast('Event deleted', 'info');
                      }}
                      aria-label={`Delete event ${ev.title}`}
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
    </div>
  );
};
