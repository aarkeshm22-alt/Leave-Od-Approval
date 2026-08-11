import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  // Read from environment, fallback to Brevo with SSL
  const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.EMAIL_PORT) || 465;   // ✅ SSL port
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;  // SSL for 465

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
    connectionTimeout: 30000,   // 30 seconds
    socketTimeout: 30000,
    tls: { rejectUnauthorized: false },
  });
};

const transporter = createTransporter();

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