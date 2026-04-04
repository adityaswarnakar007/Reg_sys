import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OTPInput from '../components/OTPInput';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { checkPasswordStrength } from '../utils/passwordStrength';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || { email: '' };

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  if (!email) {
    navigate('/forgot-password');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { allRequired } = checkPasswordStrength(newPassword, '');
    if (!allRequired) {
      setError('New password does not meet requirements');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.error || 'Reset failed';
      const remaining = err.response?.data?.attemptsRemaining;
      setError(remaining !== undefined ? `${msg} (${remaining} attempts remaining)` : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { email, purpose: 'password_reset' });
      setSuccess('New code sent to your email');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>🔐 Set new password</h2>
        <p className="subtitle">Code sent to {email}</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>6-digit code</label>
            <OTPInput length={6} value={otp} onChange={setOtp} />
          </div>

          <div className="form-group">
            <label>New password</label>
            <input
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={newPassword} username="" />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
            {loading ? 'Updating…' : 'Reset password'}
          </button>
        </form>

        <button className="btn-secondary" onClick={handleResend} disabled={resending} type="button">
          {resending ? 'Sending…' : 'Resend code'}
        </button>

        <div className="auth-link">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
