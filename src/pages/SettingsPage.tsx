import React, { useRef, useState } from 'react';
import {
  Building2,
  Clock,
  Download,
  ImagePlus,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { Logo } from '../components/Logo';
import { SmartErpState } from '../data/types';
import { useApp } from '../store/AppContext';

export const SettingsPage: React.FC = () => {
  const { state, dispatch, showToast } = useApp();

  const [institutionName, setInstitutionName] = useState(state.settings.institutionName);
  const [address, setAddress] = useState(state.settings.address);
  const [affiliation, setAffiliation] = useState(state.settings.affiliation);
  const [logo, setLogo] = useState<string | undefined>(state.settings.logo);

  const [windowStart, setWindowStart] = useState(state.settings.windowStart);
  const [windowEnd, setWindowEnd] = useState(state.settings.windowEnd);
  const [lateThresholdMin, setLateThresholdMin] = useState(state.settings.lateThresholdMin);
  const [lowAttendanceThreshold, setLowAttendanceThreshold] = useState(
    state.settings.lowAttendanceThreshold
  );
  const [demoWindowOverride, setDemoWindowOverride] = useState(state.settings.demoWindowOverride);

  const [newSection, setNewSection] = useState('');
  const [error, setError] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const backupInputRef = useRef<HTMLInputElement | null>(null);

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        setLogo(dataUrl);
        showToast('Logo ready — click Save Settings to apply', 'info');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim() || !address.trim() || !affiliation.trim()) {
      setError('Institution Name, Address, and Affiliation line are required.');
      return;
    }
    if (windowEnd <= windowStart) {
      setError('Attendance window end time must be after start time.');
      return;
    }
    if (lowAttendanceThreshold < 50 || lowAttendanceThreshold > 95) {
      setError('Low attendance threshold should be between 50% and 95%.');
      return;
    }
    setError('');
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        institutionName: institutionName.trim(),
        address: address.trim(),
        affiliation: affiliation.trim(),
        logo,
        windowStart,
        windowEnd,
        lateThresholdMin: Number(lateThresholdMin),
        lowAttendanceThreshold: Number(lowAttendanceThreshold),
        demoWindowOverride,
      },
    });
    showToast('Settings saved', 'success');
  };

  const handleExportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smarterp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast('Backup exported (JSON)', 'success');
  };

  const handleRestoreBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SmartErpState;
      if (!parsed || !Array.isArray(parsed.students) || !parsed.settings) {
        throw new Error('Invalid Smart ERP backup JSON structure.');
      }
      dispatch({ type: 'RESTORE_BACKUP', payload: parsed });
      setInstitutionName(parsed.settings.institutionName);
      setAddress(parsed.settings.address);
      setAffiliation(parsed.settings.affiliation);
      setLogo(parsed.settings.logo);
      setWindowStart(parsed.settings.windowStart);
      setWindowEnd(parsed.settings.windowEnd);
      setLateThresholdMin(parsed.settings.lateThresholdMin);
      setLowAttendanceThreshold(parsed.settings.lowAttendanceThreshold);
      setDemoWindowOverride(parsed.settings.demoWindowOverride);
      showToast('Backup restored successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to restore backup', 'error');
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const handleResetDemo = () => {
    dispatch({ type: 'RESET_DEMO_DATA' });
    setResetModalOpen(false);
    setInstitutionName('SREE SAKTHI ENGINEERING COLLEGE');
    setAddress('Karamadai');
    setAffiliation('Affiliated to Anna University, Approved by AICTE');
    setLogo(undefined);
    setWindowStart('08:45');
    setWindowEnd('09:15');
    setLateThresholdMin(10);
    setLowAttendanceThreshold(75);
    setDemoWindowOverride(true);
    showToast('Demo data restored to defaults', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="erp-card p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#7A0000] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D4A017]" />
            ERP Settings & Institution Configuration
          </h2>
          <p className="text-xs text-[#5A0000] mt-0.5">
            Changes to institution details reflect immediately across sidebars, ID cards, reports, and PDFs.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Institution Profile */}
          <section className="erp-card p-5 space-y-4">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D4A017]" />
              Institution Profile
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-inst">
                Institution Name
              </label>
              <input
                id="set-inst"
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-addr">
                Address / Location
              </label>
              <input
                id="set-addr"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-aff">
                Affiliation Line
              </label>
              <input
                id="set-aff"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-[#5A0000]">
                Custom Logo (optional, resized to 256px)
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-bold text-[#7A0000] hover:bg-[#FFF5F5]"
                >
                  <ImagePlus className="w-4 h-4" />
                  Upload Logo
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={() => setLogo(undefined)}
                    className="text-xs font-bold text-[#C0000C] hover:underline"
                  >
                    Reset to Default Cap
                  </button>
                )}
              </div>
            </div>

            {/* Live Header Preview */}
            <div className="rounded-2xl red-gradient-bg plus-pattern p-4 text-white border border-[#FFD700]/40">
              <div className="text-[10px] uppercase tracking-wider text-[#FFD700] mb-2 font-bold">
                Live Branding Preview
              </div>
              <div className="flex items-center justify-between gap-3">
                <Logo variant="compact" tone="on-red" size="sm" customLogoUrl={logo} />
                <div className="text-right min-w-0">
                  <div className="text-xs font-bold text-white truncate">{institutionName || '—'}</div>
                  <div className="text-[10px] text-[#FFD700] truncate">
                    {address || '—'} · {affiliation || '—'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Attendance Window & Sections */}
          <section className="erp-card p-5 space-y-4">
            <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A017]" />
              Attendance Window & Thresholds
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-start">
                  Window Start
                </label>
                <input
                  id="set-start"
                  type="time"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-end">
                  Window End
                </label>
                <input
                  id="set-end"
                  type="time"
                  value={windowEnd}
                  onChange={(e) => setWindowEnd(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-late">
                  Late Threshold (mins)
                </label>
                <input
                  id="set-late"
                  type="number"
                  min={1}
                  max={60}
                  value={lateThresholdMin}
                  onChange={(e) => setLateThresholdMin(Number(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5A0000] mb-1" htmlFor="set-low">
                  Low Attendance %
                </label>
                <input
                  id="set-low"
                  type="number"
                  min={50}
                  max={95}
                  value={lowAttendanceThreshold}
                  onChange={(e) => setLowAttendanceThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs"
                />
              </div>
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] cursor-pointer">
              <div>
                <div className="text-xs font-bold text-[#7A0000]">Demo Override (Keep Window Open)</div>
                <div className="text-[11px] text-[#5A0000]">
                  Allows testing attendance marking outside scheduled hours
                </div>
              </div>
              <input
                type="checkbox"
                checked={demoWindowOverride}
                onChange={(e) => setDemoWindowOverride(e.target.checked)}
                className="w-5 h-5 accent-[#7A0000]"
              />
            </label>

            {/* Sections */}
            <div className="pt-2 space-y-2 border-t border-[#E8CFCF]">
              <div className="text-xs font-bold text-[#5A0000]">Active Class Sections</div>
              <div className="flex flex-wrap gap-2">
                {state.settings.sections.map((sec) => (
                  <span
                    key={sec}
                    className="px-3 py-1 rounded-full bg-[#7A0000] text-[#FFD700] text-xs font-bold"
                  >
                    Section {sec}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="Add section (e.g., D)"
                  aria-label="Add new section"
                  className="flex-1 px-3 py-2 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={() => {
                    const s = newSection.trim().toUpperCase();
                    if (!s || state.settings.sections.includes(s)) return;
                    dispatch({ type: 'ADD_SECTION', payload: s });
                    setNewSection('');
                    showToast(`Section ${s} added`, 'success');
                  }}
                  className="px-4 py-2 min-h-[44px] rounded-full border border-[#7A0000] text-[#7A0000] text-xs font-bold hover:bg-[#FFF5F5]"
                >
                  Add
                </button>
              </div>
            </div>
          </section>
        </div>

        {error && (
          <p className="text-xs font-bold text-[#C0000C]" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-gold px-7 py-3 min-h-[44px] text-sm inline-flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>

      {/* Backup & Reset */}
      <section className="erp-card p-5 space-y-4">
        <h3 className="text-base font-bold text-[#7A0000] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#D4A017]" />
          Data Backup & Demo Reset
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-bold text-[#7A0000] hover:bg-[#FFF5F5]"
          >
            <Download className="w-4 h-4" />
            Export backup (JSON)
          </button>

          <input
            ref={backupInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => handleRestoreBackup(e.target.files?.[0])}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-bold text-[#7A0000] hover:bg-[#FFF5F5]"
          >
            <Upload className="w-4 h-4" />
            Restore backup
          </button>

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full bg-[#C0000C] text-white text-xs font-bold hover:opacity-90"
          >
            <RotateCcw className="w-4 h-4" />
            Reset demo data
          </button>
        </div>
      </section>

      <ConfirmModal
        open={resetModalOpen}
        title="Reset Demo Data"
        message="This will clear any edits in localStorage and restore all 120 seeded students, 12 staff, and 14 days of attendance history. Continue?"
        confirmLabel="Reset Data"
        variant="danger"
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDemo}
      />
    </div>
  );
};
