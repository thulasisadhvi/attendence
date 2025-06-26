// backend/routes/DashboardRoutes.js (Updated for MongoDB Integration - Fixed .lean() Map Access)
// Assuming this controller is located at controllers/DashboardRoutes.js
// and imported via `const dashboard = require('./routes/DashboardRoutes');` in server.js
// or directly if it's a controller.

const express = require('express');
// No longer need fs and path for data storage

// Import Mongoose models
const Student = require('../models/Student'); // Path to your Student model (for users.json data)
const AttendanceSummary = require('../models/AttendanceSummary'); // Path to your AttendanceSummary model (for totalattendance.json data)
const StudentAttendance = require('../models/StudentAttendance'); // Path to your new StudentAttendance model (for studentattendance.json data)


const getStudentDashboard = async (req, res) => {
  try {
    // req.user is populated by your authentication middleware (e.g., from JWT token)
    const userEmail = req.user.email;

    // 1. Find the student user
    const user = await Student.findOne({ email: userEmail, role: 'student' }).lean(); // .lean() for plain JS object

    if (!user) {
      console.log(`Student not found for email: ${userEmail}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Find relevant Total Attendance Summary
    const relevantTotalAttendance = await AttendanceSummary.findOne({
      department: user.department,
      semester: user.semester,
      section: user.section
    }).lean(); // .lean() converts Mongoose Map to plain object

    if (!relevantTotalAttendance) {
      console.log(`Total attendance data not found for ${user.department}-${user.semester}-${user.section}`);
      return res.status(404).json({
        success: false,
        message: 'Total attendance data not found for your department, semester, and section.',
      });
    }

    // 3. Find the specific student's attendance record
    const studentRecord = await StudentAttendance.findOne({
      rollNumber: user.rollNumber,
      department: user.department,
      semester: user.semester,
      section: user.section
    }).lean(); // .lean() converts Mongoose Map to plain object

    let attendanceSummary = {
      totalClasses: 0,
      presentCount: 0,
      absentCount: 0,
      overallPercentage: 0,
      subjects: [],
      monthlyData: [],
      weeklyData: [],
    };

    let presentClassesOverall = 0;

    // Only proceed with attendance calculations if both records are found
    if (studentRecord && relevantTotalAttendance) {
      let totalClassesOverall = 0;
      let presentClassesCurrentTerm = 0;
      const subjectsAttendance = [];

      // Create a map for quick lookup of total classes by subject name from relevantTotalAttendance
      const totalClassesBySubject = {};
      relevantTotalAttendance.attendanceSummary.subjects.forEach(subject => {
        totalClassesBySubject[subject.name] = subject.totalClassesConducted;
      });

      // Populate subjectsAttendance using student's attended classes and total classes
      if (studentRecord.subjects) {
        studentRecord.subjects.forEach(studentSubject => {
          const totalPeriods = totalClassesBySubject[studentSubject.name] || 0;
          const presentPeriods = studentSubject.attendedClasses;

          totalClassesOverall += totalPeriods;
          presentClassesCurrentTerm += presentPeriods;

          const percentage = totalPeriods > 0 ? ((presentPeriods / totalPeriods) * 100).toFixed(1) : 0;
          subjectsAttendance.push({
            subject: studentSubject.name,
            percentage: parseFloat(percentage),
            totalClasses: totalPeriods,
            attendedClasses: presentPeriods,
            absentClasses: totalPeriods - presentPeriods
          });
        });
      }

      presentClassesOverall = presentClassesCurrentTerm;
      const absentCountOverall = totalClassesOverall - presentClassesOverall;
      const overallPercentage = totalClassesOverall > 0 ? ((presentClassesOverall / totalClassesOverall) * 100).toFixed(1) : 0;

      // Extract all dates where classes were conducted from relevantTotalAttendance
      // FIX: relevantTotalAttendance.attendanceSummary.dates is already a plain object due to .lean()
      const allDates = Object.keys(relevantTotalAttendance.attendanceSummary.dates).sort();


      // --- Weekly Data Calculation ---
      const weeklyGroupedData = {};

      allDates.forEach(dateStr => {
        const d = new Date(dateStr + 'T00:00:00'); // Add time to prevent timezone issues

        // Get the Monday of the week containing this date
        const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Convert to days from Monday

        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - daysFromMonday);
        weekStart.setHours(0, 0, 0, 0);

        const weekKey = weekStart.toISOString().split('T')[0];

        if (!weeklyGroupedData[weekKey]) {
          weeklyGroupedData[weekKey] = {};
        }

        // Store data using the actual date as key
        weeklyGroupedData[weekKey][dateStr] = {
          // FIX: Use direct property access on plain object
          totalPeriods: relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0,
          // FIX: Use direct property access on plain object
          presentPeriods: studentRecord.dates[dateStr] || 0
        };
      });

      const weeklyAttendance = Object.keys(weeklyGroupedData).sort().map(weekKey => {
        const weekData = weeklyGroupedData[weekKey];
        const weekDates = [];
        const attendancePercentages = [];

        // Generate all 7 days of the week starting from Monday
        for (let i = 0; i < 7; i++) {
          const currentDay = new Date(weekKey);
          currentDay.setDate(currentDay.getDate() + i);
          const dateStr = currentDay.toISOString().split('T')[0];

          // Format date for display (e.g., "May 30")
          const displayDate = currentDay.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
          });
          weekDates.push(displayDate);

          // Get attendance data for this specific date
          if (weekData[dateStr]) {
            const total = weekData[dateStr].totalPeriods;
            const present = weekData[dateStr].presentPeriods;
            attendancePercentages.push(total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0);
          } else {
            // No data for this date (no classes scheduled)
            attendancePercentages.push(0);
          }
        }

        // Format week name
        const weekStart = new Date(weekKey);
        const weekEnd = new Date(weekKey);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekStartFormatted = weekStart.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        });
        const weekEndFormatted = weekEnd.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        });

        return {
          weekName: `Week (${weekStartFormatted}-${weekEndFormatted})`,
          dates: weekDates,
          attendance: attendancePercentages,
        };
      });

      // --- Monthly Data Calculation ---
      const monthlyGroupedData = {};
      allDates.forEach(date => {
        const monthKey = date.substring(0, 7); // YYYY-MM
        if (!monthlyGroupedData[monthKey]) {
          monthlyGroupedData[monthKey] = {
            totalPeriods: 0,
            presentPeriods: 0,
            absentPeriods: 0,
          };
        }

        // FIX: Use direct property access on plain object
        const totalPeriodsOnDay = relevantTotalAttendance.attendanceSummary.dates[date] || 0;
        // FIX: Use direct property access on plain object
        const presentPeriodsOnDay = studentRecord.dates[date] || 0;

        monthlyGroupedData[monthKey].totalPeriods += totalPeriodsOnDay;
        monthlyGroupedData[monthKey].presentPeriods += presentPeriodsOnDay;
        monthlyGroupedData[monthKey].absentPeriods += (totalPeriodsOnDay - presentPeriodsOnDay);
      });

      const monthlyStats = Object.keys(monthlyGroupedData).sort().map(monthKey => {
        const monthData = monthlyGroupedData[monthKey];
        const monthName = new Date(monthKey + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const percentage = monthData.totalPeriods > 0 ? parseFloat(((monthData.presentPeriods / monthData.totalPeriods) * 100).toFixed(1)) : 0;

        return {
          month: monthName,
          totalPeriods: monthData.totalPeriods,
          presentPeriods: monthData.presentPeriods,
          absentPeriods: monthData.absentPeriods,
          percentage: percentage,
          improvement: 'N/A', // These can be calculated if needed based on month-over-month data
          bestSubject: 'N/A', // These can be calculated if needed
          worstSubject: 'N/A' // These can be calculated if needed
        };
      });

      attendanceSummary = {
        totalClasses: totalClassesOverall,
        presentCount: presentClassesOverall,
        absentCount: absentCountOverall,
        overallPercentage: parseFloat(overallPercentage),
        subjects: subjectsAttendance,
        monthlyData: monthlyStats,
        weeklyData: weeklyAttendance
      };
    }

    // If no student record found, return empty attendance data but still return user info
    if (!studentRecord) {
      console.log(`No attendance record found for student: ${user.rollNumber}`);
      // Return user data with empty attendance summary
      return res.status(200).json({
        success: true,
        user: {
          name: user.name,
          email: user.email,
          rollNumber: user.rollNumber,
          department: user.department,
          year: user.year,
          semester: user.semester,
          section: user.section
        },
        attendance: attendanceSummary // Will be empty but structured
      });
    }

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        department: user.department,
        year: user.year,
        semester: user.semester,
        section: user.section
      },
      attendance: attendanceSummary
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getStudentDashboard };
