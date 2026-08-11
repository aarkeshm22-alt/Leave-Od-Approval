import nodemailer from 'nodemailer';

// Create transporter from environment variables
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT) || 587;          // SSL by default
  const secure = process.env.EMAIL_SECURE === 'false' || port === 587;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    // Force IPv4 (helps with some cloud environments)
    family: 4,
  });
};

const transporter = createTransporter();

// Verify connection on startup
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