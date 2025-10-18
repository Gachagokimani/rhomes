// components/LoginForm.tsx
import React, { useState } from 'react';
import { Button, Input, Alert } from '../ui';
import { useAuth } from '../store';

interface LoginFormProps {
  onSuccess?: () => void;
  onRegisterClick?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onRegisterClick }) => {
  const { login, requestOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const success = await requestOtp(email);
      if (success) {
        setStep('otp');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
      console.error('OTP request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const success = await verifyOtp(email, otp);
      if (success) {
        onSuccess?.();
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      console.error('OTP verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'TENANT' | 'LANDLORD') => {
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(role);
      if (success) {
        onSuccess?.();
      } else {
        setError(`Quick login as ${role.toLowerCase()} failed. Please try OTP login.`);
      }
    } catch (err: any) {
      setError(err.message || `Quick login failed. Please try OTP login.`);
      console.error('Quick login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login to RHomes</h2>
      
      {error && (
        <Alert 
          message={error} 
          type="error" 
          onClose={() => setError('')} 
          className="mb-4"
        />
      )}

      {step === 'email' ? (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          
          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            variant="primary"
          >
            Send OTP
          </Button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleQuickLogin('TENANT')}
              disabled={isLoading}
              className="text-sm"
            >
              Quick Login as Tenant
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleQuickLogin('LANDLORD')}
              disabled={isLoading}
              className="text-sm"
            >
              Quick Login as Landlord
            </Button>
          </div>

          {onRegisterClick && (
            <div className="text-center mt-4">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-gray-600 text-center text-sm">
            We sent a verification code to <strong>{email}</strong>
          </p>
          
          <Input
            label="Enter OTP"
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={isLoading}
            required
            maxLength={6}
          />
          
          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            variant="primary"
          >
            Verify & Login
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            onClick={handleBackToEmail}
            disabled={isLoading}
            className="w-full"
          >
            Back to Email
          </Button>
        </form>
      )}
    </div>
  );
};