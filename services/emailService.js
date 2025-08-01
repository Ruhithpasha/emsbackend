const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter - using Gmail as an example
    // You can configure this for other email providers
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Fallback to console logging if email credentials are not configured
    this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    if (!this.isConfigured) {
      console.log('⚠️  Email service not configured. Reset tokens will be logged to console.');
    }
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@kgn-it.com',
      to: email,
      subject: 'Password Reset Request - KGN IT Solutions',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%); }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>KGN IT Solutions - Employee Management</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName || 'User'},</h2>
              <p>We received a request to reset your password for your KGN IT Solutions account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="background: #e5e7eb; padding: 10px; border-radius: 5px; word-break: break-all;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in 1 hour for security reasons</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you continue to have problems, please contact our IT support team.</p>
              
              <p>Best regards,<br>
              <strong>KGN IT Solutions Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 KGN IT Solutions. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      if (this.isConfigured) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } else {
        // For development - log the reset token to console
        console.log('🔗 Password Reset Token (DEV MODE):');
        console.log('Email:', email);
        console.log('Reset URL:', resetUrl);
        console.log('Token:', resetToken);
        console.log('Expires in 1 hour');
        return { success: true, messageId: 'dev-mode', resetUrl };
      }
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendPasswordChangeConfirmation(email, firstName) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@kgn-it.com',
      to: email,
      subject: 'Password Changed Successfully - KGN IT Solutions',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .info { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Changed Successfully</h1>
              <p>KGN IT Solutions - Employee Management</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName || 'User'},</h2>
              <p>Your password has been successfully changed.</p>
              
              <div class="info">
                <strong>ℹ️ Security Information:</strong>
                <ul>
                  <li>Password changed on: ${new Date().toLocaleString()}</li>
                  <li>If you didn't make this change, please contact IT support immediately</li>
                  <li>We recommend using a strong, unique password</li>
                </ul>
              </div>
              
              <p>You can now log in to your account using your new password.</p>
              
              <p>Best regards,<br>
              <strong>KGN IT Solutions Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 KGN IT Solutions. All rights reserved.</p>
              <p>Need help? Contact: support@kgn-it.com</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      if (this.isConfigured) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Password change confirmation sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } else {
        console.log('📧 Password change confirmation (DEV MODE):', email);
        return { success: true, messageId: 'dev-mode' };
      }
    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      // Don't throw error for confirmation emails
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
