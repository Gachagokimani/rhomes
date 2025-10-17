import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import otpGenerator from 'otp-generator';
import logger from '../../backend/logger.js';
import User from '../models/User.js';
import otpStore from '../utils/otpStore.js';

// Generate OTP
const generateOTP = () => {
  return otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

// Nodemailer transporter factory
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login OTP</h2>
          <p>Your One-Time Password (OTP) for login is:</p>
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    logger.error('Error sending OTP email', { message: error.message });
    throw error;
  }
};

// Register user
export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, name });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    logger.error('Register error', { message: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// Request OTP
export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    const otpData = { otp, expires: Date.now() + 10 * 60 * 1000 };
    // Store OTP in Redis (or memory fallback)
    await otpStore.setOtp(`otp:${email}`, otpData, 10 * 60);

    await sendOTPEmail(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    logger.error('Request OTP failed', { message: error.message });
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

// Verify OTP and login
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stored = await otpStore.getOtp(`otp:${email}`);
    if (!stored || !stored.otp || stored.expires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Remove OTP and mark as verified
    await otpStore.delOtp(`otp:${email}`);
    user.isVerified = true;
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user._id, email: user.email, isVerified: user.isVerified } });
  } catch (error) {
    logger.error('Verify OTP failed', { message: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  register,
  requestOtp,
  verifyOtp
};
