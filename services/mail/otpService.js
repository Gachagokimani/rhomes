// In-memory storage for OTPs (replace with database in production)
const otpStorage = new Map();

/**
 * Generate a new OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

/**
 * Store OTP in storage
 */
const storeOTP = async (email, otp, purpose, expiresInMinutes) => {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const otpData = {
    otp,
    email,
    purpose,
    expiresAt,
    createdAt: new Date(),
    attempts: 0,
    maxAttempts: 5
  };

  // Store in memory (replace with database operation)
  otpStorage.set(`${email}_${purpose}`, otpData);
  
  return otpData;
};

/**
 * Generate and store OTP
 */
exports.generateOTP = async (email, purpose = 'account_verification', expiresInMinutes = 10) => {
  const otp = generateOTP();
  const otpData = await storeOTP(email, otp, purpose, expiresInMinutes);
  return otpData;
};

/**
 * Verify OTP
 */
exports.verifyOTP = async (email, otp, purpose = 'account_verification') => {
  const key = `${email}_${purpose}`;
  const otpData = otpStorage.get(key);

  if (!otpData) {
    return false;
  }

  // Check if OTP is expired
  if (new Date() > otpData.expiresAt) {
    otpStorage.delete(key);
    return false;
  }

  // Check attempt limit
  if (otpData.attempts >= otpData.maxAttempts) {
    otpStorage.delete(key);
    return false;
  }

  // Increment attempts
  otpData.attempts++;

  // Verify OTP
  if (otpData.otp === otp) {
    // OTP is valid, remove it from storage
    otpStorage.delete(key);
    return true;
  } else {
    // OTP is invalid, update storage
    otpStorage.set(key, otpData);
    return false;
  }
};

/**
 * Clean up expired OTPs
 */
exports.cleanupExpiredOTPs = async () => {
  const now = new Date();
  for (const [key, otpData] of otpStorage.entries()) {
    if (now > otpData.expiresAt) {
      otpStorage.delete(key);
    }
  }
};

/**
 * Get OTP data (for debugging)
 */
exports.getOTPData = (email, purpose = 'account_verification') => {
  return otpStorage.get(`${email}_${purpose}`);
};