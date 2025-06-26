// StudentAttendance.tsx
import React, { useState, useMemo, useEffect } from 'react';
import StudentDashboardDetails from './StudentDashboardDetails'; // Import the new component
import { Search, ArrowLeft, Clock, AlertTriangle } from 'lucide-react'; // Icons - Added Clock, AlertTriangle
import Navbar from '../../components/Navbar'; // Import Navbar
import Footer from '../../components/Footer'; // Import Footer
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../../context/AuthContext'; // Import useAuth

// Define formOptions as provided (assuming it's accessible or passed as prop/context)
const formOptions = {
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
    }
};

// Define the Student interface to match your JSON structure
// This should be consistent across all components handling student data
export interface Student {
    id: string;
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    year: string;
    section: string;
    semester: string;
    phone: string;
    password?: string;
    role?: string;
}

const StudentAttendance: React.FC = () => {
    // State to store student data, similar to StudentData.tsx
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState<boolean>(true); // Renamed for clarity
    const [studentsError, setStudentsError] = useState<string | null>(null); // Renamed for clarity
    const API_BASE_URL = 'http://localhost:5000/api/students'; // Your backend API endpoint

    const { user, isLoggedIn, isLoading, error: authError } = useAuth(); // Get auth state
    const navigate = useNavigate();

    // Function to fetch students from the backend API, similar to StudentData.tsx
    const fetchStudents = async () => {
        setLoadingStudents(true);
        setStudentsError(null);
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: Student[] = await response.json();
            setStudents(data);
            console.log('Students fetched:', data);
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudentsError('Failed to fetch students. Please ensure the backend is running and you have proper access.');
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };

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

        // If not logged in OR not a faculty user, redirect to login
        if (!isLoggedIn || !user || user.role !== 'faculty') {
            alert('You do not have permission to view this page. Please log in as a faculty member.');
            navigate('/login'); // Redirect to login page
            return;
        }

        // If authenticated as faculty, proceed to fetch data
        fetchStudents();

    }, [isLoggedIn, isLoading, user, navigate, authError]); // Depend on auth state changes


    // State for filters
    const [departmentFilter, setDepartmentFilter] = useState<string>('All');
    const [yearFilter, setYearFilter] = useState<string>('All');
    const [semesterFilter, setSemesterFilter] = useState<string>('All');
    const [sectionFilter, setSectionFilter] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // State to manage showing student dashboard details
    const [selectedStudentRollNumber, setSelectedStudentRollNumber] = useState<string | null>(null);

    // --- Dynamic Filter Options (similar to StudentData) ---
    const departments = useMemo(() => ['All', ...formOptions.departments], []);
    const years = useMemo(() => ['All', ...formOptions.years], []);

    const semesters = useMemo(() => {
        if (yearFilter !== 'All' && formOptions.semesters[yearFilter as keyof typeof formOptions.semesters]) {
            return ['All', ...formOptions.semesters[yearFilter as keyof typeof formOptions.semesters]];
        }
        return ['All', ...new Set(Object.values(formOptions.semesters).flat())];
    }, [yearFilter]);

    const sections = useMemo(() => {
        if (yearFilter !== 'All' && departmentFilter !== 'All' &&
            formOptions.sections[yearFilter as keyof typeof formOptions.sections] &&
            formOptions.sections[yearFilter as keyof typeof formOptions.sections][departmentFilter as keyof (typeof formOptions.sections)[keyof typeof formOptions.sections]]) {
            return ['All', ...formOptions.sections[yearFilter as keyof typeof formOptions.sections][departmentFilter as keyof (typeof formOptions.sections)[keyof typeof formOptions.sections]]];
        }
        return ['All', ...new Set(
            Object.values(formOptions.sections).flatMap(yearSections =>
                Object.values(yearSections).flat()
            )
        )];
    }, [yearFilter, departmentFilter]);

    // --- Filter Change Handlers with Resets (similar to StudentData) ---
    const handleDepartmentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDepartment = e.target.value;
        setDepartmentFilter(newDepartment);
        setSectionFilter('All'); // Reset section when department changes
    };

    const handleYearFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = e.target.value;
        setYearFilter(newYear);
        setSemesterFilter('All'); // Reset semester when year changes
        setSectionFilter('All');  // Reset section when year changes
    };

    const handleSemesterFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSemesterFilter(e.target.value);
    };

    const handleSectionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSectionFilter(e.target.value);
    };

    // Filter and search students based on applied filters and search term
    const filteredStudents = useMemo(() => {
        let tempStudents = students;

        if (departmentFilter !== 'All') {
            tempStudents = tempStudents.filter(s => s.department === departmentFilter);
        }
        if (yearFilter !== 'All') {
            tempStudents = tempStudents.filter(s => s.year === yearFilter);
        }
        if (semesterFilter !== 'All') {
            tempStudents = tempStudents.filter(s => s.semester === semesterFilter);
        }
        if (sectionFilter !== 'All') {
            tempStudents = tempStudents.filter(s => s.section === sectionFilter);
        }

        if (searchTerm) {
            tempStudents = tempStudents.filter(s =>
                s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.phone.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return tempStudents;
    }, [students, searchTerm, departmentFilter, yearFilter, semesterFilter, sectionFilter]);

    // If a student is selected, show their dashboard details
    if (selectedStudentRollNumber) {
        return (
            <StudentDashboardDetails
                rollNumber={selectedStudentRollNumber}
                onBack={() => setSelectedStudentRollNumber(null)}
            />
        );
    }

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
    if (loadingStudents) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto p-6 text-center mt-20 text-gray-700">
                    <div className="flex items-center justify-center gap-2">
                        <Clock className="animate-spin text-blue-500" size={24} /> Loading student data...
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (studentsError) {
        return (
            <>
                <Navbar />
                <div className="container mx-auto p-6 text-center mt-20">
                    <div className="text-red-600 text-lg flex items-center justify-center gap-2 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="w-6 h-6" /> {studentsError}
                    </div>
                </div>
                <Footer />
            </>
        );
    }


    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto p-6 lg:p-10 max-w-full xl:max-w-screen-xl">
                <div className="p-6 bg-white rounded-lg shadow-lg mx-auto my-8 relative"> {/* Added relative for positioning */}
                    {/* Back Button */}
                    <div className="absolute top-4 left-4"> {/* Positioned at top-left */}
                        <button
                            onClick={() => window.history.back()} // Go back to the previous page in history
                            className="flex items-center text-blue-600 hover:text-blue-800 transition duration-200"
                        >
                            <ArrowLeft size={20} className="mr-1" />
                            Back
                        </button>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8 mt-4">Student Attendance Records</h2> {/* Added mt-4 for spacing */}

                    {/* Search Bar */}
                    <div className="mb-6 flex items-center bg-gray-100 rounded-lg p-3 shadow-sm">
                        <Search size={20} className="text-gray-500 mr-2" />
                        <input
                            type="text"
                            placeholder="Search by Roll No, Name, Email, Dept, Section, Sem, Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 bg-transparent outline-none border-none text-gray-800 placeholder-gray-500"
                        />
                    </div>

                    {/* --- Filters Section --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-blue-50 rounded-lg shadow-inner">
                        {/* Department Filter */}
                        <div className="flex flex-col">
                            <label htmlFor="departmentFilter" className="text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select
                                id="departmentFilter"
                                value={departmentFilter}
                                onChange={handleDepartmentFilterChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {departments.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year Filter */}
                        <div className="flex flex-col">
                            <label htmlFor="yearFilter" className="text-sm font-medium text-gray-700 mb-1">Year</label>
                            <select
                                id="yearFilter"
                                value={yearFilter}
                                onChange={handleYearFilterChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                {years.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* Semester Filter (Dynamically populated) */}
                        <div className="flex flex-col">
                            <label htmlFor="semesterFilter" className="text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <select
                                id="semesterFilter"
                                value={semesterFilter}
                                onChange={handleSemesterFilterChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                disabled={yearFilter === 'All' && semesters.length <= 1}
                            >
                                {semesters.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        {/* Section Filter (Dynamically populated) */}
                        <div className="flex flex-col">
                            <label htmlFor="sectionFilter" className="text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select
                                id="sectionFilter"
                                value={sectionFilter}
                                onChange={handleSectionFilterChange}
                                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                disabled={(yearFilter === 'All' || departmentFilter === 'All') && sections.length <= 1}
                            >
                                {sections.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* --- End Filters Section --- */}

                    {/* Student Attendance Table */}
                    {filteredStudents.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg shadow-md">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.rollNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.year}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.section}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.semester}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => setSelectedStudentRollNumber(student.rollNumber)}
                                                    className="text-blue-600 hover:text-blue-900 transition duration-200 hover:underline"
                                                >
                                                    View Dashboard
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-gray-600 text-lg mt-10">No students found matching your criteria.</p>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default StudentAttendance;