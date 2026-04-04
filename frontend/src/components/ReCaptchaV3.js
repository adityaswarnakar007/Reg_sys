import { useEffect, useCallback } from 'react';

/**
 * Site key: CRA inlines REACT_APP_* at build time; public/recaptcha-config.js sets window fallback.
 */
export const getRecaptchaSiteKey = () => {
  const envKey =
    typeof process !== 'undefined' && process.env && process.env.REACT_APP_RECAPTCHA_V3_SITE_KEY;
  if (envKey && String(envKey).trim()) return String(envKey).trim();
  if (typeof window !== 'undefined' && window.__RECAPTCHA_V3_SITE_KEY__) {
    return String(window.__RECAPTCHA_V3_SITE_KEY__).trim();
  }
  return '';
};

/** True when a site key is available (env or window fallback). */
export const hasRecaptchaSiteKey = () => Boolean(getRecaptchaSiteKey());

const loadRecaptchaScript = () => {
  const siteKey = getRecaptchaSiteKey();
  if (!siteKey) {
    return Promise.reject(new Error('reCAPTCHA site key not configured'));
  }

  return new Promise((resolve, reject) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }

    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existing) {
      if (window.grecaptcha) {
        resolve(window.grecaptcha);
        return;
      }
      existing.addEventListener('load', () => resolve(window.grecaptcha));
      existing.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
};

/**
 * Google reCAPTCHA v3 — runs invisibly on execute(); action must match backend (login | register).
 */
export const useReCaptchaV3 = () => {
  useEffect(() => {
    if (!hasRecaptchaSiteKey()) return;
    loadRecaptchaScript().catch(console.error);
  }, []);

  const execute = useCallback(async (action) => {
    const siteKey = getRecaptchaSiteKey();
    if (!siteKey) {
      console.warn('reCAPTCHA v3 site key not configured (REACT_APP_RECAPTCHA_V3_SITE_KEY or recaptcha-config.js)');
      return null;
    }

    try {
      const grecaptcha = await loadRecaptchaScript();
      return new Promise((resolve) => {
        grecaptcha.ready(() => {
          grecaptcha
            .execute(siteKey, { action })
            .then(resolve)
            .catch((err) => {
              console.error('reCAPTCHA execute error:', err);
              resolve(null);
            });
        });
      });
    } catch (err) {
      console.error('reCAPTCHA load error:', err);
      return null;
    }
  }, []);

  return execute;
};

/** Shown when the site key is missing so local dev is not a silent failure. */
export const RecaptchaConfigWarning = () => {
  if (hasRecaptchaSiteKey()) return null;
  return (
    <div className="alert alert-warning recaptcha-config-warning" role="status">
      Google reCAPTCHA v3 is not configured. Add{' '}
      <code className="recaptcha-code">REACT_APP_RECAPTCHA_V3_SITE_KEY</code> to{' '}
      <code className="recaptcha-code">frontend/.env</code> or set the key in{' '}
      <code className="recaptcha-code">public/recaptcha-config.js</code>, then restart the dev server.
    </div>
  );
};

/** Short line when v3 is configured (v3 is invisible until submit). */
export const RecaptchaV3Hint = () => {
  if (!hasRecaptchaSiteKey()) return null;
  return (
    <p className="recaptcha-v3-hint">
      This form is protected by Google reCAPTCHA v3. A check runs when you submit.
    </p>
  );
};

/**
 * Legal / UX footer: required when using reCAPTCHA (alongside Google's badge).
 */
const ReCaptchaV3Badge = () => {
  return (
    <div className="recaptcha-badge-info">
      This site is protected by reCAPTCHA and the Google{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
        Privacy Policy
      </a>{' '}
      and{' '}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
        Terms of Service
      </a>{' '}
      apply.
    </div>
  );
};

export default ReCaptchaV3Badge;
