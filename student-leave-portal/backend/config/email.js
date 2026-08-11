import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  // Log the values (mask password for security)
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('📧 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT) || 587;
  const secure = process.env.EMAIL_SECURE === 'true' || false;

  // Ensure credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Missing email credentials. Check your environment variables.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    socketTimeout: 15000,
    family: 4,   // force IPv4
  });
};

let transporter;
try {
  transporter = createTransporter();
} catch (error) {
  console.error('❌ Failed to create email transporter:', error.message);
  // You can still export a dummy transporter that logs instead of sending
  transporter = {
    sendMail: (mailOptions) => {
      console.log('📧 Email would be sent (transporter not configured):', mailOptions.to);
      return Promise.resolve({ messageId: 'dummy' });
    },
    verify: (callback) => callback(new Error('Transporter not configured'), null)
  };
}

transporter.verify((error, success) => {
  if (error) {
    console.error('⚠️ Email transporter verification failed:', error.message);
  } else {
    console.log('✅ Email transporter is ready');
  }
});

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