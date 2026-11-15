import React, { useMemo, useState } from 'react';
import { Plus, Table2, Trash2, X } from 'lucide-react';
import { TimetableSlot } from '../data/types';
import { useApp } from '../store/AppContext';

const DAYS: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_TIMES: Record<number, string> = {
  1: '09:00',
  2: '09:50',
  3: '10:50',
  4: '11:40',
  5: '01:20',
  6: '02:10',
  7: '03:00',
  8: '03:50',
};

export const TimetablePage: React.FC = () => {
  const { state, dispatch, session, showToast } = useApp();
  const isAdmin = session?.role === 'admin';

  const [dept, setDept] = useState(isAdmin ? 'CSE' : 'ECE');
  const [year, setYear] = useState(2);
  const [section, setSection] = useState('A');

  const [editingCell, setEditingCell] = useState<{ day: TimetableSlot['day']; period: number; existing?: TimetableSlot } | null>(null);
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [facultyId, setFacultyId] = useState<number>(state.staff[0]?.id ?? 1);
  const [formError, setFormError] = useState('');

  const currentDeptObj = useMemo(
    () => state.departments.find((d) => d.code === dept),
    [state.departments, dept]
  );

  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    for (const s of state.timetable) {
      if (s.dept === dept && s.year === year && s.section === section) {
        map.set(`${s.day}_${s.period}`, s);
      }
    }
    return map;
  }, [state.timetable, dept, year, section]);

  const openEditor = (day: TimetableSlot['day'], period: number, existing?: TimetableSlot) => {
    if (!isAdmin) return;
    setEditingCell({ day, period, existing });
    setSubject(existing?.subject ?? currentDeptObj?.subjects[0] ?? '');
    setRoom(existing?.room ?? 'Room 204');
    setFacultyId(existing?.facultyId ?? state.staff[0]?.id ?? 1);
    setFormError('');
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;
    if (!subject.trim() || !room.trim()) {
      setFormError('Subject and Room are required.');
      return;
    }
    dispatch({
      type: 'UPSERT_TIMETABLE',
      payload: {
        id: editingCell.existing?.id,
        day: editingCell.day,
        period: editingCell.period,
        dept,
        year,
        section,
        subject: subject.trim(),
        room: room.trim(),
        facultyId,
      },
    });
    setEditingCell(null);
    showToast('Timetable slot saved', 'success');
  };

  const handleDeleteSlot = (id: number) => {
    dispatch({ type: 'DELETE_TIMETABLE', payload: id });
    setEditingCell(null);
    showToast('Timetable slot removed', 'info');
  };

  return (
    <div className="space-y-5">
      <div className="erp-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <Table2 className="w-5 h-5 text-[#D4A017]" />
            Weekly Timetable ({dept} Year {year} · Sec {section})
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {isAdmin
              ? 'Click any cell in the grid to add, edit, or remove a class period.'
              : 'Your assigned classes are highlighted in gold.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Timetable Department"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs font-semibold bg-white"
          >
            {state.departments.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>
          <select
            aria-label="Timetable Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs font-semibold bg-white"
          >
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <select
            aria-label="Timetable Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs font-semibold bg-white"
          >
            {state.settings.sections.map((s) => (
              <option key={s} value={s}>
                Sec {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-[#7A0000] text-white">
                <th className="py-3 px-3 text-left w-28">Day / Period</th>
                {PERIODS.map((p) => (
                  <th key={p} className="py-3 px-2 text-center border-l border-white/15">
                    <div className="font-bold">P{p}</div>
                    <div className="text-[10px] text-[#FFD700] font-mono">{PERIOD_TIMES[p]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8CFCF]">
              {DAYS.map((day) => (
                <tr key={day} className="bg-white">
                  <td className="py-3 px-3 font-bold text-[#7A0000] bg-[#FFF5F5] border-r border-[#E8CFCF]">
                    {day}
                  </td>
                  {PERIODS.map((period) => {
                    const slot = slotMap.get(`${day}_${period}`);
                    const fac = slot ? state.staff.find((st) => st.id === slot.facultyId) : undefined;
                    const isMine = session?.role === 'faculty' && slot?.facultyId === session.userId;

                    return (
                      <td
                        key={period}
                        className={`p-1.5 border-l border-[#E8CFCF] align-top ${
                          isMine ? 'bg-[#FFD700]/20' : ''
                        }`}
                      >
                        <button
                          type="button"
                          disabled={!isAdmin && !slot}
                          onClick={() => openEditor(day, period, slot)}
                          className={`w-full min-h-[72px] p-2 rounded-xl text-left transition-colors flex flex-col justify-between ${
                            slot
                              ? isMine
                                ? 'bg-[#7A0000] text-white border border-[#FFD700]'
                                : 'bg-[#FFF5F5] border border-[#E8CFCF] hover:border-[#7A0000]'
                              : isAdmin
                              ? 'border border-dashed border-[#E8CFCF] hover:bg-[#FFF5F5] items-center justify-center text-[#5A0000]/60'
                              : 'text-[#5A0000]/40 items-center justify-center'
                          }`}
                        >
                          {slot ? (
                            <>
                              <div className={`font-bold leading-snug ${isMine ? 'text-[#FFD700]' : 'text-[#7A0000]'}`}>
                                {slot.subject}
                              </div>
                              <div className={`text-[10px] mt-1 ${isMine ? 'text-white/90' : 'text-[#5A0000]'}`}>
                                {slot.room} · {fac?.name.split(' ').slice(0, 2).join(' ') ?? 'Faculty'}
                              </div>
                            </>
                          ) : isAdmin ? (
                            <Plus className="w-4 h-4" />
                          ) : (
                            <span className="text-[11px]">—</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {editingCell && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E8CFCF] max-w-md w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E8CFCF] pb-3">
              <h3 className="text-base font-bold text-[#7A0000]">
                {editingCell.day} · Period {editingCell.period} ({dept} Y{year}-{section})
              </h3>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full hover:bg-[#FFF5F5] flex items-center justify-center text-[#7A0000]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3" noValidate>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="tt-sub">
                  Subject
                </label>
                <input
                  id="tt-sub"
                  list="dept-subjects-list"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
                <datalist id="dept-subjects-list">
                  {(currentDeptObj?.subjects ?? []).map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="tt-room">
                  Room / Lab
                </label>
                <input
                  id="tt-room"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="tt-fac">
                  Faculty
                </label>
                <select
                  id="tt-fac"
                  value={facultyId}
                  onChange={(e) => setFacultyId(Number(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
                >
                  {state.staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.dept})
                    </option>
                  ))}
                </select>
              </div>

              {formError && <p className="text-xs font-semibold text-[#C0000C]">{formError}</p>}

              <div className="flex items-center justify-between gap-2 pt-2">
                {editingCell.existing ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(editingCell.existing!.id)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[44px] rounded-full bg-[#C0000C] text-white text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                ) : (
                  <span />
                )}
                <button type="submit" className="btn-gold px-5 py-2 min-h-[44px] text-xs">
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
