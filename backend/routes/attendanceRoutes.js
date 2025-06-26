// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Import Mongoose directly
const mongoose = require('mongoose');

// Get Mongoose models from mongoose.models cache or require them
// This ensures you're always getting the already registered model instance
const PeriodLog = mongoose.models.PeriodLog || require('../models/PeriodLog');
const ActivePeriod = mongoose.models.ActivePeriod || require('../models/ActivePeriod');
const AttendanceSummary = mongoose.models.AttendanceSummary || require('../models/AttendanceSummary');
const RollNumberAttendance = mongoose.models.RollNumberAttendance || require('../models/RollNumberAttendance');


router.post('/save-period-and-update-attendance', async (req, res) => {
    const formData = req.body;
    console.log('--- RECEIVED FORM DATA ---');
    console.log('Received form data in attendanceRoutes:', formData);

    const uniqueToken = uuidv4().replace(/-/g, '').substring(0, 10);

    // --- START MODIFICATION FOR IST TIMESTAMP ---
    const now = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + IST_OFFSET_MS);

    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(istTime.getUTCMilliseconds()).padStart(3, '0');

    const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}+05:30`;
    // --- END MODIFICATION FOR IST TIMESTAMP ---

    const dataToSave = {
        ...formData,
        token: uniqueToken,
        timestamp: timestamp,
        status: "active"
    };

    try {
        // --- 1. Save period data to PeriodLog (History) ---
        console.log('Attempting to save new period log to MongoDB (PeriodLog)...');
        const newPeriodLog = new PeriodLog(dataToSave);
        await newPeriodLog.save();
        console.log('SUCCESS: Period data saved to PeriodLog collection.');

        // --- 2. Update ActivePeriod (Latest data) ---
        console.log('Attempting to update ActivePeriod in MongoDB...');
        // Debugging line:
        console.log('ActivePeriod type:', typeof ActivePeriod, 'Name:', ActivePeriod.name, 'Is Model:', ActivePeriod.collection instanceof mongoose.Collection);
        
        // This will replace the single active document or create it if none exists.
        // It's designed to ensure only one "active" period QR code is available at a time.
        await ActivePeriod.deleteMany({}); // Remove all existing active periods
        const newActivePeriod = new ActivePeriod(dataToSave);
        await newActivePeriod.save(); // Insert the new active period
        console.log('SUCCESS: ActivePeriod updated/created in MongoDB.');

        // --- START: Schedule automatic status update to 'expired' after 5 minutes ---
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        console.log(`Scheduling automatic expiry for token ${uniqueToken} in 5 minutes (${FIVE_MINUTES_MS / 1000} seconds).`);

        setTimeout(async () => {
            console.log(`--- EXECUTING SCHEDULED EXPIRY CHECK FOR TOKEN: ${uniqueToken} ---`);

            try {
                // Update status in PeriodLog
                const updatedPeriodLog = await PeriodLog.findOneAndUpdate(
                    { token: uniqueToken, status: "active" },
                    { $set: { status: "expired" } },
                    { new: true }
                );
                if (updatedPeriodLog) {
                    console.log(`Token ${uniqueToken} marked as 'expired' in PeriodLog by timer.`);
                } else {
                    console.log(`Token ${uniqueToken} in PeriodLog was already expired or not found by timer.`);
                }
            } catch (err) {
                console.error(`Error updating PeriodLog for token ${uniqueToken} by timer:`, err.message);
            }

            try {
                // Update status in ActivePeriod (if it's still the latest active token)
                const updatedActivePeriod = await ActivePeriod.findOneAndUpdate(
                    { token: uniqueToken, status: "active" },
                    { $set: { status: "expired" } },
                    { new: true }
                );
                if (updatedActivePeriod) {
                    console.log(`Token ${uniqueToken} marked as 'expired' in ActivePeriod by timer.`);
                } else {
                    console.log(`Token ${uniqueToken} in ActivePeriod was already expired or not the current active token.`);
                }
            } catch (err) {
                console.error(`Error updating ActivePeriod for token ${uniqueToken} by timer:`, err.message);
            }

            // Update status in RollNumberAttendance by timer
            try {
                const updatedRollNumberAttendance = await RollNumberAttendance.findOneAndUpdate(
                    { token: uniqueToken, status: "active" },
                    { $set: { status: "expired" } },
                    { new: true }
                );
                if (updatedRollNumberAttendance) {
                    console.log(`Token ${uniqueToken} marked as 'expired' in RollNumberAttendance by timer.`);
                } else {
                    console.log(`Token ${uniqueToken} in RollNumberAttendance was already expired or not found by timer.`);
                }
            } catch (err) {
                console.error(`Error updating RollNumberAttendance for token ${uniqueToken} by timer:`, err.message);
            }

        }, FIVE_MINUTES_MS);
        // --- END: Schedule automatic status update to 'expired' after 5 minutes ---

        // --- 3. Update AttendanceSummary ---
        console.log('Attempting to update AttendanceSummary in MongoDB...');
        const { department, semester, section, subject } = formData;
        const today = new Date().toISOString().split('T')[0];

        try {
            // Find the summary document for the specific department, semester, and section
            let attendanceSummaryDoc = await AttendanceSummary.findOne({ department, semester, section });

            if (attendanceSummaryDoc) {
                console.log('Found existing entry for attendance summary. Updating...');
                attendanceSummaryDoc.attendanceSummary.totalClassesConducted = (attendanceSummaryDoc.attendanceSummary.totalClassesConducted || 0) + 1;
                attendanceSummaryDoc.attendanceSummary.dates.set(today, (attendanceSummaryDoc.attendanceSummary.dates.get(today) || 0) + 1);

                let subjectFound = false;
                for (let sub of attendanceSummaryDoc.attendanceSummary.subjects) {
                    if (sub.name === subject) {
                        sub.totalClassesConducted = (sub.totalClassesConducted || 0) + 1;
                        subjectFound = true;
                        break;
                    }
                }
                if (!subjectFound) {
                    attendanceSummaryDoc.attendanceSummary.subjects.push({ name: subject, totalClassesConducted: 1 });
                }
                await attendanceSummaryDoc.save();
            } else {
                console.log('No existing entry found for attendance summary. Creating new entry...');
                const newSummaryEntry = new AttendanceSummary({
                    department,
                    semester,
                    section,
                    attendanceSummary: {
                        subjects: [{ name: subject, totalClassesConducted: 1 }],
                        totalClassesConducted: 1,
                        dates: {
                            [today]: 1
                        }
                    }
                });
                await newSummaryEntry.save();
            }
            console.log('SUCCESS: AttendanceSummary data updated successfully.');
        } catch (error) {
            console.error('Error updating AttendanceSummary:', error.message);
            throw error; // Re-throw to be caught by the main catch block
        }


        // --- 4. Handle RollNumberAttendance ---
        console.log('Attempting to save initial RollNumberAttendance entry...');
        const newRollNumberAttendance = new RollNumberAttendance(dataToSave);
        await newRollNumberAttendance.save();
        console.log('SUCCESS: Initial RollNumberAttendance entry created.');

        res.status(200).json({
            message: 'Period data saved, updated, and attendance summary updated successfully!',
            token: uniqueToken,
            periodData: dataToSave
        });

    } catch (error) {
        console.error('--- FATAL ERROR IN ATTENDANCEROUTES ---');
        console.error('Error processing request in attendanceRoutes:', error);
        res.status(500).json({ message: 'Failed to process request', error: error.message });
    }
});

module.exports = router;
