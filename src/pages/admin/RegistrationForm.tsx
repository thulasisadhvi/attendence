import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save } from 'lucide-react'; // Icons from lucide-react
// Moved the formOptions data directly into the component file
const formOptions = {
  // IMPORTANT: Years are now single digits as per backend expectation
  "years": ["1", "2", "3", "4"],
  "semesters": {
    "1": ["1-1", "1-2"],
    "2": ["2-1", "2-2"],
    "3": ["3-1", "3-2"],
    "4": ["4-1", "4-2"]
  },
  "departments": ["CSE", "IT", "DS", "AIML"],
  "sections": {
    "1": {
      "CSE": ["A", "B"],
      "IT": ["A"],
      "DS": ["A"],
      "AIML": ["A"]
    },
    "2": {
      "CSE": ["A", "B", "C"],
      "IT": ["A", "B"],
      "DS": ["A", "B"],
      "AIML": ["A"]
    },
    "3": {
      "CSE": ["A", "B", "C", "D"],
      "IT": ["A", "B", "C"],
      "DS": ["A", "B"],
      "AIML": ["A", "B"]
    },
    "4": {
      "CSE": ["A", "B", "C", "D", "E"],
      "IT": ["A", "B", "C"],
      "DS": ["A", "B", "C"],
      "AIML": ["A", "B", "C"]
    }
  },
  "subjects": {
    "1": { // Changed from "1st" to "1"
      "1-1": {
        "CSE": ["C Programming", "Engineering Maths", "English"],
        "IT": ["Problem Solving", "Basic Maths"],
        "DS": ["Intro to Data Science"],
        "AIML": ["Basics of AI"]
      },
      "1-2": {
        "CSE": ["Python Programming", "Environmental Science"],
        "IT": ["Digital Logic", "Discrete Maths"],
        "DS": ["Statistics Basics"],
        "AIML": ["Linear Algebra", "Intro to ML"]
      }
    },
    "2": { // Changed from "2nd" to "2"
      "2-1": {
        "CSE": ["DSA", "DBMS", "OS"],
        "IT": ["Web Development", "Software Engineering"],
        "DS": ["Machine Learning", "Statistics"],
        "AIML": ["ML", "DL"]
      },
      "2-2": {
        "CSE": ["OOPs with Java", "Computer Architecture"],
        "IT": ["UI/UX", "Database Systems"],
        "DS": ["Data Wrangling", "Data Visualization"],
        "AIML": ["ML Projects", "Advanced DL"]
      }
    },
    "3": { // Changed from "3rd" to "3"
      "3-1": {
        "CSE": ["Computer Networks", "Theory of Computation"],
        "IT": ["Cloud Computing", "Cyber Security"],
        "DS": ["Data Engineering", "Probability and statics","Optimization Technics","DLCO"],
        "AIML": ["NLP", "ML Optimization"]
      },
      "3-2": {
        "CSE": ["Compiler Design", "Big Data"],
        "IT": ["IoT", "Ethical Hacking"],
        "DS": ["AI Tools", "Model Deployment"],
        "AIML": ["Vision Systems", "Transformer Models"]
      }
    },
    "4": { // Changed from "4th" to "4"
      "4-1": {
        "CSE": ["Project Work", "AI", "ML"],
        "IT": ["Capstone", "DevOps"],
        "DS": ["Big Data", "Capstone"],
        "AIML": ["Computer Vision", "Advanced DL"]
      },
      "4-2": {
        "CSE": ["Internship", "Seminar"],
        "IT": ["Internship", "Product Design"],
        "DS": ["Internship", "Thesis"],
        "AIML": ["Research Paper", "Final Project"]
      }
    }
  },
  "periods": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "blocks": {
    "Block-A": ["101", "102", "103"],
    "Block-B": ["201", "202", "203"],
    "Block-C": ["301", "302", "303"],
    "Block-D": ["401", "402", "403"]
  }
};

// Define Student type
interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  password: string;
  department: string;
  year: string;
  section: string;
  semester: string;
  role: string;
  phone: string;
  faceImages: string[]; // Stores Data URLs (Base64 strings)
}

// Utility function to convert Data URL to Blob (from friend's code)
const dataURLtoBlob = (dataURL: string): Blob => {
  const [header, base64] = dataURL.split(",");
  // Default to 'image/jpeg' if mime type cannot be extracted, as per friend's code and toDataURL call
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

const RegistrationForm: React.FC = () => {
  // State for student details form (omitting fields not directly used in this component's submission to backend)
  const [studentDetails, setStudentDetails] = useState<Omit<Student, 'id' | 'faceImages' | 'password' | 'role'>>({
    rollNumber: '',
    name: '',
    email: '',
    department: '', // Added back department, year, section, semester as they are part of form details
    year: '',
    section: '',
    phone: '',
    semester: '',
  });

  // State for camera and image capture
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  // This state now stores Base64 Data URLs, matching friend's logic
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentCaptureStep, setCurrentCaptureStep] = useState(1); // Tracks which picture is being taken (1, 2, or 3)
  const [faceDetected, setFaceDetected] = useState<boolean>(false); // Simulated face detection
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<string>(''); // For displaying messages to the user
  const [loading, setLoading] = useState<boolean>(false); // For showing loading state

  // Derived states for dropdown options (remain the same)
  const availableSemesters = studentDetails.year
    ? (formOptions.semesters as Record<string, string[]>)[studentDetails.year] || []
    : [];

  const availableSections = studentDetails.year && studentDetails.department
    ? (formOptions.sections as Record<string, Record<string, string[]>>)[studentDetails.year]?.[studentDetails.department] || []
    : [];

  // Handle input changes in the form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudentDetails((prevDetails) => {
      const newDetails = { ...prevDetails, [name]: value };
      // Reset dependent dropdowns when parent selection changes
      if (name === 'year') {
        newDetails.semester = '';
        newDetails.section = '';
      }
      if (name === 'department') {
        newDetails.section = '';
      }
      return newDetails;
    });
  };

  // Handle "Next" button click for student details
  const handleNext = () => {
    const { rollNumber, name, email, department, year, section, phone, semester } = studentDetails;

    // Validate all required fields
    if (!rollNumber.trim() || !name.trim() || !email.trim() || !department.trim() || !year.trim() || !section.trim() || !phone.trim() || !semester.trim()) {
      setMessage('Please fill in all student details before proceeding.');
      return;
    }

    // Basic validation for phone and email
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setMessage('Please enter a valid 10-digit Indian phone number (starts with 6-9).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
    if (!year || isNaN(parseInt(year, 10)) || year.length !== 1) {
        setMessage('Please select a valid year.');
        return;
    }

    setMessage(''); // Clear previous messages
    setShowCamera(true); // Show camera section
    startCamera(); // Start camera when "Next" is clicked
    setCurrentCaptureStep(1); // Reset capture step when camera is shown
    setCapturedImages([]); // Clear any previously captured images
  };

  // Start the camera stream
  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stop existing stream
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        console.log('Camera stream started.'); // Debug log
        // Simulate face detection after a short delay
        setTimeout(() => {
          setFaceDetected(true); // Placeholder: In a real app, this would be actual face detection
          setMessage(`Face detected! Please take picture ${currentCaptureStep} of 3.`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setMessage('Failed to access camera. Please ensure camera permissions are granted.');
      setShowCamera(false); // Hide camera section if access fails
    }
  };

  // Stop the camera stream when component unmounts or camera is hidden
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        console.log('Camera stream stopped via useEffect cleanup.'); // Debug log
      }
    };
  }, [stream]); // Only depend on stream for cleanup, as Data URLs don't need revoking

  // Take a picture from the video stream
  const takePicture = () => {
    if (!videoRef.current || !canvasRef.current || currentCaptureStep > 3) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Capture as JPEG Data URL with quality 0.8 (matching friend's code)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      
      // Add the new image (Data URL) to our array
      setCapturedImages((prev) => [...prev, dataUrl]);
      
      console.log(`Picture ${currentCaptureStep} taken. Camera should remain active.`); // Debug log
      if (currentCaptureStep < 3) {
        setCurrentCaptureStep(currentCaptureStep + 1);
        setMessage(`Picture ${currentCaptureStep} taken successfully! Please take picture ${currentCaptureStep + 1} of 3.`);
      } else {
        setMessage('All 3 pictures taken successfully! Click "Register Student" to complete registration.');
      }
    } else {
      setMessage('Failed to get canvas context.');
    }
  };

  // Handle form submission and save student data
  const handleSubmit = async () => {
    console.log('handleSubmit called.');

    if (capturedImages.length < 3) {
      setMessage('Please take at least 3 pictures of the student\'s face.');
      return;
    }

    setLoading(true); // Set loading state to true

    try {
      // --- 1. Send Roll Number and Images to Flask Backend (Port 8000) ---
      const flaskFormData = new FormData();
      flaskFormData.append('rollNumber', studentDetails.rollNumber);
      capturedImages.forEach((dataUrl, index) => {
        const blob = dataURLtoBlob(dataUrl);
        flaskFormData.append('images', blob, `face_image_${index + 1}.jpg`);
      });

      const flaskResponse = await fetch('http://localhost:8000/register-face', { 
        method: 'POST',
        body: flaskFormData,
      });

      const flaskData = await flaskResponse.json();

      if (!flaskResponse.ok) {
        setMessage(flaskData.error || flaskData.message || 'Face registration failed.');
        setLoading(false);
        return; // Stop if face registration fails
      }
      setMessage(flaskData.message || 'Face data submitted successfully to Flask.');

      // --- 2. Send Remaining Student Details to Node.js Backend (Port 5000) ---
      const nodeBody = {
        rollNumber: studentDetails.rollNumber,
        name: studentDetails.name,
        email: studentDetails.email,
        department: studentDetails.department,
        year: studentDetails.year,
        section: studentDetails.section,
        phone: studentDetails.phone,
        semester: studentDetails.semester,
        password: '12345678', // Default password
        role: 'student', // Default role
      };

      const nodeResponse = await fetch('http://localhost:5000/api/register-student', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nodeBody),
      });

      const nodeData = await nodeResponse.json();

      if (nodeResponse.ok) {
        setMessage(`Student registered successfully! ${flaskData.message || ''} ${nodeData.message || ''}`);
        // Clear the form after successful registration
        setStudentDetails({
          rollNumber: '', name: '', email: '', department: '', year: '', section: '', phone: '', semester: '',
        });
        setCapturedImages([]);
        setCurrentCaptureStep(1);
        setShowCamera(false);
        setFaceDetected(false);
        if (stream) { stream.getTracks().forEach((track) => track.stop()); setStream(null); }
      } else {
        setMessage(nodeData.error || nodeData.message || 'Student details registration failed.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setMessage('Network error. Could not connect to one or both backend servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto my-8 font-[Inter]">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Student Registration</h2>

      {/* Message display area */}
      {message && (
        <div className={`p-3 mb-4 rounded-md text-sm ${message.includes('successfully') ? 'bg-green-100 text-green-700' : message.includes('failed') || message.includes('Error') || message.includes('error') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          {message}
        </div>
      )}

      {/* Student Details Form - shown if camera is not active */}
      {!showCamera ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={studentDetails.name}
              onChange={handleChange}
              placeholder="Student Name"
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="rollNumber" className="text-sm font-medium text-gray-700 mb-1">Roll Number</label>
            <input
              type="text"
              id="rollNumber"
              name="rollNumber"
              value={studentDetails.rollNumber}
              onChange={handleChange}
              placeholder="Roll Number"
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>

          {/* Year Dropdown */}
          <div className="flex flex-col">
            <label htmlFor="year" className="text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              id="year"
              name="year"
              value={studentDetails.year}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            >
              <option value="">Select Year</option>
              {formOptions.years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>{yearOption}</option>
              ))}
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="flex flex-col">
            <label htmlFor="department" className="text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              id="department"
              name="department"
              value={studentDetails.department}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            >
              <option value="">Select Department</option>
              {formOptions.departments.map((deptOption) => (
                <option key={deptOption} value={deptOption}>{deptOption}</option>
              ))}
            </select>
          </div>

          {/* Semester Dropdown - depends on Year */}
          <div className="flex flex-col">
            <label htmlFor="semester" className="text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              id="semester"
              name="semester"
              value={studentDetails.semester}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              disabled={!studentDetails.year}
            >
              <option value="">Select Semester</option>
              {availableSemesters.map((semOption) => (
                <option key={semOption} value={semOption}>{semOption}</option>
              ))}
            </select>
          </div>

          {/* Section Dropdown - depends on Year and Department */}
          <div className="flex flex-col">
            <label htmlFor="section" className="text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              id="section"
              name="section"
              value={studentDetails.section}
              onChange={handleChange}
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
              disabled={!studentDetails.year || !studentDetails.department}
            >
              <option value="">Select Section</option>
              {availableSections.map((secOption) => (
                <option key={secOption} value={secOption}>{secOption}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col md:col-span-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={studentDetails.email}
              onChange={handleChange}
              placeholder="Email"
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1">Indian Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={studentDetails.phone}
              onChange={handleChange}
              placeholder="Phone"
              maxLength={10}
              className="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            />
          </div>
          <div className="md:col-span-2 flex justify-center mt-6">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white py-3 px-8 rounded-md hover:bg-blue-700 transition duration-300 ease-in-out text-lg font-semibold shadow-md"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Next (Access Camera)'}
            </button>
          </div>
        </div>
      ) : (
        /* Camera and Face Registration Section */
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-semibold text-gray-700 mb-4">Face Registration ({currentCaptureStep}/3)</h3>
          
          {/* Current image view / Live camera feed */}
          <div className="relative w-full max-w-sm h-64 bg-gray-200 rounded-lg overflow-hidden mb-4 border-2 border-gray-300 flex items-center justify-center">
            {/* Added 'muted' to video tag based on friend's code */}
            <video ref={videoRef} className="rounded-lg border w-full max-w-md aspect-video object-cover transform scale-x-[-1]" autoPlay muted></video>
            <canvas ref={canvasRef} className="hidden"></canvas> {/* Hidden canvas for capturing */}
          </div>
          
          {/* Image thumbnails */}
          {/* Show thumbnails only if at least one image has been captured */}
          {capturedImages.length > 0 && (
            <div className="flex space-x-2 mb-4">
              {/* Use capturedImages directly (Data URLs) for src */}
              {capturedImages.map((src, index) => (
                <div key={index} className="relative w-16 h-16 border-2 border-blue-500 rounded-md overflow-hidden shadow-sm">
                  <img src={src} alt={`Captured Face ${index + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center rounded-b-md">
                    {index + 1}
                  </div>
                </div>
              ))}
              {/* Placeholders for remaining images not yet captured */}
              {Array(3 - capturedImages.length).fill(0).map((_, index) => (
                <div key={index + capturedImages.length} className="w-16 h-16 border-2 border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-lg font-medium bg-gray-100 shadow-sm">
                  {index + capturedImages.length + 1}
                </div>
              ))}
            </div>
          )}
          
          {/* Face detection message */}
          <p className="text-sm text-gray-600 mb-4">
            {faceDetected ? (
              <span className="text-green-600 font-medium">Face detected!</span>
            ) : (
              <span className="text-red-600 font-medium">Scanning for face...</span>
            )}
          </p>
          
          {/* Buttons for taking pictures and registering */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={takePicture}
              // Disabled if camera not ready, no face, loading, or all 3 pics taken
              disabled={!stream || !faceDetected || loading || currentCaptureStep > 3} 
              className="flex items-center space-x-2 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition duration-300 ease-in-out text-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera size={20} />
              <span>{currentCaptureStep <= 3 ? `Take Picture ${currentCaptureStep} of 3` : 'All Pictures Taken'}</span>
            </button>
            <button
              onClick={handleSubmit}
              // Disabled until 3 pictures are taken or while loading
              disabled={capturedImages.length < 3 || loading} 
              className="flex items-center space-x-2 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition duration-300 ease-in-out text-lg font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              <span>{loading ? 'Saving...' : 'Register Student'}</span>
            </button>
          </div>
          
          {/* Go back button */}
          <button
            onClick={() => {
              setShowCamera(false);
              setCapturedImages([]); // Clear captured images when going back
              setCurrentCaptureStep(1); // Reset capture step
              setFaceDetected(false);
              setMessage('');
              if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
                console.log('Camera stream stopped by "Go back" button.'); // Debug log
              }
            }}
            className="text-blue-600 hover:underline text-sm"
            disabled={loading}
          >
            Go back to student details
          </button>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;