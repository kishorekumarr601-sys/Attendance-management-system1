export type Role = 'admin' | 'faculty' | 'student';

export type AttendanceMethod = 'Manual' | 'QR' | 'Face';
export type AttendanceStatus = 'Present' | 'Absent' | 'Late';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';
export type CircularAudience = 'All' | 'Staff' | 'Students';
export type CalendarEventType = 'Exam' | 'Event' | 'Semester';

export interface Student {
  id: number;
  roll: string;
  name: string;
  dob: string; // YYYY-MM-DD
  dept: string;
  year: number; // 1..4
  section: string; // A | B | C ...
  photo?: string;
  phone?: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  dept: string;
  designation: string;
  username?: string;
  password?: string;
  assignedClasses?: string[];
  status?: 'Present' | 'On Leave';
}

export interface Department {
  code: string;
  name: string;
  subjects: string[];
  sections?: string[];
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: number;
  subject: string;
  period: number; // 1..8
  time: string; // e.g. 09:05 AM
  method: AttendanceMethod;
  status: AttendanceStatus;
}

export interface Leave {
  id: number;
  studentId: number;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  reason: string; // Sick | Personal | Family | Casual Leave
  note: string;
  status: LeaveStatus;
  appliedAt: string;
  decidedBy?: string;
}

export interface Circular {
  id: number;
  title: string;
  message: string;
  date: string; // YYYY-MM-DD
  audience: CircularAudience;
}

export interface Holiday {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
}

export interface CalendarEvent {
  id: number;
  date: string; // YYYY-MM-DD
  title: string;
  type: CalendarEventType;
}

export interface Exam {
  id: number;
  type: string;
  dept: string;
  year: number;
  section: string;
  subject: string;
  max: number;
  date: string; // YYYY-MM-DD
}

export interface Mark {
  examId: number;
  studentId: number;
  marks: number;
}

export interface Notification {
  id: number;
  text: string;
  read: boolean;
  time: string;
  audience?: 'All' | 'Admin' | 'Faculty' | 'Student';
  studentId?: number;
}

export interface TimetableSlot {
  id: number;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number; // 1..8
  dept: string;
  year: number;
  section: string;
  subject: string;
  room: string;
  facultyId: number;
}

export interface ActivityItem {
  id: number;
  text: string;
  time: string;
}

export interface AppSettings {
  institutionName: string;
  address: string;
  affiliation: string;
  logo?: string;
  windowStart: string; // HH:mm
  windowEnd: string; // HH:mm
  lateThresholdMin: number;
  lowAttendanceThreshold: number;
  demoWindowOverride: boolean;
  sections: string[];
}

export interface UserSession {
  role: Role;
  userId: number;
  name: string;
  emailOrRoll: string;
}

export interface SmartErpState {
  students: Student[];
  staff: Staff[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaves: Leave[];
  circulars: Circular[];
  holidays: Holiday[];
  events: CalendarEvent[];
  exams: Exam[];
  marks: Mark[];
  notifications: Notification[];
  timetable: TimetableSlot[];
  recentActivity: ActivityItem[];
  settings: AppSettings;
}
