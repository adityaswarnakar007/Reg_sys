const nodemailer = require('nodemailer');

const smtpHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const smtpUser = process.env.EMAIL_USER;
const smtpPass = process.env.EMAIL_PASS;
const fromAddress = process.env.EMAIL_FROM || smtpUser;

const createTransporter = (port) => {
  const secure = port === 465;
  return nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    requireTLS: !secure,
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
    logger: true,
    debug: process.env.NODE_ENV === 'development'
  });
};

const configuredPort = parseInt(process.env.EMAIL_PORT, 10) || 465;
const alternatePort = configuredPort === 465 ? 587 : 465;
let primaryTransporter = createTransporter(configuredPort);
let fallbackTransporter = createTransporter(alternatePort);

const verifyTransporter = async (transporter, port) => {
  try {
    await transporter.verify();
    console.log(`[EMAIL] SMTP connection verified on port ${port}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] SMTP connection failed on port ${port}:`, error.message);
    return false;
  }
};

(async () => {
  const primaryOk = await verifyTransporter(primaryTransporter, configuredPort);
  if (!primaryOk) {
    const fallbackOk = await verifyTransporter(fallbackTransporter, alternatePort);
    if (fallbackOk) {
      primaryTransporter = fallbackTransporter;
      fallbackTransporter = createTransporter(configuredPort);
      console.log(`[EMAIL] Switched to fallback SMTP port ${alternatePort}`);
    }
  }
})();

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
    from: `"Secure Auth System" <${fromAddress}>`,
    to: email,
    subject: subjects[purpose] || 'Your OTP Code',
    html: htmlContent
  };

  const sendUsingTransporter = async (transporter, portLabel) => {
    try {
      console.log(`[EMAIL] Attempting to send ${purpose} OTP to ${email} using port ${portLabel}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] OTP email sent successfully for ${purpose} to ${email} on port ${portLabel}. MessageID: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[EMAIL] Failed on port ${portLabel}:`, error.message);
      throw error;
    }
  };

  try {
    return await sendUsingTransporter(primaryTransporter, configuredPort);
  } catch (primaryError) {
    console.error('[EMAIL] Primary SMTP failed, trying fallback...');
    try {
      return await sendUsingTransporter(fallbackTransporter, alternatePort);
    } catch (fallbackError) {
      console.error('[EMAIL] Fallback SMTP also failed.');
      throw new Error(`Email sending failed on both ports: ${primaryError.message}; ${fallbackError.message}`);
    }
  }
};

module.exports = { sendOTPEmail };
