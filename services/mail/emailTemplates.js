const appName = process.env.APP_NAME || 'Our Service';
const supportEmail = process.env.SUPPORT_EMAIL || 'support@example.com';

/**
 * Template for sending OTP email
 */
exports.sendOTPEmailTemplate = (otp, expiryMinutes, purpose) => {
  const purposeText = getPurposeText(purpose);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .otp-code { 
      font-size: 32px; 
      font-weight: bold; 
      text-align: center; 
      letter-spacing: 5px; 
      color: #2563eb;
      margin: 30px 0;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .expiry-note { 
      color: #dc2626; 
      font-weight: bold; 
      text-align: center;
    }
    .footer { 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    
    <h2>Verify Your Email Address</h2>
    
    <p>Hello,</p>
    
    <p>You're attempting to ${purposeText}. Use the verification code below to complete the process:</p>
    
    <div class="otp-code">${otp}</div>
    
    <p class="expiry-note">This code will expire in ${expiryMinutes} minutes.</p>
    
    <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Template for resending OTP email
 */
exports.resendOTPEmailTemplate = (otp, expiryMinutes, purpose) => {
  const purposeText = getPurposeText(purpose);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .otp-code { 
      font-size: 32px; 
      font-weight: bold; 
      text-align: center; 
      letter-spacing: 5px; 
      color: #2563eb;
      margin: 30px 0;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .note { 
      background: #fef3c7; 
      padding: 15px; 
      border-radius: 5px; 
      border-left: 4px solid #d97706;
    }
    .footer { 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 1px solid #e5e7eb; 
      text-align: center; 
      color: #6b7280; 
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    
    <h2>Your New Verification Code</h2>
    
    <p>Hello,</p>
    
    <p>As requested, here is your new verification code to ${purposeText}:</p>
    
    <div class="otp-code">${otp}</div>
    
    <div class="note">
      <p><strong>Note:</strong> This is a new verification code. Any previous codes are no longer valid.</p>
    </div>
    
    <p>This code will expire in ${expiryMinutes} minutes.</p>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Helper function to get purpose text
 */
function getPurposeText(purpose) {
  const purposes = {
    'account_verification': 'verify your account',
    'password_reset': 'reset your password',
    'email_change': 'verify your new email address',
    'two_factor_auth': 'complete two-factor authentication'
  };
  
  return purposes[purpose] || 'complete your verification';
}