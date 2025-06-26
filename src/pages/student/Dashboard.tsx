import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Calendar, Clock, Award, AlertTriangle, CheckCircle, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Import the plugin

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

// Register ChartJS components and the datalabels plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels // Register the plugin here
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          return;
        }

        const response = await fetch(`${API_BASE}/api/student/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data or attendance.');
        }

        const data = await response.json();
        setUserData(data.user);
        setAttendanceData(data.attendance);

        if (data.attendance.weeklyData && data.attendance.weeklyData.length > 0) {
          setCurrentWeekIndex(data.attendance.weeklyData.length - 1);
        }
        if (data.attendance.monthlyData && data.attendance.monthlyData.length > 0) {
          setCurrentMonthIndex(data.attendance.monthlyData.length - 1);
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data and attendance. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserData();
    }
  }, [user, API_BASE]);

  const stats = attendanceData || {
    totalClasses: 0,
    presentCount: 0,
    absentCount: 0,
    overallPercentage: 0,
    subjects: [],
    monthlyData: [],
    weeklyData: []
  };

  const monthlyData = stats.monthlyData || [];
  const weeklyAttendanceData = stats.weeklyData || [];

  const currentMonthData = monthlyData[currentMonthIndex] || {
    month: 'N/A',
    totalPeriods: 0,
    presentPeriods: 0,
    absentPeriods: 0,
    percentage: 0,
    improvement: 'N/A',
    bestSubject: 'N/A',
    worstSubject: 'N/A'
  };

  const currentWeekData = weeklyAttendanceData[currentWeekIndex] || {
    weekName: 'N/A',
    dates: [],
    attendance: []
  };

  // Prepare weekly chart data
  const weeklyAttendanceChart = {
    labels: currentWeekData.dates,
    datasets: [
      {
        label: 'Daily Attendance %',
        data: currentWeekData.attendance,
        backgroundColor: currentWeekData.attendance.map(value =>
          value === 0 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(99, 102, 241, 0.8)'
        ),
        borderColor: currentWeekData.attendance.map(value =>
          value === 0 ? 'rgba(156, 163, 175, 0.5)' : 'rgba(99, 102, 241, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const nextWeek = () => {
    setCurrentWeekIndex((prev) => (prev + 1) % weeklyAttendanceData.length);
  };

  const prevWeek = () => {
    setCurrentWeekIndex((prev) => (prev - 1 + weeklyAttendanceData.length) % weeklyAttendanceData.length);
  };

  const nextMonth = () => {
    setCurrentMonthIndex((prev) => (prev + 1) % monthlyData.length);
  };

  const prevMonth = () => {
    setCurrentMonthIndex((prev) => (prev - 1 + monthlyData.length) % monthlyData.length);
  };

  const subjectPerformance = {
    labels: stats.subjects.map(subject => subject.subject),
    datasets: [
      {
        label: 'Attendance Percentage',
        data: stats.subjects.map(subject => subject.percentage),
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(14, 165, 233, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(168, 85, 247, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const overallAttendance = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [stats.presentCount, stats.absentCount],
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasAttendanceData = weeklyAttendanceData.length > 0 || monthlyData.length > 0 || stats.subjects.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
                  Welcome, {userData?.name || user?.name || 'Student'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Student Dashboard • {userData?.department || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">
                  Roll Number: {userData?.rollNumber || 'N/A'} |
                  Year: {userData?.year || 'N/A'} |
                  Section: {userData?.section || 'N/A'} |
                  Semester:{userData?.semester || 'N/A'}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${
                  stats.overallPercentage >= 85
                    ? 'bg-green-100 text-green-800'
                    : stats.overallPercentage >= 75
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  Overall Attendance: {stats.overallPercentage}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* Display message if no attendance data */}
          {!hasAttendanceData && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    No attendance data available yet. Please check back later or contact administration.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Render attendance sections only if data is available */}
          {hasAttendanceData && (
            <>
              {/* Attendance Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-8 grid gap-5 grid-cols-1 md:grid-cols-3"
              >
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-50 rounded-md p-3">
                        <Calendar className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Classes
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.totalClasses}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-50 rounded-md p-3">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Classes Attended
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.presentCount}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-50 rounded-md p-3">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Classes Missed
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stats.absentCount}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Statistics with Navigation */}
              {monthlyData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="mt-8 bg-white shadow rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Monthly Overview
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={prevMonth}
                          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={monthlyData.length <= 1}
                        >
                          <ChevronLeft className="h-5 w-5 text-gray-500" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
                          {currentMonthData.month}
                        </span>
                        <button
                          onClick={nextMonth}
                          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={monthlyData.length <= 1}
                        >
                          <ChevronRight className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Updated to display Total Periods */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{currentMonthData.totalPeriods}</div>
                        <div className="text-sm text-gray-500">Total Periods</div>
                      </div>
                      {/* Updated to display Present Periods */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{currentMonthData.presentPeriods}</div>
                        <div className="text-sm text-gray-500">Present Periods</div>
                      </div>
                      {/* Updated to display Absent Periods */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{currentMonthData.absentPeriods}</div>
                        <div className="text-sm text-gray-500">Absent Periods</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{currentMonthData.percentage}%</div>
                        <div className="text-sm text-gray-500">Attendance</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Charts */}
              <div className="mt-8 grid gap-8 grid-cols-1 lg:grid-cols-2">
                {/* Weekly Attendance Chart with Dates */}
                {weeklyAttendanceData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white shadow rounded-lg"
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Weekly Attendance
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={prevWeek}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={weeklyAttendanceData.length <= 1}
                          >
                            <ChevronLeft className="h-5 w-5 text-gray-500" />
                          </button>
                          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                            {currentWeekData.weekName}
                          </span>
                          <button
                            onClick={nextWeek}
                            className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={weeklyAttendanceData.length <= 1}
                          >
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <div className="h-64">
                        <Bar
                          data={weeklyAttendanceChart}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const value = context.raw;
                                    // This part of the tooltip logic was relying on `totalAttendanceData` which isn't defined.
                                    // It's better to calculate or fetch total periods per day to accurately show "No classes scheduled".
                                    // For now, I'm simplifying this to reflect only the attendance percentage.
                                    if (value === 0) {
                                      // If attendance is 0, it could be genuinely absent or no classes.
                                      // Without knowing total periods for that day, it's safer to say '0% Attendance'.
                                      return 'Attendance: 0%';
                                    }
                                    return `Attendance: ${value}%`;
                                  }
                                }
                              },
                              // Datalabels plugin configuration
                              datalabels: {
                                anchor: 'end', // Position the label at the end of the bar
                                align: 'top', // Align the label to the top of the bar
                                formatter: (value) => { // Format the label text
                                  return value > 0 ? `${value}%` : ''; // Display only if value > 0
                                },
                                color: '#4A5568', // Text color
                                font: {
                                  weight: 'bold',
                                  size: 10
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  stepSize: 20,
                                  callback: function(value) {
                                    return value + '%';
                                  }
                                },
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.1)',
                                }
                              },
                              x: {
                                grid: {
                                  display: false,
                                },
                                ticks: {
                                  maxRotation: 0,
                                  minRotation: 0
                                }
                              }
                            }
                          }}
                        />
                      </div>
                      {/* Calculate average attendance for the week, excluding days with no classes */}
                      <div className="mt-4 text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {currentWeekData.attendance.filter(val => val > 0).length > 0
                            ? `${Math.round(currentWeekData.attendance.filter(val => val > 0).reduce((a, b) => a + b, 0) /
                              currentWeekData.attendance.filter(val => val > 0).length)}%`
                            : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Average this week</div>
                      </div>
                      {/* Mobile percentage display */}
                      {isMobile && currentWeekData.dates.length > 0 && (
                        <div className="mt-4 grid grid-cols-7 gap-1 text-xs">
                          {currentWeekData.dates.map((date, index) => (
                            <div key={index} className="text-center">
                              <div className="font-medium text-gray-700">{date.split(' ')[1]}</div>
                              <div className={`${currentWeekData.attendance[index] === 0 ? 'text-gray-400' : 'text-indigo-600'}`}>
                                {currentWeekData.attendance[index] === 0 ? 'N/A' : `${currentWeekData.attendance[index]}%`}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Overall Attendance Doughnut */}
                {stats.totalClasses > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white shadow rounded-lg"
                  >
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Overall Attendance
                      </h3>
                      <div className="h-64 flex items-center justify-center">
                        <div style={{ width: '70%', height: '70%' }}>
                          <Doughnut
                            data={overallAttendance}
                            options={{
                              responsive: true,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw;
                                      const total = stats.totalClasses;
                                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                      return `${label}: ${value} (${percentage}%)`;
                                    }
                                  }
                                }
                              },
                              cutout: '70%',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Subject-wise Attendance */}
              {stats.subjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-8 bg-white shadow sm:rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Subject-wise Attendance
                    </h3>
                    <div className="h-96">
                      <Bar
                        data={subjectPerformance}
                        options={{
                          indexAxis: 'y',
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `Attendance: ${context.raw}%`;
                                }
                              }
                            }
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              max: 100,
                              ticks: {
                                callback: function(value) {
                                  return value + '%';
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    {/* Mobile percentage display for subjects */}
                    {isMobile && (
                      <div className="mt-4 space-y-2">
                        {stats.subjects.map((subject, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                            <span className="text-sm font-bold text-indigo-600">{subject.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
export default StudentDashboard;