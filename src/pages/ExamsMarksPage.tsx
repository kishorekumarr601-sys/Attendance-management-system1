import React, { useEffect, useMemo, useState } from 'react';
import { Award, Plus, Printer, Save, Trash2 } from 'lucide-react';
import { Mark } from '../data/types';
import { useApp } from '../store/AppContext';
import { computeGrade } from '../utils/attendance';
import { formatDisplayDate, toDateKey } from '../utils/date';

export const ExamsMarksPage: React.FC = () => {
  const { state, dispatch, showToast, openStudentProfile } = useApp();

  const [selectedExamId, setSelectedExamId] = useState<number>(state.exams[0]?.id ?? 0);
  const [draftMarks, setDraftMarks] = useState<Record<number, string>>({});
  const [markErrors, setMarkErrors] = useState<Record<number, string>>({});

  // Create exam form
  const [exType, setExType] = useState('Internal Test 2');
  const [exDept, setExDept] = useState('CSE');
  const [exYear, setExYear] = useState(2);
  const [exSection, setExSection] = useState('A');
  const [exSubject, setExSubject] = useState(
    state.departments.find((d) => d.code === 'CSE')?.subjects[0] ?? 'Data Structures'
  );
  const [exMax, setExMax] = useState(100);
  const [exDate, setExDate] = useState(toDateKey());
  const [createError, setCreateError] = useState('');

  const selectedExam = useMemo(
    () => state.exams.find((e) => e.id === selectedExamId) ?? state.exams[0],
    [state.exams, selectedExamId]
  );

  const classStudents = useMemo(() => {
    if (!selectedExam) return [];
    return state.students.filter(
      (s) =>
        s.dept === selectedExam.dept &&
        s.year === selectedExam.year &&
        s.section === selectedExam.section
    );
  }, [state.students, selectedExam]);

  useEffect(() => {
    if (!selectedExam) return;
    const init: Record<number, string> = {};
    classStudents.forEach((stu) => {
      const m = state.marks.find((x) => x.examId === selectedExam.id && x.studentId === stu.id);
      init[stu.id] = m ? String(m.marks) : '';
    });
    setDraftMarks(init);
    setMarkErrors({});
  }, [selectedExam, classStudents, state.marks]);

  const deptSubjects = useMemo(
    () => state.departments.find((d) => d.code === exDept)?.subjects ?? [],
    [state.departments, exDept]
  );

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exType.trim() || !exSubject.trim() || exMax <= 0 || !exDate) {
      setCreateError('All exam fields are required and Max Marks must be > 0.');
      return;
    }
    setCreateError('');
    dispatch({
      type: 'ADD_EXAM',
      payload: {
        type: exType.trim(),
        dept: exDept,
        year: exYear,
        section: exSection,
        subject: exSubject.trim(),
        max: Number(exMax),
        date: exDate,
      },
    });
    showToast('Exam created', 'success');
  };

  const handleSaveMarks = () => {
    if (!selectedExam) return;
    const errs: Record<number, string> = {};
    const validMarks: Mark[] = [];

    classStudents.forEach((stu) => {
      const raw = draftMarks[stu.id]?.trim() ?? '';
      if (raw === '') return;
      const num = Number(raw);
      if (!Number.isFinite(num) || num < 0 || num > selectedExam.max) {
        errs[stu.id] = `0–${selectedExam.max}`;
      } else {
        validMarks.push({ examId: selectedExam.id, studentId: stu.id, marks: num });
      }
    });

    if (Object.keys(errs).length > 0) {
      setMarkErrors(errs);
      showToast('Fix highlighted mark values before saving', 'error');
      return;
    }
    setMarkErrors({});
    dispatch({ type: 'SAVE_MARKS', payload: { examId: selectedExam.id, marks: validMarks } });
    showToast(`Saved marks for ${validMarks.length} student(s)`, 'success');
  };

  const rankedResults = useMemo(() => {
    if (!selectedExam) return [];
    return classStudents
      .map((stu) => {
        const m = state.marks.find((x) => x.examId === selectedExam.id && x.studentId === stu.id);
        const score = m ? m.marks : null;
        const pct = score !== null ? Math.round((score / selectedExam.max) * 100) : null;
        return {
          student: stu,
          score,
          pct,
          grade: pct !== null ? computeGrade(pct) : '—',
          passed: pct !== null ? pct >= 40 : null,
        };
      })
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [selectedExam, classStudents, state.marks]);

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D4A017]" />
            Exams & Marks Management
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            Create exams, record marks (40% pass threshold), and print ranked class result sheets.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <Printer className="w-4 h-4" />
          Print Result Sheet
        </button>
      </div>

      {/* Create Exam Form */}
      <section className="erp-card p-5 space-y-4 no-print">
        <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#D4A017]" />
          Create Exam Entry
        </h3>
        <form onSubmit={handleCreateExam} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end" noValidate>
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-type">
              Exam Type
            </label>
            <input
              id="ex-type"
              type="text"
              value={exType}
              onChange={(e) => setExType(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-dept">
              Dept
            </label>
            <select
              id="ex-dept"
              value={exDept}
              onChange={(e) => {
                const d = e.target.value;
                setExDept(d);
                const firstSub = state.departments.find((x) => x.code === d)?.subjects[0];
                if (firstSub) setExSubject(firstSub);
              }}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {state.departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-year">
              Year
            </label>
            <select
              id="ex-year"
              value={exYear}
              onChange={(e) => setExYear(Number(e.target.value))}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-sec">
              Section
            </label>
            <select
              id="ex-sec"
              value={exSection}
              onChange={(e) => setExSection(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {state.settings.sections.map((s) => (
                <option key={s} value={s}>
                  Sec {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-sub">
              Subject
            </label>
            <input
              id="ex-sub"
              list="exam-sub-list"
              value={exSubject}
              onChange={(e) => setExSubject(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
            />
            <datalist id="exam-sub-list">
              {deptSubjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-max">
                Max
              </label>
              <input
                id="ex-max"
                type="number"
                min={10}
                max={200}
                value={exMax}
                onChange={(e) => setExMax(Number(e.target.value))}
                className="w-full px-2 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5A0000] mb-1" htmlFor="ex-date">
                Date
              </label>
              <input
                id="ex-date"
                type="date"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
                className="w-full px-2 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
              />
            </div>
          </div>
          <button type="submit" className="btn-gold px-4 py-2 min-h-[44px] text-xs">
            Create Exam
          </button>
        </form>
        {createError && <p className="text-xs font-semibold text-[#C0000C]">{createError}</p>}
      </section>

      {/* Select Exam + Enter Marks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="erp-card p-5 space-y-3 h-fit no-print">
          <h3 className="text-base font-bold text-[#7A0000]">Exams List ({state.exams.length})</h3>
          {state.exams.length === 0 ? (
            <p className="text-xs text-[#5A0000]">No exams created yet.</p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {state.exams.map((ex) => {
                const active = selectedExam?.id === ex.id;
                return (
                  <div
                    key={ex.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      active
                        ? 'bg-[#7A0000] text-white border-[#7A0000]'
                        : 'bg-[#FFF5F5] text-[#1A0000] border-[#E8CFCF]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedExamId(ex.id)}
                      className="text-left flex-1 min-w-0"
                    >
                      <div className={`text-xs font-bold truncate ${active ? 'text-[#FFD700]' : 'text-[#7A0000]'}`}>
                        {ex.subject} · {ex.type}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${active ? 'text-white/85' : 'text-[#5A0000]'}`}>
                        {ex.dept} Y{ex.year}-{ex.section} · Max {ex.max} · {formatDisplayDate(ex.date)}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'DELETE_EXAM', payload: ex.id });
                        showToast('Exam removed', 'info');
                      }}
                      aria-label={`Delete exam ${ex.subject}`}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        active ? 'text-white hover:bg-white/15' : 'text-[#C0000C] hover:bg-[#C0000C]/10'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Marks Entry + Ranked Result Sheet */}
        <section className="lg:col-span-2 erp-card p-5 space-y-4 print-container">
          {!selectedExam ? (
            <div className="p-8 text-center text-xs text-[#5A0000]">Select or create an exam.</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8CFCF] pb-3">
                <div>
                  <div className="text-[11px] font-bold text-[#5A0000] uppercase">
                    {state.settings.institutionName}
                  </div>
                  <h3 className="text-base font-bold text-[#7A0000]">
                    {selectedExam.subject} — {selectedExam.type} ({selectedExam.dept} Y{selectedExam.year}-
                    {selectedExam.section})
                  </h3>
                  <p className="text-xs text-[#5A0000]">
                    Max Marks: {selectedExam.max} · Date: {formatDisplayDate(selectedExam.date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveMarks}
                  className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1.5 no-print"
                >
                  <Save className="w-4 h-4" />
                  Save Marks
                </button>
              </div>

              {classStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5A0000] bg-[#FFF5F5] rounded-xl">
                  No students enrolled in {selectedExam.dept} Year {selectedExam.year} Section{' '}
                  {selectedExam.section}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#FFF5F5] text-[#7A0000] border-b border-[#E8CFCF]">
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Roll No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Marks (/{selectedExam.max})</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8CFCF]">
                      {rankedResults.map((row, idx) => (
                        <tr key={row.student.id}>
                          <td className="py-2.5 px-3 font-bold text-[#7A0000] tabular-nums">
                            #{idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#7A0000]">
                            {row.student.roll}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() => openStudentProfile(row.student.id)}
                              className="font-bold text-[#1A0000] hover:underline text-left"
                            >
                              {row.student.name}
                            </button>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min={0}
                              max={selectedExam.max}
                              aria-label={`Marks for ${row.student.name}`}
                              value={draftMarks[row.student.id] ?? ''}
                              onChange={(e) =>
                                setDraftMarks((prev) => ({ ...prev, [row.student.id]: e.target.value }))
                              }
                              className={`w-24 px-2.5 py-1.5 min-h-[38px] rounded-lg border text-xs font-mono font-bold tabular-nums ${
                                markErrors[row.student.id]
                                  ? 'border-[#C0000C] bg-[#FFF5F5]'
                                  : 'border-[#E8CFCF]'
                              }`}
                            />
                            {markErrors[row.student.id] && (
                              <span className="ml-1.5 text-[10px] font-bold text-[#C0000C]">
                                {markErrors[row.student.id]}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#7A0000]">{row.grade}</td>
                          <td className="py-2.5 px-3">
                            {row.passed === null ? (
                              <span className="text-[#5A0000]">Pending</span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold ${
                                  row.passed
                                    ? 'bg-[#1E9E4A]/10 text-[#1E9E4A]'
                                    : 'bg-[#C0000C]/10 text-[#C0000C]'
                                }`}
                              >
                                {row.passed ? 'PASS' : 'FAIL'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
