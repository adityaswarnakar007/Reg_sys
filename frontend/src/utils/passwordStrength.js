export const checkPasswordStrength = (password, username = '') => {
  const criteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noUsername: !username || !password.toLowerCase().includes(username.toLowerCase()),
    goodLength: password.length >= 12
  };

  const metCount = Object.values(criteria).filter(Boolean).length;
  let strength, label;

  if (metCount <= 3) { strength = 'weak'; label = 'Weak'; }
  else if (metCount <= 5) { strength = 'medium'; label = 'Medium'; }
  else { strength = 'strong'; label = 'Strong'; }

  const tips = [
    { key: 'minLength', text: 'At least 8 characters', met: criteria.minLength },
    { key: 'hasUpper', text: 'Uppercase letter', met: criteria.hasUpper },
    { key: 'hasLower', text: 'Lowercase letter', met: criteria.hasLower },
    { key: 'hasNumber', text: 'Number', met: criteria.hasNumber },
    { key: 'hasSpecial', text: 'Special character (!@#$...)', met: criteria.hasSpecial },
    { key: 'noUsername', text: 'Does not contain username', met: criteria.noUsername },
    { key: 'goodLength', text: '12+ characters (recommended)', met: criteria.goodLength }
  ];

  return { strength, label, tips, allRequired: criteria.minLength && criteria.hasUpper && criteria.hasLower && criteria.hasNumber && criteria.hasSpecial && criteria.noUsername };
};
