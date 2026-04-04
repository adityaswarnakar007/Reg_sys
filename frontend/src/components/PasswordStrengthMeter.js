import React from 'react';
import { checkPasswordStrength } from '../utils/passwordStrength';

const PasswordStrengthMeter = ({ password, username }) => {
  if (!password) return null;

  const { strength, label, tips } = checkPasswordStrength(password, username);

  return (
    <div className="strength-meter">
      <div className="strength-bar">
        <div className={`strength-fill ${strength}`}></div>
      </div>
      <span className={`strength-label ${strength}`}>Password Strength: {label}</span>
      <ul className="strength-tips">
        {tips.map((tip) => (
          <li key={tip.key} className={tip.met ? 'met' : ''}>{tip.text}</li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
