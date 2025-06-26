// File: src/pages/ResetPasswordPage.tsx
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion'; // For smooth transitions/animations
import { KeyRound, Mail, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'; // Icons for better UX

import Navbar from '../components/Navbar'; // Assuming this path
import Footer from '../components/Footer'; // Assuming this path

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add loading state

  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Hook to read URL query parameters

  const emailFromUrl = searchParams.get('email');
  const tokenFromUrl = searchParams.get('token');

  // Ensure this matches your Flask backend's port
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Effect to handle initial checks or redirect if email/token are missing
  useEffect(() => {
    if (!emailFromUrl || !tokenFromUrl) {
      setMessageType('error');
      setMessage('Invalid or missing password reset link.');
      // Optional: Redirect to login or forgot password after a delay
      setTimeout(() => navigate('/login'), 3000); // Redirect after 3 seconds
    }
  }, [emailFromUrl, tokenFromUrl, navigate]); // Dependencies for useEffect

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setIsLoading(true); // Start loading

    if (!emailFromUrl || !tokenFromUrl) {
      setMessageType('error');
      setMessage('Cannot reset password: Missing email or token from link.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('New passwords do not match!');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) { // Good practice: enforce stronger password policies
      setMessageType('error');
      setMessage('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/reset-password`, { // Use API_BASE
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailFromUrl,
          new_password: newPassword,
          confirm_password: confirmPassword,
          token: tokenFromUrl, // Send the token back to the backend for validation
        }),
      });

      interface ResetResponse {
        message: string;
      }

      const data: ResetResponse = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage(data.message);
        // Redirect to login page after successful password reset
        setTimeout(() => {
          navigate('/login');
        }, 2000); // Redirect after 2 seconds
      } else {
        setMessageType('error');
        setMessage(data.message || 'Password reset failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      setMessageType('error');
      setMessage('Network error. Please try again later.');
    } finally {
      setIsLoading(false); // End loading
    }
  };

  // Only render the form if emailFromUrl and tokenFromUrl are present, otherwise show message
  if (!emailFromUrl || !tokenFromUrl) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full space-y-8 text-center bg-white p-8 rounded-xl shadow-lg"
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Invalid Link</h2>
            {message && (
              <div className={`mb-4 border-l-4 p-4 rounded ${messageType === 'error' ? 'bg-red-50 border-red-400 text-red-700' : ''}`}>
                <div className="flex items-center justify-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  <p className="text-sm">{message}</p>
                </div>
              </div>
            )}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Go to Login Page
            </Link>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg"
        >
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Set New Password</h2>
            {emailFromUrl && (
              <p className="mt-2 text-sm text-gray-600">
                For: <span className="font-semibold text-indigo-600">{emailFromUrl}</span>
              </p>
            )}
          </div>

          {/* Message Display Area with Tailwind CSS */}
          {message && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mb-4 border-l-4 p-4 rounded ${
                messageType === 'success' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'
              }`}
            >
              <div className="flex items-center">
                {messageType === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 mr-2" />
                )}
                <p className="text-sm">{message}</p>
              </div>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  placeholder="••••••••"
                  required
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="mt-1 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <KeyRound className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;