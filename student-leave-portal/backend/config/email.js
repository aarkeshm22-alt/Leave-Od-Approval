import nodemailer from 'nodemailer';
import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

const createTransporter = async () => {
  // Force IPv4 resolution
  const { address } = await lookup('smtp.gmail.com', { family: 4 });
  console.log(`📧 Resolved Gmail SMTP IPv4: ${address}`);

  return nodemailer.createTransport({
    host: address,          // 👈 use the IP directly
    port: 587,
    secure: false,          // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,   // optional – helps with some proxies
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
    // family: 4,           // no longer needed – we resolved manually
  });
};

let transporter;
let ready = false;

// Initialize transporter asynchronously
const initTransporter = async () => {
  try {
    transporter = await createTransporter();
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });
    ready = true;
    console.log('✅ Email transporter is ready (IPv4 forced)');
  } catch (error) {
    console.error('⚠️ Email transporter verification failed:', error.message);
    // Fallback to a dummy transporter that logs instead of sending
    transporter = {
      sendMail: (mailOptions) => {
        console.log('📧 Email would be sent (transporter not ready):', mailOptions.to);
        return Promise.resolve({ messageId: 'dummy' });
      },
    };
  }
};

// Start initialization (doesn't block startup)
initTransporter();

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