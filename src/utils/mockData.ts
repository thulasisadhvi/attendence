import { AttendanceSession, Student, SubjectAttendance, AttendanceStats } from './types';

// Sample attendance sessions for faculty
export const mockAttendanceSessions: AttendanceSession[] = [
  {
    id: '1',
    facultyId: '1',
    facultyName: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    section: 'A',
    classroom: '301',
    subject: 'Data Structures',
    period: '1',
    date: '2025-06-01',
    startTime: '09:00 AM',
    endTime: '10:00 AM',
    attendees: [
      { studentId: '1', studentName: 'Alex Turner', rollNumber: 'CS2001', timestamp: '09:05 AM', status: 'present' },
      { studentId: '2', studentName: 'Maya Patel', rollNumber: 'CS2002', timestamp: '09:03 AM', status: 'present' },
      { studentId: '3', studentName: 'Jordan Lee', rollNumber: 'IT2001', timestamp: '', status: 'absent' },
    ],
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMQAAADECAYAAADApo5rAAAAAklEQVR4AewaftIAAAOWSURBVO3BQW4ER5IAQfcE//9lb41OB1CZVa0xM7b3Bz7GwzIelPGgjAdlPCjjQRkPynhQxoMyHpTxoIwHZTwo40EZD8p4UMaDMh6U8aCMB2U8KONBGQ/KeFDGg368pOSfVJ2UXCm5qXpDyU3VGyU3VTcl/6SKm4wHZTwo40EZD/rhQxU3Sm5UTCVTxaSkmapJyaRiUrKp+ELFjZJPVNwo+UTGgzIelPGgjAf98MuU3FS9oWRSMSmZVExKJhWTkknFpGSqmJTcVHyi5KbqN5XcVP0mGQ/KeFA6n1/yL1JyU/Xf/D/LeFDGgzIelPGgH/5PVdxUTEpuqt5QclP1v1Txv5TxoIwHZTwo40E/flnVJyomJZOSqeJGyVQxKZlU3CiZlEwVNxXfqPim6jfJeFDGgzIelPGgHz6k5L9JyaRiUjJVTEpuqm6UTEqmikl/Q+//lzIelPGgjAdlPOiHl5RMFZOSmYpJyaRkqvhEyaTiDSU3VZOSqeJGyVQxKZmqbpRMFW/IeFDGgzIelPGgH15SMlVMSiYlU8Wk5KZiUnJTMSmZlExKbpRMFTdKvlB1o+QTFd/IeFDGgzIelPEg+/CFkklJrZhKJiU3FW8ouakYldQVk5JJSa2YSiYlbyj5RMaDMh6U8aCMB/34UMVNxaRkqpiUTBWTkknJVDGVvFFyo2RScqPki4pJyU3Vb5LxoIwHZTwo40H24Z+k5KZiUvKJiknJVDEpuan4RMVUMim5qZiUTEpqxaRkqvhNMh6U8aCMB2U86MeHKiYlN0q+UDIpmZRMFVPFGxWTkknJJ5RMFZOSm6pJyaRkqripmJRMFZ/IeFDGgzIelPEg+/CCkknFpGSqmJRMFZOSSclNxaRkqpiUTEpuKiYlU8WkZFIyVUxKbiq+UDEp+UTGgzIelPGgjAf9eEnJpOSmYlIyKZkqJiWTkknJVDEpuVEyVUxKJiVTxaRkUjJVTEpuKm6UTBWTkknJVDEpmSpuKiYlU8UnMh6U8aCMB2U8yD58oGSqmJRMFZOSqeKmYlLyiYpJyVQxKZmU3FRMSiYlk5JJyaRkqpiU3FRMSqaKSclUMSm5qfhExoMyHpTxoIwH2R/4GA/LeFDGgzIelPGgjAdlPCjjQRkPynhQxoMyHpTxoIwHZTwo40EZD8p4UMaDMh6U8aCMB2U8KONBfwDQKDJNX9HKAQAAAABJRU5ErkJggg=='
  },
  {
    id: '2',
    facultyId: '1',
    facultyName: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    section: 'A',
    classroom: '301',
    subject: 'Algorithms',
    period: '3',
    date: '2025-06-02',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    attendees: [
      { studentId: '1', studentName: 'Alex Turner', rollNumber: 'CS2001', timestamp: '11:02 AM', status: 'present' },
      { studentId: '2', studentName: 'Maya Patel', rollNumber: 'CS2002', timestamp: '11:05 AM', status: 'present' },
      { studentId: '3', studentName: 'Jordan Lee', rollNumber: 'IT2001', timestamp: '11:08 AM', status: 'present' },
    ],
    qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMQAAADECAYAAADApo5rAAAAAklEQVR4AewaftIAAAOWSURBVO3BQW4ER5IAQfcE//9lb41OB1CZVa0xM7b3Bz7GwzIelPGgjAdlPCjjQRkPynhQxoMyHpTxoIwHZTwo40EZD8p4UMaDMh6U8aCMB2U8KONBGQ/KeFDGg368pOSfVJ2UXCm5qXpDyU3VGyU3VTcl/6SKm4wHZTwo40EZD/rhQxU3Sm5UTCVTxaSkmapJyaRiUrKp+ELFjZJPVNwo+UTGgzIelPGgjAf98MuU3FS9oWRSMSmZVExKJhWTkknFpGSqmJTcVHyi5KbqN5XcVP0mGQ/KeFA6n1/yL1JyU/Xf/D/LeFDGgzIelPGgH/5PVdxUTEpuqt5QclP1v1Txv5TxoIwHZTwo40E/flnVJyomJZOSqeJGyVQxKZlU3CiZlEwVNxXfqPim6jfJeFDGgzIelPGgHz6k5L9JyaRiUjJVTEpuqm6UTEqmikl/Q+//lzIelPGgjAdlPOiHl5RMFZOSmYpJyaRkqvhEyaTiDSU3VZOSqeJGyVQxKZmqbpRMFW/IeFDGgzIelPGgH15SMlVMSiYlU8Wk5KZiUnJTMSmZlExKbpRMFTdKvlB1o+QTFd/IeFDGgzIelPEg+/CFkklJrZhKJiU3FW8ouakYldQVk5JJSa2YSiYlbyj5RMaDMh6U8aCMB/34UMVNxaRkqpiUTBWTkknJVDGVvFFyo2RScqPki4pJyU3Vb5LxoIwHZTwo40H24Z+k5KZiUvKJiknJVDEpuan4RMVUMim5qZiUTEpqxaRkqvhNMh6U8aCMB2U86MeHKiYlN0q+UDIpmZRMFVPFGxWTkknJJ5RMFZOSm6pJyaRkqripmJRMFZ/IeFDGgzIelPEg+/CCkknFpGSqmJRMFZOSSclNxaRkqpiUTEpuKiYlU8WkZFIyVUxKbiq+UDEp+UTGgzIelPGgjAf9eEnJpOSmYlIyKZkqJiWTkknJVDEpuVEyVUxKJiVTxaRkUjJVTEpuKm6UTBWTkknJVDEpmSpuKiYlU8UnMh6U8aCMB2U8yD58oGSqmJRMFZOSqeKmYlLyiYpJyVQxKZmU3FRMSiYlk5JJyaRkqpiU3FRMSqaKSclUMSm5qfhExoMyHpTxoIwH2R/4GA/LeFDGgzIelPGgjAdlPCjjQRkPynhQxoMyHpTxoIwHZTwo40EZD8p4UMaDMh6U8aCMB2U8KONB/wDQKDJNX9HKAQAAAABJRU5ErkJggg=='
  }
];

// Sample students for faculty view
export const mockStudents: Student[] = [
  { id: '1', name: 'Alex Turner', rollNumber: 'CS2001', department: 'Computer Science', attendancePercentage: 92 },
  { id: '2', name: 'Maya Patel', rollNumber: 'CS2002', department: 'Computer Science', attendancePercentage: 96 },
  { id: '3', name: 'Jordan Lee', rollNumber: 'IT2001', department: 'Information Technology', attendancePercentage: 78 },
  { id: '4', name: 'Emma Johnson', rollNumber: 'CS2003', department: 'Computer Science', attendancePercentage: 85 },
  { id: '5', name: 'Lucas Wang', rollNumber: 'CS2004', department: 'Computer Science', attendancePercentage: 91 },
  { id: '6', name: 'Sophia Rodriguez', rollNumber: 'IT2002', department: 'Information Technology', attendancePercentage: 88 },
  { id: '7', name: 'Ethan Brown', rollNumber: 'CS2005', department: 'Computer Science', attendancePercentage: 75 },
  { id: '8', name: 'Olivia Davis', rollNumber: 'IT2003', department: 'Information Technology', attendancePercentage: 94 },
];

// Sample subject attendance for student dashboard
export const mockSubjectAttendance: SubjectAttendance[] = [
  { subject: 'Data Structures', totalClasses: 24, attendedClasses: 22, percentage: 91.7 },
  { subject: 'Algorithms', totalClasses: 20, attendedClasses: 19, percentage: 95 },
  { subject: 'Database Systems', totalClasses: 18, attendedClasses: 15, percentage: 83.3 },
  { subject: 'Computer Networks', totalClasses: 22, attendedClasses: 17, percentage: 77.3 },
  { subject: 'Operating Systems', totalClasses: 19, attendedClasses: 16, percentage: 84.2 },
];

// Sample attendance stats for student dashboard
export const mockStudentAttendanceStats: AttendanceStats = {
  overallPercentage: 85.6,
  totalClasses: 103,
  presentCount: 89,
  absentCount: 14,
  subjects: mockSubjectAttendance
};

// Departments and sections
export const departments = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

export const sections = ['A', 'B', 'C', 'D'];

export const subjects = {
  'Computer Science': [
    'Data Structures', 'Algorithms', 'Database Systems', 
    'Computer Networks', 'Operating Systems', 'Web Development',
    'Software Engineering', 'Artificial Intelligence'
  ],
  'Information Technology': [
    'Information Systems', 'Web Technologies', 'Data Analytics', 
    'Cybersecurity', 'Cloud Computing', 'Mobile Development',
    'IoT Systems', 'IT Infrastructure'
  ],
  'Electrical Engineering': [
    'Circuit Theory', 'Digital Electronics', 'Power Systems',
    'Control Systems', 'Communication Systems', 'Microprocessors',
    'Electromagnetic Theory', 'Electrical Machines'
  ],
  'Mechanical Engineering': [
    'Thermodynamics', 'Fluid Mechanics', 'Material Science',
    'Machine Design', 'Manufacturing Processes', 'Heat Transfer',
    'Dynamics of Machinery', 'Automobile Engineering'
  ],
  'Civil Engineering': [
    'Structural Analysis', 'Geotechnical Engineering', 'Transportation Engineering',
    'Environmental Engineering', 'Hydraulics', 'Surveying',
    'Construction Management', 'Concrete Technology'
  ]
};

export const classrooms = ['101', '102', '103', '201', '202', '203', '301', '302', '303', '401', '402', '403'];
export const periods = ['1', '2', '3', '4', '5', '6', '7', '8'];