import React, { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Student } from '../data/types';
import { useApp } from '../store/AppContext';
import { formatDisplayDate } from '../utils/date';
import { downloadStudentIdCardPdf } from '../utils/pdf';

interface IdCardPreviewProps {
  student: Student;
  showActions?: boolean;
  compact?: boolean;
}

export const IdCardPreview: React.FC<IdCardPreviewProps> = ({
  student,
  showActions = true,
  compact = false,
}) => {
  const { state, showToast } = useApp();
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  const initials = student.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const handleDownloadPdf = () => {
    const canvas = qrContainerRef.current?.querySelector('canvas');
    const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
    downloadStudentIdCardPdf(student, state.settings, dataUrl);
    showToast('PDF Downloaded', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`w-full ${
          compact ? 'max-w-[330px]' : 'max-w-[380px]'
        } bg-white rounded-2xl border border-[#E8CFCF] shadow-md overflow-hidden print-container`}
      >
        {/* Maroon header */}
        <div className="red-gradient-bg plus-pattern px-4 py-3 text-white flex items-center gap-3 border-b-2 border-[#FFD700]">
          {state.settings.logo ? (
            <img
              src={state.settings.logo}
              alt={state.settings.institutionName}
              className="w-9 h-9 rounded-full object-cover border border-[#FFD700] shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#5A0000] border border-[#FFD700] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-7 h-7" aria-hidden="true">
                <path d="M50 24 L82 38 L50 52 L18 38 Z" fill="#FFFFFF" />
                <polygon points="50,54 74,43 74,62 50,72 26,62 26,43" fill="#FFD700" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold tracking-wide uppercase truncate">
              {state.settings.institutionName}
            </div>
            <div className="text-[10px] text-[#FFD700] truncate">
              {state.settings.address} · {state.settings.affiliation}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex items-center gap-3.5">
          {/* Photo */}
          <div className="w-20 h-24 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center shrink-0 overflow-hidden">
            {student.photo ? (
              <img
                src={student.photo}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-[#7A0000]" style={{ fontFamily: 'var(--font-heading)' }}>
                {initials}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-[#1A0000] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {student.name}
            </div>
            <div className="text-xs font-mono font-bold text-[#7A0000] mt-0.5 tabular-nums">
              {student.roll}
            </div>
            <dl className="mt-2 space-y-0.5 text-xs text-[#333333]">
              <div className="flex gap-1.5">
                <dt className="font-semibold text-[#5A0000]">Class:</dt>
                <dd>
                  {student.dept}-{student.section} · Year {student.year}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-semibold text-[#5A0000]">DOB:</dt>
                <dd className="tabular-nums">{formatDisplayDate(student.dob)}</dd>
              </div>
              {student.phone && (
                <div className="flex gap-1.5">
                  <dt className="font-semibold text-[#5A0000]">Phone:</dt>
                  <dd className="tabular-nums truncate">{student.phone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Local QR Code */}
          <div
            ref={qrContainerRef}
            data-qr-roll={student.roll}
            className="p-1.5 bg-white border border-[#E8CFCF] rounded-lg shrink-0"
          >
            <QRCodeCanvas
              value={`ERP-STUDENT:${student.roll}`}
              size={66}
              level="M"
              bgColor="#FFFFFF"
              fgColor="#1A0000"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FFF5F5] px-4 py-2 border-t border-[#E8CFCF] flex items-center justify-between text-[11px] font-semibold text-[#5A0000]">
          <span>STUDENT IDENTITY CARD</span>
          <span className="text-[#7A0000] font-bold">Valid Till 2027</span>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-[#E8CFCF] bg-white text-xs font-semibold text-[#5A0000] hover:bg-[#FFF5F5] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] btn-gold text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};
