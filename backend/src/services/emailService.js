const axios = require('axios');
const nodemailer = require('nodemailer');
const config = require('../config/env');

/**
 * Brevo REST API dispatcher (HTTPS port 443 — immune to cloud SMTP blocking)
 */
const sendViaBrevoApi = async (email, subject, htmlContent) => {
  const apiKey = config.brevo.apiKey;
  if (!apiKey) return false;

  const senderEmail = config.brevo.senderEmail || config.gmail.user || 'smartsakaydagupan@gmail.com';
  const senderName = config.brevo.senderName || 'SmartSakay Dagupan';

  const res = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: { name: senderName, email: senderEmail },
      to: [{ email }],
      subject,
      htmlContent,
    },
    {
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      timeout: 8000,
    }
  );

  console.log(`✉️ [BREVO API SENT] Successfully dispatched to ${email} (MessageId: ${res.data?.messageId})`);
  return true;
};

/**
 * Brevo SMTP relay dispatcher (smtp-relay.brevo.com:587)
 */
const sendViaBrevoSmtp = async (email, subject, htmlContent) => {
  if (!config.brevo.smtpUser || !config.brevo.smtpKey) return false;

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: config.brevo.smtpUser,
      pass: config.brevo.smtpKey,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });

  const info = await transporter.sendMail({
    from: `"${config.brevo.senderName || 'SmartSakay Dagupan'}" <${config.brevo.senderEmail || config.brevo.smtpUser}>`,
    to: email,
    subject,
    html: htmlContent,
  });

  console.log(`✉️ [BREVO SMTP SENT] Successfully dispatched to ${email} (MessageId: ${info.messageId})`);
  return true;
};

const createGmailTransporter = () => {
  const cleanPass = (config.gmail.appPassword || config.smtp.pass || 'jihe smul jpnq spcq').replace(/\s+/g, '');
  const user = config.gmail.user || config.smtp.user || 'smartsakaydagupan@gmail.com';
  const pass = cleanPass;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass,
    },
    family: 4,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 6000,
  });
};

const createSmtpTransporter = (port = 465, secure = true) => {
  const cleanPass = (config.gmail.appPassword || config.smtp.pass || 'jihe smul jpnq spcq').replace(/\s+/g, '');
  const user = config.smtp.user || config.gmail.user || 'smartsakaydagupan@gmail.com';
  const pass = cleanPass;

  return nodemailer.createTransport({
    host: config.smtp.host || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user,
      pass,
    },
    family: 4,
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 6000,
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

  const subject = subjects[type] || subjects.registration;
  const html = `
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
  `;

  // Priority 1: Brevo REST API (HTTPS — best for Render cloud hosts)
  if (config.brevo.apiKey) {
    try {
      await sendViaBrevoApi(email, subject, html);
      return true;
    } catch (brevoErr) {
      console.warn(`⚠️ [BREVO API FAILED] ${brevoErr.response?.data?.message || brevoErr.message}. Trying fallback...`);
    }
  }

  // Priority 2: Brevo SMTP Relay
  if (config.brevo.smtpUser && config.brevo.smtpKey) {
    try {
      await sendViaBrevoSmtp(email, subject, html);
      return true;
    } catch (brevoSmtpErr) {
      console.warn(`⚠️ [BREVO SMTP FAILED] ${brevoSmtpErr.message}. Trying Gmail fallback...`);
    }
  }

  const mailOptions = {
    from: `"SmartSakay Dagupan" <${config.gmail.user || config.smtp.user || 'smartsakaydagupan@gmail.com'}>`,
    to: email,
    subject,
    html,
  };

  // Priority 3: Nodemailer built-in 'gmail' service
  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL SENT via Gmail Service] Successfully dispatched to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error1) {
    console.warn(`⚠️ [GMAIL SERVICE FAILED] ${error1.message}. Trying port 465 SSL...`);

    // Priority 4: Port 465 SSL
    try {
      const transporter465 = createSmtpTransporter(465, true);
      const info2 = await transporter465.sendMail(mailOptions);
      console.log(`✉️ [EMAIL SENT via 465 SSL] Successfully dispatched to ${email} (MessageId: ${info2.messageId})`);
      return true;
    } catch (error2) {
      console.warn(`⚠️ [PORT 465 FAILED] ${error2.message}. Trying port 587 STARTTLS...`);

      // Priority 5: Port 587 STARTTLS
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
