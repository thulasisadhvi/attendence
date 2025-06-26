// backend/controllers/attendanceController.js (Updated for MongoDB Integration)
// Removed fs and path imports as file system operations are replaced by Mongoose
// const fs = require('fs').promises;
// const path = require('path');

// Import Mongoose models
const Student = require('../models/Student'); // For users.json data
const RollNumberAttendance = require('../models/RollNumberAttendance'); // For rollnumbers.json data (new model)
const StudentAttendance = require('../models/StudentAttendance'); // For studentattendance.json data


// --- Controller Function ---
const markAttendance = async (req, res) => {
    const { rollNumber, token } = req.body;

    if (!rollNumber || !token) {
        return res.status(400).json({ status: "error", message: "Roll number and token are required." });
    }

    const rollNumberLower = rollNumber.toLowerCase();

    try {
        // 1. Retrieve session data from RollNumberAttendance model
        const sessionData = await RollNumberAttendance.findOne({ token }).lean(); // .lean() for plain JS object

        if (!sessionData) {
            return res.status(404).json({ status: "error", message: "Invalid or non-existent session token." });
        }

        // Check if the session is expired based on timestamp (live check)
        const sessionStartTime = new Date(sessionData.timestamp);
        const currentTime = new Date();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        const expiryTime = sessionStartTime.getTime() + FIVE_MINUTES_MS; // Consistent 5-minute expiry
        const expiredByTimestamp = currentTime.getTime() > expiryTime;

        if (expiredByTimestamp || sessionData.status === "expired") {
            // If expired or already marked expired, update status in DB if needed
            if (sessionData.status !== "expired") {
                await RollNumberAttendance.findOneAndUpdate(
                    { token: token },
                    { $set: { status: "expired" } },
                    { new: true }
                );
                console.log(`Session ${token} status updated to expired in DB.`);
            }
            return res.status(403).json({ status: "error", message: "This attendance session has expired." });
        }

        // 2. Retrieve student data from Student model
        const studentData = await Student.findOne({ rollNumber: rollNumberLower, role: 'student' }).lean();
        if (!studentData) {
            return res.status(404).json({ status: "error", message: `Student with roll number ${rollNumber} not found in user database.` });
        }

        // 3. Check for duplicates in current session's attendedRollNumbers
        if (sessionData.attendedRollNumbers.includes(rollNumberLower)) {
            return res.status(409).json({ status: "error", message: "Attendance already marked for this session." });
        }

        // 4. Validate student eligibility for this session
        const sessionDept = sessionData.department.toLowerCase();
        const sessionSemester = sessionData.semester.toLowerCase();
        const sessionSection = sessionData.section.toLowerCase();
        // Extract numerical year from sessionData.year (e.g., '3rd' -> '3')
        const sessionYearNum = sessionData.year.replace(/\D/g, '');


        const studentDept = studentData.department.toLowerCase();
        const studentSemester = studentData.semester.toLowerCase();
        const studentSection = studentData.section.toLowerCase();
        const studentYear = studentData.year; // Assuming user.year is already numerical if stored as such

        const isEligible = (
            studentDept === sessionDept &&
            studentSemester === sessionSemester &&
            studentSection === sessionSection &&
            studentYear === sessionYearNum // Compare numerical years
        );

        if (!isEligible) {
            return res.status(403).json({ status: "error", message: "Student does not belong to this session's department, semester, or section." });
        }

        // --- All validations passed. Proceed to mark attendance ---

        // 5. Mark attendance in RollNumberAttendance (update sessionData in DB)
        // Push the rollNumber to the attendedRollNumbers array
        await RollNumberAttendance.findOneAndUpdate(
            { token: token },
            { $push: { attendedRollNumbers: rollNumberLower } },
            { new: true }
        );
        console.log(`✅ RollNumberAttendance updated successfully for token: ${token}.`);

        // 6. Update StudentAttendance.js (student's individual attendance)
        const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const sessionSubject = sessionData.subject;

        // Find the student's attendance entry
        let studentAttendanceEntry = await StudentAttendance.findOne({ rollNumber: rollNumberLower });

        if (!studentAttendanceEntry) {
            // If student not found in StudentAttendance, create a new entry
            studentAttendanceEntry = new StudentAttendance({
                rollNumber: studentData.rollNumber,
                name: studentData.name,
                department: studentData.department,
                semester: studentData.semester,
                section: studentData.section,
                subjects: [],
                totalAttendedClasses: 0,
                dates: {} // Mongoose Map will be initialized
            });
            // Don't await save yet, continue modifying and then save once.
        }

        // Update subject attendance
        let subjectFound = false;
        for (let i = 0; i < studentAttendanceEntry.subjects.length; i++) {
            if (studentAttendanceEntry.subjects[i].name.toLowerCase() === sessionSubject.toLowerCase()) {
                studentAttendanceEntry.subjects[i].attendedClasses = (studentAttendanceEntry.subjects[i].attendedClasses || 0) + 1;
                subjectFound = true;
                break;
            }
        }
        if (!subjectFound) {
            studentAttendanceEntry.subjects.push({
                name: sessionSubject,
                attendedClasses: 1
            });
        }

        // Update total attended classes
        studentAttendanceEntry.totalAttendedClasses = (studentAttendanceEntry.totalAttendedClasses || 0) + 1;

        // Update dates (Mongoose Map type)
        // Need to convert Map to object if loaded with .lean() then convert back,
        // or directly use Map methods if not using .lean() on studentAttendanceEntry fetch.
        // Let's refetch without .lean() or handle as a Map if it's already a Document.
        // Given that it's fetched directly, it will be a Document, so use Map methods.
        const currentCount = studentAttendanceEntry.dates.get(todayDate) || 0;
        studentAttendanceEntry.dates.set(todayDate, currentCount + 1);

        // Save the updated studentAttendanceEntry document
        await studentAttendanceEntry.save();
        console.log(`✅ StudentAttendance updated successfully for ${rollNumber}.`);

        console.log(`✅ Attendance marked for ${rollNumber} in session ${token}.`);

        return res.status(200).json({
            status: "success",
            message: "Attendance marked successfully!",
            rollNumber: rollNumber,
            session: {
                subject: sessionData.subject,
                department: sessionData.department,
                semester: sessionData.semester,
                facultyName: sessionData.facultyName,
                period: sessionData.period,
            }
        });

    } catch (error) {
        console.error("Error in markAttendance:", error);
        return res.status(500).json({ status: "error", message: "An internal server error occurred during attendance marking." });
    }
};

module.exports = {
    markAttendance,
};
