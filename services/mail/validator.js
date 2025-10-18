/**
 * Validate email address
 */
exports.validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate OTP format
 */
exports.validateOTP = (otp, length = 6) => {
  if (!otp || typeof otp !== 'string') return false;
  
  const otpRegex = new RegExp(`^\\d{${length}}$`);
  return otpRegex.test(otp.trim());
};

/**
 * Validate purpose
 */
exports.validatePurpose = (purpose) => {
  const validPurposes = [
    'account_verification',
    'password_reset', 
    'email_change',
    'two_factor_auth'
  ];
  
  return validPurposes.includes(purpose);
};