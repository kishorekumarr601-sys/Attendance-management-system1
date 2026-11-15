import React, { useMemo, useState } from 'react';
import { BookOpen, Layers, Plus, Trash2 } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { useApp } from '../store/AppContext';

export const DepartmentsPage: React.FC = () => {
  const { state, dispatch, showToast } = useApp();

  const [selectedDeptCode, setSelectedDeptCode] = useState<string>(
    state.departments[0]?.code ?? 'CSE'
  );
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [deptError, setDeptError] = useState('');

  const [newSubject, setNewSubject] = useState('');
  const [subjectError, setSubjectError] = useState('');

  const [newSection, setNewSection] = useState('');
  const [sectionError, setSectionError] = useState('');

  const [deleteDeptCode, setDeleteDeptCode] = useState<string | null>(null);

  const selectedDept = useMemo(
    () => state.departments.find((d) => d.code === selectedDeptCode) ?? state.departments[0],
    [state.departments, selectedDeptCode]
  );

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newDeptCode.trim().toUpperCase();
    const name = newDeptName.trim();
    if (!code || !name) {
      setDeptError('Department code and full name are required.');
      return;
    }
    if (state.departments.some((d) => d.code.toUpperCase() === code)) {
      setDeptError(`Department "${code}" already exists.`);
      return;
    }
    setDeptError('');
    dispatch({
      type: 'ADD_DEPARTMENT',
      payload: { code, name, subjects: ['Engineering Mathematics', 'Professional Ethics'] },
    });
    setSelectedDeptCode(code);
    setNewDeptCode('');
    setNewDeptName('');
    showToast(`Department ${code} added`, 'success');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    const sub = newSubject.trim();
    if (!sub) {
      setSubjectError('Enter a subject name.');
      return;
    }
    if (selectedDept.subjects.some((s) => s.toLowerCase() === sub.toLowerCase())) {
      setSubjectError('Subject already exists in this department.');
      return;
    }
    setSubjectError('');
    dispatch({
      type: 'ADD_SUBJECT',
      payload: { deptCode: selectedDept.code, subject: sub },
    });
    setNewSubject('');
    showToast('Subject added', 'success');
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    const sec = newSection.trim().toUpperCase();
    if (!sec || sec.length > 2 || !/^[A-Z0-9]+$/.test(sec)) {
      setSectionError('Enter a 1–2 letter section code (e.g., D).');
      return;
    }
    if (state.settings.sections.includes(sec)) {
      setSectionError(`Section ${sec} already exists.`);
      return;
    }
    setSectionError('');
    dispatch({ type: 'ADD_SECTION', payload: sec });
    setNewSection('');
    showToast(`Section ${sec} added across departments`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#D4A017]" />
            Departments, Subjects & Sections
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            {state.departments.length} departments · {state.settings.sections.length} active sections
          </p>
        </div>

        {/* Add Department Inline Form */}
        <form onSubmit={handleAddDepartment} className="flex flex-wrap items-center gap-2" noValidate>
          <input
            type="text"
            value={newDeptCode}
            onChange={(e) => setNewDeptCode(e.target.value)}
            placeholder="Code (e.g., AIDS)"
            aria-label="New department code"
            className="w-32 px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs uppercase"
          />
          <input
            type="text"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="Full Department Name"
            aria-label="New department full name"
            className="w-56 px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
          />
          <button type="submit" className="btn-gold px-4 py-2 min-h-[44px] text-xs inline-flex items-center gap-1">
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        </form>
      </div>
      {deptError && <p className="text-xs font-semibold text-[#C0000C] -mt-3">{deptError}</p>}

      {/* Department Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.departments.map((dept) => {
          const stuCount = state.students.filter((s) => s.dept === dept.code).length;
          const staffCount = state.staff.filter((st) => st.dept === dept.code).length;
          const active = selectedDept?.code === dept.code;

          return (
            <div
              key={dept.code}
              className={`erp-card p-5 transition-all ${
                active ? 'ring-2 ring-[#7A0000] bg-[#FFF5F5]' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeptCode(dept.code)}
                  className="text-left flex-1"
                >
                  <span className="px-2.5 py-0.5 rounded-full bg-[#7A0000] text-[#FFD700] text-[11px] font-bold">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-[#1A0000] mt-2">{dept.name}</h3>
                  <p className="text-xs text-[#5A0000] mt-1 tabular-nums">
                    {stuCount} students · {staffCount} staff · {dept.subjects.length} subjects
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteDeptCode(dept.code)}
                  aria-label={`Delete department ${dept.code}`}
                  className="w-9 h-9 rounded-full hover:bg-[#C0000C]/10 text-[#C0000C] flex items-center justify-center shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Department Subjects + Classes & Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedDept && (
          <section className="erp-card p-5 space-y-4">
            <h3 className="text-base font-bold text-[#7A0000]">
              Subjects — {selectedDept.code} ({selectedDept.name})
            </h3>
            <form onSubmit={handleAddSubject} className="flex gap-2" noValidate>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="New subject name..."
                aria-label="Add subject name"
                className="flex-1 px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
              />
              <button type="submit" className="btn-gold px-4 py-2 min-h-[44px] text-xs">
                Add Subject
              </button>
            </form>
            {subjectError && <p className="text-xs font-semibold text-[#C0000C]">{subjectError}</p>}

            <div className="space-y-2">
              {selectedDept.subjects.length === 0 ? (
                <p className="text-xs text-[#5A0000]">No subjects listed yet.</p>
              ) : (
                selectedDept.subjects.map((sub) => (
                  <div
                    key={sub}
                    className="px-3.5 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between text-xs font-semibold text-[#1A0000]"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch({
                          type: 'DELETE_SUBJECT',
                          payload: { deptCode: selectedDept.code, subject: sub },
                        });
                        showToast('Subject removed', 'info');
                      }}
                      aria-label={`Remove ${sub}`}
                      className="text-[#C0000C] hover:underline font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Classes & Sections Panel */}
        <section className="erp-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4A017]" />
              Classes & Sections
            </h3>
          </div>

          <form onSubmit={handleAddSection} className="flex gap-2" noValidate>
            <input
              type="text"
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              placeholder="New Section (e.g., D)"
              aria-label="New section code"
              className="flex-1 px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs uppercase"
            />
            <button type="submit" className="btn-gold px-4 py-2 min-h-[44px] text-xs">
              Add Section
            </button>
          </form>
          {sectionError && <p className="text-xs font-semibold text-[#C0000C]">{sectionError}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {state.departments.flatMap((d) =>
              state.settings.sections.map((sec) => {
                const count = state.students.filter((s) => s.dept === d.code && s.section === sec).length;
                return (
                  <div
                    key={`${d.code}-${sec}`}
                    className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[#7A0000]">
                      {d.code}-{sec}
                    </span>
                    <span className="font-mono font-bold text-[#1A0000] tabular-nums">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <ConfirmModal
        open={deleteDeptCode !== null}
        title="Delete Department"
        message={`Are you sure you want to delete department ${deleteDeptCode}?`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteDeptCode(null)}
        onConfirm={() => {
          if (deleteDeptCode) {
            dispatch({ type: 'DELETE_DEPARTMENT', payload: deleteDeptCode });
            showToast(`Department ${deleteDeptCode} removed`, 'info');
          }
          setDeleteDeptCode(null);
        }}
      />
    </div>
  );
};
