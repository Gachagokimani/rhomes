import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store';
import { Button, Alert, Input } from '../ui';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, verifyOtp, requestOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [email, setEmail] = useState(currentUser?.email || '');

  // Check if user is already verified
  useEffect(() => {
    if (currentUser?.isVerified) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the verification code' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const success = await verifyOtp(email, otp);
      if (success) {
        setMessage({ type: 'success', text: 'Email verified successfully! Redirecting...' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Invalid verification code. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Verification failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const success = await requestOtp(email);
      if (success) {
        setMessage({ type: 'success', text: 'Verification code sent to your email!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to send verification code. Please try again.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send verification code.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
            <p className="mt-2 text-sm text-gray-600">
              We sent a verification code to your email address
            </p>
          </div>

          {message && (
            <Alert variant={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            {!currentUser && (
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            )}

            <Input
              label="Verification Code"
              type="text"
              value={otp}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              disabled={loading}
              maxLength={6}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="font-medium text-purple-600 hover:text-purple-500 disabled:opacity-50"
              >
                Resend Verification Code
              </button>
            </p>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};