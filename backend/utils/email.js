const nodemailer = require('nodemailer');

// Gmail SMTP configuration
const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 465;
const isSSL = emailPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: emailPort,
  secure: isSSL, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000,
  socketTimeout: 5000,
  logger: true,
  debug: process.env.NODE_ENV === 'development'
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[EMAIL] SMTP connection failed:', error.message);
  } else {
    console.log('[EMAIL] Gmail SMTP connection verified');
  }
});

const sendOTPEmail = async (email, otp, purpose) => {
  const subjects = {
    registration: 'Verify Your Email - Registration OTP',
    login: 'Login Verification - OTP Code',
    password_reset: 'Password Reset - OTP Code'
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: #1a1a2e; text-align: center;">🔐 Secure Authentication</h2>
      <div style="background: white; padding: 24px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #666; margin-bottom: 16px;">Your one-time password is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16213e; padding: 16px; background: #e8f4f8; border-radius: 8px;">${otp}</div>
        <p style="color: #999; font-size: 13px; margin-top: 16px;">This code expires in 5 minutes.</p>
      </div>
      <p style="color: #999; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  const mailOptions = {
    from: `"Secure Auth System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[purpose] || 'Your OTP Code',
    html: htmlContent
  };

  try {
    console.log(`[EMAIL] Sending ${purpose} OTP to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] OTP email sent successfully for ${purpose} to ${email}. MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL] Failed to send OTP email for ${purpose} to ${email}:`, error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

module.exports = { sendOTPEmail };
