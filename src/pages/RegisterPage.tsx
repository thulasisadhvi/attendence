import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Building, Calendar, Hash, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface StudentDetails {
  name: string;
  email: string;
  department: string;
  section: string;
  year: string;
  semister: string;
  rollNumber: string;
}

interface FormData {
  rollNumber: string;
  email: string;
  name: string;
  department: string;
  section: string;
  year: string;
  semister: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const [formData, setFormData] = useState<FormData>({
    rollNumber: '',
    email: '',
    name: '',
    department: '',
    section: '',
    year: '',
    semister: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [rollNumberError, setRollNumberError] = useState('');

  // Fetch student details when roll number changes
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (formData.rollNumber.trim().length < 3) {
        // Reset form fields when roll number is too short
        setFormData(prev => ({
          ...prev,
          email: '',
          name: '',
          department: '',
          section: '',
          year: '',
          semister: ''
        }));
        setRollNumberError('');
        return;
      }

      setFetchingDetails(true);
      setRollNumberError('');
      
      try {
        console.log('Fetching student details for roll number:', formData.rollNumber.trim());
        
        const response = await fetch(`http://localhost:5000/api/student/${formData.rollNumber.trim()}`);
        console.log('Student details response status:', response.status);
        
        if (response.ok) {
          const studentDetails: StudentDetails = await response.json();
          console.log('Student details fetched:', studentDetails);
          
          setFormData(prev => ({
            ...prev,
            email: studentDetails.email || '',
            name: studentDetails.name || '',
            department: studentDetails.department || '',
            section: studentDetails.section || '',
            year: studentDetails.year || '',
            semister: studentDetails.semister || ''
          }));
          setRollNumberError('');
        } else if (response.status === 404) {
          try {
            const errorData = await response.json();
            console.log('Student not found:', errorData);
            setRollNumberError(errorData.message || 'Student not found with this roll number');
          } catch {
            setRollNumberError('Student not found with this roll number');
          }
          // Clear auto-filled fields
          setFormData(prev => ({
            ...prev,
            email: '',
            name: '',
            department: '',
            section: '',
            year: '',
            semister: ''
          }));
        } else {
          try {
            const errorData = await response.json();
            console.log('Error response:', errorData);
            setRollNumberError(errorData.message || 'Error fetching student details');
          } catch {
            setRollNumberError('Error fetching student details');
          }
        }
      } catch (error) {
        console.error('Error fetching student details:', error);
        setRollNumberError('Network error. Please check if the server is running on port 5000.');
      } finally {
        setFetchingDetails(false);
      }
    };

    const timeoutId = setTimeout(fetchStudentDetails, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [formData.rollNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.rollNumber.trim() || !formData.password || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    if (rollNumberError) {
      setMessage({ type: 'error', text: 'Please enter a valid roll number' });
      return;
    }

    // Check if student details are loaded
    if (!formData.name || !formData.email) {
      setMessage({ type: 'error', text: 'Student details not loaded. Please check your roll number.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Sending registration request with data:', {
        rollNumber: formData.rollNumber.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      // Fixed endpoint - changed from /api/studentRoutes to /api/register or /api/students/register
      const response = await fetch('http://localhost:5000/api/student/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rollNumber: formData.rollNumber.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON, content-type:', contentType);
        const textResponse = await response.text();
        console.error('Response text:', textResponse);
        
        if (response.status === 404) {
          setMessage({ type: 'error', text: 'Registration endpoint not found. Please check your server configuration.' });
        } else {
          setMessage({ type: 'error', text: 'Server returned invalid response format.' });
        }
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        setMessage({ type: 'error', text: 'Invalid response from server' });
        return;
      }

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Registration successful! You can now login.' });
        // Reset form
        alert('Successfully Registered');
        setFormData({
          rollNumber: '',
          email: '',
          name: '',
          department: '',
          section: '',
          year: '',
          semister: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: data.message || `Registration failed (${response.status})` });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running on port 5000.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Student Registration</h2>
              <p className="text-gray-600">Create your student account</p>
            </div>

            {message.text && (
              <div className={`mt-4 p-4 rounded-md flex items-center ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {message.text}
              </div>
            )}

            <div className="mt-8 space-y-6">
              {/* Roll Number */}
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="rollNumber"
                    name="rollNumber"
                    type="text"
                    required
                    className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      rollNumberError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your roll number"
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                  />
                  {fetchingDetails && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                {rollNumberError && (
                  <p className="text-red-500 text-sm mt-1">{rollNumberError}</p>
                )}
              </div>

              {/* Auto-filled fields */}
              <div className="grid grid-cols-1 gap-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      value={formData.name}
                      readOnly
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      value={formData.email}
                      readOnly
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      id="department"
                      name="department"
                      type="text"
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      value={formData.department}
                      readOnly
                    />
                  </div>
                </div>

                {/* Section */}
                <div>
                  <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                    Section
                  </label>
                  <input
                    id="section"
                    name="section"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    value={formData.section}
                    readOnly
                  />
                </div>

                {/* Year and semister */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="year"
                        name="year"
                        type="text"
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        value={formData.year}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="semister" className="block text-sm font-medium text-gray-700 mb-1">
                      Semester
                    </label>
                    <input
                      id="semister"
                      name="semister"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                      value={formData.semister}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || fetchingDetails || !!rollNumberError}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  'Register'
                )}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in here
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};
export default RegisterPage;