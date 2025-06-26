// File: ForgotPasswordPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react'; // Added Loader2, CheckCircle, XCircle for feedback

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  // Make sure this matches your Flask backend URL
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); // Clear previous messages

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/forgotPassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        // Optionally, redirect after a short delay
        // setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Something went wrong. Please try again.' });
      }
    } catch (error) {
      console.error('Forgot password request failed:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again later.' });
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
              <Mail className="h-12 w-12 text-indigo-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address below and we'll send you a link to reset your password.
            </p>
          </motion.div>

          <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`mb-4 border-l-4 p-4 ${
                  message.type === 'success' ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mr-2" />
                  )}
                  <p className="text-sm text-gray-700">{message.text}</p>
                </div>
              </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your email"
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
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;