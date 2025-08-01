const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        const token = jwt.sign(
          { id: admin._id, email: admin.email, role: 'admin' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );
        
        return res.json({
          success: true,
          token,
          user: {
            id: admin._id,
            email: admin.email,
            role: 'admin',
            firstName: admin.firstName
          }
        });
      }
    }

    // Check if employee
    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (employee) {
      const isMatch = await bcrypt.compare(password, employee.password);
      if (isMatch) {
        const token = jwt.sign(
          { id: employee._id, email: employee.email, role: 'employee' },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );
        
        return res.json({
          success: true,
          token,
          user: {
            id: employee._id,
            email: employee.email,
            role: 'employee',
            firstName: employee.firstName,
            taskCounts: employee.taskCounts,
            tasks: employee.tasks
          }
        });
      }
    }

    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register employee route (admin only)
router.post('/register', async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (existingEmployee || existingAdmin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new employee
    const employee = new Employee({
      firstName,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      employee: {
        id: employee._id,
        firstName: employee.firstName,
        email: employee.email,
        taskCounts: employee.taskCounts
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public employee registration route
router.post('/register/employee', async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    if (!firstName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (existingEmployee || existingAdmin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new employee
    const employee = new Employee({
      firstName,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await employee.save();

    // Generate token for auto-login
    const token = jwt.sign(
      { id: employee._id, email: employee.email, role: 'employee' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Employee registered successfully',
      token,
      user: {
        id: employee._id,
        email: employee.email,
        role: 'employee',
        firstName: employee.firstName,
        taskCounts: employee.taskCounts,
        tasks: employee.tasks
      }
    });
  } catch (error) {
    console.error('Employee registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public admin registration route (with validation key)
router.post('/register/admin', async (req, res) => {
  try {
    const { firstName, email, password, adminKey } = req.body;

    if (!firstName || !email || !password || !adminKey) {
      return res.status(400).json({ message: 'All fields including admin key are required' });
    }

    // Validate admin key (you can change this secret key)
    const ADMIN_REGISTRATION_KEY = process.env.ADMIN_REGISTRATION_KEY || 'ADMIN_SECRET_2025';
    if (adminKey !== ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({ message: 'Invalid admin registration key' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Admin password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() });
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (existingEmployee || existingAdmin) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12; // Higher security for admin
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new admin
    const admin = new Admin({
      firstName,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await admin.save();

    // Generate token for auto-login
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: 'admin',
        firstName: admin.firstName
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists in either Employee or Admin collection
    let user = await Employee.findOne({ email });
    let userType = 'employee';
    
    if (!user) {
      user = await Admin.findOne({ email });
      userType = 'admin';
    }

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        message: 'If the email exists in our system, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send email
    try {
      const emailResult = await emailService.sendPasswordResetEmail(
        user.email, 
        resetToken, 
        user.firstName
      );
      
      console.log(`✅ Password reset initiated for ${userType}:`, user.email);
      
      res.status(200).json({ 
        message: 'If the email exists in our system, a password reset link has been sent.',
        ...(process.env.NODE_ENV === 'development' && { resetUrl: emailResult.resetUrl })
      });
      
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // Clear the reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      res.status(500).json({ 
        message: 'Failed to send password reset email. Please try again later.' 
      });
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Reset Password Route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with valid reset token in either collection
    let user = await Employee.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    let userType = 'employee';
    
    if (!user) {
      user = await Admin.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      userType = 'admin';
    }

    if (!user) {
      return res.status(400).json({ 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`✅ Password reset successful for ${userType}:`, user.email);

    // Send confirmation email (optional, don't fail if it doesn't work)
    try {
      await emailService.sendPasswordChangeConfirmation(user.email, user.firstName);
    } catch (emailError) {
      console.error('⚠️ Confirmation email failed (non-critical):', emailError);
    }

    res.status(200).json({ 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
