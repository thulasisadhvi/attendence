// routes/registerRoutes.js
const express = require('express');
const router = express.Router(); // Create a new router instance

// Import the controller functions
const registerController = require('../controllers/registerController');

// Define the registration route
// This route will handle POST requests to /api/register-student
router.post('/register-student', registerController.registerStudent);

module.exports = router; // Export the router