import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Clock,
  CreditCard,
  Menu,
  Palmtree,
  QrCode,
  Sparkles,
  X,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useApp } from '../store/AppContext';

const FEATURES = [
  {
    title: 'QR / Face Attendance',
    desc: 'Camera demo with proxy prevention',
    icon: QrCode,
  },
  {
    title: 'Attendance Window',
    desc: 'Only during fixed class time',
    icon: Clock,
  },
  {
    title: 'Reports & Analytics',
    desc: '14-day trend, CSV export',
    icon: BarChart3,
  },
  {
    title: 'Leave Management',
    desc: 'Apply, Approve, Reject',
    icon: Palmtree,
  },
  {
    title: 'Digital ID Cards',
    desc: 'Photo + QR code',
    icon: CreditCard,
  },
  {
    title: 'AI Insights',
    desc: 'At-risk students below 75%',
    icon: Sparkles,
  },
];

const CHECKPOINTS = [
  'Role-based access for Admin, Staff & Students',
  'Daily attendance window control',
  'Centralized student & staff records',
  'AI-generated insights & risk alerts',
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, login, showToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const demoSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToDemos = () => {
    setMobileMenuOpen(false);
    demoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickDemoLogin = (role: 'admin' | 'faculty' | 'student') => {
    if (role === 'admin') {
      login({
        role: 'admin',
        userId: 0,
        name: 'Dr. Raj',
        emailOrRoll: 'admin@ssec.edu.in',
      });
      showToast('Signed in as Dr. Raj (Admin)', 'success');
      navigate('/admin');
    } else if (role === 'faculty') {
      const fac = state.staff[0];
      login({
        role: 'faculty',
        userId: fac?.id ?? 1,
        name: fac?.name ?? 'Dr. A. Sharma',
        emailOrRoll: fac?.email ?? 'faculty@ssec.edu.in',
      });
      showToast(`Signed in as ${fac?.name ?? 'Dr. A. Sharma'} (Faculty)`, 'success');
      navigate('/faculty');
    } else {
      const kishore = state.students.find((s) => s.roll === '267325205039') ?? state.students[0];
      if (!kishore) return;
      login({
        role: 'student',
        userId: kishore.id,
        name: kishore.name,
        emailOrRoll: kishore.roll,
      });
      showToast(`Signed in as ${kishore.name}`, 'success');
      navigate('/student');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero & Top Bar */}
      <div className="red-gradient-bg plus-pattern text-white">
        <header className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          <Logo variant="full" tone="on-red" size="md" customLogoUrl={state.settings.logo} />

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-5 py-2.5 min-h-[44px] rounded-full bg-white text-[#7A0000] text-sm font-bold hover:bg-[#FFF5F5] transition-colors whitespace-nowrap"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 min-h-[44px] btn-gold text-sm whitespace-nowrap"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Toggle navigation menu"
            className="sm:hidden w-11 h-11 rounded-full bg-white/10 border border-white/25 flex items-center justify-center text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden px-4 pb-4 flex flex-col gap-2.5 border-b border-white/15">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2.5 min-h-[44px] rounded-full bg-white text-[#7A0000] text-sm font-bold"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2.5 min-h-[44px] btn-gold text-sm"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={scrollToDemos}
              className="w-full py-2.5 min-h-[44px] rounded-full border border-white text-white text-sm font-semibold"
            >
              View Demo Logins
            </button>
          </div>
        )}

        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 pt-12 pb-14 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight max-w-4xl mx-auto">
            Attendance, insight and student wellbeing - in one AI-powered ERP.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Smart ERP brings role-based dashboards, real-time attendance windows, QR &amp; face-demo
            check-in, leave workflows and AI-generated insights into a single, mobile-friendly
            system.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-8 py-3 min-h-[46px] btn-gold text-sm sm:text-base"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={scrollToDemos}
              className="px-7 py-3 min-h-[46px] rounded-full border-2 border-white text-white text-sm sm:text-base font-bold hover:bg-white/10 transition-colors"
            >
              View Demo Logins
            </button>
          </div>

          {/* 4 checkpoints with gold dots */}
          <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
            {CHECKPOINTS.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-medium"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700] shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {/* Footer pill */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A0000] border border-[#FFD700]/60 text-xs font-bold text-[#FFD700]">
            <span>Powered by Smart ERP AI</span>
          </div>
        </section>
      </div>

      {/* White Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-14 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#7A0000]">
            Everything a college attendance ERP needs
          </h2>
          <p className="text-sm text-[#5A0000] mt-2">
            Designed for {state.settings.institutionName} with real-time rules, analytics, and
            role-tailored workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="erp-card erp-card-hover p-6 flex flex-col gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] flex items-center justify-center text-[#7A0000]">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-[#7A0000]">{f.title}</h3>
                <p className="text-sm text-[#333333] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Interactive Demo Login Cards */}
        <div
          ref={demoSectionRef}
          className="mt-14 p-6 sm:p-8 rounded-2xl bg-[#FFF5F5] border border-[#E8CFCF]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-xl font-bold text-[#7A0000]">Instant Demo Logins</h3>
              <p className="text-xs text-[#5A0000] mt-0.5">
                Click any role card below to launch that dashboard immediately, or sign in on the
                login screen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="self-start sm:self-auto px-5 py-2.5 min-h-[44px] btn-gold text-xs"
            >
              Open Login Page
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="text-left erp-card erp-card-hover p-5 hover:border-[#7A0000]"
            >
              <div className="text-xs font-bold text-[#D4A017] uppercase tracking-wider">
                Admin Dashboard
              </div>
              <div className="text-base font-bold text-[#7A0000] mt-1">Dr. Raj — Super Admin</div>
              <div className="mt-2 text-xs text-[#333333] font-mono">
                admin@ssec.edu.in / admin123
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('faculty')}
              className="text-left erp-card erp-card-hover p-5 hover:border-[#7A0000]"
            >
              <div className="text-xs font-bold text-[#D4A017] uppercase tracking-wider">
                Faculty Dashboard
              </div>
              <div className="text-base font-bold text-[#7A0000] mt-1">
                Dr. A. Sharma — ECE Dept
              </div>
              <div className="mt-2 text-xs text-[#333333] font-mono">
                faculty@ssec.edu.in / faculty123
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('student')}
              className="text-left erp-card erp-card-hover p-5 hover:border-[#7A0000]"
            >
              <div className="text-xs font-bold text-[#D4A017] uppercase tracking-wider">
                Student Dashboard
              </div>
              <div className="text-base font-bold text-[#7A0000] mt-1">
                R. Kishore Kumar — CSE Yr 3
              </div>
              <div className="mt-2 text-xs text-[#333333] font-mono">
                267325205039 / student123
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#7A0000] plus-pattern text-white py-6 px-4 text-center border-t-2 border-[#FFD700]">
        <div className="font-bold text-sm tracking-wide">{state.settings.institutionName}</div>
        <div className="text-xs text-[#FFD700] mt-1">
          {state.settings.address} · {state.settings.affiliation}
        </div>
      </footer>
    </div>
  );
};
