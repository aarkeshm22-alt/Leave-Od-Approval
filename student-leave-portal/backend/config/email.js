import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
// ------------------------------------------------------------------
// 1. Create transporter from environment variables
// ------------------------------------------------------------------
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.EMAIL_PORT) || 587;
  const secure = process.env.EMAIL_SECURE === 'true' || false;

  // Log for debugging
  console.log('📧 EMAIL_HOST:', host);
  console.log('📧 EMAIL_PORT:', port);
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    }, 
    tls: {
      rejectUnauthorized: false, 
    },
    connectionTimeout: 40000,  // 40 seconds
    socketTimeout: 40000,
  });
};

// ------------------------------------------------------------------
// 2. Create and verify transporter (synchronous)
// ------------------------------------------------------------------
const transporter = createTransporter();

// Verify immediately (non‑blocking)
transporter.verify((error, success) => {
  if (error) {
    console.error('⚠️ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email transporter is ready');
  }
});

// ------------------------------------------------------------------
// 3. Export sendEmail function
// ------------------------------------------------------------------
export const sendEmail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

export default transporter;