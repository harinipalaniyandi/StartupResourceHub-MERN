const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD
  }
});

async function sendMail(to, subject, text, html) {
  try {
    return await transporter.sendMail({
      from: `"Startup Resource Hub" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html
    });
  } catch (err) {
    console.error('Mail sending error:', err.message);
    throw err;
  }
}

function otpEmailTemplate({ name, otp, purpose = 'verification' }) {
  const isReset = purpose === 'password_reset';
  const heading = isReset ? 'Reset Your Password' : 'Verify Your Email Address';
  const subtitle = isReset
    ? 'Use the secure code below to reset your Startup Resource Hub password.'
    : 'Use the code below to verify your account and access AI-powered startup intelligence.';

  return `
  <div style="background:#0f172a; padding:40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <div style="max-width:480px; margin:0 auto; background:#1e293b; border-radius:16px; overflow:hidden; border:1px solid #334155; box-shadow:0 10px 25px -5px rgba(0,0,0,0.5);">
      <div style="background:linear-gradient(135deg,#6366f1,#06b6d4); padding:28px 32px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px;">🚀 STARTUP RESOURCE HUB</h1>
        <p style="color:#e0e7ff; margin:6px 0 0; font-size:13px; font-weight:500;">AI-Powered Opportunity Intelligence</p>
      </div>

      <div style="padding:32px 28px; color:#f8fafc;">
        <h2 style="margin:0 0 10px; color:#ffffff; font-size:20px; font-weight:700;">${heading}</h2>
        <p style="margin:0 0 24px; color:#94a3b8; font-size:14px; line-height:1.6;">
          Hi <strong>${name || 'Founder'}</strong>,<br/>
          ${subtitle}
        </p>

        <div style="background:#0f172a; border:2px dashed #6366f1; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
          <span style="font-size:36px; font-weight:800; letter-spacing:10px; color:#38bdf8; font-family:monospace;">${otp}</span>
        </div>

        <p style="margin:0 0 8px; color:#cbd5e1; font-size:13px;">⏱️ This code expires in <strong>5 minutes</strong>.</p>
        <p style="margin:0; color:#64748b; font-size:12px;">If you did not request this, please ignore this email or change your password immediately.</p>
      </div>

      <div style="background:#0f172a; padding:18px 28px; text-align:center; border-top:1px solid #334155;">
        <span style="color:#64748b; font-size:12px;">© ${new Date().getFullYear()} Startup Resource Hub Platform. All rights reserved.</span>
      </div>
    </div>
  </div>`;
}

module.exports = { sendMail, otpEmailTemplate };
