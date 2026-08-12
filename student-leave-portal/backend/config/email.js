import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ------------------------------------------------------------------
// 1. Send email using Brevo's REST API (port 443, always open)
// ------------------------------------------------------------------
export const sendEmail = async (mailOptions) => {
  try {
    const apiKey = process.env.EMAIL_PASSWORD; // Brevo API key (starts with xkeysib-)
    const senderEmail = process.env.EMAIL_USER; // verified sender email

    console.log('📧 Sending email via Brevo API to:', mailOptions.to);

    const response = await axios({
      method: 'post',
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      data: {
        sender: {
          email: senderEmail,
          name: 'LOA Portal',
        },
        to: [
          {
            email: mailOptions.to,
          },
        ],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html,
      },
    });

    console.log('✅ Email sent via Brevo API to:', mailOptions.to);
    return { success: true, info: response.data };
  } catch (error) {
    console.error('❌ Brevo API error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// For backward compatibility (if any code imports the transporter directly)
export default { sendEmail };