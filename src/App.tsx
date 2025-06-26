// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyGenerateQR from './pages/faculty/GenerateQR';
import FacultyViewAttendance from './pages/faculty/ViewAttendance';
import FacultyProfile from './pages/faculty/Profile';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import NotFoundPage from './pages/NotFoundPage';
import GenerateQr from './pages/GenerateQr';
import Verifyattendance from './pages/Verifyattendance';
// import ViewAttendance from './pages/ViewAttendance';
import ResetPasswordPage from './pages/ResetPasswordPage';
import History from './pages/faculty/History';
import AdminDashboard from './pages/admin/dashboard'; // Your existing import for AdminDashboard
import Demo from './pages/RecognizeFace';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentAttendance from './pages/faculty/StudentAttendance';
// Import context
import { AuthProvider } from './context/AuthContext';
// Import the new StudentProvider
import { StudentProvider } from './pages/admin/StudentContext'; // Ensure this path is correct based on your file structure

function App() {
  return (
    // Wrap the entire application with AuthProvider and then StudentProvider.
    // StudentProvider MUST wrap the Router to make its context available to all routes and their components.
    <AuthProvider>
      <StudentProvider> {/* THIS IS THE CRUCIAL WRAPPER for StudentContext */}
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/notfound" element={<NotFoundPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/genqr" element={<GenerateQr />} />
            <Route path="/verf" element={<Verifyattendance />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
	<Route path="/rec" element={<Demo />} />
            {/* Admin Dashboard Route */}
            {/* Using the path you provided: "/ad" */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Faculty Routes */}
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
            <Route path="/faculty/generate-qr" element={<FacultyGenerateQR />} />
            <Route path="/faculty/view-attendance" element={<FacultyViewAttendance />} />
            <Route path="/faculty/profile" element={<FacultyProfile />} />
            <Route path="/faculty/history" element={<History />} />
      <Route path="/faculty/Student-attendance" element={<StudentAttendance />} />

            {/* Student Routes */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfile />} />

            {/* Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </StudentProvider>
    </AuthProvider>
  );
}

export default App;