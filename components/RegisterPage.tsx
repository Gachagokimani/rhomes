import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { useAuth } from '../store';
import { Button, Input, Alert, Select } from '../ui';

// API service functions (create this in a separate service file)
const authService = {
  // Send OTP for registration
  async sendOTP(email: string, purpose: string = 'account_verification') {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, purpose }),
    });
    return response.json();
  },

  // Verify OTP and complete registration
  async verifyOTP(email: string, otp: string, purpose: string = 'account_verification') {
    const response = await fetch('/api/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, purpose }),
    });
    return response.json();
  },

  // Complete user registration after OTP verification
  async completeRegistration(userData: any) {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Resend OTP
  async resendOTP(email: string, purpose: string = 'account_verification') {
    const response = await fetch('/api/resend-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, purpose }),
    });
    return response.json();
  }
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth(); // Remove requestOtp from useAuth since we're handling it here
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.TENANT,
    password: '',
    confirmPassword: '',
    bio: '',
    phone: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);
      
      // Send OTP for verification
      const otpResult = await authService.sendOTP(formData.email, 'account_verification');
      
      if (otpResult.success) {
        setStep('otp');
        setMessage({ 
          type: 'success', 
          text: `Verification code sent to ${formData.email}. Please check your inbox.` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: otpResult.message || 'Failed to send verification code. Please try again.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to send verification code. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    if (otp.length !== 6) {
      setMessage({ type: 'error', text: 'Verification code must be 6 digits' });
      return;
    }

    try {
      setIsLoading(true);
      setMessage(null);

      // First verify the OTP
      const verifyResult = await authService.verifyOTP(formData.email, otp, 'account_verification');
      
      if (!verifyResult.verified) {
        setMessage({ 
          type: 'error', 
          text: verifyResult.message || 'Invalid verification code. Please try again.' 
        });
        return;
      }

      // OTP verified, now complete registration
      const registerResult = await authService.completeRegistration(formData);
      
      if (registerResult.success) {
        // Auto-login the user after successful registration
        const loginSuccess = await login(formData.role, formData.email, formData.password);
        
        if (loginSuccess) {
          setMessage({ 
            type: 'success', 
            text: 'Registration successful! Redirecting...' 
          });
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setMessage({ 
            type: 'success', 
            text: 'Registration successful! Please login with your credentials.' 
          });
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } else {
        setMessage({ 
          type: 'error', 
          text: registerResult.message || 'Registration failed. Please try again.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      
      const result = await authService.resendOTP(formData.email, 'account_verification');
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: 'Verification code sent again!' 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: result.message || 'Failed to resend code. Please try again.' 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to resend code.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Step UI
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
              <p className="mt-2 text-sm text-gray-600">
                Enter the verification code sent to <strong>{formData.email}</strong>
              </p>
            </div>

            {message && (
              <Alert variant={message.type} onClose={() => setMessage(null)}>
                {message.text}
              </Alert>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <Input
                label="Verification Code"
                type="text"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  // Allow only numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                }}
                placeholder="Enter 6-digit code"
                required
                disabled={isLoading}
                maxLength={6}
                pattern="[0-9]{6}"
              />

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="w-full"
              >
                Verify & Complete Registration
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="font-medium text-purple-600 hover:text-purple-500 disabled:opacity-50"
                >
                  Resend Code
                </button>
              </p>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep('form');
                  setMessage(null);
                }}
                className="w-full"
                disabled={isLoading}
              >
                Back to Registration
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form UI
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Join {process.env.REACT_APP_NAME || 'RentHub'} today
            </p>
          </div>

          {message && (
            <Alert variant={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              error={errors.name}
              required
              disabled={isLoading}
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              error={errors.email}
              required
              disabled={isLoading}
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
              error={errors.phone}
              required
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                I am a
              </label>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                options={[
                  { value: UserRole.TENANT, label: 'Tenant - Looking for a room' },
                  { value: UserRole.LANDLORD, label: 'Landlord - Renting out rooms' }
                ]}
                disabled={isLoading}
              />
            </div>

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              error={errors.password}
              required
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              error={errors.confirmPassword}
              required
              disabled={isLoading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio (Optional)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us a bit about yourself..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">What you get:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ Access to verified room listings</li>
                <li>✓ Secure messaging with {formData.role === UserRole.TENANT ? 'landlords' : 'tenants'}</li>
                <li>✓ Save your favorite rooms</li>
                <li>✓ Get instant notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};