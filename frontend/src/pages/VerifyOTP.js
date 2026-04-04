import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OTPInput from '../components/OTPInput';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, purpose } = location.state || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    navigate('/login');
    return null;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setError(''); setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp, purpose });
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate(data.passwordExpired ? '/change-password' : '/dashboard');
      } else {
        setSuccess(data.message);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError('');
    try {
      await api.post('/auth/resend-otp', { email, purpose });
      setSuccess('New OTP sent to your email');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally { setResending(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>📧 Verify OTP</h2>
        <p className="subtitle">Enter the 6-digit code sent to {email}</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleVerify}>
          <OTPInput length={6} value={otp} onChange={setOtp} />
          <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <button className="btn-secondary" onClick={handleResend} disabled={resending}>
          {resending ? 'Sending...' : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;
