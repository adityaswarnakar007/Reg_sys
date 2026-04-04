import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ReCaptchaV3Badge, {
  useReCaptchaV3,
  RecaptchaConfigWarning,
  RecaptchaV3Hint
} from '../components/ReCaptchaV3';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const executeRecaptcha = useReCaptchaV3();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const recaptchaToken = await executeRecaptcha('forgot_password');
      if (!recaptchaToken) {
        setError(
          'reCAPTCHA verification failed. Set REACT_APP_RECAPTCHA_V3_SITE_KEY in frontend/.env or try again.'
        );
        return;
      }

      const { data } = await api.post('/auth/forgot-password', { email, recaptchaToken });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>🔑 Forgot password</h2>
        <p className="subtitle">Enter your email and we&apos;ll send a reset code</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <>
            <div className="alert alert-success">{success}</div>
            <button
              type="button"
              className="btn-primary"
              style={{ marginBottom: 16 }}
              onClick={() => navigate('/reset-password', { state: { email } })}
            >
              Enter code &amp; new password
            </button>
          </>
        )}
        <RecaptchaConfigWarning />

        <form onSubmit={handleSubmit} style={{ display: success ? 'none' : 'block' }}>
          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <RecaptchaV3Hint />

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
        </form>

        <ReCaptchaV3Badge />

        <div className="auth-link">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
