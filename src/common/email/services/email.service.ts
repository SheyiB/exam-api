
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { getEmailConfig } from '../email.config';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.createTransporter();
  }

  private generateRegistrationSlipTemplate(data: {
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
  }): string {
    const currentYear = new Date().getFullYear();
    // Use environment variable or fallback to placeholder
    const logoUrl = this.configService.get('SEB_LOGO_URL') || 'https://via.placeholder.com/140x80/15411f/white?text=SEB+LOGO';
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SEB Examination Registration Slip</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 15px;
                background-color: #f5f5f5;
            }
            .slip-container {
                background-color: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 25px;
            }
            .logo {
                width: 140px;
                height: auto;
                margin-bottom: 15px;
            }
            .title {
                color: #15411f;
                font-weight: bold;
                font-size: 22px;
                text-transform: uppercase;
                margin: 0;
                line-height: 1.2;
            }
            .content-box {
                border: 2px solid #15411f;
                padding: 25px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .photos-section {
                display: flex;
                justify-content: center;
                gap: 40px;
                margin-bottom: 25px;
                align-items: center;
            }
            .photo-container {
                text-align: center;
            }
            .photo-frame {
                width: 150px;
                height: 150px;
                border: 3px solid #15411f;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f8f9fa;
            }
            .photo-frame img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .no-photo {
                color: #666;
                font-size: 14px;
                font-style: italic;
            }
            .photo-label {
                font-size: 14px;
                font-weight: bold;
                color: #15411f;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            .detail-box {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #15411f;
            }
            .detail-item {
                margin: 8px 0;
                font-size: 16px;
            }
            .detail-item strong {
                color: #15411f;
                font-weight: bold;
            }
            .section-title {
                color: #15411f;
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                text-align: center;
            }
            .position-section {
                margin-top: 20px;
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                border-top: 3px solid #15411f;
            }
            .position-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .notice-section {
                margin-top: 25px;
                text-align: center;
                padding: 15px;
                background-color: #f2f8f3;
                border-radius: 8px;
                border-top: 3px solid #15411f;
            }
            .notice-title {
                font-weight: bold;
                color: #15411f;
                font-size: 18px;
                margin-bottom: 8px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
            }
            @media (max-width: 600px) {
                .details-grid, .position-grid {
                    grid-template-columns: 1fr;
                }
                .photos-section {
                    flex-direction: column;
                    gap: 20px;
                }
                .photo-frame {
                    width: 130px;
                    height: 130px;
                }
            }
        </style>
    </head>
    <body>
        <div class="slip-container">
            <div class="header">
                <img src="${logoUrl}" alt="SEB Logo" class="logo" onerror="this.style.display='none'">
                <h1 class="title">${currentYear} ${data.examType?.toUpperCase() || 'PROMOTIONAL'} EXAMINATION REGISTRATION SLIP</h1>
            </div>
            
            <div class="content-box">
                <h2 class="section-title">Registration Details</h2>
                
                <div class="photos-section">
                    <div class="photo-container">
                        <div class="photo-frame">
                            ${data.profilePassport ? 
                                `<img src="${data.profilePassport}" alt="Profile Photo" onerror="this.parentElement.innerHTML='<div class=\\"no-photo\\">Photo Not Available</div>'">` : 
                                `<div class="no-photo">No Photo Available</div>`
                            }
                        </div>
                        <div class="photo-label">Profile Photo (Uploaded)</div>
                    </div>
                    
                    <div class="photo-container">
                        <div class="photo-frame">
                            ${data.employeePassport ? 
                                `<img src="${data.employeePassport}" alt="Employee Photo" onerror="this.parentElement.innerHTML='<div class=\\"no-photo\\">Photo Not Available</div>'">` : 
                                `<div class="no-photo">No Photo Available</div>`
                            }
                        </div>
                        <div class="photo-label">Profile Photo (Nominal Roll)</div>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-box">
                        <div class="detail-item"><strong>Exam Number:</strong> ${data.examNumber || 'N/A'}</div>
                        <div class="detail-item"><strong>Full Name:</strong> ${data.surname || ''} ${data.firstName || ''} ${data.middleName || ''}</div>
                        <div class="detail-item"><strong>Email:</strong> ${data.email || 'N/A'}</div>
                        <div class="detail-item"><strong>Phone No:</strong> ${data.phone || 'N/A'}</div>
                        <div class="detail-item"><strong>Gender:</strong> ${data.gender || 'N/A'}</div>
                        <div class="detail-item"><strong>Date of Birth:</strong> ${data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    
                    <div class="detail-box">
                        <div class="detail-item"><strong>Staff Verification Number:</strong> ${data.staffVerificationNumber || 'N/A'}</div>
                        <div class="detail-item"><strong>NIN:</strong> ${data.nin || 'N/A'}</div>
                        <div class="detail-item"><strong>Cadre:</strong> ${data.cadre || 'N/A'}</div>
                        <div class="detail-item"><strong>MDA:</strong> ${data.mda || 'N/A'}</div>
                        <div class="detail-item"><strong>Disability Status:</strong> ${data.disability ? "Yes" : "No"}</div>
                        <div class="detail-item"><strong>Exam Date:</strong> ${data.examDate ? new Date(data.examDate).toLocaleDateString() : 'TBD'}</div>
                    </div>
                </div>
                
                <div class="position-section">
                    <h3 class="section-title">Position Details</h3>
                    <div class="position-grid">
                        <div>
                            <div class="detail-item"><strong>Present Rank:</strong> ${data.presentRank || 'N/A'}</div>
                            <div class="detail-item"><strong>Grade Level:</strong> ${data.presentGradeLevel || 'N/A'}</div>
                            <div class="detail-item"><strong>Step:</strong> ${data.presentStep || 'N/A'}</div>
                        </div>
                        <div>
                            <div class="detail-item"><strong>Expected Rank:</strong> ${data.expectedRank || 'N/A'}</div>
                            <div class="detail-item"><strong>Expected Grade Level:</strong> ${data.expectedGradeLevel || 'N/A'}</div>
                            <div class="detail-item"><strong>Date of First Appointment:</strong> ${data.dateOfFirstAppointment ? new Date(data.dateOfFirstAppointment).toLocaleDateString() : 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="notice-section">
                    <div class="notice-title">📋 IMPORTANT NOTICE</div>
                    <p style="font-size: 16px; margin: 8px 0;">Please bring this slip along with a valid ID on the day of examination.</p>
                    <p style="font-size: 16px; font-weight: bold; color: #15411f;">Good luck with your examination!</p>
                </div>
            </div>
            
            <div class="footer">
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>State Examination Board (SEB) • ${currentYear}</p>
            </div>
        </div>
    </body>
    </html>
    `;
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

  async sendWelcomeEmail(
    email: string,
    registrantData: {
      firstName: string;
      surname: string;
      middleName: string;
      examNumber?: string;
      examType?: string;
      examDate?: Date;
      phone?: string;
      gen
    }
  ): Promise<boolean> {
    const welcomeEmailHtml = this.generateWelcomeEmailTemplate(registrantData);
    
    return this.sendEmail({
      to: email,
      subject: 'Welcome to SEB Exam Portal - Registration Successful',
      html: welcomeEmailHtml,
      text: `Dear ${registrantData.firstName} ${registrantData.surname}, your registration has been successful. Your exam number is ${registrantData.examNumber}.`,
    });
  }

  async sendExamStatusUpdateEmail(
    email: string,
    registrantData: {
      firstName: string;
      surname: string;
      middlename: string,
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