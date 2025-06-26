// C:\Users\saisa\OneDrive\Desktop\Project4.0\backend\node-server\controllers\studentController.js (Updated for MongoDB Integration)
// Removed fs and path imports as file system operations are replaced by Mongoose
// const fs = require('fs');
// const path = require('path');

// Import the Student Mongoose model
const Student = require('../models/Student'); // Adjust path as needed for your project structure

// Helper functions for file operations are no longer needed
// const readStudents = () => { ... };
// const writeStudents = (students) => { ... };


// Exports all students from MongoDB
exports.getAllStudents = async (req, res) => { // Made async
    try {
        // Find all students in the MongoDB collection
        const students = await Student.find({ role: 'student' }).lean(); // .lean() for plain JS objects

        res.json(students);
    } catch (error) {
        console.error('Error retrieving all students from MongoDB:', error.message);
        res.status(500).json({ message: 'Failed to retrieve students from database', error: error.message });
    }
};

// Updates a specific student's data in MongoDB by ID
exports.updateStudent = async (req, res) => { // Made async
    const { id } = req.params; // 'id' from URL parameter (e.g., /students/:id)
    const updatedStudentData = req.body;

    // --- Backend Validation ---
    const { rollNumber, name, email, department, year, section, semester, phone } = updatedStudentData;

    // Check if all required fields are present in the incoming data
    if (!rollNumber || !name || !email || !department || !year || !section || !semester || !phone) {
        const missingFields = [];
        if (!rollNumber) missingFields.push('rollNumber');
        if (!name) missingFields.push('name');
        if (!email) missingFields.push('email');
        if (!department) missingFields.push('department');
        if (!year) missingFields.push('year');
        if (!section) missingFields.push('section');
        if (!semester) missingFields.push('semester');
        if (!phone) missingFields.push('phone');
        console.error('Missing fields in update request:', missingFields);
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}.`, details: updatedStudentData });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Invalid 10-digit Indian phone number format.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email address format.' });
    }
    // --- End Backend Validation ---

    try {
        // Find the student by their 'id' field (which corresponds to the 'id' in your schema, not Mongoose's _id)
        const existingStudent = await Student.findOne({ id: id });

        if (!existingStudent) {
            return res.status(404).json({ message: `Student with ID ${id} not found.` });
        }

        // Check for duplicate rollNumber or email if they are being changed to an existing one
        if (rollNumber !== existingStudent.rollNumber) {
            const rollNumberExists = await Student.findOne({ rollNumber: rollNumber, id: { $ne: id } });
            if (rollNumberExists) {
                return res.status(409).json({ message: `Student with Roll Number ${rollNumber} already exists.` });
            }
        }
        if (email.toLowerCase() !== existingStudent.email) { // Compare lowercase emails
            const emailExists = await Student.findOne({ email: email.toLowerCase(), id: { $ne: id } });
            if (emailExists) {
                return res.status(409).json({ message: `Student with email ${email} already exists.` });
            }
        }


        // Update the student document in MongoDB
        // Use findOneAndUpdate to find by 'id' and update the document
        // We're specifically setting fields that can be updated. Password and Role are typically not updated via this route.
        const updatedStudent = await Student.findOneAndUpdate(
            { id: id }, // Find by the 'id' field in the document
            {
                $set: { // Use $set to update specific fields
                    rollNumber,
                    name,
                    email: email.toLowerCase(), // Ensure email is stored lowercase
                    department,
                    year,
                    section,
                    semester,
                    phone,
                    // Note: 'password' and 'role' are typically not updated here.
                    // If they can be, add them to $set.
                }
            },
            { new: true, runValidators: true } // new: true returns the updated document, runValidators: true runs schema validators
        ).lean(); // .lean() for plain JS object

        if (!updatedStudent) {
            // This case should ideally not happen if existingStudent was found, but good for robustness
            return res.status(404).json({ message: `Student with ID ${id} not found after update attempt.` });
        }

        res.json({ message: 'Student updated successfully', student: updatedStudent });

    } catch (error) {
        console.error('Error during student update in MongoDB:', error.message);
        res.status(500).json({ message: 'Failed to update student in database.', error: error.message });
    }
};
