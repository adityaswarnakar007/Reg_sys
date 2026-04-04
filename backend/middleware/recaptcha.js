const axios = require('axios');

/**
 * Middleware to verify Google reCAPTCHA v3 tokens.
 * 
 * Requires RECAPTCHA_V3_SECRET_KEY in .env
 * 
 * @param {string} action - Expected reCAPTCHA action name (e.g., 'register', 'login')
 * @param {number} minScore - Minimum acceptable score (0.0 - 1.0, default 0.5)
 */
const verifyRecaptchaV3 = (action, routeMinScore = 0.5) => {
  return async (req, res, next) => {
    const envMin = parseFloat(process.env.RECAPTCHA_MIN_SCORE);
    const minScore = Number.isFinite(envMin) ? envMin : routeMinScore;

    const secretKey = process.env.RECAPTCHA_V3_SECRET_KEY;

    // If no secret key configured, skip verification (development mode)
    if (!secretKey) {
      console.warn('⚠️  RECAPTCHA_V3_SECRET_KEY not set — skipping reCAPTCHA verification');
      return next();
    }

    const { recaptchaToken } = req.body;

    if (!recaptchaToken) {
      return res.status(400).json({ error: 'reCAPTCHA token is required' });
    }

    try {
      const body = new URLSearchParams();
      body.set('secret', secretKey);
      body.set('response', recaptchaToken);
      if (req.ip) body.set('remoteip', req.ip);

      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        body.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const { success, score, action: responseAction, 'error-codes': errorCodes } = response.data;

      if (!success) {
        console.warn('reCAPTCHA verification failed:', errorCodes);
        return res.status(400).json({
          error: 'reCAPTCHA verification failed',
          details: process.env.NODE_ENV === 'development' ? errorCodes : undefined
        });
      }

      // Verify the action matches what we expect
      if (responseAction !== action) {
        console.warn(`reCAPTCHA action mismatch: expected "${action}", got "${responseAction}"`);
        return res.status(400).json({ error: 'reCAPTCHA action mismatch' });
      }

      // Check score threshold
      if (score < minScore) {
        console.warn(`reCAPTCHA score too low: ${score} < ${minScore} (set RECAPTCHA_MIN_SCORE to adjust)`);
        return res.status(403).json({
          error: 'Request blocked by reCAPTCHA. Please try again.'
        });
      }

      // Attach score to request for logging/monitoring
      req.recaptchaScore = score;
      next();
    } catch (error) {
      console.error('reCAPTCHA verification error:', error.message);
      return res.status(500).json({ error: 'reCAPTCHA verification service unavailable' });
    }
  };
};

module.exports = { verifyRecaptchaV3 };
