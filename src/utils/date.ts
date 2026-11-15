export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysKey(base: Date, deltaDays: number): string {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + deltaDays);
  return toDateKey(copy);
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '—';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  const hNum = Number(hStr);
  const mNum = Number(mStr);
  if (Number.isNaN(hNum) || Number.isNaN(mNum)) return hhmm;
  const suffix = hNum >= 12 ? 'PM' : 'AM';
  const h12 = hNum % 12 === 0 ? 12 : hNum % 12;
  return `${String(h12).padStart(2, '0')}:${String(mNum).padStart(2, '0')} ${suffix}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export interface WindowStatusInfo {
  isOpen: boolean;
  isNaturalOpen: boolean;
  overrideActive: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  opensInMinutes: number;
  label: string;
}

export function getAttendanceWindowStatus(
  windowStart: string,
  windowEnd: string,
  demoOverride: boolean,
  now: Date = new Date()
): WindowStatusInfo {
  const startMin = timeToMinutes(windowStart);
  const endMin = timeToMinutes(windowEnd);
  const currentTotalSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const startSec = startMin * 60;
  const endSec = endMin * 60;

  const isNaturalOpen = currentTotalSec >= startSec && currentTotalSec <= endSec;
  const isOpen = demoOverride || isNaturalOpen;

  let remainingSec = 0;
  if (isNaturalOpen) {
    remainingSec = Math.max(0, endSec - currentTotalSec);
  } else if (demoOverride) {
    remainingSec = 12 * 60;
  }

  const remainingMinutes = Math.floor(remainingSec / 60);
  const remainingSeconds = remainingSec % 60;
  const opensInMinutes = currentTotalSec < startSec ? Math.ceil((startSec - currentTotalSec) / 60) : 0;

  return {
    isOpen,
    isNaturalOpen,
    overrideActive: demoOverride && !isNaturalOpen,
    remainingMinutes,
    remainingSeconds,
    opensInMinutes,
    label: `${formatTime12(windowStart)} – ${formatTime12(windowEnd)}`,
  };
}

export function normalizeImportDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Excel serial date (days since 1899-12-30)
    const utcDays = Math.floor(raw - 25569);
    const utcMs = utcDays * 86400 * 1000;
    const dt = new Date(utcMs);
    if (!Number.isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toDateKey(raw);
  }
  const str = String(raw).trim();
  if (!str) return null;

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return validateCalendarDate(Number(y), Number(m), Number(d));
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return validateCalendarDate(Number(y), Number(m), Number(d));
  }

  return null;
}

function validateCalendarDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1950 || y > 2100) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function formatNowTime12(now: Date = new Date()): string {
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function getGreetingName(fullName: string): string {
  const parts = fullName
    .replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.|R\.)\s*/i, '')
    .trim()
    .split(/\s+/);
  return parts[0] || fullName;
}
