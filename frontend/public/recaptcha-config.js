/**
 * Runtime fallback for the reCAPTCHA v3 site key (public; safe to expose).
 * CRA only injects REACT_APP_* at compile time — if that fails, this still works after a refresh.
 * Keep this in sync with REACT_APP_RECAPTCHA_V3_SITE_KEY in frontend/.env
 */
(function () {
  if (typeof window === 'undefined') return;
  window.__RECAPTCHA_V3_SITE_KEY__ = '6LcomKEsAAAAAJZaAx9OiBTapDBluXRVSp2fkSum';
})();
