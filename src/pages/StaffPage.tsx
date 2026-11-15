import React, { useMemo, useState } from 'react';
import { Edit2, Mail, Plus, Search, Trash2, X } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Staff } from '../data/types';
import { useApp } from '../store/AppContext';

export const StaffPage: React.FC = () => {
  const { state, dispatch, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('CSE');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [assignedInput, setAssignedInput] = useState('');
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.staff.filter((s) => {
      if (deptFilter && s.dept !== deptFilter) return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.email.toLowerCase().includes(q) &&
        !s.designation.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [state.staff, search, deptFilter]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setDept(state.departments[0]?.code || 'CSE');
    setDesignation('Assistant Professor');
    setAssignedInput('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (st: Staff) => {
    setEditing(st);
    setName(st.name);
    setEmail(st.email);
    setDept(st.dept);
    setDesignation(st.designation);
    setAssignedInput((st.assignedClasses || []).join(', '));
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Staff name and email are required.');
      return;
    }
    const dup = state.staff.find(
      (s) => s.email.toLowerCase() === email.trim().toLowerCase() && s.id !== editing?.id
    );
    if (dup) {
      setError(`Email ${email} is already assigned to ${dup.name}.`);
      return;
    }
    const assignedClasses = assignedInput
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    if (editing) {
      dispatch({
        type: 'UPDATE_STAFF',
        payload: {
          ...editing,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          dept,
          designation: designation.trim(),
          assignedClasses,
        },
      });
      showToast(`Updated ${name.trim()}`, 'success');
    } else {
      dispatch({
        type: 'ADD_STAFF',
        payload: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          dept,
          designation: designation.trim(),
          assignedClasses,
          status: 'Present',
        },
      });
      showToast(`Added ${name.trim()}`, 'success');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="erp-card p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000]">Faculty &amp; Staff Directory</h2>
          <p className="text-xs text-[#5A0000]">
            {filtered.length} of {state.staff.length} staff members · Default faculty password:
            faculty123
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 min-h-[44px] btn-gold text-xs"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      <div className="erp-card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#5A0000] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff by name, email, or designation..."
            className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs focus:border-[#7A0000] outline-none"
          />
        </div>
        <select
          aria-label="Filter staff by department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
        >
          <option value="">All Departments</option>
          {state.departments.map((d) => (
            <option key={d.code} value={d.code}>
              {d.code}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="erp-card p-10 text-center text-sm text-[#5A0000]">
          No staff members match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((st) => (
            <div key={st.id} className="erp-card erp-card-hover p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#7A0000]">{st.name}</h3>
                  <p className="text-xs font-semibold text-[#333333] mt-0.5">
                    {st.designation} · {st.dept}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-[#5A0000] mt-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="font-mono">{st.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(st)}
                    aria-label={`Edit ${st.name}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5A0000] hover:bg-[#FFF5F5]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(st)}
                    aria-label={`Delete ${st.name}`}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[#C0000C] hover:bg-[#FFF5F5]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8CFCF]">
                <div className="text-[11px] font-bold text-[#5A0000] mb-1">Assigned Classes</div>
                {st.assignedClasses && st.assignedClasses.length > 0 ? (
                  <div className="text-xs text-[#1A0000] space-y-0.5">
                    {st.assignedClasses.map((cls) => (
                      <div key={cls}>• {cls}</div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#5A0000]">No classes assigned yet</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl border border-[#E8CFCF] shadow-2xl max-w-md w-full p-6 page-transition">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8CFCF]">
              <h3 className="text-lg font-bold text-[#7A0000]">
                {editing ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#5A0000] hover:bg-[#FFF5F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              {error && (
                <div className="px-3 py-2 rounded-xl bg-[#C0000C] text-white text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#5A0000] mb-1">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. K. Anand"
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A0000] mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anand@ssec.edu.in"
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A0000] mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white"
                  >
                    {state.departments.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A0000] mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A0000] mb-1">
                  Assigned Classes (comma-separated)
                </label>
                <input
                  type="text"
                  value={assignedInput}
                  onChange={(e) => setAssignedInput(e.target.value)}
                  placeholder="ECE302 Digital Systems Yr 2, Lab 3"
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 min-h-[44px] rounded-full border border-[#E8CFCF] text-xs font-semibold text-[#333333]"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 min-h-[44px] btn-gold text-xs">
                  {editing ? 'Save Changes' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Staff Member?"
        message={`Remove ${deleteTarget?.name} (${deleteTarget?.email}) from the faculty directory?`}
        confirmLabel="Delete Staff"
        onConfirm={() => {
          if (deleteTarget) {
            dispatch({ type: 'DELETE_STAFF', payload: deleteTarget.id });
            showToast(`Removed ${deleteTarget.name}`, 'info');
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
