const nodemailer = require('nodemailer');
const config = require('../config/env');

const createGmailTransporter = () => {
  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const user = config.gmail.user || config.smtp.user || 'flamease.config@gmail.com';
  const pass = cleanPass || config.smtp.pass || 'oeadbyahwffquxou';

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
};

const createSmtpTransporter = (port = 465, secure = true) => {
  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const user = config.smtp.user || config.gmail.user || 'flamease.config@gmail.com';
  const pass = (config.smtp.pass ? config.smtp.pass.replace(/\s+/g, '') : '') || cleanPass || 'oeadbyahwffquxou';

  return nodemailer.createTransport({
    host: config.smtp.host || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user,
      pass,
    },
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendOtp = async (email, code, type = 'registration') => {
  const subjects = {
    registration: 'SmartSakay Dagupan - Email Verification Code',
    password_reset: 'SmartSakay Dagupan - Password Reset Code',
    login: 'SmartSakay Dagupan - Login Verification Code',
  };

  const mailOptions = {
    from: `"SmartSakay Dagupan" <${config.gmail.user || config.smtp.user || 'flamease.config@gmail.com'}>`,
    to: email,
    subject: subjects[type] || subjects.registration,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1A56DB; text-align: center; margin-bottom: 8px;">SmartSakay Dagupan</h2>
        <p style="color: #334155; font-size: 15px; text-align: center;">Use the verification code below to confirm your account:</p>
        <div style="background: #f0f4ff; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A56DB;">${code}</span>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center; line-height: 1.5;">
          This code expires in 10 minutes. Do not share this code with anyone.<br/>
          If you did not request this code, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">SmartSakay Dagupan &mdash; Official Commuter Companion System</p>
      </div>
    `,
  };

  // Try 1: Nodemailer built-in 'gmail' service (Direct & most reliable)
  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL SENT via Gmail Service] Successfully dispatched to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error1) {
    console.warn(`⚠️ [GMAIL SERVICE FAILED] ${error1.message}. Trying port 465 SSL...`);

    // Try 2: Port 465 SSL with IPv4
    try {
      const transporter465 = createSmtpTransporter(465, true);
      const info2 = await transporter465.sendMail(mailOptions);
      console.log(`✉️ [EMAIL SENT via 465 SSL] Successfully dispatched to ${email} (MessageId: ${info2.messageId})`);
      return true;
    } catch (error2) {
      console.warn(`⚠️ [PORT 465 FAILED] ${error2.message}. Trying port 587 STARTTLS...`);

      // Try 3: Port 587 STARTTLS with IPv4
      try {
        const transporter587 = createSmtpTransporter(587, false);
        const info3 = await transporter587.sendMail(mailOptions);
        console.log(`✉️ [EMAIL SENT via 587 TLS] Successfully dispatched to ${email} (MessageId: ${info3.messageId})`);
        return true;
      } catch (error3) {
        console.error(`⚠️ [ALL SMTP TRANSPORTS FAILED]:`, error3.message);
        throw error3;
      }
    }
  }
};

module.exports = { sendOtp };
