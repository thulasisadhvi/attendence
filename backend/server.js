// server.js (Updated for MongoDB Integration)
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/login');
const periodRoutes = require('./routes/periodroutes');
const periodRouter = require('./routes/period');
const studentRoutes = require('./routes/studentRoutes');
const dashboard = require('./routes/DashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const historyRoutes = require('./routes/historyRoutes');
const registerRoutes = require('./routes/registerRoutes');
const viewroutes = require('./routes/viewroutes'); // Adjust path
const locationController = require('./controllers/locationController');
const attendanceController = require('./controllers/updatecontroller');

// Import the MongoDB connection function
const connectDB = require('./db'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(cors());
app.use(express.json());

// --- File System Checks (keeping non-auth related ones) ---
const savePeriodFilePath = path.join(__dirname, 'save-period.json');
const totalAttendanceFilePath = path.join(__dirname, 'controllers', 'totalattendance.json');
// const studentsFilePath = path.join(__dirname, 'students.json'); // No longer needed for auth data from JSON files
const imagesFolderPath = path.join(__dirname, 'images');

// Ensure saveperiod.json exists
if (!fs.existsSync(savePeriodFilePath)) {
    console.log('Creating empty saveperiod.json');
    fs.writeFileSync(savePeriodFilePath, '[]', 'utf8');
}

// Ensure totalattendance.json exists
if (!fs.existsSync(totalAttendanceFilePath)) {
    console.log('Creating empty totalattendance.json');
    fs.writeFileSync(totalAttendanceFilePath, '[]', 'utf8');
}

// NOTE: If 'students.json' is still used for other parts of your application (e.g., student management beyond login),
// you might want to keep its existence check and potentially migrate that data to MongoDB as well later.
// For now, it's commented out as it's no longer the source of truth for authentication.
// if (!fs.existsSync(studentsFilePath)) {
//     console.log('Creating empty students.json');
//     fs.writeFileSync(studentsFilePath, '[]', 'utf8');
// }

// Ensure images folder exists
if (!fs.existsSync(imagesFolderPath)) {
    console.log('Creating images folder.');
    fs.mkdirSync(imagesFolderPath, { recursive: true });
}
// --- END File System Checks ---

// Route Middlewares
app.use('/api/student', dashboard);
app.use('/images', express.static(path.join(__dirname, 'images'))); // Ensure this line is correct for serving images
app.use('/api/students', studentRoutes);
app.use('/api', authRoutes); // This now uses the updated loginController
app.use('/api/period', periodRoutes);
app.use('/api/period', periodRouter);
app.use('/api/history', historyRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', registerRoutes);
app.use('/api/view', viewroutes);
app.post('/api/verify-location', locationController.verifyLocation);
app.post('/api/mark-attendance', attendanceController.markAttendance);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
