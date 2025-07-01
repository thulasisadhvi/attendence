const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const login = async (req, res) => {
  const { email, empId, password, role } = req.body;

  console.log('💻 Login Attempt:', { email, empId, role }); // Log entered credentials (excluding password for security)

  if (!role || !password) {
    console.log('❌ Missing role or password');
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (role === 'student' && !email) {
    console.log('❌ Missing student email');
    return res.status(400).json({ success: false, message: 'Missing student email' });
  }

  if (role === 'faculty' && !empId) {
    console.log('❌ Missing faculty employee ID');
    return res.status(400).json({ success: false, message: 'Missing employee ID for faculty/admin' });
  }

  try {
    let user = null;

    if (role === 'student') {
      const studentEmail = email ? email.toLowerCase() : '';
      user = await Student.findOne({ email: studentEmail });
      console.log('🔍 Student Lookup Result:', user);
    } else if (role === 'faculty') {
      user = await Faculty.findOne({ empId: empId });
      console.log('🔍 Faculty Lookup Result:', user);
    } else {
      console.log('❌ Invalid role specified:', role);
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    if (!user) {
      console.log('❌ User not found or role mismatch');
      return res.status(401).json({ success: false, message: 'User not found or role mismatch' });
    }

    if (user.password !== password) {
      console.log('❌ Incorrect password');
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    let redirectUrl = '/';
    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'faculty') {
      redirectUrl = '/';
    } else if (user.role === 'student') {
      redirectUrl = '/student/dashboard';
    }

    const token = jwt.sign(
      {
        name: user.name,
        role: user.role,
        email: user.email || '',
        empId: user.empId || '',
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    console.log('✅ Login successful for:', user.role, '-', user.name);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        role: user.role,
        email: user.email || '',
        empId: user.empId || '',
      },
      redirectUrl,
    });

  } catch (err) {
    console.error('🔥 Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
};

module.exports = login;
