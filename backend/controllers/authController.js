const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendMail, otpEmailTemplate } = require('../utils/mailer');
const { notify } = require('../services/notificationService');

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'srh_jwt_secret_key_default',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name, email, password, role,
      startupName, businessDomain, startupStage, location,
      problem, productService, mvpStatus, teamSize, targetCustomers,
      marketValidation, revenueStatus, businessRegistration, fundingRequirement,
      fundingStage, requiredExpertise, currentChallenges, startupGoals, needs,
      expertise, mentorDomain, experienceYears, company, linkedinProfile, bio
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Role safety: Public registration NEVER allows admin role
    const assignedRole = role === 'mentor' ? 'mentor' : 'founder';
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });

    if (user && user.isVerified) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const profileData = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      isVerified: false,
      isActive: true,
      // Founder fields
      startupName: startupName || '',
      businessDomain: businessDomain || req.body.industry || '',
      industry: businessDomain || req.body.industry || '',
      startupStage: startupStage || 'idea',
      location: location || '',
      problem: problem || '',
      productService: productService || '',
      mvpStatus: mvpStatus || 'not_started',
      teamSize: teamSize || '1-5',
      targetCustomers: targetCustomers || 'B2B',
      marketValidation: marketValidation || 'none',
      revenueStatus: revenueStatus || 'pre_revenue',
      businessRegistration: businessRegistration || 'unregistered',
      fundingRequirement: fundingRequirement || 'none',
      fundingStage: fundingStage || 'bootstrapped',
      requiredExpertise: requiredExpertise || '',
      currentChallenges: currentChallenges || '',
      startupGoals: startupGoals || '',
      needs: needs || '',
      // Mentor fields
      expertise: expertise || '',
      mentorDomain: mentorDomain || '',
      experienceYears: Number(experienceYears) || 0,
      company: company || '',
      linkedinProfile: linkedinProfile || '',
      bio: bio || ''
    };

    if (user && !user.isVerified) {
      Object.assign(user, profileData);
      await user.save();
    } else {
      user = await User.create(profileData);
    }

    // Generate secure OTP
    const otp = generateOtp();
    await Otp.create({
      email: user.email,
      otpCode: otp,
      purpose: 'verification',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
      lastSentAt: new Date(),
      attempts: 0
    });

    // Try sending email
    try {
      await sendMail(
        user.email,
        'Verify your email - Startup Resource Hub',
        `Hi ${name}, your verification code is: ${otp}`,
        otpEmailTemplate({ name, otp, purpose: 'verification' })
      );
    } catch (mailErr) {
      console.warn('⚠️ OTP mail send failed:', mailErr.message);
      return res.status(201).json({
        message: 'Account created! If you do not receive an email within 60s, please use "Resend OTP".',
        email: user.email,
        mailFailed: true
      });
    }

    res.status(201).json({
      message: 'Registration successful. A 6-digit OTP has been sent to your email.',
      email: user.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// POST /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
  try {
    const { email, purpose = 'verification' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email.' });

    // Enforce 60-second cooldown
    const latestOtp = await Otp.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });
    if (latestOtp && Date.now() - new Date(latestOtp.lastSentAt).getTime() < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - new Date(latestOtp.lastSentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSec}s before requesting a new code.` });
    }

    const otp = generateOtp();
    await Otp.create({
      email: normalizedEmail,
      otpCode: otp,
      purpose,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      attempts: 0
    });

    await sendMail(
      normalizedEmail,
      purpose === 'password_reset' ? 'Password Reset Code - Startup Resource Hub' : 'Verification Code - Startup Resource Hub',
      `Your code is: ${otp}`,
      otpEmailTemplate({ name: user.name, otp, purpose })
    );

    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to resend code', error: err.message });
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP code are required.' });

    const normalizedEmail = email.toLowerCase().trim();
    const tokenRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'verification',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!tokenRecord) {
      return res.status(400).json({ message: 'No active OTP found. Please request a new code.' });
    }

    if (tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    // Attempt limit check (Max 5 attempts)
    if (tokenRecord.attempts >= 5) {
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (tokenRecord.otpCode !== String(otp).trim()) {
      tokenRecord.attempts += 1;
      await tokenRecord.save();
      const remaining = 5 - tokenRecord.attempts;
      return res.status(400).json({
        message: `Incorrect code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked, please resend.'}`
      });
    }

    tokenRecord.isUsed = true;
    await tokenRecord.save();

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isVerified: true },
      { new: true }
    );

    await notify(user._id, {
      title: 'Welcome to Startup Resource Hub!',
      message: 'Your account is verified. Start exploring AI-matched grants, mentors, and tools.',
      type: 'system',
      link: '/dashboard'
    });

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email address to log in.',
        needsVerification: true,
        email: user.email
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated by an administrator.' });
    }

    const token = signToken(user);
    const safeUser = user.toObject();
    delete safeUser.passwordHash;

    res.json({
      token,
      user: safeUser
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Don't leak user existence; return standard message
      return res.json({ message: 'If an account exists with this email, a password reset code has been sent.' });
    }

    const otp = generateOtp();
    await Otp.create({
      email: normalizedEmail,
      otpCode: otp,
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date(),
      attempts: 0
    });

    await sendMail(
      normalizedEmail,
      'Password Reset Code - Startup Resource Hub',
      `Your password reset code is: ${otp}`,
      otpEmailTemplate({ name: user.name, otp, purpose: 'password_reset' })
    );

    res.json({
      message: 'If an account exists with this email, a password reset code has been sent.',
      email: normalizedEmail
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to process password reset', error: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP code, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const tokenRecord = await Otp.findOne({
      email: normalizedEmail,
      purpose: 'password_reset',
      isUsed: false
    }).sort({ createdAt: -1 });

    if (!tokenRecord) {
      return res.status(400).json({ message: 'Invalid or expired password reset request.' });
    }
    if (tokenRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Password reset code has expired. Please request a new one.' });
    }
    if (tokenRecord.attempts >= 5) {
      return res.status(429).json({ message: 'Too many failed attempts. Please request a new reset code.' });
    }

    if (tokenRecord.otpCode !== String(otp).trim()) {
      tokenRecord.attempts += 1;
      await tokenRecord.save();
      return res.status(400).json({ message: 'Incorrect reset code.' });
    }

    tokenRecord.isUsed = true;
    await tokenRecord.save();

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { passwordHash, isVerified: true },
      { new: true }
    );

    await notify(user._id, {
      title: 'Security Alert: Password Changed',
      message: 'Your account password was updated successfully.',
      type: 'system'
    });

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json(user);
};
