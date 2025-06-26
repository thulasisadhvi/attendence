// backend/routes/historyRoutes.js (Updated for MongoDB Integration)
const express = require('express');
// No longer need fs and path for data storage
// const fs = require('fs');
// const path = require('path');

const router = express.Router();

// Import the Mongoose models
const PeriodLog = require('../models/PeriodLog');
const AttendanceSummary = require('../models/AttendanceSummary'); // Assuming this is your model for totalattendance.json

// Helper functions for file operations are no longer needed
// const readJsonFile = (filePath, defaultContent) => { ... };
// const writeJsonFile = (filePath, data) => { ... };


// GET route to fetch all historical period data, filtered by facultyName
router.get('/', async (req, res) => { // Made async
    const loggedInFacultyName = req.query.facultyName;

    if (!loggedInFacultyName) {
        return res.status(400).json({ message: 'Faculty name is required to fetch history.' });
    }

    try {
        // Find all period log entries. Assuming facultyName is a field in PeriodLog documents.
        // If facultyName is not directly in PeriodLog, you might need to adjust the query
        // or join with Faculty model (more complex, might not be necessary based on original JSON structure).
        // Based on original JSON, the facultyName was present in the period entry object.
        const filteredEntries = await PeriodLog.find({ facultyName: loggedInFacultyName }).lean(); // .lean() to get plain JS objects

        // The original JSON had entries wrapped in an array, e.g., { "TOKEN": [{ ... }] }.
        // With MongoDB, each token is likely its own document.
        // So, the .map and .filter for arrays from JSON are no longer directly applicable.
        // Assuming PeriodLog documents already contain the direct period details.

        res.json(filteredEntries);
    } catch (error) {
        console.error('Error fetching historical period data:', error);
        res.status(500).json({ message: 'Error retrieving historical period data.' });
    }
});

// DELETE route to remove a specific historical entry by its TOKEN
router.delete('/:token', async (req, res) => { // Made async
    const tokenToDelete = req.params.token;

    try {
        // 1. Find the PeriodLog entry to be deleted and delete it
        // The findOneAndDelete method returns the document that was deleted.
        const periodEntryToDelete = await PeriodLog.findOneAndDelete({ token: tokenToDelete }).lean();

        if (!periodEntryToDelete) {
            return res.status(404).json({ message: `Period entry with token ${tokenToDelete} not found.` });
        }

        console.log('Period entry to be deleted (from PeriodLog):', periodEntryToDelete);

        // Extract necessary details from the deleted period entry
        const { department, semester, section, subject, timestamp } = periodEntryToDelete;

        // Ensure timestamp is valid before creating Date object
        const classDate = new Date(timestamp).toISOString().split('T')[0]; // Extract YYYY-MM-DD date string

        // 2. Find and update the corresponding AttendanceSummary document
        // We will find the document, modify it in memory, and then save it.
        const targetSummary = await AttendanceSummary.findOne({
            department: department,
            semester: semester,
            section: section
        });

        if (targetSummary) {
            const attendanceSummary = targetSummary.attendanceSummary;

            // Decrement subject's totalClassesConducted
            const subjectObj = attendanceSummary.subjects.find(sub => sub.name && sub.name.trim() === subject.trim());
            if (subjectObj) {
                if (subjectObj.totalClassesConducted > 0) {
                    subjectObj.totalClassesConducted--;
                    console.log(`Decremented subject '${subject}' classes for ${department}-${semester}-${section}. New count: ${subjectObj.totalClassesConducted}`);
                } else {
                    console.warn(`Subject '${subject}' totalClassesConducted is already 0 or less for ${department}-${semester}-${section}.`);
                }
            } else {
                console.warn(`Subject '${subject}' not found in attendance summary for ${department}-${semester}-${section}.`);
            }

            // Decrement overall totalClassesConducted for the attendanceSummary
            if (attendanceSummary.totalClassesConducted > 0) {
                attendanceSummary.totalClassesConducted--;
                console.log(`Decremented overall totalClassesConducted for ${department}-${semester}-${section}. New total: ${attendanceSummary.totalClassesConducted}`);
            } else {
                console.warn(`Overall totalClassesConducted for ${department}-${semester}-${section} is already 0 or less.`);
            }

            // Decrement date count
            // Mongoose Map type allows direct manipulation
            if (attendanceSummary.dates && attendanceSummary.dates.has(classDate)) {
                let currentCount = attendanceSummary.dates.get(classDate);
                if (currentCount > 0) {
                    attendanceSummary.dates.set(classDate, currentCount - 1);
                    console.log(`Decremented class count for date '${classDate}'. New count: ${attendanceSummary.dates.get(classDate)}`);
                    if (attendanceSummary.dates.get(classDate) === 0) {
                        attendanceSummary.dates.delete(classDate); // Remove date key if count becomes 0
                        console.log(`Removed date '${classDate}' from attendance summary as its count reached 0.`);
                    }
                } else {
                    console.warn(`Date '${classDate}' count is already 0 or less for ${department}-${semester}-${section}.`);
                }
            } else {
                console.warn(`Date '${classDate}' not found in attendance summary for ${department}-${semester}-${section}.`);
            }
            
            // Save the updated AttendanceSummary document back to the database
            await targetSummary.save();
            console.log(`AttendanceSummary for ${department}-${semester}-${section} updated in DB.`);
        } else {
            console.warn(`Matching entry not found in AttendanceSummary for Department: ${department}, Semester: ${semester}, Section: ${section}. Cannot decrement counts.`);
        }

        res.status(200).json({ message: `Period entry with token ${tokenToDelete} deleted and attendance counts updated!` });

    } catch (error) {
        console.error('Error during deletion process:', error);
        res.status(500).json({ message: 'Internal server error during deletion.' });
    }
});

module.exports = router;
