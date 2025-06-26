// Project4.0/frontend/src/context/StudentContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the Student interface to match your JSON structure
export interface Student {
  id: string;
  rollNumber: string;
  email: string;
  branch: string; // Used for both Department and Branch in your current setup
  section: string;
  semester: string;
  phone: string;
}

// Define the shape of your context
interface StudentContextType {
  students: Student[];
  fetchStudents: () => Promise<void>;
  updateStudent: (id: string, updatedData: Partial<Student>) => Promise<boolean>;
}

// Create the context
const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Define the provider component
export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  // IMPORTANT: Set this to the URL where your Node.js backend is running
  const API_BASE_URL = 'http://localhost:5000/api/students';

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
      // You might want to set an error state here to show a message to the user
    }
  };

  // Function to update a student in the backend API
  const updateStudent = async (id: string, updatedData: Partial<Student>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT', // Use PUT for updates
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        // Read error message from backend if available
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
      }

      const result = await response.json();
      console.log('Student updated:', result);

      // Update the local state with the new data to reflect changes immediately
      setStudents(prevStudents =>
        prevStudents.map(student => (student.id === id ? { ...student, ...updatedData } : student))
      );
      return true; // Indicate successful update
    } catch (error: any) {
      console.error('Error updating student:', error);
      alert(`Failed to update student: ${error.message}`); // Show alert to user
      return false; // Indicate failed update
    }
  };

  // Fetch students when the provider component mounts
  useEffect(() => {
    fetchStudents();
  }, []); // Empty dependency array ensures it runs only once on mount

  const contextValue = {
    students,
    fetchStudents,
    updateStudent,
  };

  return (
    <StudentContext.Provider value={contextValue}>
      {children}
    </StudentContext.Provider>
  );
};

// Custom hook to consume the StudentContext
export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
};