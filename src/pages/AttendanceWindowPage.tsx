import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Lock,
  QrCode,
  ScanFace,
  Search,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { AttendanceMethod, AttendanceStatus, Student } from '../data/types';
import { useWindowStatus } from '../hooks/useWindowStatus';
import { useApp } from '../store/AppContext';
import { computeStudentAttendanceStats } from '../utils/attendance';
import { formatNowTime12, toDateKey } from '../utils/date';

const HISTORY_PAGE_SIZE = 15;

interface AttendanceWindowPageProps {
  defaultTab?: 'manual' | 'qr' | 'face';
}

export const AttendanceWindowPage: React.FC<AttendanceWindowPageProps> = ({
  defaultTab = 'manual',
}) => {
  const { state, dispatch, session, showToast } = useApp();
  const windowStatus = useWindowStatus();
  const [searchParams] = useSearchParams();

  const initialTab =
    (searchParams.get('tab') as 'manual' | 'qr' | 'face' | null) || defaultTab;
  const [activeTab, setActiveTab] = useState<'manual' | 'qr' | 'face'>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab') as 'manual' | 'qr' | 'face' | null;
    if (t) setActiveTab(t);
    else setActiveTab(defaultTab);
  }, [searchParams, defaultTab]);

  // Filter controls
  const [date, setDate] = useState<string>(() => toDateKey());
  const [dept, setDept] = useState<string>(() => searchParams.get('dept') || 'CSE');
  const [year, setYear] = useState<number>(() => Number(searchParams.get('year')) || 3);
  const [section, setSection] = useState<string>(() => searchParams.get('section') || 'A');
  const [subject, setSubject] = useState<string>(
    () => searchParams.get('subject') || 'Data Structures'
  );
  const [period, setPeriod] = useState<number>(() => Number(searchParams.get('period')) || 1);

  // Applied filter state
  const [applied, setApplied] = useState({
    date: toDateKey(),
    dept: searchParams.get('dept') || 'CSE',
    year: Number(searchParams.get('year')) || 3,
    section: searchParams.get('section') || 'A',
    subject: searchParams.get('subject') || 'Data Structures',
    period: Number(searchParams.get('period')) || 1,
  });

  useEffect(() => {
    const qDept = searchParams.get('dept');
    const qYear = searchParams.get('year');
    const qSub = searchParams.get('subject');
    if (qDept || qYear || qSub) {
      const next = {
        date,
        dept: qDept || dept,
        year: qYear ? Number(qYear) : year,
        section: searchParams.get('section') || section,
        subject: qSub || subject,
        period,
      };
      setDept(next.dept);
      setYear(next.year);
      setSection(next.section);
      setSubject(next.subject);
      setApplied(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const allSubjects = useMemo(() => {
    const deptSubjects = state.departments.find((d) => d.code === dept)?.subjects ?? [];
    const base = ['Data Structures', 'DBMS', 'Algorithms', 'OS', 'Digital Systems'];
    return Array.from(new Set([...deptSubjects, ...base]));
  }, [state.departments, dept]);

  const filteredStudents = useMemo(() => {
    return state.students
      .filter(
        (s) =>
          s.dept === applied.dept &&
          s.year === applied.year &&
          s.section === applied.section
      )
      .sort((a, b) => a.roll.localeCompare(b.roll));
  }, [state.students, applied]);

  // Manual marking draft statuses
  const [draftStatuses, setDraftStatuses] = useState<Record<number, AttendanceStatus>>({});

  useEffect(() => {
    const next: Record<number, AttendanceStatus> = {};
    filteredStudents.forEach((stu) => {
      const existing = state.attendance.find(
        (a) =>
          a.date === applied.date &&
          a.subject === applied.subject &&
          a.period === applied.period &&
          a.studentId === stu.id
      );
      next[stu.id] = existing?.status ?? 'Present';
    });
    setDraftStatuses(next);
  }, [filteredStudents, state.attendance, applied]);

  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false);

  const handleApplyFilter = () => {
    setApplied({ date, dept, year, section, subject, period });
    showToast(`Filter applied: ${dept}-${section} Year ${year} · ${subject}`, 'info');
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<number, AttendanceStatus> = {};
    filteredStudents.forEach((s) => {
      next[s.id] = status;
    });
    setDraftStatuses(next);
  };

  const commitBatchSave = () => {
    const nowTime = formatNowTime12();
    const records = filteredStudents.map((s) => ({
      studentId: s.id,
      status: draftStatuses[s.id] ?? 'Present',
    }));
    dispatch({
      type: 'SAVE_ATTENDANCE_BATCH',
      payload: {
        date: applied.date,
        subject: applied.subject,
        period: applied.period,
        records,
        method: 'Manual',
        activityText: `Manual Attendance marked for ${applied.dept} Year ${applied.year} (${applied.subject}) - ${nowTime}`,
      },
    });
    showToast(`Attendance saved at ${nowTime}`, 'success');
    setOverwriteConfirmOpen(false);
  };

  const handleSaveManual = () => {
    if (!windowStatus.isOpen) {
      showToast('Attendance window is closed', 'error');
      return;
    }
    if (filteredStudents.length === 0) {
      showToast('No students in this class filter', 'error');
      return;
    }
    const studentIds = new Set(filteredStudents.map((s) => s.id));
    const hasDuplicate = state.attendance.some(
      (a) =>
        a.date === applied.date &&
        a.subject === applied.subject &&
        a.period === applied.period &&
        studentIds.has(a.studentId)
    );
    if (hasDuplicate) {
      setOverwriteConfirmOpen(true);
      return;
    }
    commitBatchSave();
  };

  // QR Scan Tab State
  const [qrScanning, setQrScanning] = useState(false);
  const [qrCameraLive, setQrCameraLive] = useState(false);
  const [qrRollInput, setQrRollInput] = useState('');
  const [qrResult, setQrResult] = useState<{
    student: Student;
    time: string;
    pct: number;
  } | null>(null);
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrRafRef = useRef<number>(0);

  // Face Check Tab State
  const [faceChecking, setFaceChecking] = useState(false);
  const [faceCameraLive, setFaceCameraLive] = useState(false);
  const [faceStudentId, setFaceStudentId] = useState<number>(() => {
    return state.students.find((s) => s.roll === '267325205039')?.id ?? state.students[0]?.id ?? 1;
  });
  const [faceResult, setFaceResult] = useState<{
    student: Student;
    time: string;
  } | null>(null);
  const faceVideoRef = useRef<HTMLVideoElement | null>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);

  const stopAllStreams = () => {
    if (qrRafRef.current) cancelAnimationFrame(qrRafRef.current);
    qrRafRef.current = 0;
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((t) => t.stop());
      qrStreamRef.current = null;
    }
    if (faceStreamRef.current) {
      faceStreamRef.current.getTracks().forEach((t) => t.stop());
      faceStreamRef.current = null;
    }
    setQrCameraLive(false);
    setFaceCameraLive(false);
  };

  useEffect(() => {
    return () => stopAllStreams();
  }, []);

  useEffect(() => {
    stopAllStreams();
  }, [activeTab]);

  const markSingleStudent = (student: Student, method: AttendanceMethod) => {
    const timeStr = formatNowTime12();
    dispatch({
      type: 'UPSERT_SINGLE_ATTENDANCE',
      payload: {
        date: applied.date,
        studentId: student.id,
        subject: applied.subject,
        period: applied.period,
        method,
        status: 'Present',
        activityText: `${method} Attendance marked for ${student.name} (${student.roll}) - ${timeStr}`,
      },
    });
    const stats = computeStudentAttendanceStats(student.id, state.attendance);
    if (method === 'QR') {
      setQrResult({ student, time: timeStr, pct: stats.pct });
    } else if (method === 'Face') {
      setFaceResult({ student, time: timeStr });
    }
    showToast(`${method} Present marked for ${student.name} at ${timeStr}`, 'success');
  };

  const handleStartQrScan = async () => {
    if (!windowStatus.isOpen) {
      showToast('Attendance window is closed', 'error');
      return;
    }
    setQrScanning(true);
    setQrResult(null);

    const kishore =
      state.students.find((s) => s.roll === '267325205039') ??
      filteredStudents[0] ??
      state.students[0];

    const triggerFallbackScan = () => {
      window.setTimeout(() => {
        stopAllStreams();
        setQrScanning(false);
        if (kishore) markSingleStudent(kishore, 'QR');
      }, 1500);
    };

    const BarcodeDetectorCtor = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => {
          detect: (video: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
        };
      }
    ).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia || !BarcodeDetectorCtor) {
      triggerFallbackScan();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      qrStreamRef.current = stream;
      setQrCameraLive(true);
      const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });

      requestAnimationFrame(() => {
        if (qrVideoRef.current) {
          qrVideoRef.current.srcObject = stream;
          qrVideoRef.current.play().catch(() => {});
        }
      });

      let detected = false;
      const loop = async () => {
        if (!qrStreamRef.current || detected) return;
        const video = qrVideoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            if (codes.length > 0 && codes[0].rawValue) {
              const raw = codes[0].rawValue.trim();
              const match = raw.match(/^(?:ERP-STUDENT:)?([A-Z0-9]+)$/i);
              if (match) {
                const rollStr = match[1].toUpperCase();
                const found = state.students.find((s) => s.roll.toUpperCase() === rollStr);
                if (found) {
                  detected = true;
                  stopAllStreams();
                  setQrScanning(false);
                  markSingleStudent(found, 'QR');
                  return;
                }
              }
            }
          } catch {
            // Continue scanning
          }
        }
        qrRafRef.current = requestAnimationFrame(loop);
      };
      qrRafRef.current = requestAnimationFrame(loop);

      // Auto-complete demo scan after 2.5s if user has no physical QR in front of webcam
      window.setTimeout(() => {
        if (!detected && qrStreamRef.current) {
          detected = true;
          stopAllStreams();
          setQrScanning(false);
          if (kishore) markSingleStudent(kishore, 'QR');
        }
      }, 2500);
    } catch {
      triggerFallbackScan();
    }
  };

  const handleManualQrRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!windowStatus.isOpen) {
      showToast('Attendance window is closed', 'error');
      return;
    }
    const clean = qrRollInput.trim().toUpperCase();
    const stu = state.students.find((s) => s.roll.toUpperCase() === clean);
    if (!stu) {
      showToast(`No student found with roll number "${clean}"`, 'error');
      return;
    }
    markSingleStudent(stu, 'QR');
    setQrRollInput('');
  };

  const handleStartFaceCheck = async () => {
    if (!windowStatus.isOpen) {
      showToast('Attendance window is closed', 'error');
      return;
    }
    setFaceChecking(true);
    setFaceResult(null);

    const targetStu =
      state.students.find((s) => s.id === faceStudentId) ??
      state.students.find((s) => s.roll === '267325205039') ??
      state.students[0];

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        faceStreamRef.current = stream;
        setFaceCameraLive(true);
        requestAnimationFrame(() => {
          if (faceVideoRef.current) {
            faceVideoRef.current.srcObject = stream;
            faceVideoRef.current.play().catch(() => {});
          }
        });
      } catch {
        // Fallback mock frame
      }
    }

    window.setTimeout(() => {
      stopAllStreams();
      setFaceChecking(false);
      if (targetStu) {
        markSingleStudent(targetStu, 'Face');
      }
    }, 2000);
  };

  // History table below
  const [histSearch, setHistSearch] = useState('');
  const [histMethod, setHistMethod] = useState<string>('');
  const [histStatus, setHistStatus] = useState<string>('');
  const [histPage, setHistPage] = useState(1);

  const studentLookup = useMemo(
    () => new Map(state.students.map((s) => [s.id, s])),
    [state.students]
  );

  const historyRows = useMemo(() => {
    const q = histSearch.trim().toLowerCase();
    return state.attendance
      .filter((r) => {
        if (histMethod && r.method !== histMethod) return false;
        if (histStatus && r.status !== histStatus) return false;
        const stu = studentLookup.get(r.studentId);
        if (!stu) return false;
        if (
          q &&
          !stu.name.toLowerCase().includes(q) &&
          !stu.roll.toLowerCase().includes(q) &&
          !r.subject.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.attendance, studentLookup, histSearch, histMethod, histStatus]);

  const totalHistPages = Math.max(1, Math.ceil(historyRows.length / HISTORY_PAGE_SIZE));
  const currentHistPage = Math.min(histPage, totalHistPages);
  const visibleHistory = historyRows.slice(
    (currentHistPage - 1) * HISTORY_PAGE_SIZE,
    currentHistPage * HISTORY_PAGE_SIZE
  );

  const disabledTooltip = windowStatus.isOpen
    ? undefined
    : 'Attendance window is closed — enable Demo Override or wait until window opens';

  return (
    <div className="space-y-6">
      {/* Live Status Card */}
      <div
        className={`rounded-2xl p-5 border-2 shadow-sm flex flex-wrap items-center justify-between gap-4 ${
          windowStatus.isOpen
            ? 'bg-[#1E9E4A]/10 border-[#1E9E4A] text-[#1A0000]'
            : 'bg-[#C0000C]/10 border-[#C0000C] text-[#1A0000]'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 ${
              windowStatus.isOpen ? 'bg-[#1E9E4A]' : 'bg-[#C0000C]'
            }`}
          >
            {windowStatus.isOpen ? <Clock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div
              className={`text-sm sm:text-base font-extrabold tracking-tight ${
                windowStatus.isOpen ? 'text-[#1E9E4A]' : 'text-[#C0000C]'
              }`}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {windowStatus.isOpen
                ? `WINDOW OPEN - Closes in ${windowStatus.remainingMinutes} min ${String(
                    windowStatus.remainingSeconds
                  ).padStart(2, '0')}s - Attendance Enabled`
                : 'WINDOW CLOSED - Attendance Disabled'}
            </div>
            <div className="text-xs text-[#333333] mt-0.5 tabular-nums">
              Configured daily window: <strong>{windowStatus.label}</strong>
              {windowStatus.overrideActive && ' · Demo override active'}
              {!windowStatus.isOpen &&
                windowStatus.opensInMinutes > 0 &&
                ` · Opens in ${windowStatus.opensInMinutes} min`}
            </div>
          </div>
        </div>

        {/* Admin-only Demo Override */}
        {session?.role === 'admin' && (
          <label className="flex items-center gap-2.5 bg-white px-4 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={state.settings.demoWindowOverride}
              onChange={() => {
                dispatch({ type: 'TOGGLE_DEMO_OVERRIDE' });
                showToast(
                  !state.settings.demoWindowOverride
                    ? 'Demo override enabled: Attendance window forced OPEN'
                    : 'Demo override disabled: Using real clock window',
                  'info'
                );
              }}
              className="w-4 h-4 accent-[#7A0000]"
            />
            <span className="text-xs font-bold text-[#7A0000]">
              Demo override: force window OPEN
            </span>
          </label>
        )}
      </div>

      {/* Filters Card */}
      <div className="erp-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label htmlFor="aw-date" className="block text-xs font-bold text-[#5A0000] mb-1">
              Date
            </label>
            <input
              id="aw-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            />
          </div>

          <div>
            <label htmlFor="aw-dept" className="block text-xs font-bold text-[#5A0000] mb-1">
              Department
            </label>
            <select
              id="aw-dept"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {state.departments.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aw-year" className="block text-xs font-bold text-[#5A0000] mb-1">
              Year
            </label>
            <select
              id="aw-year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {[1, 2, 3, 4].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aw-sec" className="block text-xs font-bold text-[#5A0000] mb-1">
              Section
            </label>
            <select
              id="aw-sec"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {state.settings.sections.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aw-subj" className="block text-xs font-bold text-[#5A0000] mb-1">
              Subject
            </label>
            <select
              id="aw-subj"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {allSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="aw-period" className="block text-xs font-bold text-[#5A0000] mb-1">
              Period
            </label>
            <select
              id="aw-period"
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>
                  Period {p}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleApplyFilter}
            className="w-full px-4 py-2.5 min-h-[44px] btn-gold text-xs inline-flex items-center justify-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            Apply Filter
          </button>
        </div>

        {/* Mode Tabs */}
        <div
          className="flex flex-wrap gap-2 pt-2 border-t border-[#E8CFCF]"
          role="tablist"
          aria-label="Attendance marking mode"
        >
          {(
            [
              { id: 'manual', label: 'Manual Marking', icon: UserCheck },
              { id: 'qr', label: 'QR Scan', icon: QrCode },
              { id: 'face', label: 'Face Check', icon: ScanFace },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full text-xs font-bold transition-colors ${
                  activeTab === t.id
                    ? 'bg-[#7A0000] text-white'
                    : 'bg-[#FFF5F5] text-[#7A0000] border border-[#E8CFCF] hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Manual Marking */}
      {activeTab === 'manual' && (
        <div className="erp-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#7A0000]">
                {applied.dept}-{applied.section} · Year {applied.year} · {applied.subject} (Period{' '}
                {applied.period})
              </h3>
              <p className="text-xs text-[#5A0000]">
                {filteredStudents.length} student(s) in selected class · {applied.date}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!windowStatus.isOpen || filteredStudents.length === 0}
                title={disabledTooltip}
                onClick={() => markAll('Present')}
                className="px-3.5 py-2 min-h-[44px] rounded-full bg-[#1E9E4A] text-white text-xs font-bold disabled:opacity-45"
              >
                Mark all present
              </button>
              <button
                type="button"
                disabled={!windowStatus.isOpen || filteredStudents.length === 0}
                title={disabledTooltip}
                onClick={() => markAll('Absent')}
                className="px-3.5 py-2 min-h-[44px] rounded-full bg-[#C0000C] text-white text-xs font-bold disabled:opacity-45"
              >
                Mark all absent
              </button>
              <button
                type="button"
                disabled={!windowStatus.isOpen || filteredStudents.length === 0}
                title={disabledTooltip}
                onClick={handleSaveManual}
                className="px-5 py-2 min-h-[44px] btn-gold text-xs"
              >
                Save Attendance
              </button>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#5A0000]">
              No students found for {applied.dept}-{applied.section} Year {applied.year}. Try another
              filter or add students.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FFF5F5] text-[#7A0000] text-xs">
                  <tr>
                    <th className="text-left py-2.5 px-3">Student</th>
                    <th className="text-left py-2.5 px-3">Roll No</th>
                    <th className="text-left py-2.5 px-3">Dept</th>
                    <th className="text-right py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8CFCF]">
                  {filteredStudents.map((stu) => {
                    const currentStatus = draftStatuses[stu.id] ?? 'Present';
                    const initials = stu.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0].toUpperCase())
                      .join('');
                    return (
                      <tr key={stu.id} className="hover:bg-[#FFF5F5]/50">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#7A0000] text-[#FFD700] text-xs font-bold flex items-center justify-center shrink-0 overflow-hidden">
                              {stu.photo ? (
                                <img
                                  src={stu.photo}
                                  alt={stu.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                initials
                              )}
                            </div>
                            <span className="font-semibold text-[#1A0000]">{stu.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-[#7A0000] tabular-nums">
                          {stu.roll}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-[#5A0000]">
                          {stu.dept}-{stu.section}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <select
                            aria-label={`Status for ${stu.name}`}
                            disabled={!windowStatus.isOpen}
                            value={currentStatus}
                            onChange={(e) =>
                              setDraftStatuses((prev) => ({
                                ...prev,
                                [stu.id]: e.target.value as AttendanceStatus,
                              }))
                            }
                            className={`px-3 py-1.5 min-h-[40px] rounded-xl border text-xs font-bold ${
                              currentStatus === 'Present'
                                ? 'border-[#1E9E4A] text-[#1E9E4A] bg-white'
                                : currentStatus === 'Late'
                                  ? 'border-[#FF8A00] text-[#FF8A00] bg-white'
                                  : 'border-[#C0000C] text-[#C0000C] bg-white'
                            }`}
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                            <option value="Late">Late</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QR Scan */}
      {activeTab === 'qr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="erp-card p-5 flex flex-col items-center gap-4">
            <div className="w-full max-w-sm aspect-[4/3] bg-black rounded-2xl relative overflow-hidden flex items-center justify-center">
              {qrCameraLive && (
                <video
                  ref={qrVideoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {/* White QR corner brackets */}
              <div className="relative z-10 w-44 h-44 flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-white rounded-br-lg" />
                <QrCode className="w-16 h-16 text-white/80" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold text-white bg-black/60 py-1">
                {qrScanning ? 'Scanning QR Code...' : 'Point camera to QR Code'}
              </div>
            </div>

            <button
              type="button"
              disabled={!windowStatus.isOpen || qrScanning}
              title={disabledTooltip}
              onClick={handleStartQrScan}
              className="w-full max-w-sm py-3 min-h-[44px] btn-gold text-sm flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {qrScanning ? 'Scanning...' : 'Start QR Scan'}
            </button>

            <form onSubmit={handleManualQrRoll} className="w-full max-w-sm flex gap-2">
              <input
                type="text"
                value={qrRollInput}
                onChange={(e) => setQrRollInput(e.target.value)}
                placeholder="Fallback roll number (e.g. 267325205039)"
                aria-label="Fallback roll number"
                className="flex-1 px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs font-mono"
              />
              <button
                type="submit"
                disabled={!windowStatus.isOpen}
                title={disabledTooltip}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#7A0000] text-white text-xs font-bold disabled:opacity-45"
              >
                Mark
              </button>
            </form>
          </div>

          <div className="erp-card p-5 flex flex-col justify-center">
            {qrResult ? (
              <div className="p-5 rounded-2xl bg-[#1E9E4A]/10 border border-[#1E9E4A] space-y-3">
                <div className="flex items-center gap-2 text-[#1E9E4A] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>QR Scanned Successfully</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-16 rounded-xl bg-white border border-[#E8CFCF] flex items-center justify-center overflow-hidden shrink-0">
                    {qrResult.student.photo ? (
                      <img
                        src={qrResult.student.photo}
                        alt={qrResult.student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-[#7A0000]">
                        {qrResult.student.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-xs space-y-1 text-[#1A0000]">
                    <div className="text-sm font-bold text-[#7A0000]">
                      QR Scanned - {qrResult.student.name}, {qrResult.student.roll},{' '}
                      {qrResult.student.dept}
                    </div>
                    <div className="font-semibold text-[#1E9E4A]">
                      Present Marked at {qrResult.time} - Method: QR
                    </div>
                    <div className="text-[#5A0000] tabular-nums">
                      Overall Attendance: <strong>{qrResult.pct}%</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <QrCode className="w-10 h-10 text-[#7A0000] mx-auto" />
                <h4 className="text-sm font-bold text-[#7A0000]">Ready for QR Check-In</h4>
                <p className="text-xs text-[#5A0000] max-w-xs mx-auto">
                  Start the camera scan or enter a student roll number manually. If camera or
                  BarcodeDetector is unavailable, a simulated scan completes in 1.5 seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Face Check */}
      {activeTab === 'face' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="erp-card p-5 flex flex-col items-center gap-4">
            <div className="w-full flex items-center justify-between text-xs">
              <span className="font-bold text-[#7A0000]">Demo: face matching is simulated</span>
              <span className="text-[#5A0000]">No camera images are stored</span>
            </div>

            <div className="w-full max-w-sm aspect-[4/3] bg-black rounded-2xl relative overflow-hidden flex items-center justify-center">
              {faceCameraLive && (
                <video
                  ref={faceVideoRef}
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                />
              )}
              {/* Face outline */}
              <div className="relative z-10 w-36 h-44 rounded-full border-2 border-dashed border-[#FFD700] flex items-center justify-center">
                <ScanFace className="w-12 h-12 text-white/75" />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center text-xs font-semibold text-white bg-black/60 py-1">
                {faceChecking ? 'Verifying facial geometry...' : 'Align face in frame'}
              </div>
            </div>

            <div className="w-full max-w-sm space-y-2.5">
              <label htmlFor="face-stu-select" className="block text-xs font-bold text-[#5A0000]">
                Student for Face Check Demo
              </label>
              <select
                id="face-stu-select"
                value={faceStudentId}
                onChange={(e) => setFaceStudentId(Number(e.target.value))}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
              >
                {state.students.slice(0, 30).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.roll}) — {s.dept}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!windowStatus.isOpen || faceChecking}
                title={disabledTooltip}
                onClick={handleStartFaceCheck}
                className="w-full py-3 min-h-[44px] btn-gold text-sm flex items-center justify-center gap-2"
              >
                <ScanFace className="w-4 h-4" />
                {faceChecking ? 'Checking Face...' : 'Start Face Check'}
              </button>
            </div>
          </div>

          <div className="erp-card p-5 flex flex-col justify-center">
            {faceResult ? (
              <div className="p-5 rounded-2xl bg-[#1E9E4A]/10 border border-[#1E9E4A] space-y-2">
                <div className="flex items-center gap-2 text-[#1E9E4A] font-bold text-sm">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Biometric Verification Passed</span>
                </div>
                <div className="text-sm font-bold text-[#1A0000]">
                  Face Matched 98% - Attendance Marked - Proxy Prevented - {faceResult.student.name}
                </div>
                <div className="text-xs text-[#5A0000] tabular-nums">
                  {faceResult.student.roll} · {faceResult.student.dept}-{faceResult.student.section}{' '}
                  · Marked at {faceResult.time} · Method: Face
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-2">
                <ShieldCheck className="w-10 h-10 text-[#7A0000] mx-auto" />
                <h4 className="text-sm font-bold text-[#7A0000]">Proxy-Free Face Check (Demo)</h4>
                <p className="text-xs text-[#5A0000] max-w-xs mx-auto">
                  Starts your camera preview when permitted (or a fallback frame) and logs a
                  simulated 98% match after 2 seconds.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Table Below */}
      <div className="erp-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#7A0000]">Attendance Log History</h3>
            <p className="text-xs text-[#5A0000]">
              {historyRows.length} total matching records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#5A0000] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={histSearch}
                onChange={(e) => {
                  setHistSearch(e.target.value);
                  setHistPage(1);
                }}
                placeholder="Search name, roll, subject..."
                className="pl-8 pr-3 py-2 min-h-[40px] rounded-xl border border-[#E8CFCF] text-xs"
              />
            </div>
            <select
              aria-label="Filter history by method"
              value={histMethod}
              onChange={(e) => {
                setHistMethod(e.target.value);
                setHistPage(1);
              }}
              className="px-3 py-2 min-h-[40px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              <option value="">All Methods</option>
              <option value="Manual">Manual</option>
              <option value="QR">QR</option>
              <option value="Face">Face</option>
            </select>
            <select
              aria-label="Filter history by status"
              value={histStatus}
              onChange={(e) => {
                setHistStatus(e.target.value);
                setHistPage(1);
              }}
              className="px-3 py-2 min-h-[40px] rounded-xl border border-[#E8CFCF] text-xs bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#FFF5F5] text-[#7A0000]">
              <tr>
                <th className="text-left py-2.5 px-3">Name</th>
                <th className="text-left py-2.5 px-3">Roll No</th>
                <th className="text-left py-2.5 px-3">Subject</th>
                <th className="text-left py-2.5 px-3">Period</th>
                <th className="text-left py-2.5 px-3">Time</th>
                <th className="text-left py-2.5 px-3">Method</th>
                <th className="text-right py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8CFCF]">
              {visibleHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5A0000]">
                    No attendance records match your filters.
                  </td>
                </tr>
              ) : (
                visibleHistory.map((rec) => {
                  const stu = studentLookup.get(rec.studentId);
                  const badgeCls =
                    rec.status === 'Present'
                      ? 'text-[#1E9E4A] border-[#1E9E4A]/40 bg-[#1E9E4A]/10'
                      : rec.status === 'Late'
                        ? 'text-[#FF8A00] border-[#FF8A00]/40 bg-[#FF8A00]/10'
                        : 'text-[#C0000C] border-[#C0000C]/40 bg-[#C0000C]/10';

                  return (
                    <tr key={rec.id} className="hover:bg-[#FFF5F5]/50">
                      <td className="py-2.5 px-3 font-semibold text-[#1A0000]">
                        {stu?.name ?? 'Unknown'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#7A0000] tabular-nums">
                        {stu?.roll ?? '—'}
                      </td>
                      <td className="py-2.5 px-3">{rec.subject}</td>
                      <td className="py-2.5 px-3 tabular-nums">P{rec.period}</td>
                      <td className="py-2.5 px-3 tabular-nums">
                        {rec.date} · {rec.time}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#5A0000]">{rec.method}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${badgeCls}`}
                        >
                          <Check className="w-3 h-3" />
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalHistPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#5A0000] tabular-nums">
              Page {currentHistPage} of {totalHistPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentHistPage <= 1}
                onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 min-h-[40px] rounded-full border border-[#E8CFCF] text-xs font-semibold text-[#7A0000] disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={currentHistPage >= totalHistPages}
                onClick={() => setHistPage((p) => Math.min(totalHistPages, p + 1))}
                className="px-3 py-1.5 min-h-[40px] rounded-full border border-[#E8CFCF] text-xs font-semibold text-[#7A0000] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={overwriteConfirmOpen}
        title="Overwrite Existing Attendance?"
        message={`Attendance for ${applied.dept}-${applied.section} Year ${applied.year} (${applied.subject}, Period ${applied.period}) on ${applied.date} already exists. Overwrite with the new statuses?`}
        confirmLabel="Overwrite"
        variant="warning"
        onConfirm={commitBatchSave}
        onCancel={() => setOverwriteConfirmOpen(false)}
      />
    </div>
  );
};
