// controllers/studentDashboardByRollNumber.js (Updated for MongoDB Integration)
// No longer need fs and path imports
// const fs = require('fs');
// const path = require('path');

// Import Mongoose models
const Student = require('../models/Student'); // Path to your Student model
const AttendanceSummary = require('../models/AttendanceSummary'); // Path to your AttendanceSummary model
const StudentAttendance = require('../models/StudentAttendance'); // Path to your StudentAttendance model


const getStudentDashboardByRollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    // --- Added console log for clicked roll number ---
    console.log(`Backend: Received request for dashboard for Roll Number: ${rollNumber}`);

    if (!rollNumber) {
      return res.status(400).json({ success: false, message: 'Roll number is required' });
    }

    // 1. Find the student user
    const user = await Student.findOne({ rollNumber: rollNumber, role: 'student' }).lean();

    if (!user) {
      // --- Added console log for student not found ---
      console.log(`Backend: Student with Roll Number ${rollNumber} NOT FOUND in DB.`);
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    // --- Added console log for student found ---
    console.log(`Backend: Student with Roll Number ${rollNumber} FOUND: ${user.name}`);


    // 2. Find relevant total attendance data
    const relevantTotalAttendance = await AttendanceSummary.findOne({
      department: user.department,
      semester: user.semester,
      section: user.section
    }).lean(); // .lean() to get plain JS object

    if (!relevantTotalAttendance) {
      console.log(`Backend: Total attendance data not found for ${user.rollNumber}'s department, semester, and section.`);
      return res.status(404).json({
        success: false,
        message: 'Total attendance data not found for this student\'s department, semester, and section.',
      });
    }

    // 3. Find student attendance record
    const studentRecord = await StudentAttendance.findOne({
      rollNumber: user.rollNumber,
      department: user.department,
      semester: user.semester,
      section: user.section
    }).lean(); // .lean() to get plain JS object

    if (!studentRecord) {
      console.log(`Backend: Student attendance record not found for ${user.rollNumber}.`);
      // It's possible a student has no attendance record yet. Return user with empty attendance.
      return res.status(200).json({
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        department: user.department,
        year: user.year,
        semester: user.semester,
        section: user.section,
        phone: user.phone || null,
        faceImage: user.faceImage || null,
        overallAttendancePercentage: 0,
        weeklyOverallAttendance: {},
        monthlyOverallAttendance: {},
        dailyOverallAttendance: {},
        attendance: []
      });
    }

    // Calculate attendance data similar to dashboard controller
    let totalClassesOverall = 0;
    let presentClassesOverall = 0;
    const subjectsAttendance = [];

    // Create a map for quick lookup of total classes by subject name
    const totalClassesBySubject = {};
    relevantTotalAttendance.attendanceSummary.subjects.forEach(subject => {
      totalClassesBySubject[subject.name] = subject.totalClassesConducted;
    });

    // Calculate subject-wise attendance
    if (studentRecord.subjects) {
      studentRecord.subjects.forEach(studentSubject => {
        const totalPeriods = totalClassesBySubject[studentSubject.name] || 0;
        const presentPeriods = studentSubject.attendedClasses;

        totalClassesOverall += totalPeriods;
        presentClassesOverall += presentPeriods;

        const overallPercentage = totalPeriods > 0 ? parseFloat(((presentPeriods / totalPeriods) * 100).toFixed(1)) : 0;

        const weeklyData = {};
        const monthlyData = {};
        const dailyData = {};

        // Get all dates from the relevantTotalAttendance.attendanceSummary.dates (which is a plain object)
        const allDates = Object.keys(relevantTotalAttendance.attendanceSummary.dates).sort();

        // Process daily attendance for this subject
        allDates.forEach(dateStr => {
          const totalPeriodsOnDay = relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0;
          const presentPeriodsOnDay = studentRecord.dates[dateStr] || 0; // Access as plain object

          // For simplification, we'll assume equal distribution across subjects
          // In a real scenario, you'd have subject-specific daily data
          const subjectPeriodsOnDay = Math.ceil(totalPeriodsOnDay / studentRecord.subjects.length); // Use ceil to avoid 0 if less than 1
          const subjectPresentOnDay = Math.ceil(presentPeriodsOnDay / studentRecord.subjects.length); // Use ceil

          dailyData[dateStr] = subjectPeriodsOnDay > 0 ?
            parseFloat(((subjectPresentOnDay / subjectPeriodsOnDay) * 100).toFixed(1)) : 0;
        });

        // Calculate weekly data
        const weeklyGroupedData = {};
        allDates.forEach(dateStr => {
          const d = new Date(dateStr + 'T00:00:00');
          const dayOfWeek = d.getDay();
          const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;

          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - daysFromMonday);
          weekStart.setHours(0, 0, 0, 0);

          const weekEnd = new Date(weekStart);
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

          const weekKey = `Week (${weekStartFormatted}-${weekEndFormatted})`;

          if (!weeklyGroupedData[weekKey]) {
            weeklyGroupedData[weekKey] = { total: 0, present: 0 };
          }

          const totalPeriodsOnDay = relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0;
          const presentPeriodsOnDay = studentRecord.dates[dateStr] || 0;

          const subjectPeriodsOnDay = Math.ceil(totalPeriodsOnDay / studentRecord.subjects.length);
          const subjectPresentOnDay = Math.ceil(presentPeriodsOnDay / studentRecord.subjects.length);

          weeklyGroupedData[weekKey].total += subjectPeriodsOnDay;
          weeklyGroupedData[weekKey].present += subjectPresentOnDay;
        });

        Object.keys(weeklyGroupedData).forEach(weekKey => {
          const weekData = weeklyGroupedData[weekKey];
          weeklyData[weekKey] = weekData.total > 0 ? parseFloat(((weekData.present / weekData.total) * 100).toFixed(1)) : 0;
        });

        // Calculate monthly data
        const monthlyGroupedData = {};
        allDates.forEach(dateStr => {
          const monthKey = dateStr.substring(0, 7); // YYYY-MM
          const monthName = new Date(monthKey + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' });

          if (!monthlyGroupedData[monthName]) {
            monthlyGroupedData[monthName] = { total: 0, present: 0 };
          }

          const totalPeriodsOnDay = relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0;
          const presentPeriodsOnDay = studentRecord.dates[dateStr] || 0;

          const subjectPeriodsOnDay = Math.ceil(totalPeriodsOnDay / studentRecord.subjects.length);
          const subjectPresentOnDay = Math.ceil(presentPeriodsOnDay / studentRecord.subjects.length);

          monthlyGroupedData[monthName].total += subjectPeriodsOnDay;
          monthlyGroupedData[monthName].present += subjectPresentOnDay;
        });

        Object.keys(monthlyGroupedData).forEach(monthName => {
          const monthData = monthlyGroupedData[monthName];
          monthlyData[monthName] = monthData.total > 0 ? parseFloat(((monthData.present / monthData.total) * 100).toFixed(1)) : 0;
        });

        subjectsAttendance.push({
          subject: studentSubject.name,
          overall: overallPercentage,
          weekly: weeklyData,
          monthly: monthlyData,
          daily: dailyData
        });
      });
    }

    // Calculate overall attendance percentages
    const overallPercentage = totalClassesOverall > 0 ? parseFloat(((presentClassesOverall / totalClassesOverall) * 100).toFixed(1)) : 0;

    // Calculate overall weekly attendance
    const weeklyOverallAttendance = {};
    const monthlyOverallAttendance = {};
    const dailyOverallAttendance = {};

    const allDates = Object.keys(relevantTotalAttendance.attendanceSummary.dates).sort();

    // Calculate overall daily attendance
    allDates.forEach(dateStr => {
      const totalPeriodsOnDay = relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0;
      const presentPeriodsOnDay = studentRecord.dates[dateStr] || 0;
      dailyOverallAttendance[dateStr] = totalPeriodsOnDay > 0 ? parseFloat(((presentPeriodsOnDay / totalPeriodsOnDay) * 100).toFixed(1)) : 0;
    });

    // Calculate overall weekly attendance
    const weeklyGroupedDataOverall = {}; // Use a different name to avoid conflict
    allDates.forEach(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      const dayOfWeek = d.getDay();
      const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;

      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - daysFromMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
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

      const weekKey = `Week (${weekStartFormatted}-${weekEndFormatted})`;

      if (!weeklyGroupedDataOverall[weekKey]) {
        weeklyGroupedDataOverall[weekKey] = { total: 0, present: 0 };
      }

      weeklyGroupedDataOverall[weekKey].total += relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0;
      weeklyGroupedDataOverall[weekKey].present += studentRecord.dates[dateStr] || 0;
    });

    Object.keys(weeklyGroupedDataOverall).forEach(weekKey => {
      const weekData = weeklyGroupedDataOverall[weekKey];
      weeklyOverallAttendance[weekKey] = weekData.total > 0 ? parseFloat(((weekData.present / weekData.total) * 100).toFixed(1)) : 0;
    });

    // Calculate overall monthly attendance
    const monthlyGroupedDataOverall = {}; // Use a different name to avoid conflict
    allDates.forEach(dateStr => {
      const monthKey = dateStr.substring(0, 7); // YYYY-MM
      const monthName = new Date(monthKey + '-01').toLocaleString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyGroupedDataOverall[monthName]) {
        monthlyGroupedDataOverall[monthName] = { total: 0, present: 0 };
      }

      monthlyGroupedDataOverall[monthName].total += relevantTotalAttendance.attendanceSummary.dates[dateStr] || 0;
      monthlyGroupedDataOverall[monthName].present += studentRecord.dates[dateStr] || 0;
    });

    Object.keys(monthlyGroupedDataOverall).forEach(monthName => {
      const monthData = monthlyGroupedDataOverall[monthName];
      monthlyOverallAttendance[monthName] = monthData.total > 0 ? parseFloat(((monthData.present / monthData.total) * 100).toFixed(1)) : 0;
    });

    // Prepare response data in the expected format for frontend
    const responseData = {
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      department: user.department,
      year: user.year,
      semester: user.semester,
      section: user.section,
      phone: user.phone || null,
      faceImage: user.faceImage || null, // Assuming this field exists in Student model
      overallAttendancePercentage: overallPercentage,
      weeklyOverallAttendance: weeklyOverallAttendance,
      monthlyOverallAttendance: monthlyOverallAttendance,
      dailyOverallAttendance: dailyOverallAttendance,
      attendance: subjectsAttendance // This contains subject-wise details with overall, weekly, monthly, daily
    };

    res.status(200).json(responseData);

  } catch (err) {
    console.error('View dashboard error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getStudentDashboardByRollNumber };
