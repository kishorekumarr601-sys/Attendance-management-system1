import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';
import { ProtectedRoute } from './components/ProtectedRoute';
import { StudentProfileModal } from './components/StudentProfileModal';
import { ToastContainer } from './components/ToastContainer';
import { AcademicCalendarPage } from './pages/AcademicCalendarPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AttendanceHistoryPage } from './pages/AttendanceHistoryPage';
import { AttendanceWindowPage } from './pages/AttendanceWindowPage';
import { CircularsPage } from './pages/CircularsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { ExamsMarksPage } from './pages/ExamsMarksPage';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { HolidayCalendarPage } from './pages/HolidayCalendarPage';
import { IdCardsPage } from './pages/IdCardsPage';
import { ImportExcelPage } from './pages/ImportExcelPage';
import { LandingPage } from './pages/LandingPage';
import { LeaveRequestsPage } from './pages/LeaveRequestsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SplashPage } from './pages/SplashPage';
import { StaffPage } from './pages/StaffPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentsPage } from './pages/StudentsPage';
import { TimetablePage } from './pages/TimetablePage';
import { AppProvider } from './store/AppContext';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <StudentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <StaffPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance-window"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AttendanceWindowPage defaultTab="manual" />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qr-face"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AttendanceWindowPage defaultTab="qr" />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/history"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AttendanceHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/circulars"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <CircularsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <LeaveRequestsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/timetable"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <TimetablePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <DepartmentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/holidays"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <HolidayCalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/calendar"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <AcademicCalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <ExamsMarksPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/import"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <ImportExcelPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/id-cards"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <IdCardsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <FacultyDashboard view="dashboard" />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/attendance"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <AttendanceWindowPage defaultTab="manual" />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/students"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <StudentsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/reports"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/history"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <AttendanceHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/leaves"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <LeaveRequestsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/timetable"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <TimetablePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/exams"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <ExamsMarksPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/import"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <ImportExcelPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/calendar"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <AcademicCalendarPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/circulars"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <CircularsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/profile"
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <AppLayout>
                  <FacultyDashboard view="profile" />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Student Route */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <ToastContainer />
        <StudentProfileModal />
        <FloatingAiAssistant />
      </HashRouter>
    </AppProvider>
  );
}
