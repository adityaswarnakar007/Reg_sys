import React, { useRef } from 'react';

const OTPInput = ({ length = 6, value, onChange }) => {
  const inputs = useRef([]);

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/\D/, '');
    const newOTP = value.split('');
    newOTP[index] = val;
    const joined = newOTP.join('');
    onChange(joined);

    if (val && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputs.current[focusIndex]?.focus();
  };

  return (
    <div className="otp-inputs">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

export default OTPInput;
