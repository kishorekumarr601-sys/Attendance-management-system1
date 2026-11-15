import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Sparkles, User } from 'lucide-react';
import { Logo } from '../components/Logo';
import { getHomePathForRole } from '../components/ProtectedRoute';
import { Role } from '../data/types';
import { useApp } from '../store/AppContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, session, login, showToast } = useApp();

  const [tab, setTab] = useState<Role>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (session) {
    return <Navigate to={getHomePathForRole(session.role)} replace />;
  }

  const handleTabChange = (nextTab: Role) => {
    setTab(nextTab);
    setErrorMsg('');
    setIdentifier('');
    setPassword('');
  };

  const attemptLogin = (role: Role, idVal: string, passVal: string) => {
    const cleanId = idVal.trim();
    if (!cleanId || !passVal) {
      setErrorMsg('Invalid credentials');
      return;
    }

    if (role === 'admin') {
      if (cleanId.toLowerCase() === 'admin@ssec.edu.in' && passVal === 'admin123') {
        login({
          role: 'admin',
          userId: 0,
          name: 'Dr. Raj',
          emailOrRoll: 'admin@ssec.edu.in',
        });
        showToast('Welcome back, Dr. Raj', 'success');
        navigate('/admin');
        return;
      }
      setErrorMsg('Invalid credentials');
      return;
    }

    if (role === 'faculty') {
      const matchedStaff = state.staff.find(
        (st) => st.email.toLowerCase() === cleanId.toLowerCase()
      );
      const validPass = matchedStaff?.password ? passVal === matchedStaff.password : passVal === 'faculty123';
      if (matchedStaff && validPass) {
        login({
          role: 'faculty',
          userId: matchedStaff.id,
          name: matchedStaff.name,
          emailOrRoll: matchedStaff.email,
        });
        showToast(`Welcome back, ${matchedStaff.name}`, 'success');
        navigate('/faculty');
        return;
      }
      setErrorMsg('Invalid credentials');
      return;
    }

    // Student
    const matchedStudent = state.students.find(
      (stu) => stu.roll.toUpperCase() === cleanId.toUpperCase()
    );
    if (matchedStudent && (passVal === 'student123' || passVal === matchedStudent.dob)) {
      login({
        role: 'student',
        userId: matchedStudent.id,
        name: matchedStudent.name,
        emailOrRoll: matchedStudent.roll,
      });
      showToast(`Welcome back, ${matchedStudent.name}`, 'success');
      navigate('/student');
      return;
    }

    setErrorMsg('Invalid credentials');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    attemptLogin(tab, identifier, password);
  };

  const handleDemoCardClick = (role: Role, demoId: string, demoPass: string) => {
    setTab(role);
    setIdentifier(demoId);
    setPassword(demoPass);
    setErrorMsg('');
    attemptLogin(role, demoId, demoPass);
  };

  return (
    <div className="min-h-screen bg-[#FFF5F5] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <Link
          to="/landing"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7A0000] hover:underline py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <span className="text-[11px] font-semibold text-[#5A0000]">
          {state.settings.institutionName}
        </span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8CFCF] shadow-xl p-6 sm:p-8 page-transition">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo variant="full" tone="on-white" size="md" customLogoUrl={state.settings.logo} />
          <h1 className="text-xl font-bold text-[#7A0000] mt-4">Sign in to Smart ERP</h1>
          <p className="text-xs text-[#5A0000] mt-1">
            Select your role tab or click a demo login card below
          </p>
        </div>

        {/* Role Tabs */}
        <div
          role="tablist"
          aria-label="Login role"
          className="grid grid-cols-3 gap-1 p-1 bg-[#FFF5F5] border border-[#E8CFCF] rounded-xl mb-5"
        >
          {(['admin', 'faculty', 'student'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={tab === r}
              onClick={() => handleTabChange(r)}
              className={`py-2.5 min-h-[44px] rounded-lg text-xs font-bold capitalize transition-all ${
                tab === r
                  ? 'bg-[#7A0000] text-white shadow-xs'
                  : 'text-[#5A0000] hover:text-[#7A0000]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#C0000C] text-white text-xs font-semibold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-identifier"
              className="block text-xs font-bold text-[#5A0000] mb-1.5"
            >
              {tab === 'student' ? 'Roll Number' : 'Email Address'}
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-[#7A0000]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={
                  tab === 'admin'
                    ? 'admin@ssec.edu.in'
                    : tab === 'faculty'
                      ? 'faculty@ssec.edu.in'
                      : '267325205039'
                }
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm text-[#1A0000] focus:border-[#7A0000] outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-[#5A0000] mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="w-4 h-4 text-[#7A0000]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 min-h-[44px] rounded-xl border border-[#E8CFCF] text-sm text-[#1A0000] focus:border-[#7A0000] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-[#5A0000] hover:bg-[#FFF5F5]"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button type="submit" className="flex-1 py-3 min-h-[46px] btn-gold text-sm">
              Login
            </button>
            <button
              type="button"
              onClick={() => handleDemoCardClick('admin', 'admin@ssec.edu.in', 'admin123')}
              className="px-4 py-3 min-h-[46px] rounded-full border border-[#7A0000] text-[#7A0000] text-xs font-bold hover:bg-[#FFF5F5] inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
              Demo Mode
            </button>
          </div>
        </form>

        {/* 3 Demo Login Cards */}
        <div className="mt-6 pt-5 border-t border-[#E8CFCF]">
          <div className="text-xs font-bold text-[#7A0000] mb-2.5">
            Quick Demo Logins (click to auto-fill &amp; sign in)
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleDemoCardClick('admin', 'admin@ssec.edu.in', 'admin123')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] hover:border-[#7A0000] flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-[#7A0000]">Admin</div>
                <div className="text-[11px] font-mono text-[#333333]">
                  admin@ssec.edu.in / admin123
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#7A0000]">Admin Dashboard →</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoCardClick('faculty', 'faculty@ssec.edu.in', 'faculty123')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] hover:border-[#7A0000] flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-[#7A0000]">Faculty (Dr. A. Sharma)</div>
                <div className="text-[11px] font-mono text-[#333333]">
                  faculty@ssec.edu.in / faculty123
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#7A0000]">Faculty Dashboard →</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoCardClick('student', '267325205039', 'student123')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#FFF5F5] border border-[#E8CFCF] hover:border-[#7A0000] flex items-center justify-between gap-2 transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-[#7A0000]">Student (R. Kishore Kumar)</div>
                <div className="text-[11px] font-mono text-[#333333]">
                  267325205039 / student123
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#7A0000]">Student Dashboard →</span>
            </button>
          </div>
          <p className="mt-3 text-[11px] text-center text-[#5A0000]">
            Demo credentials only. Do not use real passwords.
          </p>
        </div>
      </div>
    </div>
  );
};
