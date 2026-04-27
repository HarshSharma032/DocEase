const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

// @desc    Register a new user (patient or admin)
// @route   POST /api/auth/register-user
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    let userExists = await User.findOne({ email });
    if (!userExists) {
      userExists = await Doctor.findOne({ email });
    }

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Patient'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(res, user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new doctor
// @route   POST /api/auth/register-doctor
// @access  Public
const registerDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, experience, feesPerCunsultation } = req.body;

    let userExists = await User.findOne({ email });
    if (!userExists) {
      userExists = await Doctor.findOne({ email });
    }

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const doctor = await Doctor.create({
      name,
      email,
      password,
      specialization,
      experience,
      feesPerCunsultation
    });

    if (doctor) {
      res.status(201).json({
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        status: doctor.status,
        token: generateToken(res, doctor._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid doctor data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let isDoctor = false;

    if (!user) {
      user = await Doctor.findOne({ email });
      isDoctor = true;
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isDoctor,
        status: isDoctor ? user.status : undefined,
        token: generateToken(res, user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh session using HTTPOnly cookie
// @route   GET /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  const token = req.cookies.jwt_refresh;
  
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no refresh token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const newAccessToken = generateToken(res, decoded.id);
    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, refresh token failed' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt_refresh', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  registerDoctor,
  loginUser,
  refreshToken,
  logoutUser
};
