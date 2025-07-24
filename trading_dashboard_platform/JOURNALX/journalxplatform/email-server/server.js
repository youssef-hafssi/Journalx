const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000'], // Allow your frontend
  credentials: true
}));
app.use(express.json());

// Create SMTP transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD // Use App Password
    }
  });
};

// Email verification endpoint
app.post('/api/send-verification-email', async (req, res) => {
  try {
    const { to, subject, html, name, verificationUrl } = req.body;

    if (!to || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, html' 
      });
    }

    const transporter = createTransporter();

    // Verify SMTP connection
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    const mailOptions = {
      from: {
        name: 'JournalX Trading Platform',
        address: process.env.GMAIL_USER
      },
      to: to,
      subject: subject || 'Verify your JournalX account',
      html: html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', {
      messageId: info.messageId,
      to: to,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Handle specific error types
    if (error.code === 'EAUTH') {
      res.status(401).json({ 
        success: false, 
        error: 'SMTP authentication failed. Check your Gmail credentials.',
        details: 'Make sure you\'re using an App Password, not your regular Gmail password'
      });
    } else if (error.code === 'ECONNECTION') {
      res.status(503).json({ 
        success: false, 
        error: 'Failed to connect to SMTP server' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send email',
        details: error.message 
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'JournalX Email Server'
  });
});

// Test SMTP connection endpoint
app.get('/api/test-smtp', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    res.json({ 
      success: true, 
      message: 'SMTP connection successful',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        user: process.env.GMAIL_USER ? 'Configured' : 'Not configured'
      }
    });
  } catch (error) {
    console.error('SMTP test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'SMTP connection failed',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email server running on port ${PORT}`);
  console.log(`📧 SMTP User: ${process.env.GMAIL_USER ? 'Configured' : 'Not configured'}`);
  console.log(`🔑 App Password: ${process.env.GMAIL_APP_PASSWORD ? 'Configured' : 'Not configured'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 SMTP test: http://localhost:${PORT}/api/test-smtp`);
});
