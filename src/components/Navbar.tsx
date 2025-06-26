// File: src/components/Navbar.tsx (Updated)
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, Menu, X, LogOut, User, Home, ClipboardCheck } from 'lucide-react'; // Import ClipboardCheck icon
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMenu();
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.07,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, y: -10 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-30">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/ADTP-LOGO.jpg" alt="College Logo" className="h-20 w-auto" />
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:ml-6">
            <div className="flex space-x-4">
              <Link to="/" className={`nav-link ${location.pathname === '/' ? 'nav-link-active' : ''}`}>
                Home
              </Link>

              {!user && (
                <>
                  <Link to="/login" className={`nav-link ${location.pathname === '/login' ? 'nav-link-active' : ''}`}>
                    Login
                  </Link>
                  {/* // <Link to="/register" className={`nav-link ${location.pathname === '/register' ? 'nav-link-active' : ''}`}>
                  //    Register
                  // </Link> */}
                </>
              )}

              {user && user.role === 'faculty' && (
                <>
                  <Link to="/faculty/generate-qr" className={`nav-link ${location.pathname === '/faculty/generate-qr' ? 'nav-link-active' : ''}`}>
                    Generate QR
                  </Link>
                  <Link to="/faculty/history" className={`nav-link ${location.pathname === '/faculty/history' ? 'nav-link-active' : ''}`}>
                    History
                  </Link>
                  {/* NEW TAB FOR FACULTY: Student Attendance */}
                  <Link to="/faculty/student-attendance" className={`nav-link ${location.pathname === '/faculty/student-attendance' ? 'nav-link-active' : ''}`}>
                    Student Attendance
                  </Link>
                  <Link to="/faculty/profile" className={`nav-link ${location.pathname === '/faculty/profile' ? 'nav-link-active' : ''}`}>
                    Profile
                  </Link>
                </>
              )}

              {user && user.role === 'student' && (
                <>
                  <Link to="/student/dashboard" className={`nav-link ${location.pathname === '/student/dashboard' ? 'nav-link-active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/student/profile" className={`nav-link ${location.pathname === '/student/profile' ? 'nav-link-active' : ''}`}>
                    Profile
                  </Link>
                </>
              )}

              {user && (
                <button
                  onClick={handleLogout}
                  className="btn btn-outline flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <motion.div
          className="sm:hidden bg-white"
          initial="closed"
          animate="open"
          variants={menuVariants}
        >
          <div className="pt-2 pb-4 space-y-1">
            <motion.div variants={itemVariants}>
              <Link
                to="/"
                className={`block px-3 py-2 text-base font-medium ${location.pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                onClick={closeMenu}
              >
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Home
                </div>
              </Link>
            </motion.div>

            {!user && (
              <>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/login"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/login' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  {/* <Link
                    to="/register"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/register' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    Register
                  </Link> */}
                </motion.div>
              </>
            )}

            {user && user.role === 'faculty' && (
              <>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/faculty/generate-qr"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/faculty/generate-qr' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    Generate QR
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/faculty/history"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/faculty/history' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    History
                  </Link>
                </motion.div>
                {/* NEW TAB FOR FACULTY (MOBILE): Student Attendance */}
                <motion.div variants={itemVariants}>
                  <Link
                    to="/faculty/student-attendance"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/faculty/student-attendance' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center">
                      <ClipboardCheck className="h-5 w-5 mr-2" /> {/* Added icon for mobile */}
                      Student Attendance
                    </div>
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/faculty/profile"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/faculty/profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Profile
                    </div>
                  </Link>
                </motion.div>
              </>
            )}

            {user && user.role === 'student' && (
              <>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/student/dashboard"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/student/dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Link
                    to="/student/profile"
                    className={`block px-3 py-2 text-base font-medium ${location.pathname === '/student/profile' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={closeMenu}
                  >
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Profile
                    </div>
                  </Link>
                </motion.div>
              </>
            )}

            {user && (
              <motion.div variants={itemVariants}>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </div>
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;