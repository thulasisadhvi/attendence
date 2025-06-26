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
  block?: string;
  room?: string;
  period?: string;
  facultyName?: string;
  token?: string;
  timestamp?: string;
  status?: string; // 'active' or 'expired' - this comes directly from the backend
  timeLeftSeconds?: number; // Time left in seconds, calculated and sent by backend
}

// Define the type for the expected result from your face recognition backend
interface RecognitionResult {
  status: string;
  rollNumber?: string; // Backend returns 'rollNumber'
  // Add other properties if your backend returns more data
  // confidence?: number;
}

// Reusable popup component for success messages
const SuccessPopup: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.4 }}
    className="fixed top-6 right-6 z-50 bg-green-100 border border-green-500 text-green-800 px-6 py-3 rounded-xl shadow-lg"
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
  const [error, setError] = useState<string | null>(null); // Stores error messages
  const [isExpired, setIsExpired] = useState<boolean>(false); // True if QR code is expired
  const [timeLeft, setTimeLeft] = useState<number>(0); // Remaining time for active QR code

  const videoRef = useRef<HTMLVideoElement>(null); // Ref for the video element
  const streamRef = useRef<MediaStream | null>(null); // Ref for the camera stream
  const recognitionIntervalRef = useRef<number | null>(null); // Ref for the recognition interval

  // States for verification steps
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false); // Indicates if face recognition was successful for attendance
  const [showSuccess, setShowSuccess] = useState(false); // Final attendance marked success message

  const [isProcessingFace, setIsProcessingFace] = useState<boolean>(false); // To show processing state for face recognition
  const [faceRecognitionResult, setFaceRecognitionResult] = useState<RecognitionResult | null>(null); // Stores the result from face recognition backend

  // State for transient popup messages
  const [popupMessage, setPopupMessage] = useState("");

  // Function to show a popup message for 3 seconds
  const showPopup = (message: string) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 3000);
  };

  // --- Start: Face Recognition Logic (adapted from Demo component) ---

  const startCamera = async () => {
    setError(null); // Clear any previous errors
    setFaceRecognitionResult(null); // Clear previous recognition results
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
      // If camera fails to start, we can't proceed with face verification
      setFaceVerified(false);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current);
      recognitionIntervalRef.current = null;
    }
    setFaceRecognitionResult(null); // Clear results on stop
    setIsProcessingFace(false); // Stop any processing indication
  }, []);

  const autoCaptureAndRecognize = useCallback(async () => {
    // Stop if QR code is expired, no video stream, or if already processing
    if (isExpired || !videoRef.current || !streamRef.current || isProcessingFace) {
      return;
    }

    // If face is already verified and attendance marked, stop the camera and recognition
    if (faceVerified && showSuccess) {
      stopCamera();
      return;
    }

    setIsProcessingFace(true); // Indicate that processing has started

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get 2D canvas context.");
      setIsProcessingFace(false);
      return;
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          console.warn("Canvas toBlob failed: No blob created.");
          setIsProcessingFace(false);
          return;
        }

        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");
        // Append the token obtained from the URL
        if (token) {
          formData.append("token", token);
        }

        try {
          // Send image and token to your face recognition backend
          const response = await fetch("http://localhost:8000/recognize", {
            method: "POST",
            body: formData,
          });

          console.log("➡ Backend Response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }

          const data: RecognitionResult = await response.json();
          setFaceRecognitionResult(data); // Store the recognition result
          setError(null); // Clear any previous errors if a valid response comes

          if (data.status === "Spoof attempt detected") {
            setError("⚠ Spoof attempt detected. Access denied.");
            showPopup("⚠ Spoof attempt detected!");
          } else if (data.status === "Attendance marked") {
            setFaceVerified(true); // Mark face as verified
            setShowSuccess(true); // Show the final success message
            showPopup("😊 Face verified & Attendance marked successfully!");
            stopCamera(); // Stop camera and recognition after successful attendance
          } else if (data.status === "No face detected" || data.status === "Multiple faces detected") {
            // Do not set a persistent error, just update the result display
          }
        } catch (err: any) {
          console.error("Backend communication error:", err);
          setError(`⚠ Backend error during face recognition: ${err.message}`);
        } finally {
          setIsProcessingFace(false); // Mark processing as complete
        }
      },
      "image/jpeg",
      0.8 // JPEG quality
    );
  }, [isExpired, isProcessingFace, token, faceVerified, showSuccess, stopCamera]); // Dependencies for useCallback

  // Effect to set up/tear down the auto-capture interval
  useEffect(() => {
    // Only start auto-capture if location is verified and face is not yet verified, and camera isn't expired
    if (locationVerified && !faceVerified && !isExpired) {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current); // Clear any existing interval
      }
      recognitionIntervalRef.current = window.setInterval(autoCaptureAndRecognize, 1500); // Capture every 1.5 seconds
    } else if (recognitionIntervalRef.current) {
      clearInterval(recognitionIntervalRef.current); // Clear interval if conditions are no longer met
      recognitionIntervalRef.current = null;
    }

    // Cleanup function: clear the interval when the component unmounts or dependencies change
    return () => {
      if (recognitionIntervalRef.current) {
        clearInterval(recognitionIntervalRef.current);
        recognitionIntervalRef.current = null;
      }
    };
  }, [locationVerified, faceVerified, isExpired, autoCaptureAndRecognize]);

  // --- End: Face Recognition Logic ---

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
          `http://localhost:5000/api/period?token=${token}`
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
        setIsExpired(true);
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
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          setError("This QR Code has just expired! Please ask the faculty to regenerate.");
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isExpired, periodData]);

  // Function to handle location verification
  const verifyLocation = () => {
    if (isExpired) {
      showPopup("Cannot verify location: QR Code has expired.");
      return;
    }
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser. Please use a compatible browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location verified:", position.coords);
        setLocationVerified(true);
        showPopup("📍 Location verified successfully!");
        startCamera(); // Start camera immediately after location is verified
      },
      (geoError) => {
        let errorMessage = "Location permission denied or error occurred. Please allow location access.";
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable location services for your browser/device.";
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMessage = "Location information is unavailable. Please try again later.";
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMessage = "Request for user location timed out. Please check your connection.";
        }
        alert(errorMessage);
        console.error("Geolocation error:", geoError);
        setError(errorMessage); // Set a general error for location failure
      }
    );
  };

  // Destructure periodData for easier access (defaults to empty object if null during initial load)
  const {
    department,
    section,
    year,
    semester,
    subject,
    facultyName,
    period,
    block,
    room,
  } = periodData || {};

  // Display loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-indigo-700 text-xl font-semibold">
        Loading attendance details...
      </div>
    );
  }

  // Display error state (e.g., no token, token not found, expired)
  if (error && !showSuccess) { // Only show error if no final success message is displayed
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
        {popupMessage && <SuccessPopup message={popupMessage} />}
      </AnimatePresence>

      {/* Header section displaying period details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Department", value: department, icon: "🏢" },
          { label: "Section", value: section, icon: "📚" },
          { label: "Year", value: year, icon: "🎓" },
          { label: "Semester", value: semester, icon: "🗓️" },
          { label: "Subject", value: subject, icon: "📖" },
          { label: "Faculty", value: facultyName, icon: "👩‍🏫" },
          { label: "Period", value: period, icon: "⏰" },
          { label: "Block", value: block, icon: "🏫" },
          { label: "Room", value: room, icon: "🚪" },
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
                  ? "text-indigo-800"
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
          {!locationVerified && (
            <button
              onClick={verifyLocation}
              disabled={isExpired} // Disable button if QR code is expired
              className={`px-8 py-3 rounded-lg font-semibold shadow-md transition duration-300 ${isExpired ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              📍 Verify Location
            </button>
          )}

          {locationVerified && !faceVerified && !showSuccess && (
            <>
              {/* Camera preview area */}
              <div className="relative">
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
                <p><strong>Student Name:</strong> {faceRecognitionResult?.rollNumber ? `Student with Roll No. ${faceRecognitionResult.rollNumber}` : "Recognized Student"} </p>
                <p><strong>Subject:</strong> {subject || "N/A"}</p>
                <p><strong>Department:</strong> {department || "N/A"}</p>
                <p><strong>Semester:</strong> {semester || "N/A"}</p>
                <p><strong>Faculty Name:</strong> {facultyName || "N/A"}</p>
                <p><strong>Period:</strong> {period || "N/A"}</p>
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