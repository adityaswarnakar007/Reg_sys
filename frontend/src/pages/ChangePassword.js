import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { checkPasswordStrength } from '../utils/passwordStrength';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match'); return; }

    const { allRequired } = checkPasswordStrength(form.newPassword);
    if (!allRequired) { setError('New password does not meet requirements'); return; }

    setLoading(true);
    try {
      const { data } = await api.put('/user/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setSuccess(data.message);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>🔑 Change Password</h2>
        <p className="subtitle">Password expires every 30 days. Cannot reuse last 3 passwords.</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <div className="password-field">
              <input
                name="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={handleChange}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword((v) => !v)}>
                {showCurrentPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>New Password</label>
            <div className="password-field">
              <input
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={handleChange}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowNewPassword((v) => !v)}>
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <PasswordStrengthMeter password={form.newPassword} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <div className="password-field">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((v) => !v)}>
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>

        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default ChangePassword;
