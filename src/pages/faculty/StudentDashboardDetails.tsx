import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, BarChart2, Calendar, Book, Download, UserCheck, UserX, Clock } from 'lucide-react'; // Icons

// Importing jsPDF and html2canvas via CDN for direct use in Canvas
// Make sure these are properly installed in your local project:
// npm install jspdf html2canvas
// or yarn add jspdf html2canvas
// For Canvas environment, we'll assume global availability or load them via script tags if needed in a full HTML immersive.
// For React, you would typically import them: import jsPDF from 'jspdf'; import html2canvas from 'html2canvas';

// Define the structure of the Student data received from the backend
export interface SubjectAttendance {
    subject: string;
    overall: number; // Overall percentage for this subject
    weekly: { [key: string]: number }; // Week (e.g., "Week (May 20-May 26)"): Percentage
    monthly: { [key: string]: number }; // Month (e.g., "May 2024"): Percentage
    daily: { [key: string]: 0 | 1 }; // Date (YYYY-MM-DD): 1 (Present) or 0 (Absent)
}

export interface Student {
    id: string; // Ensure id field is present if your backend sends it
    name: string;
    email: string;
    rollNumber: string;
    department: string; // Corrected: Explicitly 'department'
    year: string; // Added: Assuming 'year' is part of the student object
    semester: string;
    section: string;
    phone?: string; // Optional
    faceImage?: string | null; // Optional
    overallAttendancePercentage: number;
    weeklyOverallAttendance: { [key: string]: number }; // Week name: Percentage
    monthlyOverallAttendance: { [key: string]: number }; // Month name: Percentage
    dailyOverallAttendance: { [key: string]: number }; // Date (YYYY-MM-DD): Percentage
    attendance: SubjectAttendance[]; // Array of subject-wise attendance objects
}

interface StudentDashboardDetailsProps {
    rollNumber: string; // We'll pass the roll number to fetch data
    onBack: () => void;
}

const StudentDashboardDetails: React.FC<StudentDashboardDetailsProps> = ({ rollNumber, onBack }) => {
    // --- ALL HOOKS MUST BE DECLARED AT THE TOP LEVEL OF THE COMPONENT ---
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [subjectWiseView, setSubjectWiseView] = useState<'overall' | 'weekly' | 'monthly' | 'daily'>('overall');
    const [subjectFilter, setSubjectFilter] = useState<string>('All Subjects');

    const [currentOverallWeekIndex, setCurrentOverallWeekIndex] = useState<number>(0);
    const [currentOverallMonthIndex, setCurrentOverallMonthIndex] = useState<number>(0);
    const [currentOverallDayIndex, setCurrentOverallDayIndex] = useState<number>(0);

    const [currentSubjectPeriodIndex, setCurrentSubjectPeriodIndex] = useState<number>(0);

    // Ref for the content to be exported as PDF
    const contentRef = useRef<HTMLDivElement>(null);
    // --- END HOOKS DECLARATION ---


    // Fetch student data from the backend
    useEffect(() => {
        const fetchStudentData = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`http://localhost:5000/api/view/dashboard/student/${rollNumber}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data: Student = await response.json();
                setStudent(data);
            } catch (err: any) {
                console.error("Failed to fetch student data:", err);
                setError(`Failed to load student data. Please try again. Error: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (rollNumber) {
            fetchStudentData();
        }
    }, [rollNumber]);


    // Memoized lists of available periods based on backend data (dependent on 'student' state)
    const overallAvailableWeeks = useMemo(() => {
        if (!student) return [];
        return Object.keys(student.weeklyOverallAttendance || {}).sort((a, b) => {
            const getDateFromWeekString = (weekStr: string) => {
                const match = weekStr.match(/\(([^)]+)-/);
                const yearMatch = weekStr.match(/(\d{4})/);
                const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
                return match ? new Date(`${match[1].trim()} ${year}`) : new Date(0);
            };
            return getDateFromWeekString(a).getTime() - getDateFromWeekString(b).getTime();
        });
    }, [student]);

    const overallAvailableMonths = useMemo(() => {
        if (!student) return [];
        const months = Object.keys(student.monthlyOverallAttendance || {});
        return months.sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA.getTime() - dateB.getTime();
        });
    }, [student]);

    const overallAvailableDays = useMemo(() => {
        if (!student) return [];
        return Object.keys(student.dailyOverallAttendance || {}).sort();
    }, [student]);

    // Derive subjects for the filter dropdown (dependent on 'student' state)
    const subjects = useMemo(() => {
        if (!student) return ['All Subjects'];
        return ['All Subjects', ...new Set((student.attendance || []).map(att => att.subject))];
    }, [student]);

    // Memoized list of available periods for the subject-wise view (dynamic based on view type and filter)
    const availableSubjectPeriods = useMemo(() => {
        if (!student) return [];
        const periods = new Set<string>();
        const filteredSubjects = (student.attendance || []).filter(att =>
            subjectFilter === 'All Subjects' ? true : att.subject === subjectFilter
        );

        filteredSubjects.forEach(att => {
            if (subjectWiseView === 'weekly') {
                Object.keys(att.weekly || {}).forEach(week => periods.add(week));
            } else if (subjectWiseView === 'monthly') {
                Object.keys(att.monthly || {}).forEach(month => periods.add(month));
            } else if (subjectWiseView === 'daily') {
                Object.keys(att.daily || {}).forEach(date => periods.add(date));
            }
        });

        let sortedPeriods = Array.from(periods);

        if (subjectWiseView === 'monthly') {
            sortedPeriods.sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateA.getTime() - dateB.getTime();
            });
        }
        if (subjectWiseView === 'weekly') {
            sortedPeriods.sort((a, b) => {
                const getDateFromWeekString = (weekStr: string) => {
                    const match = weekStr.match(/\(([^)]+)-/);
                    const yearMatch = weekStr.match(/(\d{4})/);
                    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
                    return match ? new Date(`${match[1].trim()} ${year}`) : new Date(0);
                };
                return getDateFromWeekString(a).getTime() - getDateFromWeekString(b).getTime();
            });
        }
        return sortedPeriods;
    }, [subjectWiseView, student, subjectFilter]);

    // Effect to reset indices when student data or view/filter changes
    useEffect(() => {
        setCurrentOverallWeekIndex(overallAvailableWeeks.length > 0 ? 0 : 0);
        setCurrentOverallMonthIndex(overallAvailableMonths.length > 0 ? 0 : 0);
        setCurrentOverallDayIndex(overallAvailableDays.length > 0 ? 0 : 0);
        setCurrentSubjectPeriodIndex(0); // Reset for subject-wise period navigator
    }, [student, overallAvailableWeeks, overallAvailableMonths, overallAvailableDays, subjectWiseView, subjectFilter]);


    // Navigation handlers for overall attendance cards
    const navigateOverallWeek = useCallback((direction: 'prev' | 'next') => {
        setCurrentOverallWeekIndex(prev => {
            const newIndex = direction === 'prev' ? prev - 1 : prev + 1;
            return Math.max(0, Math.min(newIndex, overallAvailableWeeks.length - 1));
        });
    }, [overallAvailableWeeks.length]);

    const navigateOverallMonth = useCallback((direction: 'prev' | 'next') => {
        setCurrentOverallMonthIndex(prev => {
            const newIndex = direction === 'prev' ? prev - 1 : prev + 1;
            return Math.max(0, Math.min(newIndex, overallAvailableMonths.length - 1));
        });
    }, [overallAvailableMonths.length]);

    const navigateOverallDay = useCallback((direction: 'prev' | 'next') => {
        setCurrentOverallDayIndex(prev => {
            const newIndex = direction === 'prev' ? prev - 1 : prev + 1;
            return Math.max(0, Math.min(newIndex, overallAvailableDays.length - 1));
        });
    }, [overallAvailableDays.length]);

    // Navigation handler for subject-wise attendance periods
    const navigateSubjectPeriod = useCallback((direction: 'prev' | 'next') => {
        setCurrentSubjectPeriodIndex(prev => {
            const newIndex = direction === 'prev' ? prev - 1 : prev + 1;
            return Math.max(0, Math.min(newIndex, availableSubjectPeriods.length - 1));
        });
    }, [availableSubjectPeriods.length]);

    // Current period string for subject-wise navigation display
    const currentSubjectPeriod = availableSubjectPeriods[currentSubjectPeriodIndex] || 'N/A';

    // Export data to PDF function
    const handleExportData = async () => {
        if (!contentRef.current) {
            alert("Content to export not found.");
            return;
        }

        // Add loading indicator
        const originalExportButtonContent = document.getElementById('exportButton')?.innerHTML;
        const exportButton = document.getElementById('exportButton');
        if (exportButton) {
            exportButton.innerHTML = '<span class="flex items-center"><svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating PDF...</span>';
            exportButton.disabled = true;
        }

        try {
            // Load html2canvas and jspdf from CDN for Canvas environment
            // In your local project, you would import them as:
            // import html2canvas from 'html2canvas';
            // import jsPDF from 'jspdf';
            if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
                console.warn("html2canvas or jspdf not found. Loading from CDN...");
                await new Promise((resolve, reject) => {
                    const script1 = document.createElement('script');
                    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    script1.onload = () => {
                        const script2 = document.createElement('script');
                        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                        script2.onload = resolve;
                        script2.onerror = reject;
                        document.head.appendChild(script2);
                    };
                    script1.onerror = reject;
                    document.head.appendChild(script1);
                });
                console.log("html2canvas and jspdf loaded.");
            }

            const canvas = await window.html2canvas(contentRef.current, { scale: 2 }); // Increased scale for better resolution
            const imgData = canvas.toDataURL('image/png');
            const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`attendance_dashboard_${student?.rollNumber || 'student'}.pdf`);

            alert('PDF exported successfully!');
        } catch (err) {
            console.error('Error exporting PDF:', err);
            alert('Failed to export PDF. Please try again. If the issue persists, try a different browser or ensure content is fully visible.');
        } finally {
            // Restore button state
            if (exportButton && originalExportButtonContent) {
                exportButton.innerHTML = originalExportButtonContent;
                exportButton.disabled = false;
            }
        }
    };


    // Render logic for subject-wise attendance based on selected view and filter
    const renderSubjectWiseAttendance = () => {
        if (!student) return null; // Defensive check, though unlikely to be hit here

        const filteredAttendance = (student.attendance || []).filter(att =>
            subjectFilter === 'All Subjects' ? true : att.subject === subjectFilter
        );

        if (filteredAttendance.length === 0) {
            return <p className="text-gray-600 mt-4">No detailed attendance data available for the selected subject and view.</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {filteredAttendance.map((att, index) => (
                    <div key={att.subject} className="bg-white p-5 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
                        <div>
                            <h4 className="font-semibold text-lg text-gray-800 mb-2">{att.subject}</h4>
                            {subjectWiseView === 'overall' && (
                                <p className="text-gray-700">Overall: <span className="font-bold text-blue-700">{att.overall}%</span></p>
                            )}
                            {subjectWiseView === 'weekly' && (
                                <p className="text-gray-700">Weekly ({currentSubjectPeriod}): <span className="font-bold text-green-700">{att.weekly[currentSubjectPeriod] !== undefined ? `${att.weekly[currentSubjectPeriod]}%` : 'N/A'}</span></p>
                            )}
                            {subjectWiseView === 'monthly' && (
                                <p className="text-gray-700">Monthly ({currentSubjectPeriod}): <span className="font-bold text-purple-700">{att.monthly[currentSubjectPeriod] !== undefined ? `${att.monthly[currentSubjectPeriod]}%` : 'N/A'}</span></p>
                            )}
                            {subjectWiseView === 'daily' && (
                                <p className="text-gray-700">Daily ({currentSubjectPeriod}):
                                    <span className={`font-bold ml-1 ${att.daily[currentSubjectPeriod] === 1 ? 'text-green-700' : (att.daily[currentSubjectPeriod] === 0 ? 'text-red-700' : 'text-gray-500')}`}>
                                        {att.daily[currentSubjectPeriod] !== undefined ? (att.daily[currentSubjectPeriod] === 1 ? 'Present' : 'Absent') : 'N/A'}
                                        {att.daily[currentSubjectPeriod] === 1 ? <UserCheck size={16} className="inline ml-1 mb-0.5" /> : (att.daily[currentSubjectPeriod] === 0 ? <UserX size={16} className="inline ml-1 mb-0.5" /> : null)}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Handle loading, error, and no data states (these must come AFTER hook declarations)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg shadow-xl max-w-5xl mx-auto my-8 p-6">
                <p className="text-xl text-gray-700">Loading student dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] bg-red-100 rounded-lg shadow-xl max-w-5xl mx-auto my-8 p-6">
                <p className="text-xl text-red-600">{error}</p>
                <button
                    onClick={onBack}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                >
                    Go Back
                </button>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] bg-yellow-100 rounded-lg shadow-xl max-w-5xl mx-auto my-8 p-6">
                <p className="text-xl text-gray-700">Student not found or no data available for roll number: {rollNumber}.</p>
                <button
                    onClick={onBack}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div ref={contentRef} className="p-6 bg-gray-50 rounded-lg shadow-xl max-w-5xl mx-auto my-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition duration-200 font-medium"
                >
                    <ChevronLeft size={20} />
                    <span>Back to Student List</span>
                </button>
                <h2 className="text-3xl font-bold text-gray-800 flex-grow text-center">
                    Dashboard for {student.name} ({student.rollNumber})
                </h2>
                <button
                    id="exportButton" // Added ID for easier access in handleExportData
                    onClick={handleExportData}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 text-sm font-semibold shadow-md"
                    title="Export Data to PDF"
                >
                    <Download size={18} />
                    <span>Export PDF</span>
                </button>
            </div>

            {/* Overall Attendance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <BarChart2 size={36} className="mb-2" />
                    <p className="text-sm font-light">Overall Attendance</p>
                    <p className="text-4xl font-extrabold">{student.overallAttendancePercentage}%</p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-center w-full mb-2 -mt-2">
                        <button
                            onClick={() => navigateOverallWeek('prev')}
                            disabled={currentOverallWeekIndex === 0 || overallAvailableWeeks.length <= 1}
                            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-white mr-1"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <p className="text-sm font-light flex-grow text-center">
                            Weekly Overall ({overallAvailableWeeks[currentOverallWeekIndex] || 'N/A'})
                        </p>
                        <button
                            onClick={() => navigateOverallWeek('next')}
                            disabled={currentOverallWeekIndex === overallAvailableWeeks.length - 1 || overallAvailableWeeks.length <= 1}
                            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-white ml-1"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <Calendar size={36} className="mb-2" />
                    <p className="text-4xl font-extrabold">
                        {overallAvailableWeeks[currentOverallWeekIndex] !== undefined && student.weeklyOverallAttendance[overallAvailableWeeks[currentOverallWeekIndex]] !== undefined
                            ? `${student.weeklyOverallAttendance[overallAvailableWeeks[currentOverallWeekIndex]]}%`
                            : 'N/A'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-center w-full mb-2 -mt-2">
                        <button
                            onClick={() => navigateOverallMonth('prev')}
                            disabled={currentOverallMonthIndex === 0 || overallAvailableMonths.length <= 1}
                            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-white mr-1"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <p className="text-sm font-light flex-grow text-center">
                            Monthly Overall ({overallAvailableMonths[currentOverallMonthIndex] || 'N/A'})
                        </p>
                        <button
                            onClick={() => navigateOverallMonth('next')}
                            disabled={currentOverallMonthIndex === overallAvailableMonths.length - 1 || overallAvailableMonths.length <= 1}
                            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-white ml-1"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <Clock size={36} className="mb-2" />
                    <p className="text-4xl font-extrabold">
                        {overallAvailableMonths[currentOverallMonthIndex] !== undefined && student.monthlyOverallAttendance[overallAvailableMonths[currentOverallMonthIndex]] !== undefined
                            ? `${student.monthlyOverallAttendance[overallAvailableMonths[currentOverallMonthIndex]]}%`
                            : 'N/A'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center justify-center w-full mb-2 -mt-2">
                        <button
                            onClick={() => navigateOverallDay('prev')}
                            disabled={currentOverallDayIndex === 0 || overallAvailableDays.length <= 1}
                            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-white mr-1"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <p className="text-sm font-light flex-grow text-center">
                            Daily Overall ({overallAvailableDays[currentOverallDayIndex] || 'N/A'})
                        </p>
                        <button
                            onClick={() => navigateOverallDay('next')}
                            disabled={currentOverallDayIndex === overallAvailableDays.length - 1 || overallAvailableDays.length <= 1}
                            className="p-1 rounded-full bg-white bg-opacity-30 hover:bg-opacity-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-white ml-1"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <Book size={36} className="mb-2" />
                    <p className="text-4xl font-extrabold">
                        {overallAvailableDays[currentOverallDayIndex] !== undefined && student.dailyOverallAttendance[overallAvailableDays[currentOverallDayIndex]] !== undefined
                            ? `${student.dailyOverallAttendance[overallAvailableDays[currentOverallDayIndex]]}%`
                            : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Student Details and Subject-wise View Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="font-bold text-gray-800 text-xl mb-4">Student Details</h3>
                    <p className="text-gray-700 mb-2"><strong>Name:</strong> {student.name}</p>
                    <p className="text-gray-700 mb-2"><strong>Roll Number:</strong> {student.rollNumber}</p>
                    <p className="text-gray-700 mb-2"><strong>Department:</strong> {student.department}</p>
                    <p className="text-gray-700 mb-2"><strong>Year:</strong> {student.year}</p>
                    <p className="text-gray-700 mb-2"><strong>Semester:</strong> {student.semester}</p>
                    <p className="text-gray-700 mb-2"><strong>Section:</strong> {student.section}</p>
                    <p className="text-gray-700 mb-2"><strong>Email:</strong> {student.email}</p>
                    <p className="text-gray-700 mb-2"><strong>Phone:</strong> {student.phone || 'N/A'}</p>
                    {student.faceImage && (
                        <div className="mt-4 flex flex-col items-center">
                            <h4 className="font-semibold text-gray-700 mb-2">Registered Face:</h4>
                            <img src={student.faceImage} alt="Student Face" className="w-32 h-32 object-cover rounded-full border-2 border-blue-300 shadow-md" />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="font-bold text-gray-800 text-xl mb-4">Subject-wise Attendance View & Filters</h3>
                    <div className="flex flex-wrap gap-3 mb-4">
                        <button
                            onClick={() => setSubjectWiseView('overall')}
                            className={`flex items-center space-x-1 px-5 py-2 rounded-full text-md font-medium transition duration-200 ease-in-out shadow-sm
                                ${subjectWiseView === 'overall' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <BarChart2 size={18} /> <span>Overall</span>
                        </button>
                        <button
                            onClick={() => setSubjectWiseView('weekly')}
                            className={`flex items-center space-x-1 px-5 py-2 rounded-full text-md font-medium transition duration-200 ease-in-out shadow-sm
                                ${subjectWiseView === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Calendar size={18} /> <span>Weekly</span>
                        </button>
                        <button
                            onClick={() => setSubjectWiseView('monthly')}
                            className={`flex items-center space-x-1 px-5 py-2 rounded-full text-md font-medium transition duration-200 ease-in-out shadow-sm
                                ${subjectWiseView === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Calendar size={18} /> <span>Monthly</span>
                        </button>
                        <button
                            onClick={() => setSubjectWiseView('daily')}
                            className={`flex items-center space-x-1 px-5 py-2 rounded-full text-md font-medium transition duration-200 ease-in-out shadow-sm
                                ${subjectWiseView === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <Clock size={18} /> <span>Daily</span>
                        </button>
                    </div>

                    {(subjectWiseView === 'weekly' || subjectWiseView === 'monthly' || subjectWiseView === 'daily') && availableSubjectPeriods.length > 0 && (
                        <div className="flex items-center justify-center space-x-4 mb-4 bg-gray-100 p-3 rounded-md shadow-inner">
                            <button
                                onClick={() => navigateSubjectPeriod('prev')}
                                disabled={currentSubjectPeriodIndex === 0}
                                className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-semibold text-lg text-gray-800">
                                {subjectWiseView === 'weekly' && `Week: ${currentSubjectPeriod}`}
                                {subjectWiseView === 'monthly' && `Month: ${currentSubjectPeriod}`}
                                {subjectWiseView === 'daily' && `Date: ${currentSubjectPeriod}`}
                            </span>
                            <button
                                onClick={() => navigateSubjectPeriod('next')}
                                disabled={currentSubjectPeriodIndex === availableSubjectPeriods.length - 1}
                                className="p-2 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                    {(subjectWiseView !== 'overall' && availableSubjectPeriods.length === 0) && (
                        <p className="text-gray-600 text-sm mt-2">No periods available for this view. Ensure attendance data includes these timeframes.</p>
                    )}

                    <div className="mb-4">
                        <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Subject:</label>
                        <select
                            id="subjectFilter"
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t pt-6 border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Subject-wise Attendance Details ({subjectWiseView.charAt(0).toUpperCase() + subjectWiseView.slice(1)})</h3>
                {renderSubjectWiseAttendance()}
            </div>
        </div>
    );
};

export default StudentDashboardDetails;
