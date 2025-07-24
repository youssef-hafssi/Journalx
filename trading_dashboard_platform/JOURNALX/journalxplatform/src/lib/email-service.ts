// Email service for sending verification emails via SMTP
// This would typically be implemented on your backend/server

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface VerificationEmailData {
  to: string;
  name: string;
  verificationUrl: string;
  token: string;
}

export class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async sendVerificationEmail(data: VerificationEmailData): Promise<boolean> {
    try {
      // For client-side implementation, we'll use a backend API endpoint
      // In production, this should be handled by your backend server
      
      const emailData = {
        to: data.to,
        subject: 'Verify your JournalX account',
        html: this.createVerificationEmailTemplate(data)
      };

      // This would call your backend API endpoint that handles SMTP sending
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  private createVerificationEmailTemplate(data: VerificationEmailData): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px; font-weight: bold;">
              📊 JournalX
            </h1>
            <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 16px;">
              Trading Journal Platform
            </p>
          </div>

          <!-- Main Content -->
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="background-color: #3b82f6; color: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
              ✉️
            </div>
            
            <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">
              Verify Your Email Address
            </h2>
            
            <p style="color: #4b5563; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
              Hi <strong>${data.name}</strong>,
            </p>
            
            <p style="color: #4b5563; margin: 0 0 32px 0; font-size: 16px; line-height: 1.5;">
              Thank you for signing up with JournalX! To complete your account setup and start using our trading journal platform, please verify your email address by clicking the button below:
            </p>

            <!-- Verification Button -->
            <div style="margin: 40px 0;">
              <a href="${data.verificationUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                ✅ Verify Email Address
              </a>
            </div>

            <p style="color: #6b7280; margin: 24px 0; font-size: 14px; line-height: 1.5;">
              If the button doesn't work, you can copy and paste this link into your browser:
            </p>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; word-break: break-all;">
              <a href="${data.verificationUrl}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                ${data.verificationUrl}
              </a>
            </div>

            <div style="background-color: #fef3cd; border-left: 4px solid #f59e0b; padding: 16px; margin: 32px 0; text-align: left;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>⏰ Important:</strong> This verification link will expire in 24 hours for security reasons.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0;">
          
          <div style="text-align: center;">
            <p style="color: #6b7280; margin: 0 0 16px 0; font-size: 14px;">
              🚀 <strong>What's next after verification?</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; text-align: left; max-width: 400px; margin: 0 auto; padding-left: 20px;">
              <li>Access your personalized trading dashboard</li>
              <li>Start logging your trades and analyzing performance</li>
              <li>Use advanced journal features to improve your trading</li>
              <li>Track your progress with detailed analytics</li>
            </ul>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;">
          
          <div style="text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
              If you didn't create an account with JournalX, you can safely ignore this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 JournalX - Professional Trading Journal Platform
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Default configuration for Gmail SMTP
export const gmailSMTPConfig: EmailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '' // Use App Password, not regular password
  }
};

// Singleton instance
export const emailService = new EmailService(gmailSMTPConfig);
