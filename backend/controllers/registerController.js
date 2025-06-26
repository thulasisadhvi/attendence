// controllers/registerController.js (Updated for MongoDB Integration)
// Removed fs and path imports as file system operations are replaced by Mongoose
// const fs = require('fs').promises;
// const path = require('path');

// Import the Student Mongoose model
const Student = require('../models/Student'); // Adjust path as needed

// Main controller function for student registration
exports.registerStudent = async (req, res) => {
    const { rollNumber, name, email, department, year, section, phone, semester } = req.body;

    // --- Server-side Validation ---
    if (!rollNumber || !name || !email || !department || !year || !section || !phone || !semester) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    // Validate rollNumber format (customize as needed)
    if (!/^[A-Za-z0-9]+$/.test(rollNumber)) {
        return res.status(400).json({ error: 'Invalid Roll Number format.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Validate Indian phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit Indian phone number (starts with 6-9).' });
    }

    try {
        // Check if student with this roll number or email already exists in MongoDB
        const existingStudentByRollNumber = await Student.findOne({ rollNumber });
        if (existingStudentByRollNumber) {
            return res.status(409).json({ error: `Student with Roll Number ${rollNumber} already exists.` });
        }

        const existingStudentByEmail = await Student.findOne({ email: email.toLowerCase() }); // Ensure consistent casing for email
        if (existingStudentByEmail) {
            return res.status(409).json({ error: `Student with email ${email} already exists.` });
        }

        // Create a new student object directly for Mongoose
        const newStudentData = {
            // FIX: Add the 'id' field back, generating a unique ID like your original JSON
            id: Date.now().toString(),
            rollNumber,
            name,
            email: email.toLowerCase(), // Store email in lowercase for consistency
            password: '12345678', // Default plaintext password. Hashing recommended for production!
            department,
            year,
            section,
            semester,
            phone,
            role: 'student'      // Default role
        };

        // Create and save the new student document to MongoDB
        const registeredStudent = await Student.create(newStudentData);

        console.log('Successfully registered student details in MongoDB:', registeredStudent.rollNumber, registeredStudent.name);

        // Send a success response. Avoid sending sensitive data like password.
        res.status(201).json({ message: 'Student details registered successfully!', student: {
            // Return only safe student details
            id: registeredStudent.id, // Now returning the 'id' field
            _id: registeredStudent._id, // Also returning Mongoose's generated ID
            rollNumber: registeredStudent.rollNumber,
            name: registeredStudent.name,
            email: registeredStudent.email,
            department: registeredStudent.department,
            year: registeredStudent.year,
            section: registeredStudent.section,
            semester: registeredStudent.semester,
            phone: registeredStudent.phone,
            role: registeredStudent.role
        }});
    } catch (error) {
        console.error('Error during student registration to MongoDB:', error);
        res.status(500).json({ error: 'Internal server error during student registration.' });
    }
};
