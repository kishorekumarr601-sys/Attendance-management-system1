import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { getAttendanceWindowStatus, WindowStatusInfo } from '../utils/date';

export function useWindowStatus(): WindowStatusInfo {
  const { state } = useApp();
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return getAttendanceWindowStatus(
    state.settings.windowStart,
    state.settings.windowEnd,
    state.settings.demoWindowOverride,
    now
  );
}
