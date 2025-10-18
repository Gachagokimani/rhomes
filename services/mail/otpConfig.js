const nodemailer = require('nodemailer');
const { generateOTP, verifyOTP, cleanupExpiredOTPs } = require('./otpService');
const { sendOTPEmailTemplate, resendOTPEmailTemplate } = require('./emailTemplates');
const { validateEmail, validateOTP } = require('./validator');

// Nodemailer transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
    // Additional settings for better deliverability
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5
  });
};

const transporter = createTransporter();

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

class  OTPManager {
  constructor() {
    this.transporter = transporter;
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
    this.maxResendAttempts = parseInt(process.env.MAX_RESEND_ATTEMPTS) || 3;
    this.resendCooldownMinutes = parseInt(process.env.RESEND_COOLDOWN_MINUTES) || 2;
  }

  /**
   * Generate and send OTP to user email
   */
  async sendOTP(email, purpose = 'account_verification') {
    try {
      // Validate email
      if (!validateEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Generate OTP
      const otpData = await generateOTP(email, purpose, this.otpExpiryMinutes);
      
      // Send email
      await this.sendOTPEmail(email, otpData.otp, purpose);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        resendAllowed: true,
        cooldown: this.resendCooldownMinutes * 60 * 1000 // in milliseconds
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  /**
   * Resend OTP with cooldown check
   */
  async resendOTP(email, purpose = 'account_verification') {
    try {
      if (!validateEmail(email)) {
        throw new Error('Invalid email address');
      }

      // Check resend cooldown and attempts (implementation depends on your storage)
      const canResend = await this.canResendOTP(email);
      if (!canResend.allowed) {
        throw new Error(`Please wait ${canResend.remainingTime} before requesting a new OTP`);
      }

      // Generate new OTP
      const otpData = await generateOTP(email, purpose, this.otpExpiryMinutes);
      
      // Send resend email
      await this.sendResendOTPEmail(email, otpData.otp, purpose);
      
      return {
        success: true,
        message: 'OTP resent successfully',
        resendAllowed: true,
        cooldown: this.resendCooldownMinutes * 60 * 1000
      };
    } catch (error) {
      console.error('Error resending OTP:', error);
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(email, otp, purpose = 'account_verification') {
    try {
      // Validate inputs
      if (!validateEmail(email)) {
        throw new Error('Invalid email address');
      }
      
      if (!validateOTP(otp)) {
        throw new Error('Invalid OTP format');
      }

      const isValid = await verifyOTP(email, otp, purpose);
      
      if (isValid) {
        return {
          success: true,
          message: 'OTP verified successfully',
          verified: true
        };
      } else {
        return {
          success: false,
          message: 'Invalid or expired OTP',
          verified: false
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email, otp, purpose) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Your App Name',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `Your Verification Code - ${process.env.APP_NAME || 'Our Service'}`,
      html: sendOTPEmailTemplate(otp, this.otpExpiryMinutes, purpose)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}:`, result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Send resend OTP email
   */
  async sendResendOTPEmail(email, otp, purpose) {
    const mailOptions = {
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Your App Name',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `Your New Verification Code - ${process.env.APP_NAME || 'Our Service'}`,
      html: resendOTPEmailTemplate(otp, this.otpExpiryMinutes, purpose)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Resend OTP email sent to ${email}:`, result.messageId);
      return result;
    } catch (error) {
      console.error('Failed to send resend OTP email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Check if OTP can be resent
   */
  async canResendOTP(email) {
    // This should check your database/storage for recent OTP requests
    // For now, returning always allowed - implement based on your storage
    return {
      allowed: true,
      remainingTime: 0
    };
  }

  /**
   * Clean up expired OTPs
   */
  async cleanup() {
    try {
      await cleanupExpiredOTPs();
      console.log('Expired OTPs cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }
}

// Create singleton instance
const otpManager = new OTPManager();

// Cleanup expired OTPs every hour
setInterval(() => {
  otpManager.cleanup();
}, 60 * 60 * 1000);
export {otpManager};
module.exports = otpManager;