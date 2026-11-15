import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, X } from 'lucide-react';
import { Student } from '../data/types';
import { useApp } from '../store/AppContext';

interface StudentFormModalProps {
  open: boolean;
  editingStudent?: Student | null;
  onClose: () => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  open,
  editingStudent,
  onClose,
}) => {
  const { state, dispatch, showToast } = useApp();

  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('CSE');
  const [year, setYear] = useState(1);
  const [section, setSection] = useState('A');
  const [phone, setPhone] = useState('');
  const [dobDay, setDobDay] = useState('14');
  const [dobMonth, setDobMonth] = useState('05');
  const [dobYear, setDobYear] = useState('2005');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Camera capture state (camera only, no file upload)
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    if (editingStudent) {
      setRoll(editingStudent.roll);
      setName(editingStudent.name);
      setDept(editingStudent.dept);
      setYear(editingStudent.year);
      setSection(editingStudent.section);
      setPhone(editingStudent.phone || '');
      const [y, m, d] = (editingStudent.dob || '2005-05-14').split('-');
      setDobYear(y || '2005');
      setDobMonth(m || '05');
      setDobDay(d || '14');
      setPhoto(editingStudent.photo);
    } else {
      setRoll('');
      setName('');
      setDept(state.departments[0]?.code || 'CSE');
      setYear(1);
      setSection(state.settings.sections[0] || 'A');
      setPhone('');
      setDobYear('2006');
      setDobMonth('05');
      setDobDay('15');
      setPhoto(undefined);
    }
    setErrors({});
    setCameraError('');
  }, [open, editingStudent, state.departments, state.settings.sections]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is unavailable in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      });
    } catch {
      setCameraError('Camera permission denied or no camera device detected.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    const w = 240;
    const h = 300;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetRatio = w / h;
    const sourceRatio = video.videoWidth / video.videoHeight;
    let sw = video.videoWidth;
    let sh = video.videoHeight;
    let sx = 0;
    let sy = 0;
    if (sourceRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = (video.videoHeight - sh) / 2;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    setPhoto(canvas.toDataURL('image/jpeg', 0.85));
    stopCamera();
    showToast('Photo captured from camera', 'success');
  };

  if (!open) return null;

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => String(currentYear - 14 - i));
  const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const cleanRoll = roll.trim().toUpperCase();
    const cleanName = name.trim();

    if (!cleanRoll) nextErrors.roll = 'Roll number is required.';
    else {
      const dup = state.students.find(
        (s) => s.roll.toUpperCase() === cleanRoll && s.id !== editingStudent?.id
      );
      if (dup) nextErrors.roll = `Roll number ${cleanRoll} already belongs to ${dup.name}.`;
    }

    if (!cleanName) nextErrors.name = 'Student full name is required.';
    if (!dept) nextErrors.dept = 'Select a department.';
    if (!dobDay || !dobMonth || !dobYear) nextErrors.dob = 'Complete date of birth is required.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const dob = `${dobYear}-${dobMonth}-${dobDay}`;
    if (editingStudent) {
      dispatch({
        type: 'UPDATE_STUDENT',
        payload: {
          ...editingStudent,
          roll: cleanRoll,
          name: cleanName,
          dept,
          year,
          section,
          dob,
          phone: phone.trim() || undefined,
          photo,
        },
      });
      showToast(`Updated ${cleanName}`, 'success');
    } else {
      dispatch({
        type: 'ADD_STUDENT',
        payload: {
          roll: cleanRoll,
          name: cleanName,
          dept,
          year,
          section,
          dob,
          phone: phone.trim() || undefined,
          photo,
        },
      });
      showToast(`Added ${cleanName} (${cleanRoll})`, 'success');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-form-title"
    >
      <div className="bg-white rounded-2xl border border-[#E8CFCF] shadow-2xl max-w-lg w-full p-6 my-8 page-transition">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8CFCF]">
          <div>
            <h2 id="student-form-title" className="text-lg font-bold text-[#7A0000]">
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </h2>
            <p className="text-xs text-[#5A0000]">
              Students can sign in with their roll number and password student123
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5A0000] hover:bg-[#FFF5F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="sf-roll" className="block text-xs font-semibold text-[#5A0000] mb-1">
                Roll No *
              </label>
              <input
                id="sf-roll"
                type="text"
                value={roll}
                onChange={(e) => {
                  setRoll(e.target.value);
                  setErrors((p) => ({ ...p, roll: '' }));
                }}
                placeholder="e.g. CSE24015"
                className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm font-mono uppercase focus:border-[#7A0000] outline-none"
              />
              {errors.roll && <p className="text-xs text-[#C0000C] mt-1">{errors.roll}</p>}
            </div>

            <div>
              <label htmlFor="sf-name" className="block text-xs font-semibold text-[#5A0000] mb-1">
                Full Name *
              </label>
              <input
                id="sf-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({ ...p, name: '' }));
                }}
                placeholder="Enter full name"
                className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm focus:border-[#7A0000] outline-none"
              />
              {errors.name && <p className="text-xs text-[#C0000C] mt-1">{errors.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="sf-dept" className="block text-xs font-semibold text-[#5A0000] mb-1">
                Department *
              </label>
              <select
                id="sf-dept"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white focus:border-[#7A0000] outline-none"
              >
                {state.departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf-year" className="block text-xs font-semibold text-[#5A0000] mb-1">
                Year *
              </label>
              <select
                id="sf-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white focus:border-[#7A0000] outline-none"
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sf-sec" className="block text-xs font-semibold text-[#5A0000] mb-1">
                Section *
              </label>
              <select
                id="sf-sec"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white focus:border-[#7A0000] outline-none"
              >
                {state.settings.sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3-dropdown DOB picker */}
          <div>
            <span className="block text-xs font-semibold text-[#5A0000] mb-1">
              Date of Birth (Day / Month / Year) *
            </span>
            <div className="grid grid-cols-3 gap-2">
              <select
                aria-label="Birth Day"
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}
                className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white"
              >
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {Number(d)}
                  </option>
                ))}
              </select>
              <select
                aria-label="Birth Month"
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}
                className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white"
              >
                {MONTHS.map((m, idx) => {
                  const val = String(idx + 1).padStart(2, '0');
                  return (
                    <option key={m} value={val}>
                      {m}
                    </option>
                  );
                })}
              </select>
              <select
                aria-label="Birth Year"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}
                className="px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm bg-white"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {errors.dob && <p className="text-xs text-[#C0000C] mt-1">{errors.dob}</p>}
          </div>

          <div>
            <label htmlFor="sf-phone" className="block text-xs font-semibold text-[#5A0000] mb-1">
              Phone (Optional)
            </label>
            <input
              id="sf-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm focus:border-[#7A0000] outline-none"
            />
          </div>

          {/* Camera-only Photo */}
          <div className="p-3 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-14 rounded-lg bg-white border border-[#E8CFCF] flex items-center justify-center overflow-hidden shrink-0">
                  {photo ? (
                    <img src={photo} alt="Captured student" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-[#7A0000]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#7A0000]">Student Photo (Camera Only)</div>
                  <div className="text-[11px] text-[#5A0000]">
                    Capture live photo via webcam for ID card verification
                  </div>
                </div>
              </div>
              {!cameraOpen ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-2 min-h-[44px] rounded-full bg-[#7A0000] text-white text-xs font-semibold hover:bg-[#A50000] transition-colors shrink-0"
                >
                  Take Photo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3.5 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-semibold text-[#333333] shrink-0"
                >
                  Cancel Camera
                </button>
              )}
            </div>

            {cameraError && <p className="text-xs text-[#C0000C] mt-2">{cameraError}</p>}

            {cameraOpen && (
              <div className="mt-3 space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-52 rounded-xl bg-black object-cover"
                />
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-2.5 min-h-[44px] btn-gold text-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Capture Frame
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-full border border-[#E8CFCF] text-sm font-semibold text-[#333333] hover:bg-[#FFF5F5]"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2.5 min-h-[44px] btn-gold text-sm">
              {editingStudent ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
