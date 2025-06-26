// AdminDashboard.tsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import RegistrationForm from './RegistrationForm';
import StudentAttendance from './StudentAttendance';
import StudentData from './StudentData';
import { UserPlus, CalendarCheck, Users, Menu, X, LogOut, Clock, AlertTriangle } from 'lucide-react'; // Added Clock, AlertTriangle icons
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../../context/AuthContext'; // Import useAuth from your context

// Define a type for the currently active component
type ActiveComponent = 'registration' | 'attendance' | 'studentData';

const AdminDashboard: React.FC = () => {
    // State to manage which component is currently active/displayed
    const [activeComponent, setActiveComponent] = useState<ActiveComponent>('registration');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar visibility

    // Access logout function and navigate from AuthContext and react-router-dom
    const { logout, user, isLoggedIn, isLoading, error: authError } = useAuth(); // Get auth state
    const navigate = useNavigate();

    // --- Authentication and Authorization Check ---
    useEffect(() => {
        if (isLoading) {
            // Still loading authentication state, wait.
            return;
        }

        if (authError) {
            // An error occurred during authentication, handle as needed
            // The redirection below will cover it if isLoggedIn is false.
        }

        // If not logged in OR not an admin user, redirect to login
        if (!isLoggedIn || !user || user.role !== 'admin') {
            alert('You do not have permission to view this page. Please log in as an administrator.');
            navigate('/login'); // Redirect to login page
        }
    }, [isLoggedIn, isLoading, user, navigate, authError]); // Depend on auth state changes

    // Function to handle logout
    const handleLogout = () => {
        logout(); // Call the logout function from your AuthContext
        navigate('/login'); // Redirect to the login page after logout
        setIsSidebarOpen(false); // Close sidebar after logout on mobile
    };

    // Function to render the active component based on state
    const renderComponent = () => {
        switch (activeComponent) {
            case 'registration':
                return <RegistrationForm />;
            case 'attendance':
                return <StudentAttendance />;
            case 'studentData':
                return <StudentData />;
            default:
                return <RegistrationForm />; // Default to registration form
        }
    };

    // Conditional rendering based on AuthContext's loading/auth state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex items-center text-gray-700 text-lg">
                    <Clock className="animate-spin text-blue-500 mr-2" size={24} /> Checking authentication...
                </div>
            </div>
        );
    }

    // If not authenticated or not admin, the useEffect will handle redirection.
    // Return null here to prevent rendering the dashboard momentarily before redirect.
    if (!isLoggedIn || !user || user.role !== 'admin') {
        return null;
    }

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-gray-100 font-sans">
            {/* Mobile Sidebar Toggle Button */}
            <button
                className="lg:hidden p-4 text-gray-600 hover:text-gray-900 fixed top-4 left-4 z-50 bg-white rounded-full shadow-md"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 bg-gradient-to-br from-blue-700 to-blue-900 text-white w-64 p-6 shadow-xl z-40
          transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0
          transition-transform duration-300 ease-in-out flex flex-col`}
            >
                <div className="flex items-center mb-10 mt-2 lg:mt-0">
                    <img
                        src="https://placehold.co/40x40/ffffff/000000?text=AD"
                        alt="Admin Logo"
                        className="rounded-full mr-3"
                    />
                    <h1 className="text-2xl font-extrabold tracking-wide">Admin Panel</h1>
                </div>

                <nav className="flex-1">
                    <ul className="space-y-4">
                        <li>
                            <button
                                onClick={() => { setActiveComponent('registration'); setIsSidebarOpen(false); }}
                                className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition duration-200 ease-in-out
                    ${activeComponent === 'registration' ? 'bg-blue-600 shadow-md transform scale-105' : 'hover:bg-blue-800'}`}
                            >
                                <UserPlus size={20} className="mr-3" />
                                <span>Student Registration</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { setActiveComponent('attendance'); setIsSidebarOpen(false); }}
                                className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition duration-200 ease-in-out
                    ${activeComponent === 'attendance' ? 'bg-blue-600 shadow-md transform scale-105' : 'hover:bg-blue-800'}`}
                            >
                                <CalendarCheck size={20} className="mr-3" />
                                <span>Student Attendance</span>
                            </button>
                        </li>
                        <li>
                            <button
                                onClick={() => { setActiveComponent('studentData'); setIsSidebarOpen(false); }}
                                className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition duration-200 ease-in-out
                    ${activeComponent === 'studentData' ? 'bg-blue-600 shadow-md transform scale-105' : 'hover:bg-blue-800'}`}
                            >
                                <Users size={20} className="mr-3" />
                                <span>All Students Data</span>
                            </button>
                        </li>
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className="mt-auto pt-6 border-t border-blue-800">

                    <p className="text-sm text-blue-200 mt-4">Logged in as Admin</p>
                    <button
                        onClick={handleLogout} // Call the integrated handleLogout
                        className="flex items-center w-full p-3 rounded-lg text-lg font-medium text-red-300 hover:bg-blue-800 hover:text-red-100 transition duration-200 ease-in-out"
                    >
                        <LogOut size={20} className="mr-3" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content area */}
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
                {renderComponent()}
            </main>
        </div>
    );
};

export default AdminDashboard;