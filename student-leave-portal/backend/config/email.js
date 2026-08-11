import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
// ------------------------------------------------------------------
// 1. Create transporter from environment variables
// ------------------------------------------------------------------
const createTransporter = () => {
  const host = process.env.EMAIL_USER || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.EMAIL_PORT) || 587;
  const secure = process.env.EMAIL_SECURE === 'true' || false;

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
      rejectUnauthorized: false,  // optional – helps with some proxies
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
    // family: 4,  // no need – Brevo uses IPv4
  });
};

let transporter;
let ready = false;

// ------------------------------------------------------------------
// 2. Initialize transporter (non‑blocking)
// ------------------------------------------------------------------
const initTransporter = async () => {
  try {
    transporter = createTransporter();
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });
    ready = true;
    console.log('✅ Email transporter is ready');
  } catch (error) {
    console.error('⚠️ Email transporter verification failed:', error.message);
    // Fallback: dummy transporter that logs instead of sending
    transporter = {
      sendMail: (mailOptions) => {
        console.log('📧 Email would be sent (transporter not ready):', mailOptions.to);
        return Promise.resolve({ messageId: 'dummy' });
      },
    };
  }
};

initTransporter();

// ------------------------------------------------------------------
// 3. Export sendEmail function
// ------------------------------------------------------------------
export const sendEmail = async (mailOptions) => {
  if (!ready) {
    console.warn('⚠️ Transporter not ready, queuing email:', mailOptions.to);
  }
  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Email send error:', error);
    return { success: false, error: error.message };
  }
};

export default transporter; 