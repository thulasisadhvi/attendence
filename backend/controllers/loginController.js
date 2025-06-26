// loginController.js (Updated for MongoDB Integration - Console Logs Removed)
const jwt = require('jsonwebtoken');

// Import the Mongoose models
const Student = require('../models/Student'); // Adjust path as needed
const Faculty = require('../models/Faculty'); // Adjust path as needed

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const login = async (req, res) => {
  const { email, empId, password, role } = req.body;

  // 🔐 Input validation
  if (!role || !password) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (role === 'student' && !email) {
    return res.status(400).json({ success: false, message: 'Missing student email' });
  }

  if (role === 'faculty' && !empId) {
    return res.status(400).json({ success: false, message: 'Missing employee ID for faculty/admin' });
  }

  try {
    let user = null;

    // 🔍 Find user in MongoDB based on role
    if (role === 'student') {
      const studentEmail = email ? email.toLowerCase() : ''; // Ensure email is lowercase for query
      user = await Student.findOne({ email: studentEmail });
    } else if (role === 'faculty') {
      // empId will be used as-is, matching exact casing in your MongoDB document
      user = await Faculty.findOne({ empId: empId });
    } else {
      // If an invalid role is sent, return an error
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or role mismatch' });
    }

    // 🔐 Password match (plaintext for now - seriously consider bcrypt for production!)
    // In a real application, you would hash the password and compare hashes:
    // const isMatch = await bcrypt.compare(password, user.password);
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // Determine redirect URL based on the user's actual role from the database
    let redirectUrl = '/'; // Default redirect URL

    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'faculty') {
      redirectUrl = '/'; // Assuming a specific faculty dashboard path
    } else if (user.role === 'student') {
      redirectUrl = '/student/dashboard';
    }


    // 🧾 Create JWT
    const token = jwt.sign(
      {
        name: user.name,
        role: user.role, // The actual role ('admin', 'faculty', 'student') will be in the token
        email: user.email || '',
        empId: user.empId || '',
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // ✅ Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        role: user.role, // Send the actual role back to the frontend
        email: user.email || '',
        empId: user.empId || '',
      },
      redirectUrl, // Include the determined redirect URL
    });

  } catch (err) {
    console.error('Login error:', err); // Keeping essential error logging
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
};

module.exports = login;
