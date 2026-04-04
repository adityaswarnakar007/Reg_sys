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
            <input name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input name="newPassword" type="password" value={form.newPassword} onChange={handleChange} required />
            <PasswordStrengthMeter password={form.newPassword} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required />
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
