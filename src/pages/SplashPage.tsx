import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { getHomePathForRole } from '../components/ProtectedRoute';

const SPLASH_SEEN_KEY = 'smarterp_splash_seen';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, state } = useApp();

  useEffect(() => {
    if (session) {
      navigate(getHomePathForRole(session.role), { replace: true });
      return;
    }

    if (sessionStorage.getItem(SPLASH_SEEN_KEY) === '1') {
      navigate('/landing', { replace: true });
      return;
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      navigate('/landing', { replace: true });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [navigate, session]);

  return (
    <div className="min-h-screen red-gradient-bg plus-pattern flex flex-col items-center justify-center px-6 text-center text-white select-none">
      {/* Big graduation cap in dark red circle */}
      <div className="w-28 h-28 rounded-full bg-[#5A0000] border-4 border-[#FFD700] flex items-center justify-center shadow-2xl mb-6">
        {state.settings.logo ? (
          <img
            src={state.settings.logo}
            alt={state.settings.institutionName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-20 h-20" aria-hidden="true">
            <path d="M50 22 L86 38 L50 54 L14 38 Z" fill="#FFFFFF" />
            <polygon points="50,56 75,45 75,65 50,76 25,65 25,45" fill="#FFD700" />
            <circle cx="86" cy="42" r="3.5" fill="#FFD700" />
            <path d="M86 42 L86 64" stroke="#FFD700" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <h1
        className="text-[42px] leading-tight font-extrabold tracking-tight text-white"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Smart ERP
      </h1>
      <p className="mt-2 text-base sm:text-lg text-white/90 font-medium max-w-md">
        AI-Powered Attendance Management System
      </p>

      {/* Gold progress bar filling over 2 seconds */}
      <div className="w-56 h-2 rounded-full bg-white/20 overflow-hidden mt-8 border border-white/15">
        <div className="h-full bg-[#FFD700] rounded-full splash-progress" />
      </div>

      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
          navigate('/landing', { replace: true });
        }}
        className="mt-6 text-xs text-white/75 hover:text-[#FFD700] underline underline-offset-4"
      >
        Skip intro
      </button>
    </div>
  );
};
