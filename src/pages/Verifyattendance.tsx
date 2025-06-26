// Verifyattendance.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios"; // Make sure axios is installed: npm install axios or yarn add axios

// Define the type for periodData for better type safety
interface PeriodData {
  year?: string;
  semester?: string;
  department?: string;
  section?: string;
  subject?: string;
  block?: string; // Ensure block is part of PeriodData
  room?: string;  // Ensure room is part of PeriodData
  period?: string;
  facultyName?: string;
  token?: string;
  timestamp?: string;
  status?: string; // 'active' or 'expired' - this comes directly from the backend
  timeLeftSeconds?: number; // Time left in seconds, calculated and sent by backend
}

// Define the type for the expected result from your face recognition backend (Flask)
interface RecognitionResult {
  status: string;
  rollNumber?: string; // Backend returns 'rollNumber'
  // Add other properties if your backend returns more data
  // confidence?: number;
}

// Define the type for the expected result from your Node.js attendance marking backend
interface MarkAttendanceResponse {
  status: string; // "success" or "error"
  message: string;
  rollNumber?: string; // Confirmed roll number
  session?: { // Optional, but useful to confirm session details
    subject: string;
    department: string;
    semester: string;
    facultyName: string;
    period: string;
  };
}

// Reusable popup component for success messages (can be used for other messages too)
const SuccessPopup: React.FC<{ message: string; type?: 'success' | 'error' }> = ({ message, type = 'error' }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl shadow-lg
      ${type === 'success' ? 'bg-green-100 border border-green-500 text-green-800' : 'bg-red-100 border border-red-500 text-red-800'}
    `}
  >
    {message}
  </motion.div>
);

const VerifyAttendancePage: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Extract the token from the URL (e.g., ?token=your_token_here)
  const token = searchParams.get("token");

  // State variables for managing fetched data and UI
  const [periodData, setPeriodData] = useState<PeriodData | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // True while fetching data
  const [error, setError] = useState<string | null>(null); // Stores persistent error messages (like expired QR)
  const [isExpired, setIsExpired] = useState<boolean>(false); // True if QR code is expired
  const [timeLeft, setTimeLeft] = useState<number>(0); // Remaining time for active QR code

  const videoRef = useRef<HTMLVideoElement>(null); // Ref for the video element
  const streamRef = useRef<MediaStream | null>(null); // Ref for the camera stream
  const recognitionIntervalRef = useRef<number | null>(null); // Ref for the recognition interval

  // States for verification steps
  const [locationVerified, setLocationVerified] = useState(false); // New: True after "Verify Location" click
  const [faceVerified, setFaceVerified] = useState(false); // Indicates if face recognition was successful for attendance
  const [showSuccess, setShowSuccess] = useState(false); // Final attendance marked success message

  const [isProcessingFace, setIsProcessingFace] = useState<boolean>(false); // To show processing state for face recognition
  const [faceRecognitionResult, setFaceRecognitionResult] = useState<RecognitionResult | null>(null); // Stores the *current* result from face recognition backend (for live feedback)

  // NEW STATE: To specifically hold the roll number and other details for the final success message
  const [markedAttendanceDetails, setMarkedAttendanceDetails] = useState<MarkAttendanceResponse['session'] | null>(null);
  const [identifiedStudentRollNumber, setIdentifiedStudentRollNumber] = useState<string | null>(null);


  // State for transient popup messages
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<'success' | 'error'>('error');


  // Function to show a popup message for 3 seconds
  const showPopup = (message: string, type: 'success' | 'error' = 'error') => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType('error'); // Reset to default error type
    }, 3000);
  };

  // --- Start: Camera & Face Recognition Logic ---

  const startCamera = async () => {
    setError(null); // Clear any previous errors
    setFaceRecognitionResult(null); // Clear previous recognition results (for live feed)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false, // No audio needed
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Auto-play failed: ", err);
            setError("Failed to play video. Browser autoplay policies might be blocking it.");
          });
        };
      }
    } catch (err: any) {
      console.error("Camera error: ", err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("Permission denied: Please grant camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found: Make sure you have a camera connected and enabled.");
        } else if (err.name === "NotReadableError") {
          setError("Camera is in use: Another application might be using your camera.");
        } else if (err.name === "SecurityError") {
          setError("Camera access blocked. Ensure you are on HTTPS (or localhost).");
        } else {
          setError(`An unexpected browser error occurred: ${err.message}`);
        }
      } else {
        setError("Camera access denied or not available. Please check permissions.");
      }
      setFaceVerified(false);
      // If camera fails, stop any pending recognition interval too
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current); // Corrected ref name
      recognitionIntervalRef.current = null;
    }
    setFaceRecognitionResult(null); // Clear results on stop - this is for the *live* feedback display
    setIsProcessingFace(false); // Stop any processing indication
  }, []);

  const autoCaptureAndRecognize = useCallback(async () => {
    // Stop capturing if QR is expired, camera stream is not active, or attendance is already marked
    if (isExpired || !videoRef.current || !streamRef.current || (faceVerified && showSuccess)) {
      stopCamera(); // Ensure camera is stopped if these conditions are met
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get 2D canvas context.");
      return; // Do not set isProcessingFace to false here as it's not a server call failure
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    // Set processing state *before* sending, so UI can react immediately
    setIsProcessingFace(true);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          console.warn("Canvas toBlob failed: No blob created.");
          setIsProcessingFace(false); // Reset processing if blob creation fails
          return;
        }

        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");
        // No need to append token here, as Flask backend doesn't use it for pure recognition
        // Flask backend will just identify face and return rollNumber if found.

        try {
          // Send image to Flask for face recognition
          const flaskResponse = await fetch("http://localhost:8000/recognize", {
            method: "POST",
            body: formData,
          });

          console.log("➡ Flask Backend Response status:", flaskResponse.status);

          if (!flaskResponse.ok) {
            const errorText = await flaskResponse.text();
            throw new Error(`Flask server returned ${flaskResponse.status}: ${errorText}`);
          }

          const flaskData: RecognitionResult = await flaskResponse.json();
          setFaceRecognitionResult(flaskData); // Store the recognition result for live feedback
          setError(null); // Clear any previous errors if a valid response comes

          if (flaskData.status === "Spoof attempt detected") {
            setError("⚠ Spoof attempt detected. Access denied."); // This is a persistent error
            showPopup("⚠ Spoof attempt detected!"); // Transient popup for immediate feedback
          } else if (flaskData.status === "Unknown face" || flaskData.status === "No face found" || flaskData.status === "Multiple faces detected") {
             // These are not critical errors that stop the camera, just feedback
             // The camera should continue running to find a valid face
             showPopup(`Face Recognition: ${flaskData.status}`, 'error'); // Show feedback
          } else if (flaskData.status === "Attendance marked" && flaskData.rollNumber) {
            // Face recognized! Now send roll number to Node.js backend for attendance marking
            console.log(`Face recognized: ${flaskData.rollNumber}. Attempting to mark attendance via Node.js...`);
            try {
              const nodeResponse = await axios.post<MarkAttendanceResponse>(
                'http://localhost:5000/api/mark-attendance', // Node.js backend URL and new endpoint
                {
                  rollNumber: flaskData.rollNumber,
                  token: token // Send the token from the URL to Node.js
                }
              );

              const nodeData = nodeResponse.data;
              console.log("➡ Node.js Backend Response:", nodeData);

              if (nodeData.status === "success") {
                setFaceVerified(true); // Mark face as verified (combined with eligibility)
                setIdentifiedStudentRollNumber(nodeData.rollNumber || null); // Set the roll number for final display
                setMarkedAttendanceDetails(nodeData.session || null); // Store session details
                setShowSuccess(true); // Show the final success message
                showPopup("😊 Attendance marked successfully!", 'success');
                stopCamera(); // Stop camera after full success
              } else {
                // Node.js backend returned an error (e.g., student not eligible, duplicate)
                setError(`Attendance Error: ${nodeData.message}`); // Persistent error
                showPopup(`🚫 ${nodeData.message}`, 'error'); // Transient popup
                // Do NOT stop camera here, allow student to re-attempt or correct if possible
              }
            } catch (nodeErr: any) {
              console.error("Node.js Backend communication error:", nodeErr);
              setError(`⚠ Node.js Backend error: ${nodeErr.response?.data?.message || nodeErr.message}`); // Persistent error
              showPopup(`🚫 Node.js error!`, 'error'); // Transient popup
            }
          }
        } catch (err: any) {
          console.error("General Backend communication error (Flask):", err);
          setError(`⚠ General backend error: ${err.message}`); // Persistent error for Flask issues
          showPopup(`🚫 Backend error!`, 'error'); // More general transient popup
        } finally {
          // Always reset processing after the async operation completes,
          // regardless of success or failure.
          setIsProcessingFace(false);
        }
      },
      "image/jpeg",
      0.8 // JPEG quality
    );
  }, [isExpired, token, faceVerified, showSuccess, stopCamera]); // Dependencies for useCallback

  // Effect to set up/tear down the auto-capture interval
  useEffect(() => {
    // Start auto-capture if location is verified, and QR code is active, and attendance not yet marked
    if (locationVerified && periodData && !isExpired && !faceVerified && !showSuccess) {
      // Clear any existing interval to prevent duplicates
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
      }
      // Start a new interval
      recognitionIntervalRef.current = window.setInterval(autoCaptureAndRecognize, 1500); // Capture every 1.5 seconds
    } else {
      // Clear interval if any of the conditions for continuous running are no longer met
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
    }

    // Cleanup function: clear the interval and stop camera when the component unmounts or dependencies change
    return () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
      stopCamera(); // Also stop camera definitively when component unmounts
    };
  }, [periodData, faceVerified, isExpired, locationVerified, showSuccess, autoCaptureAndRecognize, stopCamera]);

  // --- End: Camera & Face Recognition Logic ---

  // Effect hook to fetch period data when the component mounts or token changes
  useEffect(() => {
    if (!token) {
      setError("No token provided in the URL. Please use a valid QR code link.");
      setLoading(false);
      return;
    }

    const fetchPeriodData = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors
        const response = await axios.get<PeriodData>(
          `http://localhost:5000/api/period?token=${token}` // Assumed Node.js backend for period data
        );
        const fetchedData = response.data;
        setPeriodData(fetchedData);

        if (fetchedData.status === "expired") {
          setIsExpired(true);
          setError("This QR Code has expired. Please ask the faculty to regenerate a new one.");
        } else {
          setIsExpired(false);
          setTimeLeft(fetchedData.timeLeftSeconds || 0);
        }
      } catch (err: any) {
        console.error("Error fetching period data:", err);
        setError(err.response?.data?.message || "Failed to load period data. Please try again.");
        setIsExpired(true); // Assume expired or invalid if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodData();
  }, [token]);

  // Effect hook for the countdown timer
  useEffect(() => {
    if (isExpired || timeLeft <= 0) {
      if (timeLeft <= 0 && !isExpired && periodData) {
        setIsExpired(true);
        setError("This QR Code has just expired! Please ask the faculty to regenerate.");
        stopCamera(); // Stop camera if timer expires
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          setError("This QR Code has just expired! Please ask the faculty to regenerate.");
          stopCamera(); // Stop camera if timer expires
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isExpired, periodData, stopCamera]);

  // Function to handle location verification via Geolocation API
  const verifyLocation = () => {
    if (isExpired) {
      showPopup("Cannot verify location: QR Code has expired.");
      return;
    }
    if (!navigator.geolocation) {
      showPopup("Geolocation is not supported by your browser. Please use a compatible browser.", 'error');
      return;
    }

    if (!periodData?.block || !periodData?.room) {
      setError("Period data (block or room) is missing. Cannot verify location."); // Keep this as a persistent error
      showPopup("🚫 Period data (block or room) missing. Contact faculty.", 'error'); // Transient popup
      return;
    }

    // Show a loading indicator for location verification
    setPopupMessage("Verifying location..."); // This will be immediately overwritten if an error occurs
    setPopupType('success'); // Indicate a positive status for loading

    navigator.geolocation.getCurrentPosition(
      async (position) => { // Make this async to use await
        const studentLatitude = position.coords.latitude;
        const studentLongitude = position.coords.longitude;

        console.log("Student's current location:", { studentLatitude, studentLongitude });

        try {
          // Send student's location and expected room to your backend for verification
          // Assuming this is also a Node.js endpoint, as the Python app doesn't have it
          const response = await axios.post('http://localhost:5000/api/verify-location', { 
            studentLatitude,
            studentLongitude,
            block: periodData.block,
            room: periodData.room,
            token: token // Send the token for backend validation if needed
          });

          if (response.data.status === 'success') {
            setLocationVerified(true);
            showPopup("📍 Location verified successfully!", 'success'); // Success popup
            startCamera(); // Start camera after successful location verification
          } else {
            showPopup(`🚫 ${response.data.message || "Location verification failed!"}`, 'error');
          }
        } catch (err: any) {
          console.error("Backend location verification error:", err);
          if (err.response?.status === 403 && err.response?.data?.message.includes("Location mismatch")) {
              showPopup("🚫 Please go to your classroom to mark attendance.", 'error');
          } else {
              setError(`⚠ An unexpected error occurred with location verification.`); // Persistent error for serious issues
              showPopup(`🚫 Verification error. Please try again.`, 'error'); // Transient popup
          }
        }
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        showPopup("🚫 Please go to your classroom to mark attendance.", 'error');
      },
      {
        enableHighAccuracy: true, // Request high accuracy GPS
        timeout: 7000,          // Reduce timeout slightly for quicker feedback (e.g., 7 seconds)
        maximumAge: 0            // Don't use cached position
      }
    );
  };

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-700 text-xl font-semibold">
        Loading attendance details...
      </div>
    );
  }

  // Display *persistent* error state (e.g., no token, token not found, expired)
  // This remains if QR is truly expired or there's a fundamental data error.
  // It will NOT show for transient location issues.
  if (error && !showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error!</h2>
        <p className="text-lg text-red-500">{error}</p>
        <p className="mt-4 text-gray-600">Please ensure you have a valid and active QR code link.</p>
      </div>
    );
  }

  // Format time left for display (e.g., "4:59")
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTimeLeft = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900 max-w-6xl mx-auto">
      <AnimatePresence>
        {/* Render popup message if it exists */}
        {popupMessage && <SuccessPopup message={popupMessage} type={popupType} />}
      </AnimatePresence>

      {/* Header section displaying period details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Department", value: periodData?.department, icon: "🏢" },
          { label: "Section", value: periodData?.section, icon: "📚" },
          { label: "Year", value: periodData?.year, icon: "🎓" },
          { label: "Semester", value: periodData?.semester, icon: "🗓️" },
          { label: "Subject", value: periodData?.subject, icon: "📖" },
          { label: "Faculty", value: periodData?.facultyName, icon: "👩‍🏫" },
          { label: "Period", value: periodData?.period, icon: "⏰" },
          { label: "Block", value: periodData?.block, icon: "🏫" },
          { label: "Room", value: periodData?.room, icon: "🚪" },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex items-center gap-4 bg-white shadow-sm border border-gray-200 rounded-xl p-5 hover:shadow-md transition duration-300"
          >
            <div className="text-2xl">{icon}</div>
            <div>
              <div className="text-sm text-gray-500">{label}</div>
              <div className="text-base font-semibold text-gray-800">{value || "N/A"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Section displaying QR Code status and countdown timer */}
      <div className={`mb-6 p-4 rounded-xl text-center font-semibold ${isExpired ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
        {isExpired ? (
          <p>This QR Code is <span className="uppercase font-extrabold">EXPIRED</span>.</p>
        ) : (
          <p>QR Code Status: <span className="uppercase font-extrabold">ACTIVE</span> | Time Left: {formattedTimeLeft}</p>
        )}
      </div>

      {/* Main steps for attendance verification */}
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
          Attendance Verification Steps
        </h2>

        {/* Stepper UI visually indicating progress */}
        <div className="flex justify-between mb-8 max-w-3xl mx-auto">
          {/* Step 1: Verify Location */}
          <div className="flex-1 text-center relative">
            <div
              className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                locationVerified ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-600"
              }`}
            >
              1
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                locationVerified ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Verify Location
            </p>
            {/* Connecting line for stepper */}
            <div
              className={`absolute top-5 right-0 h-1 w-full bg-gray-300 ${
                locationVerified ? "bg-indigo-600" : ""
              }`}
              style={{ width: "100%", left: "50%", transform: "translateX(50%)" }}
            />
          </div>

          {/* Step 2: Verify Face */}
          <div className="flex-1 text-center relative">
            <div
              className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                faceVerified
                  ? "bg-indigo-600 text-white"
                  : locationVerified // Highlight if previous step is done
                  ? "bg-indigo-300 text-indigo-900"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              2
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                faceVerified
                  ? "text-indigo-600"
                  : locationVerified
                  ? "texst-indigo-800"
                  : "text-gray-500"
              }`}
            >
              Verify Face
            </p>
            {/* Connecting line for stepper */}
            <div
              className={`absolute top-5 right-0 h-1 w-full bg-gray-300 ${
                faceVerified ? "bg-indigo-600" : ""
              }`}
              style={{ width: "100%", left: "50%", transform: "translateX(50%)" }}
            />
          </div>

          {/* Step 3: Success */}
          <div className="flex-1 text-center">
            <div
              className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center ${
                showSuccess ? "bg-indigo-600 text-white" : "bg-gray-300 text-gray-600"
              }`}
            >
              3
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                showSuccess ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              Success
            </p>
          </div>
        </div>

        {/* Action Buttons & Video Stream */}
        <div className="max-w-3xl mx-auto text-center">
          {/* "Verify Location" button - shown only if not expired and not yet location verified */}
          {!locationVerified && (
            <motion.button
              onClick={verifyLocation}
              disabled={isExpired || loading} // Disable button if QR code is expired or data is still loading
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`mt-6 w-full sm:w-auto px-8 py-3 rounded-lg font-semibold shadow-md transition duration-200
                ${isExpired || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                }`}
            >
              📍 Verify Location to Start Camera
            </motion.button>
          )}

          {/* Camera preview area and face recognition results - shown only after location is verified, not expired, and before final success */}
          {locationVerified && !faceVerified && !showSuccess && !isExpired && (
            <>
              {/* Camera preview area */}
              <div className="relative mt-6">
                <video
                  ref={videoRef}
                  width="320"
                  height="240"
                  className="rounded-lg border mx-auto mb-4 shadow-md bg-gray-200 object-cover" // Added bg-gray for visibility
                  autoPlay
                  muted
                  playsInline
                />
                {/* Optional: Add a general status/instruction message over video */}
                {!faceRecognitionResult && !error && !isProcessingFace && (
                  <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-white text-sm py-1 rounded-b-lg">
                    Position your face in front of the camera.
                  </div>
                )}
                  {isProcessingFace && (
                  <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-white text-sm py-1 rounded-b-lg">
                    Scanning...
                  </div>
                )}
              </div>

              {/* Display recognition results */}
              {faceRecognitionResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className={`mb-2 font-medium ${
                      faceRecognitionResult.status === "Spoof attempt detected" ? "text-red-600" :
                      faceRecognitionResult.status === "Attendance marked" ? "text-green-600" : "text-gray-600"
                    }`}>
                      {faceRecognitionResult.status || "Processing..."}
                    </div>
                    {faceRecognitionResult.rollNumber && (
                      <div className="text-lg font-bold text-gray-800">
                        Roll Number: {faceRecognitionResult.rollNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Message if QR is expired and no success */}
          {isExpired && !showSuccess && (
            <div className="bg-red-100 border border-red-400 text-red-800 p-6 rounded-xl shadow-md mt-6">
              <h3 className="text-xl font-bold mb-4">QR Code Expired</h3>
              <p>This QR code has expired. Please request a new one from the faculty.</p>
            </div>
          )}

          {/* Attendance marked success message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-green-100 border border-green-400 text-green-800 p-6 rounded-xl shadow-md mt-6"
            >
              <h3 className="text-xl font-bold mb-4">✅ Attendance Marked Successfully!</h3>
              <div className="space-y-1 text-left text-gray-700">
                <p><strong>Roll Number:</strong> {identifiedStudentRollNumber || "N/A"} </p>
                {/* Use markedAttendanceDetails for session-specific info */}
                <p><strong>Subject:</strong> {markedAttendanceDetails?.subject || "N/A"}</p>
                <p><strong>Department:</strong> {markedAttendanceDetails?.department || "N/A"}</p>
                <p><strong>Semester:</strong> {markedAttendanceDetails?.semester || "N/A"}</p>
                <p><strong>Faculty Name:</strong> {markedAttendanceDetails?.facultyName || "N/A"}</p>
                <p><strong>Period:</strong> {markedAttendanceDetails?.period || "N/A"}</p>
              </div>
              <p className="mt-4 text-sm italic text-gray-600">
                Thank you for verifying your attendance.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAttendancePage;