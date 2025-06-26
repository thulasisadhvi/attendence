import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Import necessary icons
import { User, Mail, Building, KeyRound, Award, AlertTriangle, Hash, CalendarDays } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
// Define interfaces for better type safety
interface UserProfileData {
    name: string;
    email: string;
    department: string;
    rollNumber: string;
    semester: string;
    section: string; // Added section
    year: string;    // Added year
    batch?: string; // Optional if not always present in data
}

const StudentProfile: React.FC = () => {
    const { user } = useAuth(); // Initial user data from AuthContext
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // API base URL - ensure this is correctly configured in your .env file
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    // Redirect if no user or not student (authentication check)
    // This should ideally happen higher up in your routing, but kept here for self-containment.
    if (!user || user.role !== 'student') {
        // Use a client-side redirect or a more robust authentication flow.
        // For production, consider using React Router's Navigate component or similar.
        window.location.href = '/login';
        return null;
    }

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Authentication token not found. Please log in again.');
                }

                // Fetch data from the existing student dashboard endpoint
                const response = await fetch(`${API_BASE}/api/student/dashboard`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch profile data (Status: ${response.status})`);
                }

                const data = await response.json();
                if (data.success && data.user) {
                    setProfileData({
                        name: data.user.name,
                        email: data.user.email,
                        department: data.user.department,
                        rollNumber: data.user.rollNumber,
                        semester: data.user.semester, // Assuming 'semister' typo is handled on backend side
                        section: data.user.section,
                        year: data.user.year,
                        batch: data.user.batch || 'N/A' // Assuming batch might not always be there
                    });
                } else {
                    setError(data.message || 'No user data found in the response.');
                }
            } catch (err: any) {
                console.error("Error fetching profile data:", err);
                setError(err.message || 'An unexpected error occurred while loading your profile.');
            } finally {
                setLoading(false);
            }
        };

        // Fetch profile data only if a user is authenticated
        if (user && user.email) {
            fetchProfile();
        }
    }, [user, API_BASE]); // Re-fetch if user context changes or API_BASE changes

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center p-6 rounded-lg shadow-md bg-white">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-red-700">Error Loading Profile</h2>
                    <p className="mt-2 text-red-600">{error}</p>
                    <p className="mt-4 text-gray-500 text-sm">Please ensure you are logged in and try again.</p>
                </div>
            </div>
        );
    }

    // If no profileData (e.g., after loading and no error, but data is null)
    if (!profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-6 rounded-lg shadow-md bg-white">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-yellow-700">Profile Not Found</h2>
                    <p className="mt-2 text-gray-600">No profile data could be retrieved for your account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
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
                                    Student Profile
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">View and manage your personal details.</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <div className="flex items-center">
                                <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-700 mr-6 shadow-sm">
                                    {profileData.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl leading-6 font-bold text-gray-900">
                                        {profileData.name}
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                        Roll Number: {profileData.rollNumber}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <User className="h-4 w-4 mr-2 text-gray-400" /> Full Name
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.name}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <Mail className="h-4 w-4 mr-2 text-gray-400" /> Email Address
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.email}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <Building className="h-4 w-4 mr-2 text-gray-400" /> Department
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.department}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <KeyRound className="h-4 w-4 mr-2 text-gray-400" /> Roll Number
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.rollNumber}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <Award className="h-4 w-4 mr-2 text-gray-400" /> Current Semester
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.semester}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <Hash className="h-4 w-4 mr-2 text-gray-400" /> Section
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.section}</dd>
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-700 flex items-center">
                                        <CalendarDays className="h-4 w-4 mr-2 text-gray-400" /> Current Year
                                    </dt>
                                    <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.year}</dd>
                                </div>
                                {profileData.batch && profileData.batch !== 'N/A' && (
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-700 flex items-center">
                                            <Clock className="h-4 w-4 mr-2 text-gray-400" /> Batch
                                        </dt>
                                        <dd className="mt-1 text-lg text-gray-900 font-semibold">{profileData.batch}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StudentProfile;