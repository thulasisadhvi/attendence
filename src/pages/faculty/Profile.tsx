import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Building, KeyRound } from 'lucide-react'; // Removed Save, Edit2, Loader2 as they are not needed for display-only

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
//import { departments } from '../../utils/mockData';

const FacultyProfile: React.FC = () => {
  // Destructure user from the mock useAuth hook
  // IMPORTANT: For the actual application, remove the mock data/components below
  // and rely on your existing imports (Navbar, Footer, useAuth, departments).
  const { user } = useAuth(); // Assuming useAuth provides a user object with name, email, department, facultyId, and role

  // State to hold profile data, initialized from the user object
  const [profileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    facultyId: user?.facultyId || '',
  });

  // Redirect if no user or not faculty
  // This logic should ideally be handled by a router or higher-order component
  if (!user || user.role !== 'faculty') {
    // For a real application, replace this with a proper redirect using react-router-dom's Navigate or history.push
    window.location.href = '/login';
    return null; // Prevent rendering if redirecting
  }

  return (
    <div className="min-h-screen flex flex-col font-inter">
      <Navbar />

      <main className="flex-grow bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="md:flex md:items-center md:justify-between mb-8">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  Faculty Profile
                </h2>
              </div>
              {/* Edit/Save buttons removed as per request to only display data */}
            </div>
          </motion.div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center">
                <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-700 mr-6">
                  {profileData.name.charAt(0).toUpperCase()} {/* Ensure character is uppercase */}
                </div>
                <div>
                  <h3 className="text-xl leading-6 font-bold text-gray-900">
                    {profileData.name}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Faculty ID: {profileData.facultyId}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Full Name Display */}
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    Full Name
                  </label>
                  <p className="mt-2 text-gray-900">{profileData.name}</p> {/* Displaying name */}
                </div>

                {/* Email Address Display */}
                <div className="sm:col-span-3">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    Email Address
                  </label>
                  <p className="mt-2 text-gray-900">{profileData.email}</p> {/* Displaying email */}
                </div>

                {/* Department Display */}
                <div className="sm:col-span-3">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                    Department
                  </label>
                  <p className="mt-2 text-gray-900">{profileData.department}</p> {/* Displaying department */}
                </div>

                {/* Faculty ID (Non-editable) - already correctly displaying */}
                <div className="sm:col-span-3">
                  <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700 flex items-center">
                    <KeyRound className="h-4 w-4 mr-2 text-gray-400" />
                    Faculty ID
                  </label>
                  <p className="mt-2 text-gray-900">{profileData.facultyId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FacultyProfile;