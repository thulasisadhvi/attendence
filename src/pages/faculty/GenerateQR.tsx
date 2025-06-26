// File: GenerateQr.tsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import FacultyAttendanceForm from '../../components/FacultyAttendanceForm';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import Navbar from '../../components/Navbar'; // Assuming Navbar/Footer are handled by a Layout component or can be removed if not universal
// import Footer from '../../components/Footer'; // Assuming Navbar/Footer are handled by a Layout component or can be removed if not universal
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { useAuth } from '../../context/AuthContext'; // Import useAuth hook

const GenerateQr: React.FC = () => {
  const [showQR, setShowQR] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState({
    department: '',
    section: '',
    classroom: ''
  });

  const { user, isLoggedIn, isLoading } = useAuth(); // Use the authentication hook
  const navigate = useNavigate(); // Hook for programmatic navigation

  // --- Authentication and Authorization Check ---
  useEffect(() => {
    if (isLoading) {
      // Still loading authentication state, do nothing yet
      return;
    }

    // If not logged in, redirect to login page
    if (!isLoggedIn) {
      navigate('/login');
      return; // Stop further execution
    }

    // If logged in but the role is not 'faculty', redirect to a suitable page (e.g., home or a forbidden page)
    if (user && user.role !== 'faculty') {
      alert('You do not have permission to access the QR Generation page.');
      navigate('/'); // Redirect to home page
      return; // Stop further execution
    }
    // If we reach here, the user is logged in and has the 'faculty' role, so they can view the page.

  }, [isLoggedIn, isLoading, user, navigate]); // Depend on auth state and navigate

  const handleGenerateQR = (department: string, section: string, classroom: string) => {
    setSelectedData({ department, section, classroom });
    setShowQR(true);
  };

  const handleBack = () => {
    setShowQR(false);
  };

  // Display a loading message while authentication state is being determined
  if (isLoading) {
    return <div className="text-center text-gray-600 text-lg mt-20">Loading authentication...</div>;
  }

  // If not logged in or not authorized, the useEffect will handle redirection, so we can return null or a simple message here
  if (!isLoggedIn || (user && user.role !== 'faculty')) {
    return null; // Or <p>Redirecting...</p>
  }

  // Render the page content only if authenticated as faculty
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />  {/* Assuming Navbar/Footer are handled by a Layout component or can be removed if not universal */}
      
      <div className="flex flex-1">
        <main className="flex-1 p-4 md:p-6">
          <div className="flex justify-center items-center flex-col mb-6">
            <h1 className="text-2xl font-bold text-gray-800 text-center">Faculty Attendance Portal</h1>
            <p className="text-gray-600 text-center">Generate QR codes for class attendance tracking</p>
          </div>

          <div className="max-w-md mx-auto mt-8">
            {showQR ? (
              <QRCodeDisplay 
                department={selectedData.department}
                section={selectedData.section}
                classroom={selectedData.classroom}
                onBack={handleBack}
              />
            ) : (
              <FacultyAttendanceForm onGenerateQR={handleGenerateQR} />
            )}
          </div>
        </main>
      </div>
      
      {/* <Footer /> */} {/* Assuming Navbar/Footer are handled by a Layout component or can be removed if not universal */}
    </div>
  );
};

export default GenerateQr;