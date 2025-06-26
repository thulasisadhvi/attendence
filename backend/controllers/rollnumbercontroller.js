// rollnumbercontroller.js
const fs = require('fs');
const path = require('path');

// Assuming these JSON files are in a 'data' directory at the root of your project
const USERS_FILE = path.join(__dirname, '..', 'users.json');
const PERIODS_FILE = path.join(__dirname, '..', 'rollnumbers.json'); // This will be your saveperiod.json
const STUDENT_ATTENDANCE_FILE = path.join(__dirname, 'studentattendance.json'); // New: Path to student attendance file

const updateRollNumber = async (req, res) => {
    const { rollNumber, token, subject, department, semester, facultyName, period } = req.body;

    if (!rollNumber || !token) {
        return res.status(400).json({ status: 'error', message: 'Roll number and token are required.' });
    }

    try {
        // 1. Read users.json to get student's details
        const usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const student = usersData.find(user => user.rollNumber === rollNumber);

        if (!student) {
            console.warn(`Attempt to mark attendance for unknown roll number: ${rollNumber}`);
            return res.status(404).json({ status: 'error', message: 'Student not found.' });
        }

        // 2. Read rollnumbers.json (saveperiod.json) to get period details
        const periodsData = JSON.parse(fs.readFileSync(PERIODS_FILE, 'utf8'));
        const periodEntry = periodsData[token];

        if (!periodEntry) {
            console.warn(`Attempt to mark attendance with invalid or non-existent token: ${token}`);
            return res.status(404).json({ status: 'error', message: 'Invalid or expired period token.' });
        }

        if (periodEntry.status === 'expired') {
            console.warn(`Attempt to mark attendance for an expired QR token: ${token}`);
            return res.status(403).json({ status: 'error', message: 'QR Code has expired.' });
        }

        // Destructure expected period details for comparison
        const {
            department: expectedDepartment,
            semester: expectedSemester,
            section: expectedSection,
            subject: expectedSubject,
            period: expectedPeriod,
            facultyName: expectedFacultyName
        } = periodEntry;

        // 3. Verify student's details against period's expected details
        if (
            student.department !== expectedDepartment ||
            student.semester !== expectedSemester ||
            student.section !== expectedSection ||
            subject !== expectedSubject || // Cross-check subject from frontend
            period !== expectedPeriod ||    // Cross-check period from frontend
            facultyName !== expectedFacultyName // Cross-check faculty from frontend
        ) {
            console.warn(`Mismatch for rollNumber ${rollNumber} with token ${token}.
Expected: Dept:${expectedDepartment}, Sem:${expectedSemester}, Sec:${expectedSection}, Sub:${expectedSubject}, Period:${expectedPeriod}, Faculty:${expectedFacultyName}
Received: Dept:${student.department}, Sem:${student.semester}, Sec:${student.section}, Sub:${subject}, Period:${period}, Faculty:${facultyName}
`);
            return res.status(403).json({ status: 'error', message: 'Student details do not match period details. Please ensure you are in the correct class.' });
        }

        // 4. Check if roll number already attended for this period
        if (periodEntry.attendedRollNumbers.includes(rollNumber)) {
            console.log(`Roll number ${rollNumber} has already marked attendance for token ${token}.`);
            return res.status(409).json({ status: 'error', message: 'Attendance already marked for this period.' });
        }

        // 5. Add roll number to attendedRollNumbers for the current period
        periodEntry.attendedRollNumbers.push(rollNumber);

        // 6. Save updated periodsData back to rollnumbers.json
        fs.writeFileSync(PERIODS_FILE, JSON.stringify(periodsData, null, 2), 'utf8');

        // 7. Update studentattendance.json
        const studentAttendanceData = JSON.parse(fs.readFileSync(STUDENT_ATTENDANCE_FILE, 'utf8'));
        const studentToUpdate = studentAttendanceData.find(s => s.rollNumber === rollNumber);

        if (studentToUpdate) {
            // Increment totalAttendedClasses
            studentToUpdate.totalAttendedClasses = (studentToUpdate.totalAttendedClasses || 0) + 1;

            // Increment attendedClasses for the specific subject
            const subjectEntry = studentToUpdate.subjects.find(s => s.name === subject);
            if (subjectEntry) {
                subjectEntry.attendedClasses = (subjectEntry.attendedClasses || 0) + 1;
            } else {
                // If subject not found (though it should be if other checks pass), add it
                studentToUpdate.subjects.push({ name: subject, attendedClasses: 1 });
            }

            // Update dates attended
            const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
            if (!studentToUpdate.dates) {
                studentToUpdate.dates = {};
            }
            studentToUpdate.dates[today] = (studentToUpdate.dates[today] || 0) + 1;

            // Save updated student attendance data back to studentattendance.json
            fs.writeFileSync(STUDENT_ATTENDANCE_FILE, JSON.stringify(studentAttendanceData, null, 2), 'utf8');
            console.log(`Student attendance details updated for Roll No: ${rollNumber}`);
        } else {
            console.warn(`Roll number ${rollNumber} not found in studentattendance.json for detailed update.`);
            // You might want to handle this case, e.g., by adding a new entry
            // For now, we'll just log a warning and proceed without updating studentattendance.json for this student.
        }

        console.log(`Attendance marked successfully for Roll No: ${rollNumber} for token: ${token}`);
        res.status(200).json({ status: 'success', message: 'Attendance marked successfully!', rollNumber: rollNumber });

    } catch (error) {
        console.error('Error in updateRollNumber controller:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error during attendance marking.' });
    }
};

module.exports = {
    updateRollNumber
};