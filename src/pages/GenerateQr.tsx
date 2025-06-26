import React, { useState } from 'react';
import FacultyAttendanceForm from '../components/FacultyAttendanceForm';
import QRCodeDisplay from '../components/QRCodeDisplay';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
const GenerateQr: React.FC = () => {
  const [showQR, setShowQR] = useState<boolean>(false);
  const [selectedData, setSelectedData] = useState({
    department: '',
    section: '',
    classroom: ''
  });

  const handleGenerateQR = (department: string, section: string, classroom: string) => {
    setSelectedData({ department, section, classroom });
    setShowQR(true);
  };

  const handleBack = () => {
    setShowQR(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
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
      <Footer />
    </div>
  );
};

export default GenerateQr;