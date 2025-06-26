// src/pages/History.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar'; // Adjust path if necessary
import Footer from '../../components/Footer'; // Adjust path if necessary
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../../context/AuthContext'; // Import useAuth

// Define the type for a single period entry
interface PeriodEntry {
    year: string;
    semester: string;
    department: string;
    section: string;
    subject: string;
    block: string;
    room: string;
    period: string;
    facultyName: string;
    token: string; // This `token` here seems to be a unique identifier for the period, not the auth token
    timestamp: string;
    status: 'active' | 'expired';
}

const History: React.FC = () => {
    const [historyData, setHistoryData] = useState<PeriodEntry[] | null>(null);
    const [loadingData, setLoadingData] = useState<boolean>(true); // Renamed to avoid conflict with auth isLoading
    const [dataError, setDataError] = useState<string | null>(null); // Renamed to avoid conflict with auth error
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [itemToDeleteToken, setItemToDeleteToken] = useState<string | null>(null);

    const { user, isLoggedIn, isLoading, error: authError } = useAuth(); // Get auth state
    const navigate = useNavigate();

    const fetchHistory = async (facultyName: string) => {
        setLoadingData(true);
        setDataError(null);
        try {
            const response = await axios.get<PeriodEntry[]>(`http://localhost:5000/api/history?facultyName=${encodeURIComponent(facultyName)}`);
            const sortedData = response.data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setHistoryData(sortedData);
        } catch (err) {
            console.error('Error fetching history:', err);
            setDataError('Failed to fetch attendance history. Please ensure you are logged in or try again.');
            setHistoryData([]);
        } finally {
            setLoadingData(false);
        }
    };

    // --- Authentication and Authorization Check ---
    useEffect(() => {
        if (isLoading) {
            // Still loading authentication state, wait.
            return;
        }

        if (authError) {
            // An error occurred during authentication, handle as needed (e.g., specific error message)
            // For general access control, the redirection below will cover it if isLoggedIn is false.
        }

        // If not logged in OR not a faculty user, redirect to login
        if (!isLoggedIn || !user || user.role !== 'faculty') {
            alert('You do not have permission to view this page. Please log in as a faculty member.');
            navigate('/login'); // Redirect to login page
            return;
        }

        // If authenticated as faculty, proceed to fetch data
        if (user.name) {
            fetchHistory(user.name);
        } else {
            // This case should ideally not happen if AuthContext properly provides user.name for faculty
            setDataError('Faculty name not found in authentication context. Cannot fetch history.');
            setHistoryData([]);
            setLoadingData(false);
        }
    }, [isLoggedIn, isLoading, user, navigate, authError]); // Depend on auth state changes

    const showFeedbackMessage = (message: string, type: 'success' | 'error') => {
        setFeedback({ message, type });
        setTimeout(() => setFeedback(null), 3000);
    };

    const confirmDelete = (token: string) => {
        setItemToDeleteToken(token);
        setShowConfirmModal(true);
    };

    const cancelDelete = () => {
        setShowConfirmModal(false);
        setItemToDeleteToken(null);
    };

    const handleDelete = async () => {
        if (itemToDeleteToken === null || !user || user.role !== 'faculty') {
            console.error('Deletion attempt without token or authorized faculty user.');
            return;
        }

        setShowConfirmModal(false);

        try {
            await axios.delete(`http://localhost:5000/api/history/${itemToDeleteToken}`);
            showFeedbackMessage('Period entry deleted successfully!', 'success');
            if (user.name) { // Re-fetch history for the current faculty after deletion
                fetchHistory(user.name);
            }
        } catch (err) {
            console.error('Error deleting entry:', err);
            showFeedbackMessage('Failed to delete entry. Please try again.', 'error');
        } finally {
            setItemToDeleteToken(null);
        }
    };

    const columnDefinitions = [
        { key: 'token', header: 'Token' },
        { key: 'timestamp', header: 'Date & Time' },
        { key: 'facultyName', header: 'Faculty' },
        { key: 'subject', header: 'Subject' },
        { key: 'department', header: 'Dept.' },
        { key: 'year', header: 'Year' },
        { key: 'semester', header: 'Sem.' },
        { key: 'section', header: 'Sec.' },
        { key: 'period', header: 'Period' },
        { key: 'block', header: 'Block' },
        { key: 'room', header: 'Room' },
        { key: 'status', header: 'Status' },
    ];

    // Conditional rendering based on AuthContext's loading/auth state FIRST
    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto p-6 text-center mt-20 text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="animate-spin text-blue-500" size={24} /> Checking authentication...
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // If not authenticated or not faculty, the useEffect will handle redirection.
    // Return null here to prevent rendering the page content momentarily before redirect.
    if (!isLoggedIn || !user || user.role !== 'faculty') {
        return null;
    }

    // Now, handle the data fetching loading/error states (after successful authentication)
    if (loadingData) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto p-6 text-center mt-20 text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="animate-spin text-blue-500" size={24} /> Loading attendance history...
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (dataError) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto p-6 text-center mt-20">
                    <div className="text-red-600 text-lg flex items-center justify-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-6 h-6" /> {dataError}
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <Navbar />
            <main className="flex-grow container mx-auto p-6 lg:p-10 max-w-full xl:max-w-screen-xl">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-10 text-center drop-shadow-sm">
                    Attendance Period History
                </h2>

                {feedback && (
                    <div className={`mb-8 p-4 rounded-lg flex items-center justify-center gap-3 text-base font-semibold ${feedback.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {feedback.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        {feedback.message}
                    </div>
                )}

                {historyData && historyData.length === 0 ? (
                    <div className="text-center text-gray-600 text-xl mt-20 p-8 bg-white shadow-lg rounded-2xl border border-gray-200">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-yellow-500" />
                        <p>No attendance period history found for "{user?.name || 'this faculty'}".</p>
                        <p className="mt-2">Generate a QR code to start logging periods!</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-2xl rounded-xl border border-gray-200 overflow-x-auto"> {/* Added overflow-x-auto back for potentially wide tables */}
                        <table className="min-w-full table-auto divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                                <tr>
                                    {columnDefinitions.map((col) => (
                                        <th
                                            key={col.key}
                                            scope="col"
                                            className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap"
                                        >
                                            {col.header}
                                        </th>
                                    ))}
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {historyData && historyData.map((entry, index) => (
                                    <tr key={entry.token || index} className="hover:bg-blue-50 transition-colors duration-200 ease-in-out odd:bg-gray-50">
                                        {columnDefinitions.map((col) => (
                                            <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                                                {col.key === 'status' ? (
                                                    <span className={`font-medium flex items-center gap-1 ${entry.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {entry.status === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                                                    </span>
                                                ) : col.key === 'timestamp' ? (
                                                    new Date(entry.timestamp).toLocaleString()
                                                ) : (
                                                    entry[col.key as keyof PeriodEntry] !== undefined ? String(entry[col.key as keyof PeriodEntry]) : 'N/A'
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            {entry.status === 'active' ? (
                                                <button
                                                    onClick={() => confirmDelete(entry.token)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-300 rounded-md hover:bg-red-50 hover:border-red-500 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 border border-gray-200 bg-gray-100 rounded-md cursor-not-allowed">
                                                    <Clock className="w-4 h-4" /> Expired
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto transform transition-all duration-300 scale-100 opacity-100 border border-gray-200">
                        <AlertTriangle className="w-16 h-16 mx-auto mb-6 text-red-500" />
                        <h3 className="text-2xl font-bold mb-4 text-gray-900">Confirm Deletion</h3>
                        <p className="text-gray-700 text-lg mb-8">Are you sure you want to delete this period entry? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={cancelDelete}
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default History;