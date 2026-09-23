const nodemailer = require('nodemailer');
const config = require('../src/config/env');

async function testEmail() {
  const targetEmail = process.argv[2] || config.gmail.user;

  console.log('====================================================');
  console.log('📧 SmartSakay Dagupan - Email Service Diagnostic');
  console.log('====================================================');
  console.log('SMTP Host      :', config.smtp.host || 'smtp.gmail.com (service: gmail)');
  console.log('GMAIL_USER     :', config.gmail.user || '(not set)');
  console.log('GMAIL_PASS     :', config.gmail.appPassword ? (config.gmail.appPassword === 'your-gmail-app-password' ? '⚠️ PLACEHOLDER ("your-gmail-app-password")' : '********') : '(not set)');
  console.log('Target Email   :', targetEmail);
  console.log('----------------------------------------------------');

  const cleanPass = config.gmail.appPassword ? config.gmail.appPassword.replace(/\s+/g, '') : '';
  const hasSmtp = Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
  const hasGmail = Boolean(cleanPass && cleanPass !== 'your-gmail-app-password');

  if (!hasSmtp && !hasGmail) {
    console.error('❌ CONFIGURATION ERROR:');
    console.error('   Neither custom SMTP nor a valid GMAIL_APP_PASSWORD is set in server/.env.');
    console.error('   To send real verification emails to Gmail inboxes:');
    console.error('   1. Go to https://myaccount.google.com/security');
    console.error('   2. Ensure 2-Step Verification is turned ON.');
    console.error('   3. Go to https://myaccount.google.com/apppasswords');
    console.error('   4. Create an app password named "SmartSakay".');
    console.error('   5. Copy the 16-character password into server/.env:');
    console.error('      GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx');
    process.exit(1);
  }

  const transporter = hasSmtp
    ? nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: { user: config.gmail.user, pass: cleanPass },
      });

  try {
    console.log('⏳ Verifying SMTP transporter connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    console.log(`⏳ Sending test verification email to: ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: `"SmartSakay Dagupan" <${config.gmail.user || 'no-reply@smartsakay.com'}>`,
      to: targetEmail,
      subject: 'SmartSakay Dagupan - Test Email Delivery',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1A56DB; text-align: center;">SmartSakay Dagupan</h2>
          <p>This is a live test email confirming your Nodemailer SMTP connection is working perfectly!</p>
          <div style="background: #f0f4ff; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1A56DB;">123456</span>
          </div>
          <p style="color: #64748b; font-size: 13px;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    console.log('🎉 EMAIL DELIVERED SUCCESSFULLY!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response  :', info.response);
  } catch (err) {
    console.error('❌ EMAIL SENDING FAILED:');
    console.error('   Error:', err.message);
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      console.error('\n👉 Google rejected authentication (535 Bad Credentials).');
      console.error('   Follow these steps to generate a Google App Password:');
      console.error('   1. Open: https://myaccount.google.com/apppasswords');
      console.error('   2. Log in with the account specified in GMAIL_USER (' + config.gmail.user + ')');
      console.error('   3. Generate an App Password for "SmartSakay"');
      console.error('   4. Put the generated 16 characters in server/.env as: GMAIL_APP_PASSWORD=abcdefghijklmnop');
    }
  }
}

testEmail();
