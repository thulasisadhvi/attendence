import React, { useState, useMemo, useEffect } from 'react';
import { Search, Edit, Save, XCircle } from 'lucide-react';

// Define formOptions as provided
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
// 'branch' field has been completely removed
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

const StudentData: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const API_BASE_URL = 'http://localhost:5000/api/students';

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<Student>>({});

  // Function to fetch students from the backend API
  const fetchStudents = async () => {
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
      alert('Failed to fetch students. Please ensure the backend is running.');
    }
  };

  // Function to update student data via API
  const updateStudent = async (id: string, updatedFields: Partial<Student>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Try to read error message from backend
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || 'Unknown error'}`);
      }

      const responseData = await response.json(); // Backend should return an object like { message: ..., student: { ... } }

      // Update the students state with the new data received from the backend
      setStudents(prevStudents =>
        prevStudents.map(student => (student.id === id ? { ...student, ...responseData.student } : student))
      );
      alert('Student updated successfully!');
      return true; // Indicate success
    } catch (error) {
      console.error(`Error updating student with ID ${id}:`, error);
      alert(`Failed to update student: ${error instanceof Error ? error.message : String(error)}`);
      return false; // Indicate failure
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // States for filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [semesterFilter, setSemesterFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');

  // --- Dynamic Filter Options ---

  // Departments are static from formOptions
  const departments = useMemo(() => ['All', ...formOptions.departments], []);
  // Years are static from formOptions
  const years = useMemo(() => ['All', ...formOptions.years], []);

  // Semesters depend on the selected yearFilter
  const semesters = useMemo(() => {
    if (yearFilter !== 'All' && formOptions.semesters[yearFilter]) {
      return ['All', ...formOptions.semesters[yearFilter]];
    }
    // If no specific year is selected, show all possible semesters
    // This collects all unique semesters from all years
    return ['All', ...new Set(Object.values(formOptions.semesters).flat())];
  }, [yearFilter]); // Recalculate when yearFilter changes

  // Sections depend on the selected yearFilter AND departmentFilter
  const sections = useMemo(() => {
    if (yearFilter !== 'All' && departmentFilter !== 'All' &&
        formOptions.sections[yearFilter] && formOptions.sections[yearFilter][departmentFilter]) {
      return ['All', ...formOptions.sections[yearFilter][departmentFilter]];
    }
    // If filters are 'All' or combination is invalid, show all possible sections
    // This collects all unique sections from all years and departments
    return ['All', ...new Set(
      Object.values(formOptions.sections).flatMap(yearSections =>
        Object.values(yearSections).flat()
      )
    )];
  }, [yearFilter, departmentFilter]); // Recalculate when yearFilter or departmentFilter changes

  // --- Filter Change Handlers with Resets ---

  const handleDepartmentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDepartment = e.target.value;
    setDepartmentFilter(newDepartment);
    // Reset section filter when department changes, as its options depend on department
    setSectionFilter('All');
  };

  const handleYearFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    setYearFilter(newYear);
    // Reset semester and section filters when year changes, as their options depend on year
    setSemesterFilter('All');
    setSectionFilter('All');
  };

  const handleSemesterFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSemesterFilter(e.target.value);
  };

  const handleSectionFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSectionFilter(e.target.value);
  };

  // Filter students based on search term and applied filters
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

  // Handle starting edit mode for a student
  const handleEditClick = (student: Student) => {
    setEditingStudentId(student.id);
    setEditedData({
      rollNumber: student.rollNumber,
      name: student.name,
      email: student.email,
      department: student.department,
      section: student.section,
      semester: student.semester,
      phone: student.phone,
      year: student.year,
      // 'branch' initialization removed
    });
  };

  // Handle changes in input fields while editing
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle saving edited data
  const handleSaveClick = async (studentId: string) => {
    // Find the original student data to retain unchanged fields
    const originalStudent = students.find(s => s.id === studentId);

    // If for some reason original student isn't found, we can't proceed.
    if (!originalStudent) {
      alert('Original student data not found for saving.');
      return;
    }

    // Combine editedData with originalStudent data,
    // giving precedence to editedData for fields that were changed.
    // 'branch' is intentionally excluded here.
    const dataToSave: Partial<Student> = {
      rollNumber: editedData.rollNumber ?? originalStudent.rollNumber,
      name: editedData.name ?? originalStudent.name,
      email: editedData.email ?? originalStudent.email,
      department: editedData.department ?? originalStudent.department,
      year: editedData.year ?? originalStudent.year,
      section: editedData.section ?? originalStudent.section,
      semester: editedData.semester ?? originalStudent.semester,
      phone: editedData.phone ?? originalStudent.phone,
    };

    // Frontend Validation - NOW PERFORMING VALIDATION ON dataToSave
    // 'branch' has been removed from validation check and debugging logs
    if (!dataToSave.rollNumber || !dataToSave.name || !dataToSave.email || !dataToSave.department ||
        !dataToSave.year || !dataToSave.section || !dataToSave.semester || !dataToSave.phone) {
      alert('Please fill in all fields before saving.');

      // --- Further Debugging for missing fields ---
      const missingFields = [];
      if (!dataToSave.rollNumber) missingFields.push('rollNumber');
      if (!dataToSave.name) missingFields.push('name');
      if (!dataToSave.email) missingFields.push('email');
      if (!dataToSave.department) missingFields.push('department');
      if (!dataToSave.year) missingFields.push('year');
      if (!dataToSave.section) missingFields.push('section');
      if (!dataToSave.semester) missingFields.push('semester');
      if (!dataToSave.phone) missingFields.push('phone');
      console.error('Frontend validation failed. Missing/empty fields:', missingFields.join(', '));
      // --- End Further Debugging ---

      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(dataToSave.phone || '')) { // Validate against dataToSave.phone
      alert('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dataToSave.email || '')) { // Validate against dataToSave.email
      alert('Please enter a valid email address.');
      return;
    }

    const success = await updateStudent(studentId, dataToSave); // Pass the compiled dataToSave

    if (success) {
      setEditingStudentId(null);
      setEditedData({});
    }
  };

  // Handle canceling edit
  const handleCancelClick = () => {
    setEditingStudentId(null);
    setEditedData({});
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg mx-auto my-8">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">All Students Data</h2>

      {/* Search Bar */}
      <div className="mb-6 flex items-center bg-gray-100 rounded-lg p-3 shadow-sm">
        <Search size={20} className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search students (Roll No, Name, Email, Dept, Section, Sem, Phone)..."
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
            // Disable if no specific year is selected and only 'All' is available
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
            // Disable if no year or department is selected and only 'All' is available
            disabled={(yearFilter === 'All' || departmentFilter === 'All') && sections.length <= 1}
          >
            {sections.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      {/* --- End Filters Section --- */}

      {/* Student Data Table */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingStudentId === student.id ? (
                      <input
                        type="text"
                        name="rollNumber"
                        value={editedData.rollNumber || ''}
                        onChange={handleEditChange}
                        className="w-24 p-1 border border-gray-300 rounded-sm"
                      />
                    ) : (
                      student.rollNumber
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingStudentId === student.id ? (
                      <input
                        type="text"
                        name="name"
                        value={editedData.name || ''}
                        onChange={handleEditChange}
                        className="w-32 p-1 border border-gray-300 rounded-sm"
                      />
                    ) : (
                      student.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editingStudentId === student.id ? (
                      <input
                        type="email"
                        name="email"
                        value={editedData.email || ''}
                        onChange={handleEditChange}
                        className="w-40 p-1 border border-gray-300 rounded-sm"
                      />
                    ) : (
                      student.email
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editingStudentId === student.id ? (
                      // For department, year, semester, section, use select for better user experience
                      // and to ensure valid data from formOptions
                      <select
                        name="department"
                        value={editedData.department || ''}
                        onChange={handleEditChange}
                        className="w-24 p-1 border border-gray-300 rounded-sm"
                      >
                        {formOptions.departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    ) : (
                      student.department
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editingStudentId === student.id ? (
                      <select
                        name="year"
                        value={editedData.year || ''}
                        onChange={handleEditChange}
                        className="w-16 p-1 border border-gray-300 rounded-sm"
                      >
                        {formOptions.years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    ) : (
                      student.year
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editingStudentId === student.id ? (
                      <select
                        name="section"
                        value={editedData.section || ''}
                        onChange={handleEditChange}
                        className="w-16 p-1 border border-gray-300 rounded-sm"
                        disabled={!editedData.year || !editedData.department || !formOptions.sections[editedData.year]?.[editedData.department]}
                      >
                        {editedData.year && editedData.department && formOptions.sections[editedData.year]?.[editedData.department]?.map(section => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    ) : (
                      student.section
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editingStudentId === student.id ? (
                      <select
                        name="semester"
                        value={editedData.semester || ''}
                        onChange={handleEditChange}
                        className="w-16 p-1 border border-gray-300 rounded-sm"
                        disabled={!editedData.year || !formOptions.semesters[editedData.year]}
                      >
                        {editedData.year && formOptions.semesters[editedData.year]?.map(semester => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    ) : (
                      student.semester
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {editingStudentId === student.id ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editedData.phone || ''}
                        onChange={handleEditChange}
                        maxLength={10}
                        className="w-28 p-1 border border-gray-300 rounded-sm"
                      />
                    ) : (
                      student.phone
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingStudentId === student.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSaveClick(student.id)}
                          className="text-green-600 hover:text-green-900 transition duration-200"
                          title="Save"
                        >
                          <Save size={18} />
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="text-red-600 hover:text-red-900 transition duration-200"
                          title="Cancel"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(student)}
                        className="text-blue-600 hover:text-blue-900 transition duration-200"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 text-lg mt-10">No students registered yet or found matching your search.</p>
      )}
    </div>
  );
};

export default StudentData;
