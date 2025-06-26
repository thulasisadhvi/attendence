import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Users, User, CalendarCheck, BarChart3 } from 'lucide-react';

import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { mockAttendanceSessions } from '../../utils/mockData';

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const recentSessions = mockAttendanceSessions.slice(0, 5);

  // Redirect if no user or not faculty
  if (!user || user.role !== 'faculty') {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                  Welcome, {user.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Faculty Dashboard • {user.department}
                </p>
              </div>
              <div className="mt-4 flex md:mt-0 md:ml-4">
                <Link to="/faculty/generate-qr" className="btn btn-primary flex items-center">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatsCard 
              title="Total Classes"
              value="24"
              icon={<CalendarCheck className="h-6 w-6 text-indigo-600" />}
            />
            <StatsCard 
              title="Total Students"
              value="145"
              icon={<Users className="h-6 w-6 text-teal-600" />}
            />
            <StatsCard 
              title="Average Attendance"
              value="87%"
              icon={<BarChart3 className="h-6 w-6 text-indigo-600" />}
            />
            <StatsCard 
              title="QR Sessions"
              value="42"
              icon={<QrCode className="h-6 w-6 text-teal-600" />}
            />
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Sessions</h3>
              <Link to="/faculty/view-attendance" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all sessions
              </Link>
            </div>
            <div className="shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSessions.map((session, index) => {
                    const presentCount = session.attendees.filter(a => a.status === 'present').length;
                    const totalCount = session.attendees.length;
                    const percentage = Math.round((presentCount / totalCount) * 100);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {session.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.department} - {session.section}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.startTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Link to="/faculty/generate-qr" className="card hover:bg-indigo-50 transition-colors">
                <QrCode className="h-8 w-8 text-indigo-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">Generate QR Code</h4>
                <p className="text-gray-600">Create a new attendance session with QR code</p>
              </Link>
              
              <Link to="/faculty/view-attendance" className="card hover:bg-indigo-50 transition-colors">
                <Users className="h-8 w-8 text-indigo-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">View Student Attendance</h4>
                <p className="text-gray-600">Check individual and class attendance records</p>
              </Link>
              
              <Link to="/faculty/profile" className="card hover:bg-indigo-50 transition-colors">
                <User className="h-8 w-8 text-indigo-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-1">Manage Profile</h4>
                <p className="text-gray-600">Update your profile information</p>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

const StatsCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ 
  title, 
  value, 
  icon 
}) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-50 rounded-md p-3">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;