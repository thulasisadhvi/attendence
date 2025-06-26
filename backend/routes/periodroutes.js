// routes/periodRoutes.js (Updated for MongoDB Integration)
const express = require('express');
const router = express.Router();
// No longer need fs and path imports for data storage
// const fs = require('fs');
// const path = require('path');

// Import the Mongoose model
const PeriodLog = require('../models/PeriodLog'); // Adjust path as needed

// Function to calculate expiry based on timestamp
const isPeriodExpired = (timestampString) => {
    if (!timestampString) return true; // Treat as expired if no timestamp

    const entryTime = new Date(timestampString).getTime();
    const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
    const expiryTime = entryTime + FIVE_MINUTES_MS;
    const currentTime = new Date().getTime();

    return currentTime > expiryTime;
};

// Route to fetch the LATEST period data (for QRCodeDisplay.tsx)
router.get('/latest', async (req, res) => { // Made async
    try {
        // Find the latest period entry by timestamp
        // Assuming your PeriodLog has a 'timestamp' field.
        // sort({ timestamp: -1 }) gets the most recent, .limit(1) gets only one.
        const latestPeriodEntry = await PeriodLog.findOne().sort({ timestamp: -1 }).lean();

        if (!latestPeriodEntry) {
            return res.status(404).json({ message: 'No attendance data saved yet.' });
        }

        const expiredByTimestamp = isPeriodExpired(latestPeriodEntry.timestamp);

        if (expiredByTimestamp && latestPeriodEntry.status === "active") {
            // Update status to "expired" in the database
            await PeriodLog.findOneAndUpdate(
                { token: latestPeriodEntry.token }, // Find by token
                { $set: { status: "expired" } },     // Set status to expired
                { new: true }                        // Return the updated document
            );
            console.log(`Backend: Updated status for latest token ${latestPeriodEntry.token} to 'expired' during /latest fetch.`);
            // Update the in-memory object so the response is consistent
            latestPeriodEntry.status = "expired";
        }

        const entryTime = new Date(latestPeriodEntry.timestamp).getTime();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        const expiryTime = entryTime + FIVE_MINUTES_MS;
        const currentTime = new Date().getTime();
        const remainingMs = Math.max(0, expiryTime - currentTime);

        res.status(200).json({
            ...latestPeriodEntry,
            timeLeftSeconds: Math.round(remainingMs / 1000)
        });

    } catch (err) {
        console.error('Error fetching latest period data from MongoDB:', err);
        res.status(500).json({ message: 'Internal server error while fetching latest period data.' });
    }
});


// Route to fetch period data by SPECIFIC TOKEN (for VerifyAttendancePage.tsx)
router.get('/', async (req, res) => { // Made async
    const { token } = req.query; // Get token from query parameter

    if (!token) {
        return res.status(400).json({ message: 'Token is required.' });
    }

    try {
        // Find the period data by token in MongoDB
        const periodDetails = await PeriodLog.findOne({ token: token }).lean(); // .lean() for plain JS object

        if (!periodDetails) {
            return res.status(404).json({ message: 'Period data not found for this token.' });
        }

        // Check the current expiry status based on timestamp (live check)
        const expiredByTimestamp = isPeriodExpired(periodDetails.timestamp);

        if (expiredByTimestamp && periodDetails.status === "active") {
            periodDetails.status = "expired"; // Update in-memory object for consistent response
            // Update in the database
            await PeriodLog.findOneAndUpdate(
                { token: token },
                { $set: { status: "expired" } },
                { new: true }
            );
            console.log(`Backend: Updated status for token ${token} to 'expired' due to live timestamp check.`);
        } else if (!expiredByTimestamp && periodDetails.status === "expired") {
            console.warn(`Backend: Token ${token} is marked expired in DB but timestamp suggests it should be active. Maintaining 'expired' status.`);
            // Optionally, you might decide to reactivate it here if timestamp is the single source of truth
            // For now, mirroring the original behavior to maintain 'expired' if already marked so.
        }

        // IMPORTANT: Calculate time left for the frontend
        const entryTime = new Date(periodDetails.timestamp).getTime();
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        const expiryTime = entryTime + FIVE_MINUTES_MS;
        const currentTime = new Date().getTime();
        const remainingMs = Math.max(0, expiryTime - currentTime); // Ensure it's not negative

        res.status(200).json({
            ...periodDetails, // Send all details including token, timestamp, and status
            timeLeftSeconds: Math.round(remainingMs / 1000) // Add time left for frontend timer
        });

    } catch (err) {
        console.error('Error fetching period data by token from MongoDB:', err);
        res.status(500).json({ message: 'Internal server error while fetching period data.' });
    }
});

module.exports = router;
