import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as puppeteer from 'puppeteer';
import { getEmailConfig } from '../email.config';
import { generateExamSlipTemplate } from '../constants/examSlipTemplate.js'

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}

export interface RegistrantData {
  email: string;
  firstName: string;
  surname: string;
  middleName?: string;
  examNumber?: string;
  examType?: string;
  examDate?: Date;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  staffVerificationNumber?: string;
  nin?: string;
  cadre?: string;
  mda?: string;
  disability?: boolean;
  presentRank?: string;
  presentGradeLevel?: string;
  presentStep?: string;
  expectedRank?: string;
  expectedGradeLevel?: string;
  dateOfFirstAppointment?: Date;
  profilePassport?: string;
  employeePassport?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private generateRegistrationSlipTemplate(data: RegistrantData): string {
  const logoUrl = this.configService.get('SEB_LOGO_URL') || 'https://via.placeholder.com/140x80/15411f/white?text=SEB+LOGO';
  
  return generateExamSlipTemplate(data, {
    logoUrl,
    profilePhotoUrl: data.profilePassport,
    employeePhotoUrl: data.employeePassport,
    isBackend: true
  });
}

  private async generateRegistrationSlipPDF(data: RegistrantData): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    
    try {
      this.logger.log('Starting PDF generation for registration slip');
      
      // Launch puppeteer browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set page format for PDF
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
      });

      // Generate HTML content
      const htmlContent = this.generateRegistrationSlipTemplate(data);
      
      // Set HTML content
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true
      });

      this.logger.log('PDF generation completed successfully');
      return Buffer.from(pdfBuffer);

    } catch (error) {
      this.logger.error('Failed to generate PDF for registration slip', error);
      throw new InternalServerErrorException('Failed to generate registration slip PDF');
    } finally {
      // Always close the browser
      if (browser) {
        await browser.close();
      }
    }
  }

  private createTransporter() {
    try {
      const config = getEmailConfig();
      
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      this.logger.log('Email transporter created successfully');
    } catch (error) {
      this.logger.error('Failed to create email transporter', error);
      throw new InternalServerErrorException('Email service initialization failed');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM') || this.configService.get('EMAIL_USER'),
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to: ${options.to}`, result.messageId);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to: ${options.to}`, error);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, registrantData: RegistrantData): Promise<boolean> {
    try {
      this.logger.log(`Generating welcome email with PDF attachment for: ${email}`);
      
      // Generate the PDF registration slip
      const pdfBuffer = await this.generateRegistrationSlipPDF(registrantData);
      
      // Generate welcome email HTML
      const welcomeEmailHtml = this.generateWelcomeEmailTemplate({
        firstName: registrantData.firstName,
        surname: registrantData.surname,
        examNumber: registrantData.examNumber,
        examType: registrantData.examType,
        examDate: registrantData.examDate,
      });

      // Create filename for PDF attachment
      const pdfFileName = `${registrantData.examNumber || 'Registration'}_Slip_${registrantData.firstName}_${registrantData.surname}.pdf`;
      
      // Send email with PDF attachment
      return this.sendEmail({
        to: email,
        subject: 'Welcome to SEB Exam Portal - Registration Successful',
        html: welcomeEmailHtml,
        text: `Dear ${registrantData.firstName} ${registrantData.surname}, your registration has been successful. Your exam number is ${registrantData.examNumber}. Please find your registration slip attached.`,
        attachments: [
          {
            filename: pdfFileName,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }
        ],
      });

    } catch (error) {
      this.logger.error(`Failed to send welcome email with PDF to: ${email}`, error);
      
      // Fallback: Send email without PDF attachment
      this.logger.log(`Attempting to send welcome email without PDF attachment to: ${email}`);
      const welcomeEmailHtml = this.generateWelcomeEmailTemplate({
        firstName: registrantData.firstName,
        surname: registrantData.surname,
        examNumber: registrantData.examNumber,
        examType: registrantData.examType,
        examDate: registrantData.examDate,
      });
      
      return this.sendEmail({
        to: email,
        subject: 'Welcome to SEB Exam Portal - Registration Successful',
        html: welcomeEmailHtml,
        text: `Dear ${registrantData.firstName} ${registrantData.surname}, your registration has been successful. Your exam number is ${registrantData.examNumber}.`,
      });
    }
  }

  async sendExamStatusUpdateEmail(
    email: string,
    registrantData: {
      firstName: string;
      surname: string;
      middlename: string;
      examNumber: string;
      examStatus: string;
      totalScore?: number;
      remark?: string;
    }
  ): Promise<boolean> {
    const statusUpdateHtml = this.generateStatusUpdateEmailTemplate(registrantData);
    
    return this.sendEmail({
      to: email,
      subject: `Exam Status Update - ${registrantData.examNumber}`,
      html: statusUpdateHtml,
      text: `Dear ${registrantData.firstName} ${registrantData.surname}, your exam status has been updated to: ${registrantData.examStatus}`,
    });
  }

  // Method to generate and return PDF without sending email (for download purposes)
  async generateRegistrationSlipPDFForDownload(registrantData: RegistrantData): Promise<Buffer> {
    return this.generateRegistrationSlipPDF(registrantData);
  }

  private generateWelcomeEmailTemplate(data: {
    firstName: string;
    surname: string;
    examNumber?: string;
    examType?: string;
    examDate?: Date;
  }): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SEB Exam Portal</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #0056b3;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 5px 5px;
                border: 1px solid #dee2e6;
            }
            .exam-details {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid #0056b3;
            }
            .attachment-notice {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                color: #155724;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #6c757d;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Registration Successful!</h1>
        </div>
        
        <div class="content">
            <h2>Dear ${data.firstName} ${data.surname},</h2>
            
            <p>Congratulations! Your registration for the SEB examination has been successfully completed.</p>
            
            <div class="attachment-notice">
                <h3>📎 Registration Slip Attached</h3>
                <p><strong>Your official registration slip has been attached to this email as a PDF file.</strong> Please download and print it for your records. You will need to bring this slip along with a valid ID on the day of examination.</p>
            </div>
            
            ${data.examNumber ? `
            <div class="exam-details">
                <h3>📋 Exam Details:</h3>
                <ul>
                    <li><strong>Exam Number:</strong> ${data.examNumber}</li>
                    ${data.examType ? `<li><strong>Exam Type:</strong> ${data.examType.charAt(0).toUpperCase() + data.examType.slice(1)}</li>` : ''}
                    ${data.examDate ? `<li><strong>Exam Date:</strong> ${new Date(data.examDate).toLocaleDateString()}</li>` : ''}
                </ul>
            </div>
            ` : ''}
            
            <p><strong>Important Notes:</strong></p>
            <ul>
                <li>Please keep your exam number safe as you will need it for future reference</li>
                <li><strong>Download and print your registration slip attached to this email</strong></li>
                <li>Bring both your registration slip and a valid ID to the examination venue</li>
                <li>You will be notified of any updates regarding your exam status</li>
                <li>Make sure to check your email regularly for important announcements</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>State Examination Board (SEB)</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
    `;
  }

  private generateStatusUpdateEmailTemplate(data: {
    firstName: string;
    surname: string;
    examNumber: string;
    examStatus: string;
    totalScore?: number;
    remark?: string;
  }): string {
    const statusColor = data.examStatus === 'passed' ? '#28a745' : 
                       data.examStatus === 'failed' ? '#dc3545' : '#ffc107';
    const statusIcon = data.examStatus === 'passed' ? '✅' : 
                      data.examStatus === 'failed' ? '❌' : '⏳';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exam Status Update</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #0056b3;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f8f9fa;
                padding: 30px;
                border-radius: 0 0 5px 5px;
                border: 1px solid #dee2e6;
            }
            .status-badge {
                display: inline-block;
                padding: 10px 20px;
                border-radius: 25px;
                color: white;
                font-weight: bold;
                text-transform: uppercase;
                background-color: ${statusColor};
            }
            .exam-details {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                margin: 20px 0;
                border-left: 4px solid ${statusColor};
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: #6c757d;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${statusIcon} Exam Status Update</h1>
        </div>
        
        <div class="content">
            <h2>Dear ${data.firstName} ${data.surname},</h2>
            
            <p>Your exam status has been updated. Here are the details:</p>
            
            <div class="exam-details">
                <h3>📋 Exam Results:</h3>
                <ul>
                    <li><strong>Exam Number:</strong> ${data.examNumber}</li>
                    <li><strong>Status:</strong> <span class="status-badge">${data.examStatus}</span></li>
                    ${data.totalScore ? `<li><strong>Total Score:</strong> ${data.totalScore}</li>` : ''}
                    ${data.remark ? `<li><strong>Remark:</strong> ${data.remark}</li>` : ''}
                </ul>
            </div>
            
            ${data.examStatus === 'passed' ? 
                '<p style="color: #28a745;"><strong>🎉 Congratulations! You have successfully passed the examination.</strong></p>' :
                data.examStatus === 'failed' ?
                '<p style="color: #dc3545;"><strong>We regret to inform you that you did not meet the passing requirements this time. Please don\'t give up and consider preparing for the next examination.</strong></p>' :
                '<p style="color: #ffc107;"><strong>Your examination is currently being processed. You will be notified once the results are finalized.</strong></p>'
            }
            
            <p>If you have any questions regarding your results, please contact our support team.</p>
            
            <p>Best regards,<br>
            <strong>State Examination Board (SEB)</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
    `;
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Email connection test failed', error);
      return false;
    }
  }
}