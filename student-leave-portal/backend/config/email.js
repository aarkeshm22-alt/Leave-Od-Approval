import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const createTransporter = () => {
  // ✅ Read from environment, fallback to Brevo
  const host = process.env.EMAIL_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.EMAIL_PORT) || 587;   // ✅ Use 587 (STARTTLS) instead of 465
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  console.log('📧 EMAIL_HOST:', host);
  console.log('📧 EMAIL_PORT:', port);
  console.log('📧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('📧 EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');

  // ✅ Validate credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials missing!');
    return null;
  }

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
      ciphers: 'SSLv3'
    },
    connectionTimeout: 30000,
    socketTimeout: 30000,
    // ✅ Force IPv4 (helps with cloud environments like Render)
    family: 4,
  });
};

const transporter = createTransporter();

if (transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('⚠️ Email transporter verification failed:', error.message);
      console.error('  Error details:', error);
    } else {
      console.log('✅ Email transporter is ready (Brevo SMTP)');
      console.log(`  Host: ${process.env.EMAIL_HOST || 'smtp-relay.brevo.com'}`);
      console.log(`  Port: ${process.env.EMAIL_PORT || 587}`);
      console.log(`  User: ${process.env.EMAIL_USER}`);
    }
  });
} else {
  console.error('❌ Failed to create email transporter');
}

export const sendEmail = async (mailOptions) => {
  try {
    if (!transporter) {
      return { 
        success: false, 
        error: 'Email transporter not initialized. Check credentials.' 
      };
    }

    // ✅ Validate mail options
    if (!mailOptions.to || !mailOptions.subject || !mailOptions.html) {
      return { 
        success: false, 
        error: 'Missing required mail options: to, subject, html' 
      };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', mailOptions.to);
    console.log('  Message ID:', info.messageId);
    
    return { success: true, info };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    
    // ✅ Better error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Connection failed. Check host and port.';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Socket connection failed. Try using port 587 with STARTTLS.';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: error.code 
    };
  }
};

export const sendOTPEmail = async (user, otp) => {
  const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'LOA Portal';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1a2a4a; font-size: 24px; margin: 0;">🔐 LOA Portal</h1>
        <p style="color: #64748b; font-size: 14px; margin: 5px 0;">Password Reset OTP</p>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          Hello <strong>${user.firstName || 'User'}</strong>,
        </p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">
          You requested to reset your password for the LOA Portal. Use the OTP below:
        </p>
        
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f1f5f9; border-radius: 12px; border: 2px dashed #1a2a4a;">
          <span style="font-size: 36px; font-weight: bold; color: #1a2a4a; letter-spacing: 8px; font-family: monospace;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          This OTP will expire in <strong>10 minutes</strong>.
        </p>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; padding: 20px 0; color: #94a3b8; font-size: 12px;">
        <p>&copy; 2026 LOA Portal. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail({
    from: `"${fromName}" <${fromEmail}>`,
    to: user.email,
    subject: '🔐 LOA Portal - Password Reset OTP',
    html: html,
  });
};

export default transporter;