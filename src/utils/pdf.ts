import { jsPDF } from 'jspdf';
import { AppSettings, Student } from '../data/types';
import { formatDisplayDate } from './date';
import { StudentAttendanceStats } from './attendance';

function getQrDataUrlFromDom(roll: string): string | null {
  const el = document.querySelector(`[data-qr-roll="${roll}"] canvas`) as HTMLCanvasElement | null;
  if (el) {
    try {
      return el.toDataURL('image/png');
    } catch {
      return null;
    }
  }
  return null;
}

export function downloadStudentIdCardPdf(
  student: Student,
  settings: AppSettings,
  qrDataUrl?: string | null
): void {
  const doc = new jsPDF({ unit: 'mm', format: [92, 58], orientation: 'landscape' });
  drawIdCardOnDoc(doc, student, settings, 0, 0, qrDataUrl ?? getQrDataUrlFromDom(student.roll));
  doc.save(`ID_Card_${student.roll}.pdf`);
}

export function downloadAllIdCardsPdf(students: Student[], settings: AppSettings): void {
  if (students.length === 0) return;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const cardW = 92;
  const cardH = 58;
  const marginX = 11;
  const marginY = 14;
  const gapX = 6;
  const gapY = 8;

  students.forEach((student, idx) => {
    const posInPage = idx % 8;
    if (idx > 0 && posInPage === 0) {
      doc.addPage();
    }
    const col = posInPage % 2;
    const row = Math.floor(posInPage / 2);
    const x = marginX + col * (cardW + gapX);
    const y = marginY + row * (cardH + gapY);
    drawIdCardOnDoc(doc, student, settings, x, y, getQrDataUrlFromDom(student.roll));
  });

  doc.save(`${settings.institutionName.replace(/\s+/g, '_')}_ID_Cards.pdf`);
}

function drawIdCardOnDoc(
  doc: jsPDF,
  student: Student,
  settings: AppSettings,
  x: number,
  y: number,
  qrDataUrl?: string | null
) {
  const w = 92;
  const h = 58;

  // Card border
  doc.setDrawColor(232, 207, 207);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 3, 3, 'FD');

  // Maroon header
  doc.setFillColor(122, 0, 0);
  doc.rect(x, y, w, 13, 'F');
  doc.setFillColor(255, 215, 0);
  doc.rect(x, y + 12.2, w, 0.8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(settings.institutionName.toUpperCase(), x + w / 2, y + 5.5, {
    align: 'center',
    maxWidth: w - 8,
  });

  doc.setTextColor(255, 215, 0);
  doc.setFontSize(5.5);
  doc.text(`${settings.address} · ${settings.affiliation}`, x + w / 2, y + 10, {
    align: 'center',
    maxWidth: w - 8,
  });

  // Photo box or initials
  const px = x + 4.5;
  const py = y + 16.5;
  const pw = 19;
  const ph = 24;
  doc.setDrawColor(232, 207, 207);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(px, py, pw, ph, 1.5, 1.5, 'FD');

  if (student.photo && student.photo.startsWith('data:image')) {
    try {
      doc.addImage(student.photo, 'JPEG', px + 0.5, py + 0.5, pw - 1, ph - 1);
    } catch {
      drawInitials(doc, student.name, px, py, pw, ph);
    }
  } else {
    drawInitials(doc, student.name, px, py, pw, ph);
  }

  // Student info
  const tx = x + 26;
  doc.setTextColor(26, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(student.name, tx, y + 20.5, { maxWidth: 42 });

  doc.setTextColor(122, 0, 0);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(student.roll, tx, y + 25.5);

  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text(`Dept: ${student.dept} - Section ${student.section}`, tx, y + 31);
  doc.text(`Year: Year ${student.year}`, tx, y + 35.5);
  doc.text(`DOB: ${formatDisplayDate(student.dob)}`, tx, y + 40);

  // QR code box
  const qx = x + 69;
  const qy = y + 18;
  const qs = 18.5;
  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, 'PNG', qx, qy, qs, qs);
    } catch {
      drawFallbackQrBox(doc, qx, qy, qs, student.roll);
    }
  } else {
    drawFallbackQrBox(doc, qx, qy, qs, student.roll);
  }

  // Footer
  doc.setFillColor(255, 245, 245);
  doc.rect(x, y + 48, w, 10, 'F');
  doc.setTextColor(90, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('IDENTITY CARD · VALID TILL 2027', x + 4.5, y + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID: ERP-STUDENT:${student.roll}`, x + w - 4.5, y + 54, { align: 'right' });
}

function drawInitials(doc: jsPDF, name: string, x: number, y: number, w: number, h: number) {
  const init = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  doc.setTextColor(122, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(init, x + w / 2, y + h / 2 + 2, { align: 'center' });
}

function drawFallbackQrBox(doc: jsPDF, x: number, y: number, s: number, roll: string) {
  doc.setDrawColor(122, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, s, s, 'FD');
  doc.setFillColor(26, 0, 0);
  // Corner finder squares + deterministic cell pattern
  doc.rect(x + 1.5, y + 1.5, 4, 4, 'F');
  doc.rect(x + s - 5.5, y + 1.5, 4, 4, 'F');
  doc.rect(x + 1.5, y + s - 5.5, 4, 4, 'F');
  let seed = 0;
  for (let i = 0; i < roll.length; i++) seed = (seed * 31 + roll.charCodeAt(i)) % 997;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if ((seed + r * 7 + c * 13) % 2 === 0) {
        doc.rect(x + 6 + c * 1.4, y + 6 + r * 1.4, 1.1, 1.1, 'F');
      }
    }
  }
}

export function downloadAttendanceCertificatePdf(
  student: Student,
  stats: StudentAttendanceStats,
  settings: AppSettings
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'landscape' });
  const w = 210;
  const h = 148;

  // Double border maroon + gold
  doc.setDrawColor(122, 0, 0);
  doc.setLineWidth(1.5);
  doc.rect(6, 6, w - 12, h - 12);
  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(0.6);
  doc.rect(9, 9, w - 18, h - 18);

  // Header band
  doc.setFillColor(122, 0, 0);
  doc.rect(9, 9, w - 18, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.institutionName.toUpperCase(), w / 2, 19, { align: 'center' });

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${settings.address} · ${settings.affiliation}`, w / 2, 26.5, { align: 'center' });

  // Title
  doc.setTextColor(122, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CERTIFICATE OF ATTENDANCE', w / 2, 48, { align: 'center' });

  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(0.8);
  doc.line(65, 51, 145, 51);

  // Body
  doc.setTextColor(35, 35, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('This is to certify that', w / 2, 63, { align: 'center' });

  doc.setTextColor(26, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${student.name} (${student.roll})`, w / 2, 72, { align: 'center' });

  doc.setTextColor(51, 51, 51);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(
    `a student of Year ${student.year}, Department of ${student.dept} (Section ${student.section}),`,
    w / 2,
    81,
    { align: 'center' }
  );
  doc.text(
    `has recorded an overall attendance of ${stats.pct}% (${stats.attended} out of ${stats.total} sessions)`,
    w / 2,
    89,
    { align: 'center' }
  );
  const eligibility = stats.pct >= settings.lowAttendanceThreshold ? 'ELIGIBLE' : 'BELOW THRESHOLD';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(stats.pct >= settings.lowAttendanceThreshold ? 30 : 192, stats.pct >= settings.lowAttendanceThreshold ? 158 : 0, stats.pct >= settings.lowAttendanceThreshold ? 74 : 12);
  doc.text(`Exam Eligibility Status: ${eligibility} (Required: ${settings.lowAttendanceThreshold}%)`, w / 2, 98, {
    align: 'center',
  });

  // Signatures
  doc.setTextColor(90, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Issued on: ${formatDisplayDate(new Date().toISOString().slice(0, 10))}`, 20, 126);
  doc.line(145, 121, 190, 121);
  doc.text('Head of Department / Principal', 167.5, 126, { align: 'center' });

  doc.save(`Attendance_Certificate_${student.roll}.pdf`);
}

export function downloadAttendanceReportPdf(
  rows: Array<{
    roll: string;
    name: string;
    dept: string;
    year: number;
    section: string;
    attended: number;
    total: number;
    pct: number;
  }>,
  subtitle: string,
  settings: AppSettings
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Header
  doc.setFillColor(122, 0, 0);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setFillColor(255, 215, 0);
  doc.rect(0, 25, 210, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(settings.institutionName.toUpperCase(), 14, 11);

  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${settings.address} · ${settings.affiliation}`, 14, 17);
  doc.setTextColor(255, 255, 255);
  doc.text(`Attendance Report — ${subtitle}`, 14, 22.5);

  let y = 36;
  const drawTableHeader = () => {
    doc.setFillColor(255, 245, 245);
    doc.rect(12, y - 5, 186, 7.5, 'F');
    doc.setTextColor(122, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Roll No', 14, y);
    doc.text('Student Name', 45, y);
    doc.text('Class', 112, y);
    doc.text('Attended', 144, y);
    doc.text('Total', 165, y);
    doc.text('%', 186, y);
    y += 6;
  };

  drawTableHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  rows.forEach((row, index) => {
    if (y > 278) {
      doc.addPage();
      y = 20;
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }
    if (index % 2 === 1) {
      doc.setFillColor(250, 248, 248);
      doc.rect(12, y - 4, 186, 6, 'F');
    }
    doc.setTextColor(26, 0, 0);
    doc.text(row.roll, 14, y);
    doc.text(row.name.slice(0, 32), 45, y);
    doc.text(`${row.dept} Y${row.year}-${row.section}`, 112, y);
    doc.text(String(row.attended), 148, y);
    doc.text(String(row.total), 167, y);
    if (row.pct < settings.lowAttendanceThreshold) {
      doc.setTextColor(192, 0, 12);
    } else {
      doc.setTextColor(30, 158, 74);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${row.pct}%`, 186, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
  });

  doc.save(`Attendance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
