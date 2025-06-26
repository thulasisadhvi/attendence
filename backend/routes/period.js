// backend/routes/period.js (Updated for MongoDB Integration)
const express = require('express');
// No longer need fs and path for period data storage
// const fs = require('fs');
// const path = require('path');

const router = express.Router();

// Import the Mongoose models
const ActivePeriod = require('../models/ActivePeriod'); // Path to your ActivePeriod model
const PeriodLog = require('../models/PeriodLog');     // Path to your PeriodLog model

// Helper function to check if the token is valid and not expired, and updates status if expired
// This function is kept largely the same to match the original logic, but it now expects
// a direct Mongoose document object (or null) as 'entry', not an array wrapper.
// The update to status in the object will be persisted by saving the document in the route.
const validateAndGetPeriod = (entry, requestedToken) => {
    // console.log(`[VALIDATE] validateAndGetPeriod called with entry type: ${typeof entry}, token: ${requestedToken}`);

    if (!entry) {
        // console.log(`[VALIDATE] Entry for token ${requestedToken} is NULL or UNDEFINED.`);
        return { isValid: false, message: 'QR code not found.' };
    }

    // Since we are now directly passing a Mongoose document, 'entry' will be an object.
    // The original logic's array handling is no longer strictly needed but is kept for robustness.
    let actualEntry;
    if (Array.isArray(entry)) {
        // console.log(`[VALIDATE] Entry for token ${requestedToken} is an ARRAY. Length: ${entry.length}`);
        if (entry.length === 0) {
            return { isValid: false, message: 'No entries found for this token.' };
        }
        actualEntry = entry[0]; // Get the actual attendance object from the array
    } else if (typeof entry === 'object' && entry !== null) {
        // console.log(`[VALIDATE] Entry for token ${requestedToken} is an OBJECT.`);
        actualEntry = entry;
    } else {
        console.error('[VALIDATE] Unexpected data type for entry in validateAndGetPeriod:', typeof entry);
        return { isValid: false, message: 'Malformed data encountered.' };
    }

    if (!actualEntry || actualEntry.token !== requestedToken) {
        // console.log(`[VALIDATE] Token mismatch or missing in actual entry. Expected: ${requestedToken}, Found: ${actualEntry ? actualEntry.token : 'none'}`);
        return { isValid: false, message: 'Token mismatch or missing.' };
    }

    if (!actualEntry.timestamp) {
        console.warn('[VALIDATE] Entry found without timestamp, considering it invalid for expiry check.');
        return { isValid: false, message: 'Timestamp missing for validation.' };
    }

    const entryTime = new Date(actualEntry.timestamp).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    // Check expiry based on timestamp
    if (currentTime > entryTime + fiveMinutes) {
        // console.log(`[VALIDATE] Token ${requestedToken} expired by timestamp (currentTime: ${currentTime}, entryTime: ${entryTime}, expiry: ${entryTime + fiveMinutes}).`);
        // We will mark status as expired and signal to the caller that an update is needed
        // The caller (route handler) will be responsible for saving this change to the DB.
        actualEntry.status = "expired";
        return { isValid: false, message: 'QR code expired. Please ask the faculty to regenerate.', statusUpdateNeeded: true, updatedData: actualEntry };
    }

    // Check status explicitly if already marked as expired
    if (actualEntry.status === "expired") {
        // console.log(`[VALIDATE] Token ${requestedToken} is already marked as expired.`);
        return { isValid: false, message: 'QR code is already marked as expired.' };
    }

    // console.log(`[VALIDATE] Token ${requestedToken} is valid and active.`);
    return { isValid: true, data: actualEntry }; // Return the entry if valid
};


// Route to get specific period data by token (reads from PeriodLog model)
router.get('/', async (req, res) => { // Made async to use await
    const { token } = req.query;
    // console.log(`[ROUTE /] Received request for token: ${token}`);

    if (!token) {
        return res.status(400).json({ message: 'Token is required to retrieve period data.' });
    }

    try {
        // Find the period log document by token
        const periodDoc = await PeriodLog.findOne({ token: token });
        // console.log(`[ROUTE /] PeriodLog lookup for token "${token}". Result:`, periodDoc ? 'Found' : 'Not Found');

        // Validate the period document
        const validationResult = validateAndGetPeriod(periodDoc, token);
        // console.log(`[ROUTE /] Validation result for token ${token}:`, validationResult);

        if (!validationResult.isValid) {
            // If the status was updated to expired and needs to be saved
            if (validationResult.statusUpdateNeeded && validationResult.updatedData) {
                await PeriodLog.findOneAndUpdate(
                    { token: token },
                    { $set: { status: "expired" } },
                    { new: true } // Return the updated document
                );
                // console.log(`[ROUTE /] Status for token ${token} updated to expired in PeriodLog.`);
            }
            return res.status(403).json({ message: validationResult.message });
        }

        // If found and valid, send the data
        res.json(validationResult.data);
        // console.log(`[ROUTE /] Sent valid data for token ${token} to client.`);

    } catch (error) {
        console.error('[ROUTE /] Error retrieving period data:', error.message);
        res.status(500).json({ message: 'Error retrieving period data.' });
    }
});

// Route to get the latest period data (for the faculty's immediate QR display)
// Reads from ActivePeriod model, then validates against PeriodLog
router.get('/latest', async (req, res) => { // Made async to use await
    // console.log('[ROUTE /latest] Received request for latest period data.');

    try {
        // Find the single active period document (assuming there's only one relevant active period)
        // You might store just one document and update it, or find the latest by creation date.
        // For simplicity, we'll assume a single document or find the most recently created one.
        const activePeriod = await ActivePeriod.findOne().sort({ createdAt: -1 }); // Get the latest one if multiple could exist
        // console.log('[ROUTE /latest] ActivePeriod lookup result:', activePeriod ? 'Found' : 'Not Found');

        if (!activePeriod || !activePeriod.token) {
            // console.log('[ROUTE /latest] No latest token found in ActivePeriod.');
            return res.status(404).json({ message: 'No latest token found.' });
        }

        const latestToken = activePeriod.token;
        // console.log(`[ROUTE /latest] Extracted token from ActivePeriod: ${latestToken}`);

        // Now, find the full period data from PeriodLog using the extracted token
        const periodDoc = await PeriodLog.findOne({ token: latestToken });
        // console.log(`[ROUTE /latest] PeriodLog lookup for latest token "${latestToken}". Result:`, periodDoc ? 'Found' : 'Not Found');

        if (!periodDoc) {
             // This case means activePeriod pointed to a token that doesn't exist in PeriodLog (data inconsistency)
             console.error(`[ROUTE /latest] ActivePeriod token "${latestToken}" not found in PeriodLog.`);
             return res.status(404).json({ message: 'Associated period data not found.' });
        }

        const validationResult = validateAndGetPeriod(periodDoc, latestToken);
        // console.log(`[ROUTE /latest] Validation result for token ${latestToken} from PeriodLog:`, validationResult);

        if (!validationResult.isValid) {
            // If the status was updated to expired and needs to be saved in PeriodLog
            if (validationResult.statusUpdateNeeded && validationResult.updatedData) {
                await PeriodLog.findOneAndUpdate(
                    { token: latestToken },
                    { $set: { status: "expired" } },
                    { new: true }
                );
                // console.log(`[ROUTE /latest] Status for token ${latestToken} updated to expired in PeriodLog.`);
            }
            // Also update the status in ActivePeriod if it became expired
            if (activePeriod.status !== "expired") {
                await ActivePeriod.findOneAndUpdate(
                    { token: latestToken }, // Find by this token
                    { $set: { status: "expired" } },
                    { new: true }
                );
                // console.log(`[ROUTE /latest] Status for latest period updated to expired in ActivePeriod.`);
            }
            return res.status(403).json({ message: validationResult.message });
        }

        // If found and valid, send the data
        res.json(validationResult.data);
        // console.log(`[ROUTE /latest] Sent valid data for token ${latestToken} to client from PeriodLog.`);

    } catch (error) {
        console.error('[ROUTE /latest] Error retrieving latest period data:', error.message);
        res.status(500).json({ message: 'Error retrieving latest period data.' });
    }
});

module.exports = router;
