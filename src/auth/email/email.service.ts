import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private apiUrl: string;
  private senderEmail: string;
  private senderName: string;

  constructor(private readonly httpService: HttpService) {
    this.apiUrl = process.env.NOTIFICATION_API_URL || 'https://notification.kubaka.gov.rw/email/send/';
    this.senderEmail = process.env.EMAIL_SENDER_EMAIL || 'no-reply@mininfra.gov.rw';
    this.senderName = process.env.EMAIL_SENDER_NAME || 'National Building Registry - MININFRA';
  }

  async sendWelcomeEmail(email: string, tempPassword: string, firstName: string): Promise<void> {
    try {
      const subject = 'Welcome to Building Management System';
      const message = await this.getEmailTemplate(email, tempPassword, firstName);

      // Prepare form data as x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('sender_email', this.senderEmail);
      formData.append('sender_name', this.senderName);
      formData.append('receiver_email', email);
      formData.append('receiver_name', firstName);
      formData.append('subject', subject);
      formData.append('message', message);

      // Send POST request
      const response$ = this.httpService.post(this.apiUrl, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      // Wait for the response
      const response = await lastValueFrom(response$);

      if (response.status === 200 || response.status === 201) {
        this.logger.log(`Welcome email sent to ${email} via notification API.`);
      } else {
        this.logger.error(`Failed to send welcome email to ${email}. Status: ${response.status}`);
        throw new Error(`Notification API error with status ${response.status}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email} via notification API:`, error);
      throw error;
    }
  }
  async getEmailTemplate(email: string, tempPassword: string, firstName: string): Promise<string> {
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome Email</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 30px;
          color: #333;
        }
        .button {
          display: inline-block;
          background-color: #2563eb;
          color: white !important;
          padding: 12px 20px;
          border-radius: 6px;
          text-decoration: none;
          margin-top: 20px;
      
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #888;
          padding: 20px;
        }
        .credentials {
          background-color: #f1f5f9;
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>

    <div class="container">
      <div class="header">
        <h2>Welcome to the Rwanda Building Identification System</h2>
      </div>

      <div class="content">
        <p>Hello <strong>${firstName}</strong>,</p>

        <p>An admin account has been created for you on the <strong>Rwanda Building Identification System</strong>.</p>

        <div class="credentials">
          <p><strong>Your Login Credentials:</strong></p>
          <p>Email: ${email}<br>
            Temporary Password: ${tempPassword}</p>
        </div>

        <p><strong>Important:</strong> This is a temporary password. You’ll be prompted to change it upon your first login.</p>

        <p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:4200'}/login" class="button">Access the System</a>
        </p>

        <p>Best regards,<br>
          Rwanda Building Identification System Team<br>
          <em>MININFRA</em>
        </p>
      </div>

      <div class="footer">
        © 2025 Rwanda Building Identification System – MININFRA
      </div>
    </div>

    </body>
    </html>
    `;
    return htmlContent;
  }
}
