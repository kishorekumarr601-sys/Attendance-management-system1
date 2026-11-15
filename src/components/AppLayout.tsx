import React, { useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Clock,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Palmtree,
  QrCode,
  Search,
  Settings,
  Table2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { Logo } from './Logo';
import { useWindowStatus } from '../hooks/useWindowStatus';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Students', to: '/admin/students', icon: GraduationCap },
  { label: 'Staff', to: '/admin/staff', icon: Users },
  { label: 'Attendance Window', to: '/admin/attendance-window', icon: Clock },
  { label: 'QR / Face Attendance', to: '/admin/qr-face', icon: QrCode },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
  { label: 'Attendance History', to: '/admin/history', icon: History },
  { label: 'Circulars & Alerts', to: '/admin/circulars', icon: Megaphone },
  { label: 'Leave Requests', to: '/admin/leaves', icon: Palmtree },
  { label: 'Timetable', to: '/admin/timetable', icon: Table2 },
  { label: 'Departments & Subjects', to: '/admin/departments', icon: BookOpen },
  { label: 'Holiday Calendar', to: '/admin/holidays', icon: Calendar },
  { label: 'Academic Calendar', to: '/admin/calendar', icon: CalendarDays },
  { label: 'Exams & Marks', to: '/admin/exams', icon: Award },
  { label: 'Import from Excel', to: '/admin/import', icon: FileSpreadsheet },
  { label: 'ID Cards', to: '/admin/id-cards', icon: CreditCard },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

const FACULTY_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/faculty', icon: LayoutDashboard, end: true },
  { label: 'Take Attendance', to: '/faculty/attendance', icon: Clock },
  { label: 'Students', to: '/faculty/students', icon: GraduationCap },
  { label: 'Reports', to: '/faculty/reports', icon: BarChart3 },
  { label: 'Attendance History', to: '/faculty/history', icon: History },
  { label: 'Leave Requests', to: '/faculty/leaves', icon: Palmtree },
  { label: 'Timetable', to: '/faculty/timetable', icon: Table2 },
  { label: 'Exams & Marks', to: '/faculty/exams', icon: Award },
  { label: 'Import Marks', to: '/faculty/import', icon: FileSpreadsheet },
  { label: 'Academic Calendar', to: '/faculty/calendar', icon: CalendarDays },
  { label: 'Circulars', to: '/faculty/circulars', icon: Megaphone },
  { label: 'Profile', to: '/faculty/profile', icon: UserCheck },
];

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state, dispatch, session, logout, openStudentProfile, closeStudentProfile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const windowInfo = useWindowStatus();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useKeyboardShortcuts(
    () => {
      searchInputRef.current?.focus();
      setSearchOpen(true);
    },
    () => {
      setSearchOpen(false);
      setNotifOpen(false);
      setProfileMenuOpen(false);
      setDrawerOpen(false);
      closeStudentProfile();
    }
  );

  const isAdmin = session?.role === 'admin';
  const navItems = isAdmin ? ADMIN_NAV : FACULTY_NAV;

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { students: [], staff: [] };
    const matchedStudents = state.students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.roll.toLowerCase().includes(q) ||
          s.dept.toLowerCase().includes(q)
      )
      .slice(0, 6);
    const matchedStaff = state.staff
      .filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.email.toLowerCase().includes(q) ||
          st.dept.toLowerCase().includes(q)
      )
      .slice(0, 4);
    return { students: matchedStudents, staff: matchedStaff };
  }, [searchQuery, state.students, state.staff]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentNav = navItems.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#7A0000] plus-pattern text-white">
      <div className="px-5 py-5 border-b border-white/15 flex items-center justify-between">
        <Logo variant="full" tone="on-red" size="sm" customLogoUrl={state.settings.logo} />
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation menu"
          className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-r-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#9E0000] text-white font-semibold border-l-4 border-[#FFD700]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white border-l-4 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-[#FFD700]" aria-hidden="true" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-r-xl text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white border-l-4 border-transparent transition-colors mt-2"
        >
          <LogOut className="w-4 h-4 shrink-0 text-[#FFD700]" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </nav>

      <div className="px-4 py-3.5 border-t border-white/15 bg-[#5A0000]/60 text-[11px]">
        <div className="font-bold text-[#FFD700] truncate">{state.settings.institutionName}</div>
        <div className="text-white/75 truncate mt-0.5">
          {state.settings.address} · {state.settings.affiliation}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FFF5F5]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen no-print">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#E8CFCF] px-4 lg:px-7 py-3 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-11 h-11 rounded-xl border border-[#E8CFCF] flex items-center justify-center text-[#7A0000] hover:bg-[#FFF5F5] shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-[#7A0000] truncate">
                {currentNav?.label || 'Smart ERP'}
              </h1>
              <div className="text-[11px] text-[#5A0000] flex items-center gap-2 truncate">
                <span>{state.settings.institutionName}</span>
                <span aria-hidden="true">·</span>
                <span
                  className={`font-semibold ${
                    windowInfo.isOpen ? 'text-[#1E9E4A]' : 'text-[#C0000C]'
                  }`}
                >
                  Window {windowInfo.isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </div>
            </div>
          </div>

          {/* Search + Notifications + Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Global Search */}
            <div className="relative hidden md:block w-64 lg:w-72">
              <Search
                className="w-4 h-4 text-[#5A0000] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search students, staff... (/)"
                aria-label="Search students and staff"
                className="w-full pl-9 pr-3 py-2 min-h-[42px] rounded-full border border-[#E8CFCF] bg-[#FFF5F5]/60 text-xs text-[#1A0000] placeholder:text-[#5A0000]/60 focus:bg-white focus:border-[#7A0000] outline-none"
              />

              {searchOpen && searchQuery.trim() !== '' && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-[#E8CFCF] shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {searchResults.students.length === 0 && searchResults.staff.length === 0 ? (
                    <div className="p-4 text-xs text-[#5A0000] text-center">
                      No matching students or staff found.
                    </div>
                  ) : (
                    <>
                      {searchResults.students.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 bg-[#FFF5F5] text-[11px] font-bold text-[#7A0000]">
                            Students
                          </div>
                          {searchResults.students.map((stu) => (
                            <button
                              key={stu.id}
                              type="button"
                              onClick={() => {
                                openStudentProfile(stu.id);
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-[#FFF5F5] flex items-center justify-between gap-2 text-xs border-b border-[#E8CFCF]/50"
                            >
                              <div>
                                <div className="font-semibold text-[#1A0000]">{stu.name}</div>
                                <div className="text-[11px] text-[#5A0000] font-mono tabular-nums">
                                  {stu.roll} · {stu.dept}-{stu.section} Yr {stu.year}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#7A0000]">View</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {searchResults.staff.length > 0 && (
                        <div>
                          <div className="px-3 py-1.5 bg-[#FFF5F5] text-[11px] font-bold text-[#7A0000]">
                            Staff
                          </div>
                          {searchResults.staff.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                                navigate(isAdmin ? '/admin/staff' : '/faculty/profile');
                              }}
                              className="w-full text-left px-3.5 py-2.5 hover:bg-[#FFF5F5] flex items-center justify-between gap-2 text-xs border-b border-[#E8CFCF]/50"
                            >
                              <div>
                                <div className="font-semibold text-[#1A0000]">{st.name}</div>
                                <div className="text-[11px] text-[#5A0000]">
                                  {st.dept} · {st.designation}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold text-[#7A0000]">Open</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((p) => !p);
                  setProfileMenuOpen(false);
                }}
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative w-11 h-11 rounded-full border border-[#E8CFCF] bg-white flex items-center justify-center text-[#7A0000] hover:bg-[#FFF5F5] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#C0000C] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl border border-[#E8CFCF] shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E8CFCF] flex items-center justify-between bg-[#FFF5F5]">
                    <span className="text-xs font-bold text-[#7A0000]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A0000] hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E8CFCF]">
                    {state.notifications.length === 0 ? (
                      <div className="p-5 text-xs text-center text-[#5A0000]">
                        No notifications yet.
                      </div>
                    ) : (
                      state.notifications.slice(0, 12).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 text-xs ${n.read ? 'bg-white' : 'bg-[#FFF5F5]/70'}`}
                        >
                          <div className="text-[#1A0000] font-medium leading-relaxed">{n.text}</div>
                          <div className="text-[11px] text-[#5A0000] mt-1">
                            {n.time} {n.read ? '· Read' : '· Unread'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((p) => !p);
                  setNotifOpen(false);
                }}
                aria-label="Account menu"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 min-h-[44px] rounded-full border border-[#E8CFCF] bg-[#FFF5F5] hover:bg-white transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-[#7A0000] text-[#FFD700] text-xs font-bold flex items-center justify-center shrink-0">
                  {isAdmin ? 'DR' : 'AS'}
                </span>
                <span className="hidden sm:inline text-xs font-bold text-[#7A0000] whitespace-nowrap">
                  {isAdmin ? 'Dr. Raj - Super Admin' : session?.name || 'Dr. A. Sharma'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A0000]" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#E8CFCF] shadow-xl z-50 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate(isAdmin ? '/admin/settings' : '/faculty/profile');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#1A0000] hover:bg-[#FFF5F5] flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#7A0000]" />
                    {isAdmin ? 'Settings' : 'Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#C0000C] hover:bg-[#FFF5F5] flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1440px] w-full mx-auto page-transition">
          {children}
        </main>
      </div>
    </div>
  );
};
