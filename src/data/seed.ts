import {
  AttendanceRecord,
  CalendarEvent,
  Circular,
  Department,
  Exam,
  Holiday,
  Leave,
  Mark,
  Notification,
  SmartErpState,
  Staff,
  Student,
  TimetableSlot,
} from './types';
import { addDaysKey, toDateKey } from '../utils/date';

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Akash', 'Ananya', 'Arjun', 'Bhavana', 'Charan', 'Deepika',
  'Dev', 'Divya', 'Gautam', 'Harini', 'Ishaan', 'Jeevika', 'Karthik', 'Keerthana',
  'Lakshmi', 'Madhav', 'Meera', 'Nandini', 'Nikhil', 'Pavithra', 'Pranav', 'Preethi',
  'Rahul', 'Rakshita', 'Rithik', 'Roshni', 'Sanjay', 'Shalini', 'Siddharth', 'Soundarya',
  'Surya', 'Swathi', 'Tanvi', 'Tarun', 'Varun', 'Vidya', 'Vishal', 'Yamini',
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Patel', 'Verma', 'Nair', 'Reddy', 'Iyer', 'Krishnan',
  'Rao', 'Menon', 'Subramanian', 'Sundaram', 'Babu', 'Murugan', 'Raj', 'Gopal',
  'Natarajan', 'Venkatesh', 'Prasad', 'Srinivasan',
];

function createRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function createSeedState(): SmartErpState {
  const today = new Date();
  const todayStr = toDateKey(today);
  const rng = createRng(20261115);

  const departments: Department[] = [
    {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      subjects: ['Data Structures', 'DBMS', 'Algorithms', 'OS'],
      sections: ['A', 'B', 'C'],
    },
    {
      code: 'IT',
      name: 'Information Technology',
      subjects: ['Web Technologies', 'Computer Networks', 'Software Engineering', 'Cloud Computing'],
      sections: ['A', 'B', 'C'],
    },
    {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      subjects: ['Digital Systems', 'Signals & Systems', 'Microprocessors', 'VLSI Design', 'Communication Systems'],
      sections: ['A', 'B', 'C'],
    },
    {
      code: 'EEE',
      name: 'Electrical & Electronics Engineering',
      subjects: ['Circuit Theory', 'Power Systems', 'Control Systems', 'Electrical Machines'],
      sections: ['A', 'B', 'C'],
    },
    {
      code: 'MECH',
      name: 'Mechanical Engineering',
      subjects: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'CAD/CAM', 'Manufacturing Tech'],
      sections: ['A', 'B', 'C'],
    },
    {
      code: 'CIVIL',
      name: 'Civil Engineering',
      subjects: ['Structural Analysis', 'Geotechnical Engineering', 'Surveying'],
      sections: ['A', 'B', 'C'],
    },
  ];

  // Exact 10 named students first
  const namedStudents: Student[] = [
    {
      id: 1,
      roll: '267325205039',
      name: 'R. Kishore Kumar',
      dob: '2005-05-14',
      dept: 'CSE',
      year: 3,
      section: 'A',
      phone: '+91 98765 43210',
    },
    {
      id: 2,
      roll: 'CSE21055',
      name: 'Aarav Sharma',
      dob: '2005-08-21',
      dept: 'CSE',
      year: 3,
      section: 'A',
      phone: '+91 98765 43211',
    },
    {
      id: 3,
      roll: 'ME21034',
      name: 'Kavya Patel',
      dob: '2005-02-11',
      dept: 'MECH',
      year: 3,
      section: 'A',
      phone: '+91 98765 43212',
    },
    {
      id: 4,
      roll: 'ECE22018',
      name: 'Rohit Verma',
      dob: '2006-04-19',
      dept: 'ECE',
      year: 2,
      section: 'A',
      phone: '+91 98765 43213',
    },
    {
      id: 5,
      roll: 'CSE21071',
      name: 'Sneha Roy',
      dob: '2005-09-07',
      dept: 'CSE',
      year: 3,
      section: 'B',
      phone: '+91 98765 43214',
    },
    {
      id: 6,
      roll: 'EEE21022',
      name: 'Priya Nair',
      dob: '2005-06-28',
      dept: 'EEE',
      year: 3,
      section: 'A',
      phone: '+91 98765 43215',
    },
    {
      id: 7,
      roll: 'ME21089',
      name: 'Arjun Mehta',
      dob: '2005-11-03',
      dept: 'MECH',
      year: 3,
      section: 'B',
      phone: '+91 98765 43216',
    },
    {
      id: 8,
      roll: 'ECE21044',
      name: 'Divya S',
      dob: '2006-01-15',
      dept: 'ECE',
      year: 2,
      section: 'A',
      phone: '+91 98765 43217',
    },
    {
      id: 9,
      roll: 'CIVIL21011',
      name: 'Vikram R',
      dob: '2005-07-23',
      dept: 'CIVIL',
      year: 3,
      section: 'A',
      phone: '+91 98765 43218',
    },
    {
      id: 10,
      roll: 'CSE21098',
      name: 'Anitha K',
      dob: '2005-03-30',
      dept: 'CSE',
      year: 3,
      section: 'A',
      phone: '+91 98765 43219',
    },
  ];

  // Generate 110 more students -> 120 total across 6 depts, years 1..4, sections A, B, C
  const students: Student[] = [...namedStudents];
  const deptCodes = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
  const existingRolls = new Set(students.map((s) => s.roll));
  const countsByDept: Record<string, number> = {
    CSE: 4,
    IT: 0,
    ECE: 2,
    EEE: 1,
    MECH: 2,
    CIVIL: 1,
  };

  let nextId = 11;
  let nameIdx = 0;
  while (students.length < 120) {
    // Pick department with fewest students so distribution is ~20 each
    const dept = deptCodes.slice().sort((a, b) => countsByDept[a] - countsByDept[b])[0];
    countsByDept[dept] += 1;
    const seq = countsByDept[dept];
    const year = ((seq - 1) % 4) + 1;
    const section = ['A', 'B', 'C'][(seq - 1) % 3];
    const yrPrefix = 25 - year;
    const prefix = dept === 'MECH' ? 'ME' : dept;
    let roll = `${prefix}${yrPrefix}${String(100 + seq).slice(-3)}`;
    while (existingRolls.has(roll)) {
      roll = `${prefix}${yrPrefix}${String(Math.floor(100 + rng() * 899))}`;
    }
    existingRolls.add(roll);

    const first = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(nameIdx / FIRST_NAMES.length) % LAST_NAMES.length];
    nameIdx += 1;

    const birthYear = 2008 - year;
    const birthMonth = String(((seq * 3) % 12) + 1).padStart(2, '0');
    const birthDay = String(((seq * 7) % 27) + 1).padStart(2, '0');

    students.push({
      id: nextId++,
      roll,
      name: `${first} ${last}`,
      dob: `${birthYear}-${birthMonth}-${birthDay}`,
      dept,
      year,
      section,
      phone: `+91 98${String(10000000 + nextId * 713).slice(0, 8)}`,
    });
  }

  // 12 Staff members
  const staff: Staff[] = [
    {
      id: 1,
      name: 'Dr. A. Sharma',
      email: 'faculty@ssec.edu.in',
      dept: 'ECE',
      designation: 'Assistant Professor',
      username: 'asharma',
      assignedClasses: ['ECE302 Digital Systems Yr 2', 'ECE101 Signals & Systems Yr 1'],
      status: 'Present',
    },
    {
      id: 2,
      name: 'Prof. Senthil Kumar',
      email: 'skumar@ssec.edu.in',
      dept: 'CSE',
      designation: 'Associate Professor',
      username: 'skumar',
      assignedClasses: ['CSE301 Data Structures Yr 3', 'CSE302 DBMS Yr 3'],
      status: 'Present',
    },
    {
      id: 3,
      name: 'Dr. Meenakshi Priya',
      email: 'mpriya@ssec.edu.in',
      dept: 'CSE',
      designation: 'Professor & HoD',
      username: 'mpriya',
      assignedClasses: ['CSE303 Algorithms Yr 3', 'CSE304 OS Yr 3'],
      status: 'Present',
    },
    {
      id: 4,
      name: 'Prof. R. Singh',
      email: 'rsingh@ssec.edu.in',
      dept: 'MECH',
      designation: 'Assistant Professor',
      username: 'rsingh',
      assignedClasses: ['ME301 Thermodynamics Yr 3'],
      status: 'Present',
    },
    {
      id: 5,
      name: 'Dr. Kavitha Venkat',
      email: 'kvenkat@ssec.edu.in',
      dept: 'IT',
      designation: 'Professor & HoD',
      username: 'kvenkat',
      assignedClasses: ['IT201 Web Technologies Yr 2'],
      status: 'Present',
    },
    {
      id: 6,
      name: 'Prof. Karthikeyan M',
      email: 'karthik@ssec.edu.in',
      dept: 'EEE',
      designation: 'Associate Professor',
      username: 'karthik',
      assignedClasses: ['EE301 Power Systems Yr 3'],
      status: 'Present',
    },
    {
      id: 7,
      name: 'Dr. S. Balasubramanian',
      email: 'bala@ssec.edu.in',
      dept: 'MECH',
      designation: 'Professor & HoD',
      username: 'sbala',
      assignedClasses: ['ME201 Fluid Mechanics Yr 2'],
      status: 'Present',
    },
    {
      id: 8,
      name: 'Prof. Lakshmi Narayanan',
      email: 'lakshmi@ssec.edu.in',
      dept: 'CIVIL',
      designation: 'Assistant Professor',
      username: 'lakshmi',
      assignedClasses: ['CE301 Structural Analysis Yr 3'],
      status: 'Present',
    },
    {
      id: 9,
      name: 'Dr. Vijayalakshmi P',
      email: 'viji@ssec.edu.in',
      dept: 'ECE',
      designation: 'Professor & HoD',
      username: 'viji',
      assignedClasses: ['ECE304 VLSI Design Yr 3'],
      status: 'Present',
    },
    {
      id: 10,
      name: 'Prof. Arvind Krishnan',
      email: 'arvind@ssec.edu.in',
      dept: 'IT',
      designation: 'Assistant Professor',
      username: 'arvind',
      assignedClasses: ['IT302 Cloud Computing Yr 3'],
      status: 'Present',
    },
    {
      id: 11,
      name: 'Prof. Deepa Rajendran',
      email: 'deepa@ssec.edu.in',
      dept: 'EEE',
      designation: 'Assistant Professor',
      username: 'deepa',
      assignedClasses: ['EE202 Control Systems Yr 2'],
      status: 'Present',
    },
    {
      id: 12,
      name: 'Dr. Mohanavelu T',
      email: 'mohan@ssec.edu.in',
      dept: 'CIVIL',
      designation: 'Professor & HoD',
      username: 'mohan',
      assignedClasses: ['CE202 Geotechnical Engineering Yr 2'],
      status: 'Present',
    },
  ];

  // Generate 14 days of attendance records (13 past days + today's morning check-in)
  const attendance: AttendanceRecord[] = [];
  let attSeq = 1;

  const past14Dates: string[] = [];
  for (let d = 13; d >= 0; d--) {
    past14Dates.push(addDaysKey(today, -d));
  }

  // Helper to push record
  const pushAtt = (
    date: string,
    studentId: number,
    subject: string,
    period: number,
    time: string,
    method: 'Manual' | 'QR' | 'Face',
    status: 'Present' | 'Absent' | 'Late'
  ) => {
    attendance.push({
      id: `att_${attSeq++}`,
      date,
      studentId,
      subject,
      period,
      time,
      method,
      status,
    });
  };

  // 1) Kishore Kumar (id=1): Exact subject attendance:
  // Data Structures: 7/10 = 70%
  // DBMS: 7/8 = 88%
  // Algorithms: 11/12 = 92%
  // OS: 13/16 = 81%
  const kishorePlan: Array<{
    subject: string;
    total: number;
    present: number;
    period: number;
    time: string;
    method: 'Manual' | 'QR' | 'Face';
  }> = [
    { subject: 'Data Structures', total: 10, present: 7, period: 1, time: '09:05 AM', method: 'QR' },
    { subject: 'DBMS', total: 8, present: 7, period: 2, time: '10:02 AM', method: 'Manual' },
    { subject: 'Algorithms', total: 12, present: 11, period: 3, time: '11:04 AM', method: 'Face' },
    { subject: 'OS', total: 16, present: 13, period: 4, time: '01:10 PM', method: 'Manual' },
  ];

  kishorePlan.forEach((plan) => {
    for (let i = 0; i < plan.total; i++) {
      const dateIdx = Math.min(13, Math.floor((i * 14) / plan.total));
      const dateStr = past14Dates[dateIdx];
      // Make last 3 Data Structures sessions absent so he sees the alert naturally
      const isPresent =
        plan.subject === 'Data Structures'
          ? i < plan.present
          : i !== 2 && (plan.subject !== 'OS' || (i !== 6 && i !== 12));
      const finalPresent =
        plan.subject === 'Data Structures'
          ? i < 7
          : plan.subject === 'DBMS'
            ? i !== 3
            : plan.subject === 'Algorithms'
              ? i !== 5
              : i !== 3 && i !== 8 && i !== 13;
      void isPresent;
      pushAtt(
        dateStr,
        1,
        plan.subject,
        plan.period,
        plan.time,
        plan.method,
        finalPresent ? 'Present' : 'Absent'
      );
    }
  });

  // 2) Kavya Patel (id=3, ME21034): 13 Present + 8 Absent = 21 total -> 62%, 5 absent in last 7 days
  for (let i = 0; i < 21; i++) {
    const dateIdx = Math.min(13, Math.floor((i * 14) / 21));
    const dateStr = past14Dates[dateIdx];
    const subject = i % 2 === 0 ? 'Thermodynamics' : 'Fluid Mechanics';
    // Absent on indices 2, 5, 8 (older) and 14, 16, 17, 19, 20 (last 7 days = 5 absences)
    const absentSet = new Set([2, 5, 8, 14, 16, 17, 19, 20]);
    pushAtt(
      dateStr,
      3,
      subject,
      (i % 4) + 1,
      '09:10 AM',
      i % 3 === 0 ? 'QR' : 'Manual',
      absentSet.has(i) ? 'Absent' : 'Present'
    );
  }

  // 3) Rohit Verma (id=4, ECE22018): 12 Present + 3 Late + 7 Absent = 22 total -> 15/22 = 68%
  for (let i = 0; i < 22; i++) {
    const dateIdx = Math.min(13, Math.floor((i * 14) / 22));
    const dateStr = past14Dates[dateIdx];
    const subject = i % 2 === 0 ? 'Digital Systems' : 'Signals & Systems';
    let status: 'Present' | 'Absent' | 'Late' = 'Present';
    if (i === 4 || i === 10 || i === 16) status = 'Late';
    else if ([2, 6, 9, 13, 15, 18, 20].includes(i)) status = 'Absent';
    pushAtt(dateStr, 4, subject, (i % 4) + 1, '09:08 AM', 'Manual', status);
  }

  // 4) Sneha Roy (id=5, CSE21071): 12 Present + 3 Late + 6 Absent = 21 total -> 15/21 = 71%
  for (let i = 0; i < 21; i++) {
    const dateIdx = Math.min(13, Math.floor((i * 14) / 21));
    const dateStr = past14Dates[dateIdx];
    const subject = i % 2 === 0 ? 'Data Structures' : 'DBMS';
    let status: 'Present' | 'Absent' | 'Late' = 'Present';
    if (i === 3 || i === 9 || i === 15) status = 'Late';
    else if ([1, 5, 8, 12, 17, 19].includes(i)) status = 'Absent';
    pushAtt(dateStr, 5, subject, (i % 4) + 1, '09:09 AM', 'QR', status);
  }

  // 5) Remaining 116 students across 14 days
  // Calibrate probabilities so:
  // - CSE leads at ~92%
  // - IT ~87%, EEE ~85%, CIVIL ~83%
  // - ECE has several students <75% (around 10-12)
  // - MECH has more students <75% (around 14-16)
  // Total at-risk across all 120 students ~ 30-35 students
  const atRiskIds = new Set<number>();
  students.forEach((stu) => {
    if ([1, 3, 4, 5].includes(stu.id)) return;
    if (stu.dept === 'MECH' && stu.id % 4 !== 0) atRiskIds.add(stu.id);
    else if (stu.dept === 'ECE' && stu.id % 2 === 0) atRiskIds.add(stu.id);
    else if (stu.dept === 'CIVIL' && stu.id % 5 === 0) atRiskIds.add(stu.id);
    else if (stu.dept === 'EEE' && stu.id % 6 === 0) atRiskIds.add(stu.id);
    else if (stu.dept === 'IT' && stu.id % 7 === 0) atRiskIds.add(stu.id);
  });

  const deptObjMap = new Map(departments.map((d) => [d.code, d]));

  students.forEach((stu) => {
    if ([1, 3, 4, 5].includes(stu.id)) return;
    const dept = deptObjMap.get(stu.dept)!;
    const isAtRisk = atRiskIds.has(stu.id);
    const baseRate = isAtRisk
      ? 0.64
      : stu.dept === 'CSE'
        ? 0.94
        : stu.dept === 'IT'
          ? 0.89
          : stu.dept === 'EEE'
            ? 0.87
            : stu.dept === 'ECE'
              ? 0.86
              : 0.85;

    past14Dates.forEach((dateStr, dIdx) => {
      // Give CSE & ECE today's morning period so "Present Today" & "Absent Today" are well populated
      // and give all students 1-2 records on past days
      const periodsCount = dIdx === 13 ? 1 : 2;
      for (let p = 1; p <= periodsCount; p++) {
        // Keep some of today unmarked for variety, but mark ~85% of students today
        if (dIdx === 13 && stu.id % 9 === 0) continue;

        const subj = dept.subjects[(dIdx + p + stu.id) % dept.subjects.length];
        // Slight realistic upward trend over last week (+5%)
        const weekBoost = dIdx >= 7 ? 0.04 : -0.02;
        const roll = rng();
        let status: 'Present' | 'Absent' | 'Late' = 'Present';
        if (roll > Math.min(0.98, baseRate + weekBoost)) {
          status = rng() < 0.18 ? 'Late' : 'Absent';
        }
        const method: 'Manual' | 'QR' | 'Face' =
          stu.dept === 'CSE' && dIdx >= 11
            ? 'QR'
            : p === 2 && stu.id % 4 === 0
              ? 'Face'
              : 'Manual';
        const time = method === 'QR' ? '09:06 AM' : method === 'Face' ? '09:08 AM' : '09:11 AM';
        pushAtt(dateStr, stu.id, subj, p, time, method, status);
      }
    });
  });

  // Leaves (including Kishore Kumar's Pending Casual Leave for Faculty dashboard)
  const leaves: Leave[] = [
    {
      id: 1,
      studentId: 1,
      from: addDaysKey(today, 2),
      to: addDaysKey(today, 2),
      reason: 'Casual Leave',
      note: 'Family function in Coimbatore — 1 day',
      status: 'Pending',
      appliedAt: todayStr,
    },
    {
      id: 2,
      studentId: 3,
      from: addDaysKey(today, -3),
      to: addDaysKey(today, -2),
      reason: 'Sick',
      note: 'Viral fever and medical rest',
      status: 'Approved',
      appliedAt: addDaysKey(today, -4),
      decidedBy: 'Prof. R. Singh',
    },
    {
      id: 3,
      studentId: 8,
      from: addDaysKey(today, 4),
      to: addDaysKey(today, 5),
      reason: 'Personal',
      note: 'Attending inter-college technical symposium',
      status: 'Pending',
      appliedAt: todayStr,
    },
    {
      id: 4,
      studentId: 7,
      from: addDaysKey(today, -5),
      to: addDaysKey(today, -5),
      reason: 'Family',
      note: 'Urgent travel home',
      status: 'Rejected',
      appliedAt: addDaysKey(today, -6),
      decidedBy: 'Dr. S. Balasubramanian',
    },
  ];

  // Circulars
  const circulars: Circular[] = [
    {
      id: 1,
      title: 'College Fest on 20 Oct',
      message: 'Annual Techno-Cultural Fest "Sakthi Utsav" starts on 20 Oct. All department project stalls must register by 5 PM.',
      date: addDaysKey(today, -1),
      audience: 'All',
    },
    {
      id: 2,
      title: 'Holiday announced - Diwali 21 Oct',
      message: 'The institution will remain closed on 21 Oct on account of Diwali. Regular classes resume on 22 Oct.',
      date: addDaysKey(today, -2),
      audience: 'All',
    },
    {
      id: 3,
      title: 'Exam hall ticket available',
      message: 'End-semester model exam hall tickets are now ready for collection from respective department coordinators. Minimum 75% attendance required.',
      date: todayStr,
      audience: 'Students',
    },
  ];

  // Holidays
  const holidays: Holiday[] = [
    { id: 1, date: '2026-10-21', title: 'Diwali' },
    { id: 2, date: '2027-01-15', title: 'Pongal' },
    { id: 3, date: '2027-01-26', title: 'Republic Day' },
    { id: 4, date: '2026-12-25', title: 'Christmas' },
    { id: 5, date: '2026-10-02', title: 'Gandhi Jayanti' },
  ];

  // Academic Events
  const events: CalendarEvent[] = [
    { id: 1, date: addDaysKey(today, 3), title: 'Internal Assessment Test 2', type: 'Exam' },
    { id: 2, date: addDaysKey(today, 6), title: 'College Tech Fest & Hackathon', type: 'Event' },
    { id: 3, date: addDaysKey(today, 14), title: 'End Semester Practicals Begin', type: 'Semester' },
    { id: 4, date: addDaysKey(today, 22), title: 'University Theory Examinations', type: 'Exam' },
  ];

  // Timetable slots (Monday - Friday, periods 1 - 8)
  const timetable: TimetableSlot[] = [
    // ECE Year 2 Section A (Dr. A. Sharma's classes)
    { id: 1, day: 'Monday', period: 1, dept: 'ECE', year: 2, section: 'A', subject: 'Digital Systems (ECE302)', room: 'Room 204', facultyId: 1 },
    { id: 2, day: 'Monday', period: 3, dept: 'ECE', year: 2, section: 'A', subject: 'Signals & Systems (ECE101)', room: 'Room 102', facultyId: 1 },
    { id: 3, day: 'Monday', period: 6, dept: 'ECE', year: 2, section: 'A', subject: 'Lab Session - Digital Lab', room: 'Lab 3', facultyId: 1 },
    { id: 4, day: 'Tuesday', period: 1, dept: 'ECE', year: 2, section: 'A', subject: 'Digital Systems (ECE302)', room: 'Room 204', facultyId: 1 },
    { id: 5, day: 'Tuesday', period: 2, dept: 'ECE', year: 2, section: 'A', subject: 'Microprocessors', room: 'Room 204', facultyId: 9 },
    { id: 6, day: 'Wednesday', period: 1, dept: 'ECE', year: 2, section: 'A', subject: 'Digital Systems (ECE302)', room: 'Room 204', facultyId: 1 },
    { id: 7, day: 'Wednesday', period: 4, dept: 'ECE', year: 2, section: 'A', subject: 'Communication Systems', room: 'Room 205', facultyId: 9 },
    { id: 8, day: 'Thursday', period: 2, dept: 'ECE', year: 2, section: 'A', subject: 'Signals & Systems (ECE101)', room: 'Room 102', facultyId: 1 },
    { id: 9, day: 'Friday', period: 1, dept: 'ECE', year: 2, section: 'A', subject: 'Digital Systems (ECE302)', room: 'Room 204', facultyId: 1 },
    { id: 10, day: 'Friday', period: 5, dept: 'ECE', year: 2, section: 'A', subject: 'Lab Session', room: 'Lab 3', facultyId: 1 },

    // CSE Year 3 Section A
    { id: 11, day: 'Monday', period: 1, dept: 'CSE', year: 3, section: 'A', subject: 'Data Structures', room: 'CS-101', facultyId: 2 },
    { id: 12, day: 'Monday', period: 2, dept: 'CSE', year: 3, section: 'A', subject: 'DBMS', room: 'CS-101', facultyId: 2 },
    { id: 13, day: 'Monday', period: 3, dept: 'CSE', year: 3, section: 'A', subject: 'Algorithms', room: 'CS-102', facultyId: 3 },
    { id: 14, day: 'Monday', period: 4, dept: 'CSE', year: 3, section: 'A', subject: 'OS', room: 'CS-102', facultyId: 3 },
    { id: 15, day: 'Tuesday', period: 1, dept: 'CSE', year: 3, section: 'A', subject: 'Algorithms', room: 'CS-102', facultyId: 3 },
    { id: 16, day: 'Tuesday', period: 2, dept: 'CSE', year: 3, section: 'A', subject: 'Data Structures', room: 'CS-101', facultyId: 2 },
    { id: 17, day: 'Wednesday', period: 1, dept: 'CSE', year: 3, section: 'A', subject: 'DBMS', room: 'CS-101', facultyId: 2 },
    { id: 18, day: 'Wednesday', period: 3, dept: 'CSE', year: 3, section: 'A', subject: 'OS', room: 'CS-102', facultyId: 3 },
    { id: 19, day: 'Thursday', period: 1, dept: 'CSE', year: 3, section: 'A', subject: 'Data Structures', room: 'CS-101', facultyId: 2 },
    { id: 20, day: 'Thursday', period: 4, dept: 'CSE', year: 3, section: 'A', subject: 'DBMS Lab', room: 'Lab 1', facultyId: 2 },
    { id: 21, day: 'Friday', period: 1, dept: 'CSE', year: 3, section: 'A', subject: 'OS', room: 'CS-102', facultyId: 3 },
    { id: 22, day: 'Friday', period: 2, dept: 'CSE', year: 3, section: 'A', subject: 'Algorithms', room: 'CS-102', facultyId: 3 },

    // MECH Year 3 Section A
    { id: 23, day: 'Monday', period: 1, dept: 'MECH', year: 3, section: 'A', subject: 'Thermodynamics', room: 'ME-201', facultyId: 4 },
    { id: 24, day: 'Tuesday', period: 2, dept: 'MECH', year: 3, section: 'A', subject: 'Fluid Mechanics', room: 'ME-202', facultyId: 7 },
    { id: 25, day: 'Wednesday', period: 1, dept: 'MECH', year: 3, section: 'A', subject: 'Strength of Materials', room: 'ME-201', facultyId: 4 },
    { id: 26, day: 'Thursday', period: 3, dept: 'MECH', year: 3, section: 'A', subject: 'CAD/CAM', room: 'CAD Lab', facultyId: 7 },
    { id: 27, day: 'Friday', period: 2, dept: 'MECH', year: 3, section: 'A', subject: 'Manufacturing Tech', room: 'Workshop', facultyId: 4 },
  ];

  // Exams & Marks for CSE Year 3 A & ECE Year 2 A
  const exams: Exam[] = [
    { id: 1, type: 'Internal Test 1', dept: 'CSE', year: 3, section: 'A', subject: 'Data Structures', max: 100, date: addDaysKey(today, -10) },
    { id: 2, type: 'Internal Test 1', dept: 'CSE', year: 3, section: 'A', subject: 'DBMS', max: 100, date: addDaysKey(today, -9) },
    { id: 3, type: 'Internal Test 1', dept: 'CSE', year: 3, section: 'A', subject: 'Algorithms', max: 100, date: addDaysKey(today, -8) },
    { id: 4, type: 'Internal Test 1', dept: 'CSE', year: 3, section: 'A', subject: 'OS', max: 100, date: addDaysKey(today, -7) },
    { id: 5, type: 'Internal Test 1', dept: 'ECE', year: 2, section: 'A', subject: 'Digital Systems', max: 100, date: addDaysKey(today, -6) },
  ];

  const marks: Mark[] = [];
  const cse3A = students.filter((s) => s.dept === 'CSE' && s.year === 3 && s.section === 'A');
  cse3A.forEach((s, idx) => {
    const base = s.id === 1 ? [86, 91, 94, 83] : [76 + ((idx * 5) % 20), 72 + ((idx * 7) % 24), 78 + ((idx * 3) % 20), 74 + ((idx * 4) % 22)];
    marks.push(
      { examId: 1, studentId: s.id, marks: base[0] },
      { examId: 2, studentId: s.id, marks: base[1] },
      { examId: 3, studentId: s.id, marks: base[2] },
      { examId: 4, studentId: s.id, marks: base[3] }
    );
  });

  const ece2A = students.filter((s) => s.dept === 'ECE' && s.year === 2 && s.section === 'A');
  ece2A.forEach((s, idx) => {
    marks.push({ examId: 5, studentId: s.id, marks: s.id === 4 ? 61 : 74 + ((idx * 6) % 21) });
  });

  // 3 Unread Notifications at start
  const notifications: Notification[] = [
    {
      id: 1,
      text: 'Mechanical & ECE at-risk report updated: check students below 75% attendance.',
      read: false,
      time: '09:15 AM',
      audience: 'Admin',
    },
    {
      id: 2,
      text: 'Pending leave request from R. Kishore Kumar (Casual Leave - 1 day).',
      read: false,
      time: '09:10 AM',
      audience: 'All',
    },
    {
      id: 3,
      text: 'QR attendance session completed for CSE Year 3 (Data Structures).',
      read: false,
      time: '09:05 AM',
      audience: 'All',
    },
  ];

  const recentActivity = [
    { id: 1, text: 'QR Attendance marked for CSE Year 3 - 09:12 AM', time: '09:12 AM' },
    { id: 2, text: 'Leave request approved - Prof. Singh', time: '09:04 AM' },
    { id: 3, text: 'Face recognition failed - ME21089, manual check', time: '08:58 AM' },
  ];

  return {
    students,
    staff,
    departments,
    attendance,
    leaves,
    circulars,
    holidays,
    events,
    exams,
    marks,
    notifications,
    timetable,
    recentActivity,
    settings: {
      institutionName: 'SREE SAKTHI ENGINEERING COLLEGE',
      address: 'Karamadai',
      affiliation: 'Affiliated to Anna University, Approved by AICTE',
      windowStart: '09:00',
      windowEnd: '09:15',
      lateThresholdMin: 5,
      lowAttendanceThreshold: 75,
      demoWindowOverride: false,
      sections: ['A', 'B', 'C'],
    },
  };
}
