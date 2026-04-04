import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import ReCaptchaV3Badge, {
  useReCaptchaV3,
  RecaptchaConfigWarning,
  RecaptchaV3Hint
} from '../components/ReCaptchaV3';
import { checkPasswordStrength } from '../utils/passwordStrength';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const executeRecaptcha = useReCaptchaV3();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { allRequired } = checkPasswordStrength(form.password, form.username);
    if (!allRequired) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true);
    try {
      const recaptchaToken = await executeRecaptcha('register');
      if (!recaptchaToken) {
        setError(
          'reCAPTCHA verification failed. Set REACT_APP_RECAPTCHA_V3_SITE_KEY in frontend/.env or try again.'
        );
        return;
      }

      await api.post('/auth/register', {
        ...form,
        recaptchaToken
      });
      navigate('/verify-otp', { state: { email: form.email, purpose: 'registration' } });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>🔐 Create Account</h2>
        <p className="subtitle">Secure registration with 2FA verification</p>

        {error && <div className="alert alert-error">{error}</div>}
        <RecaptchaConfigWarning />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input name="username" value={form.username} onChange={handleChange} placeholder="Choose a username" required minLength={3} maxLength={30} />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a strong password" required />
            <PasswordStrengthMeter password={form.password} username={form.username} />
          </div>

          <RecaptchaV3Hint />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying…' : 'Register'}
          </button>
        </form>

        <ReCaptchaV3Badge />

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
