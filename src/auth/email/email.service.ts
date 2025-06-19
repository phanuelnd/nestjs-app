import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendWelcomeEmail(email: string, tempPassword: string, firstName: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
        to: email,
        subject: 'Welcome to Building Management System',
        html: this.getWelcomeEmailTemplate(firstName, email, tempPassword),
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      throw error;
    }
  }

  private getWelcomeEmailTemplate(firstName: string, email: string, tempPassword: string): string {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .credentials { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          .warning { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
        <body>
        <div class="container">
            <div class="header">
            <h1>Welcome to the Rwanda Building Identification System</h1>
            </div>
            <div class="content">
            <h2>Hello ${firstName},</h2>
            <p>
                An admin account has been created for you on the Rwanda Building Identification System.
            </p>

            <div class="credentials">
                <h3>Your Login Credentials:</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>

            <div class="warning">
                <p><strong>Important:</strong> This is a temporary password. You’ll be prompted to change it upon your first login.</p>
            </div>

            <p>
                To access the system and access the dashboard, click the button below:
            </p>
            <p style="text-align: center;">
                <a href="${loginUrl}/login" class="button">Access the System</a>
            </p>

            <p>
                If you have any issues logging in or questions about your role, please contact the system administrator or MININFRA support team.
            </p>

            <p>
                Best regards,<br>
                Rwanda Building Identification System Team -  MININFRA
            </p>
            </div>
        </div>
        </body>

      </html>
    `;
  }
}