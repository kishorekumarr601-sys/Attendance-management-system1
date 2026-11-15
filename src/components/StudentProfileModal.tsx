import React from 'react';
import { Award, CreditCard, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import {
  computeStudentAttendanceStats,
  computeStudentExamSummary,
  computeSubjectAttendance,
} from '../utils/attendance';
import { formatDisplayDate } from '../utils/date';
import { downloadAttendanceCertificatePdf, downloadStudentIdCardPdf } from '../utils/pdf';
import { IdCardPreview } from './IdCardPreview';

export const StudentProfileModal: React.FC = () => {
  const { state, selectedStudentProfileId, closeStudentProfile, showToast } = useApp();

  if (selectedStudentProfileId === null) return null;
  const student = state.students.find((s) => s.id === selectedStudentProfileId);
  if (!student) return null;

  const stats = computeStudentAttendanceStats(student.id, state.attendance);
  const subjects = computeSubjectAttendance(student.id, state.attendance);
  const examSummary = computeStudentExamSummary(student, state.exams, state.marks);
  const threshold = state.settings.lowAttendanceThreshold;

  const handleDownloadId = () => {
    downloadStudentIdCardPdf(student, state.settings);
    showToast('PDF Downloaded', 'success');
  };

  const handleDownloadCert = () => {
    downloadAttendanceCertificatePdf(student, stats, state.settings);
    showToast('PDF Downloaded', 'success');
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-name"
    >
      <div className="bg-white rounded-2xl border border-[#E8CFCF] shadow-2xl max-w-2xl w-full p-6 my-8 page-transition">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E8CFCF]">
          <div>
            <h2 id="profile-modal-name" className="text-xl font-bold text-[#7A0000]">
              {student.name}
            </h2>
            <p className="text-xs text-[#5A0000] mt-0.5 font-mono tabular-nums">
              {student.roll} · {student.dept}-{student.section} · Year {student.year} · DOB{' '}
              {formatDisplayDate(student.dob)}
            </p>
          </div>
          <button
            type="button"
            onClick={closeStudentProfile}
            aria-label="Close student profile"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#5A0000] hover:bg-[#FFF5F5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          {/* Attendance Summary */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5A0000]">Overall Attendance</span>
                <span
                  className={`text-lg font-extrabold tabular-nums ${
                    stats.pct >= threshold ? 'text-[#1E9E4A]' : 'text-[#C0000C]'
                  }`}
                >
                  {stats.pct}%
                </span>
              </div>
              <div className="text-xs text-[#333333] mt-1 tabular-nums">
                {stats.attended} attended / {stats.total} sessions · Late: {stats.lateCount}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#7A0000] mb-2">Subject-wise Attendance</h3>
              {subjects.length === 0 ? (
                <p className="text-xs text-[#5A0000]">No subject attendance recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {subjects.map((sub) => (
                    <div key={sub.subject}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-[#1A0000]">{sub.subject}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            sub.pct >= threshold ? 'text-[#1E9E4A]' : 'text-[#C0000C]'
                          }`}
                        >
                          {sub.pct}% ({sub.attended}/{sub.total})
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#FFF5F5] overflow-hidden border border-[#E8CFCF]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${sub.pct}%`,
                            backgroundColor: sub.pct >= threshold ? '#1E9E4A' : '#C0000C',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#7A0000] mb-2">Marks Summary</h3>
              {examSummary.entries.length === 0 ? (
                <p className="text-xs text-[#5A0000]">No exam marks published yet.</p>
              ) : (
                <div className="border border-[#E8CFCF] rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FFF5F5] text-[#7A0000]">
                      <tr>
                        <th className="text-left py-2 px-3">Subject</th>
                        <th className="text-right py-2 px-3">Score</th>
                        <th className="text-right py-2 px-3">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8CFCF]">
                      {examSummary.entries.map((entry) => (
                        <tr key={entry.exam.id}>
                          <td className="py-1.5 px-3">{entry.exam.subject}</td>
                          <td className="py-1.5 px-3 text-right tabular-nums">
                            {entry.marks}/{entry.exam.max}
                          </td>
                          <td className="py-1.5 px-3 text-right font-bold">{entry.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ID Card */}
          <div className="flex flex-col justify-between gap-4">
            <IdCardPreview student={student} showActions={false} compact />

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownloadId}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] btn-gold text-xs"
              >
                <CreditCard className="w-4 h-4" />
                Download ID Card
              </button>
              <button
                type="button"
                onClick={handleDownloadCert}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full bg-[#7A0000] text-white text-xs font-bold hover:bg-[#A50000] transition-colors"
              >
                <Award className="w-4 h-4 text-[#FFD700]" />
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
