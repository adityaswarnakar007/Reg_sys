import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ReCaptchaV3Badge, {
  useReCaptchaV3,
  RecaptchaConfigWarning,
  RecaptchaV3Hint
} from '../components/ReCaptchaV3';

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const executeRecaptcha = useReCaptchaV3();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha('login');
      if (!recaptchaToken) {
        setError(
          'reCAPTCHA verification failed. Set REACT_APP_RECAPTCHA_V3_SITE_KEY in frontend/.env or try again.'
        );
        return;
      }

      const { data } = await api.post('/auth/login', {
        ...form,
        recaptchaToken
      });
      if (data.requireOTP) {
        navigate('/verify-otp', { state: { email: form.email, purpose: 'login' } });
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed';
      const remaining = err.response?.data?.attemptsRemaining;
      setError(remaining !== undefined ? `${msg} (${remaining} attempts remaining)` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>🔐 Welcome Back</h2>
        <p className="subtitle">Sign in to your secure account</p>

        {error && <div className="alert alert-error">{error}</div>}
        <RecaptchaConfigWarning />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Enter your password" required />
            <div className="auth-link" style={{ marginTop: 8, textAlign: 'right' }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <RecaptchaV3Hint />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying…' : 'Sign In'}
          </button>
        </form>

        <ReCaptchaV3Badge />

        <div className="auth-link">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
