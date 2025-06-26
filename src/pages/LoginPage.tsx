// File: LoginPage.tsx (FIXED)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { motion } from 'framer-motion';
import { School, User, KeyRound, AlertCircle, Eye, EyeOff } from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext'; // Import useAuth

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faculty' | 'student'>('faculty');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Use the AuthContext
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please fill in both fields');
      return;
    }
    // ^^^ This is where the '!' was. It should be removed.

    setIsLoading(true);

    try {
      // The login function now returns an object { user, redirectUrl } or null
      const result = await login(email, password, activeTab);

      if (result && result.user) {
        // Use the redirectUrl provided by the backend
        navigate(result.redirectUrl);
      } else {
        // The error message will be set by AuthContext and available via useAuth().error
        setErrorMessage('Incorrect credentials. Please try again.');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      // Fallback error message if something unexpected happens
      setErrorMessage('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="flex justify-center">
              <School className="h-12 w-12 text-indigo-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          </motion.div>

          <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="flex border-b border-gray-200 mb-6">
              {['faculty', 'student'].map((role) => (
                <button
                  key={role}
                  className={`flex-1 py-2 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === role
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab(role as 'faculty' | 'student')}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </button>
              ))}
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 bg-red-50 border-l-4 border-red-400 p-4"
              >
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {activeTab === 'faculty' ? 'Employee ID' : 'Student Email'}
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type={activeTab === 'faculty' ? 'text' : 'email'}
                    autoComplete={activeTab === 'faculty' ? 'off' : 'email'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder={activeTab === 'faculty' ? 'Enter Employee ID' : 'student@college.edu'}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <span
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </span>
                </div>
              </div>

              {activeTab === 'student' && ( // Conditionally render Forgot Password for students
                <div className="text-sm text-right">
                  <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                  </Link>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LoginPage;