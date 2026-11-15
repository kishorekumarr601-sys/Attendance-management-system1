import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getHomePathForRole } from '../components/ProtectedRoute';
import { useApp } from '../store/AppContext';

export const NotFoundPage: React.FC = () => {
  const { session, state } = useApp();
  const navigate = useNavigate();

  const target = session ? getHomePathForRole(session.role) : '/landing';

  return (
    <div className="min-h-screen red-gradient-bg plus-pattern text-white flex flex-col items-center justify-center p-6 text-center">
      <Logo variant="full" tone="on-red" size="md" customLogoUrl={state.settings.logo} />

      <div className="mt-8 bg-white text-[#1A0000] rounded-2xl p-8 max-w-md w-full shadow-2xl border border-[#E8CFCF] space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF5F5] border border-[#E8CFCF] text-[#7A0000] flex items-center justify-center mx-auto">
          <Compass className="w-7 h-7" />
        </div>
        <div className="text-4xl font-bold text-[#7A0000] tabular-nums">404</div>
        <h1 className="text-xl font-bold text-[#1A0000]">Page Not Found</h1>
        <p className="text-xs text-[#5A0000] leading-relaxed">
          The Smart ERP route you tried to open does not exist or has been moved.
        </p>
        <button
          type="button"
          onClick={() => navigate(target)}
          className="btn-gold px-6 py-2.5 min-h-[44px] text-xs inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
      </div>
    </div>
  );
};
