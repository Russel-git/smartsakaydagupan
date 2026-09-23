const nodemailer = require('nodemailer');
const config = require('../config/env');

const createTransporter = () => {
  if (config.smtp.host && config.smtp.user && config.smtp.pass) {
    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      connectionTimeout: 10000,
    });
  }

  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmail.user,
      pass: cleanPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const sendOtp = async (email, code, type = 'registration') => {
  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const hasSmtp = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
  const hasGmail = Boolean(cleanPass && cleanPass !== 'your-gmail-app-password');

  // Allow automated test runner to simulate dispatch without internet
  if (process.env.NODE_ENV === 'test' && !hasSmtp && !hasGmail) {
    console.log(`[TEST EMAIL] Simulated dispatch to ${email} (code: ${code})`);
    return true;
  }

  if (!hasSmtp && !hasGmail) {
    const errorMsg = 'Email service is not configured. Please set a valid GMAIL_USER and 16-character GMAIL_APP_PASSWORD in server/.env to send real verification codes.';
    console.error(`⚠️ [EMAIL SERVICE CONFIG ERROR] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const transporter = createTransporter();

  const subjects = {
    registration: 'SmartSakay Dagupan - Email Verification Code',
    password_reset: 'SmartSakay Dagupan - Password Reset Code',
    login: 'SmartSakay Dagupan - Login Verification Code',
  };

  const mailOptions = {
    from: `"SmartSakay Dagupan" <${config.gmail.user || 'no-reply@smartsakay.com'}>`,
    to: email,
    subject: subjects[type] || subjects.registration,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 8px;">
        <h2 style="color: #1A56DB; text-align: center; margin-bottom: 8px;">SmartSakay Dagupan</h2>
        <p style="color: #334155; font-size: 15px; text-align: center;">Use the verification code below to confirm your account:</p>
        <div style="background: #f0f4ff; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A56DB;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center; line-height: 1.5;">
          This code expires in 5 minutes. Do not share this code with anyone.<br/>
          If you did not request this code, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">SmartSakay Dagupan &mdash; Official Commuter Companion System</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL SENT] Successfully dispatched to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`⚠️ [EMAIL FAILED] Unable to send to ${email} via SMTP:`, error.message);
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      throw new Error(
        'Google SMTP rejected authentication (535 Bad Credentials). Ensure 2-Step Verification is enabled in Google, generate a 16-character App Password at https://myaccount.google.com/apppasswords, and paste it into GMAIL_APP_PASSWORD in server/.env.'
      );
    }
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = { sendOtp };
