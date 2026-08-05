const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Email validation function
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Phone validation function (Indian numbers)
const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone.replace(/[^0-9]/g, ''));
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add timeout and other options
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });
};

// Send email function
const sendEmail = async (mailOptions) => {
  const transporter = createTransporter();
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, program, message } = req.body;

    // Log request for debugging
    console.log('Contact request received:', { name, email, phone, program });

    // Validation
    if (!name || !email || !phone || !program) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields (name, email, phone, program)',
      });
    }

    // Email validation
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Phone validation
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!validatePhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit phone number',
      });
    }

    // Prepare data for admin email
    const emailData = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Enquiry: ${program} - ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #1a56db; color: white; padding: 20px; text-align: center; }
            .content { background: white; padding: 30px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #1a56db; }
            .value { margin-left: 10px; }
            .message-box { background: #f0f4ff; padding: 15px; border-radius: 5px; margin-top: 10px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📬 New Enquiry Received</h2>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">👤 Name:</span>
                <span class="value">${name}</span>
              </div>
              <div class="field">
                <span class="label">📧 Email:</span>
                <span class="value">${email}</span>
              </div>
              <div class="field">
                <span class="label">📱 Phone:</span>
                <span class="value">${phone}</span>
              </div>
              <div class="field">
                <span class="label">📚 Program:</span>
                <span class="value">${program}</span>
              </div>
              ${message ? `
                <div class="field">
                  <span class="label">💬 Message:</span>
                  <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
                </div>
              ` : ''}
              <hr>
              <p style="color: #666; font-size: 14px;">
                Received on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
            <div class="footer">
              Mandke Skills - Contact Form
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Auto-reply email
    const autoReplyData = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: process.env.AUTO_REPLY_SUBJECT || 'Thank you for contacting Mandke Skills',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: #1a56db; color: white; padding: 20px; text-align: center; }
            .content { background: white; padding: 30px; }
            .btn { display: inline-block; padding: 12px 24px; background: #1a56db; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 Thank You for Contacting Mandke Skills</h2>
            </div>
            <div class="content">
              <p>Dear <strong>${name}</strong>,</p>
              <p>Thank you for reaching out to Mandke Skills! We have received your enquiry regarding <strong>${program}</strong>.</p>
              <p>Our team will get back to you within <strong>24-48 hours</strong> to discuss your requirements in detail.</p>
              <p>In the meantime, you can:</p>
              <ul>
                <li>📞 Call us directly: <strong>+91 9112220491</strong></li>
                <li>📧 Email us: <strong>mandkeskills@gmail.com</strong></li>
              </ul>
              <div style="text-align: center; margin: 20px 0;">
                <a href="tel:+919112220491" class="btn">📞 Call Now</a>
              </div>
              <hr>
              <p style="font-size: 14px; color: #666;">
                <strong>Your enquiry details:</strong><br>
                Program: ${program}<br>
                Phone: ${phone}
              </p>
              <p style="font-size: 12px; color: #999;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} Mandke Skills. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    // Send both emails in parallel
    const [adminEmail, autoReply] = await Promise.all([
      sendEmail(emailData),
      sendEmail(autoReplyData),
    ]);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Your enquiry has been submitted successfully!',
      data: {
        name,
        email,
        program,
        adminEmailId: adminEmail.messageId,
        autoReplyId: autoReply.messageId,
      },
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send enquiry. Please try again or contact us directly.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

// GET /api/contact - For testing
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Contact API is working',
    endpoints: {
      post: '/api/contact',
      health: '/api/health'
    }
  });
});

module.exports = router;