import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Calendar, User, Clock } from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { mockAttendanceSessions, mockStudents } from '../../utils/mockData';
import { Student } from '../../utils/types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ViewAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'sessions'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Redirect if no user or not faculty
  if (!user || user.role !== 'faculty') {
    window.location.href = '/login';
    return null;
  }
  
  useEffect(() => {
    let result = [...mockStudents];
    
    if (searchTerm) {
      result = result.filter(
        student => 
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterDepartment) {
      result = result.filter(
        student => student.department === filterDepartment
      );
    }
    
    setFilteredStudents(result);
  }, [searchTerm, filterDepartment]);
  
  const departments = Array.from(new Set(mockStudents.map(student => student.department)));
  
  // Chart data for attendance trends
  const attendanceChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Average Attendance',
        data: [78, 82, 85, 76, 90, 86, 88, 89],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Attendance Trends',
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: function(value: any) {
            return value + '%';
          }
        }
      }
    }
  };
  
  // Departmental attendance data
  const departmentalData = {
    labels: departments,
    datasets: [
      {
        label: 'Average Attendance by Department',
        data: [87, 81, 92, 78, 85],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(14, 165, 233, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(168, 85, 247, 0.7)',
        ],
      },
    ],
  };
  
  // Student-specific data when a student is selected
  const studentAttendanceData = selectedStudent ? {
    labels: ['Data Structures', 'Algorithms', 'Database Systems', 'Computer Networks', 'Operating Systems'],
    datasets: [
      {
        label: 'Attendance Percentage',
        data: [95, 87, 100, 75, 90],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
    ],
  } : null;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  Attendance Records
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  View and analyze student attendance data
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <button className="btn btn-outline flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </motion.div>

          {/* Attendance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Attendance Overview
              </h3>
              <div className="h-64">
                <Line data={attendanceChartData} options={chartOptions} />
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="sm:hidden">
              <label htmlFor="tabs" className="sr-only">
                Select a tab
              </label>
              <select
                id="tabs"
                name="tabs"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as 'students' | 'sessions')}
              >
                <option value="students">Students</option>
                <option value="sessions">Sessions</option>
              </select>
            </div>
            <div className="hidden sm:block">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`${
                      activeTab === 'students'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className={`${
                      activeTab === 'sessions'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Sessions
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="mt-8">
            {activeTab === 'students' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Search and filters */}
                <div className="flex flex-col sm:flex-row justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="flex-1 max-w-md relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name or roll number"
                      className="input-field pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 max-w-xs relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Filter className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <select
                      className="input-field pl-10"
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept, index) => (
                        <option key={index} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Students Table */}
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll Number
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student, index) => (
                        <tr 
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="font-medium text-indigo-800">{student.name.charAt(0)}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.rollNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px]">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    student.attendancePercentage >= 85 
                                      ? 'bg-green-600' 
                                      : student.attendancePercentage >= 75 
                                      ? 'bg-yellow-500'
                                      : 'bg-red-600'
                                  }`}
                                  style={{ width: `${student.attendancePercentage}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium ${
                                student.attendancePercentage >= 85 
                                  ? 'text-green-800' 
                                  : student.attendancePercentage >= 75 
                                  ? 'text-yellow-800'
                                  : 'text-red-800'
                              }`}>
                                {student.attendancePercentage}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Departmental Chart */}
                <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Department-wise Attendance
                    </h3>
                    <div className="h-64">
                      <Bar 
                        data={departmentalData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            title: {
                              display: false,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              max: 100,
                              ticks: {
                                callback: function(value: any) {
                                  return value + '%';
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Student Detail Modal */}
                {selectedStudent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 overflow-y-auto z-50"
                  >
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedStudent(null)}></div>
                      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="font-medium text-xl text-indigo-800">{selectedStudent.name.charAt(0)}</span>
                              </div>
                              <div className="ml-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                  {selectedStudent.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {selectedStudent.rollNumber} • {selectedStudent.department}
                                </p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                              onClick={() => setSelectedStudent(null)}
                            >
                              <span className="sr-only">Close</span>
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                              Attendance Details
                            </h4>
                            <div className="bg-indigo-50 rounded-lg p-4 flex justify-between items-center mb-6">
                              <div>
                                <p className="text-sm text-gray-500">Overall Attendance</p>
                                <p className="text-2xl font-bold text-indigo-700">{selectedStudent.attendancePercentage}%</p>
                              </div>
                              <div className={`text-sm px-3 py-1 rounded-full font-medium ${
                                selectedStudent.attendancePercentage >= 85 
                                  ? 'bg-green-100 text-green-800' 
                                  : selectedStudent.attendancePercentage >= 75 
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedStudent.attendancePercentage >= 85 
                                  ? 'Excellent' 
                                  : selectedStudent.attendancePercentage >= 75 
                                  ? 'Good'
                                  : 'Needs Improvement'}
                              </div>
                            </div>
                            
                            {studentAttendanceData && (
                              <div className="mt-4 h-64">
                                <Bar 
                                  data={studentAttendanceData}
                                  options={{
                                    indexAxis: 'y' as const,
                                    responsive: true,
                                    plugins: {
                                      legend: {
                                        display: false,
                                      },
                                    },
                                    scales: {
                                      x: {
                                        beginAtZero: true,
                                        max: 100,
                                        ticks: {
                                          callback: function(value: any) {
                                            return value + '%';
                                          }
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-6">
                          <button
                            type="button"
                            className="btn btn-primary w-full"
                            onClick={() => setSelectedStudent(null)}
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Sessions List */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {mockAttendanceSessions.map((session, index) => {
                      const presentCount = session.attendees.filter(a => a.status === 'present').length;
                      const totalCount = session.attendees.length;
                      const percentage = Math.round((presentCount / totalCount) * 100);
                      
                      return (
                        <li key={index}>
                          <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="sm:flex sm:justify-between w-full">
                                <div>
                                  <p className="text-sm font-medium text-indigo-600 truncate">
                                    {session.subject} - Section {session.section}
                                  </p>
                                  <div className="mt-2 flex">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      <p>
                                        {session.date}
                                      </p>
                                    </div>
                                    <div className="ml-4 flex items-center text-sm text-gray-500">
                                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      <p>
                                        {session.startTime} - {session.endTime}
                                      </p>
                                    </div>
                                    <div className="ml-4 flex items-center text-sm text-gray-500">
                                      <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                      <p>
                                        Classroom {session.classroom}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                  <div className="flex items-center">
                                    <p className="text-sm text-gray-500 mr-2">Attendance:</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      percentage >= 80 
                                        ? 'bg-green-100 text-green-800' 
                                        : percentage >= 60 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {presentCount}/{totalCount} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="mt-2 flex">
                                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                      View details
                                    </button>
                                    <span className="mx-2 text-gray-400">|</span>
                                    <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                      Download report
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ViewAttendancePage;