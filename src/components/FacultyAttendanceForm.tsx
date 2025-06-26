import React, { useState, useEffect } from 'react';
import axios from 'axios';
import formOptions from './formOptions.json';
import { jwtDecode } from 'jwt-decode';

interface FacultyAttendanceFormProps {
  onGenerateQR: (formData: {
    year: string;
    semester: string;
    department: string;
    section: string;
    subject: string;
    block: string;
    room: string;
    period: string;
    facultyName: string;
  }) => void;
}

interface DecodedToken {
  name: string;
  email: string;
  // Add other fields from token if needed
}

const FacultyAttendanceForm: React.FC<FacultyAttendanceFormProps> = ({ onGenerateQR }) => {
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [block, setBlock] = useState('');
  const [room, setRoom] = useState('');
  const [period, setPeriod] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false); // New state for confirmation dialog
  const [currentFormData, setCurrentFormData] = useState<any>(null); // State to store data for confirmation

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setFacultyName(decoded.name);
        console.log('Faculty Name:', decoded.name);
      } catch (err) {
        console.error('Invalid token:', err);
      }
    } else {
      console.warn('No token found in localStorage.');
    }
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value;
    setYear(selectedYear);
    setSemester('');
    setDepartment('');
    setSection('');
    setSubject('');
    setPeriod('');
  };

  const handleSemesterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSemester = e.target.value;
    setSemester(selectedSemester);
    setDepartment('');
    setSection('');
    setSubject('');
    setPeriod('');
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDept = e.target.value;
    setDepartment(selectedDept);
    setSection('');
    setSubject('');
    setPeriod('');
  };

  const handleBlockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBlock(e.target.value);
    setRoom('');
  };

  // This handles the first click on "Generate QR Code" button
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!year || !semester || !department || !section || !subject || !block || !room || !period) {
      alert('Please fill in all fields before generating QR code.');
      return;
    }

    const formData = {
      year,
      semester,
      department,
      section,
      subject,
      block,
      room,
      period,
      facultyName,
    };

    setCurrentFormData(formData); // Store data for confirmation
    setShowConfirmation(true); // Show the confirmation dialog
  };

  // This handles the "Confirm" button click in the dialog
  const handleConfirmGenerateQR = async () => {
    if (!currentFormData) return; // Should not happen if dialog is shown

    try {
      // Send data to backend ONLY if confirmed
      await axios.post('http://localhost:5000/api/save-period-and-update-attendance', currentFormData);
      onGenerateQR(currentFormData); // Call parent QR generation function
      alert('QR code generated and attendance updated successfully!');
      setShowConfirmation(false); // Close confirmation dialog
      // Optionally reset form fields after successful QR generation
      // setYear(''); setSemester(''); setDepartment(''); // etc.
    } catch (error) {
      console.error('Failed to save period data:', error);
      alert('Something went wrong while saving period info. Please check server console for details.');
      setShowConfirmation(false); // Close confirmation dialog on error
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false); // Hide the confirmation dialog
    setCurrentFormData(null); // Clear the stored data
  };

  return (
    <form
      onSubmit={handlePreSubmit} // Changed to handlePreSubmit
      className="p-4 space-y-4 max-w-xl mx-auto bg-white shadow-md rounded-md"
    >
      <h2 className="text-xl font-bold mb-4">Faculty Attendance Form</h2>

      {facultyName && (
        <p className="text-gray-600 text-sm mb-2">
          Logged in as: <strong>{facultyName}</strong>
        </p>
      )}

      {/* Your existing form fields */}
      <select value={year} onChange={handleYearChange} className="w-full p-2 border rounded">
        <option value="">Select Year</option>
        {formOptions.years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {year && (
        <select value={semester} onChange={handleSemesterChange} className="w-full p-2 border rounded">
          <option value="">Select Semester</option>
          {formOptions.semesters[year]?.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>
      )}

      {semester && (
        <select value={department} onChange={handleDepartmentChange} className="w-full p-2 border rounded">
          <option value="">Select Department</option>
          {formOptions.departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      )}

      {department && year && (
        <select value={section} onChange={(e) => setSection(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Section</option>
          {(formOptions.sections[year] && formOptions.sections[year][department])?.map((sec) => (
            <option key={sec} value={sec}>
              {sec}
            </option>
          ))}
        </select>
      )}

      {section && (
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Subject</option>
          {(formOptions.subjects[year] &&
            formOptions.subjects[year][semester] &&
            formOptions.subjects[year][semester][department])?.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
        </select>
      )}

      <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full p-2 border rounded">
        <option value="">Select Period</option>
        {formOptions.periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select value={block} onChange={handleBlockChange} className="w-full p-2 border rounded">
        <option value="">Select Block</option>
        {Object.keys(formOptions.blocks).map((blk) => (
          <option key={blk} value={blk}>
            {blk}
          </option>
        ))}
      </select>
      {block && (
        <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Room</option>
          {formOptions.blocks[block]?.map((rm) => (
            <option key={rm} value={rm}>
              {rm}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={!year || !semester || !department || !section || !subject || !block || !room || !period}
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded w-full"
      >
        Generate QR Code
      </button>

      {/* Confirmation Dialog */}
      {showConfirmation && currentFormData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-center">Confirm QR Code Generation</h3>
            <p className="mb-2">Please review the details:</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li><strong>Faculty:</strong> {currentFormData.facultyName}</li>
              <li><strong>Year:</strong> {currentFormData.year}</li>
              <li><strong>Semester:</strong> {currentFormData.semester}</li>
              <li><strong>Department:</strong> {currentFormData.department}</li>
              <li><strong>Section:</strong> {currentFormData.section}</li>
              <li><strong>Subject:</strong> {currentFormData.subject}</li>
              <li><strong>Period:</strong> {currentFormData.period}</li>
              <li><strong>Block:</strong> {currentFormData.block}</li>
              <li><strong>Room:</strong> {currentFormData.room}</li>
            </ul>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerateQR}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default FacultyAttendanceForm;