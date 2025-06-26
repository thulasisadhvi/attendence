// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'faculty' | 'student';
  department?: string;
  rollNumber?: string;
  facultyId?: string;
  profilePicture?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'faculty' | 'student';
}

// Attendance related types
export interface AttendanceSession {
  id: string;
  facultyId: string;
  facultyName: string;
  department: string;
  section: string;
  classroom: string;
  subject: string;
  period: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: Attendee[];
  qrCode: string;
}

export interface Attendee {
  studentId: string;
  studentName: string;
  rollNumber: string;
  timestamp: string;
  status: 'present' | 'absent';
}

export interface SubjectAttendance {
  subject: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  attendancePercentage: number;
}

// Form related types
export interface QRFormData {
  department: string;
  section: string;
  classroom: string;
  subject: string;
  period: string;
}

export interface VerificationData {
  sessionId: string;
  studentId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  faceVerified: boolean;
}

// Dashboard related types
export interface AttendanceStats {
  overallPercentage: number;
  totalClasses: number;
  presentCount: number;
  absentCount: number;
  subjects: SubjectAttendance[];
}