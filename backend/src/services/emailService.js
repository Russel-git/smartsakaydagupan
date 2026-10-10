const nodemailer = require('nodemailer');
const config = require('../config/env');

const nodemailer = require('nodemailer');
const config = require('../config/env');

const createTransporter = (options = {}) => {
  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const user = config.smtp.user || config.gmail.user;
  const pass = (config.smtp.pass ? config.smtp.pass.replace(/\s+/g, '') : '') || cleanPass;

  const port = options.port || Number(config.smtp.port) || 465;
  const secure = options.secure !== undefined ? options.secure : port === 465;

  return nodemailer.createTransport({
    host: options.host || config.smtp.host || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user,
      pass,
    },
    family: 4, // CRITICAL: Force IPv4 to prevent ENETUNREACH on cloud environments like Render
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const sendOtp = async (email, code, type = 'registration') => {
  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const hasSmtp = Boolean((config.smtp.host || config.gmail.user) && (config.smtp.pass || cleanPass));

  // Allow automated test runner to simulate dispatch without internet
  if (process.env.NODE_ENV === 'test' && !hasSmtp) {
    console.log(`[TEST EMAIL] Simulated dispatch to ${email} (code: ${code})`);
    return true;
  }

  const subjects = {
    registration: 'SmartSakay Dagupan - Email Verification Code',
    password_reset: 'SmartSakay Dagupan - Password Reset Code',
    login: 'SmartSakay Dagupan - Login Verification Code',
  };

  const mailOptions = {
    from: `"SmartSakay Dagupan" <${config.gmail.user || config.smtp.user || 'no-reply@smartsakay.com'}>`,
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

  // Try Primary: Port 465 SSL with IPv4
  try {
    const transporter = createTransporter({ port: 465, secure: true });
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ [EMAIL SENT via 465 SSL] Successfully dispatched to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error1) {
    console.warn(`⚠️ [PRIMARY SMTP 465 FAILED] ${error1.message}. Trying port 587 STARTTLS...`);

    // Try Secondary: Port 587 STARTTLS with IPv4
    try {
      const transporter587 = createTransporter({ port: 587, secure: false });
      const info2 = await transporter587.sendMail(mailOptions);
      console.log(`✉️ [EMAIL SENT via 587 TLS] Successfully dispatched to ${email} (MessageId: ${info2.messageId})`);
      return true;
    } catch (error2) {
      console.warn(`⚠️ [SECONDARY SMTP 587 FAILED] ${error2.message}. Trying service 'gmail'...`);

      // Try Tertiary: Nodemailer built-in 'gmail' service
      try {
        const gmailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.gmail.user || config.smtp.user,
            pass: cleanPass || config.smtp.pass,
          },
          family: 4,
          connectionTimeout: 8000,
        });
        const info3 = await gmailTransporter.sendMail(mailOptions);
        console.log(`✉️ [EMAIL SENT via service gmail] Successfully dispatched to ${email} (MessageId: ${info3.messageId})`);
        return true;
      } catch (error3) {
        console.error(`⚠️ [ALL SMTP TRANSPORTS FAILED]:`, error3.message);
        throw error3;
      }
    }
  }
};

module.exports = { sendOtp };
