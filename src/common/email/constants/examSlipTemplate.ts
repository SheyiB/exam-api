/**
 * Unified Exam Slip Template Generator
 * Can be used in both frontend and backend environments
 */
export interface ExamData {
  exam?: {
    examType?: string;
    examNumber?: string;
    examDate?: string | Date;
  };
  examType?: string;
  examNumber?: string;
  surname?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string | Date;
  staffVerificationNumber?: string;
  nin?: string;
  cadre?: string;
  mda?: string;
  disability?: boolean | string;
  presentRank?: string;
  presentGradeLevel?: string;
  presentStep?: string;
  expectedRank?: string;
  expectedGradeLevel?: string;
  dateOfFirstAppointment?: string | Date;

  // Extra for frontend PDF
  profilePassport?: string;
  employeePassport?: string;
}

export interface ExamSlipOptions {
  logoUrl?: string;
  isBackend?: boolean;
  profilePhotoUrl?: string | null;
  employeePhotoUrl?: string | null;

  // frontend only
  logoImage?: string;
  filename?: string;
}

// Extend global Window for html2pdf
declare global {
  interface Window {
    html2pdf?: any;
  }
}
/**
 * Generate HTML template for exam registration slip
 * @param {Object} data - Registrant data
 * @param {Object} options - Generation options
 * @param {string} options.logoUrl - Logo image URL or base64
 * @param {boolean} options.isBackend - Whether running on backend (affects styling)
 * @param {string} options.profilePhotoUrl - Profile photo URL or base64
 * @param {string} options.employeePhotoUrl - Employee photo URL or base64
 * @returns {string} HTML template string
 */

const formatDate = (date?: string | Date): string => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const generatePhotoSection = (
  photoUrl: string | null | undefined,
  label: string,
  altText: string
): string => {
  if (photoUrl && photoUrl !== "N/A") {
    return `
      <img src="${photoUrl}" alt="${altText}" 
           style="width: 100%; height: 100%; object-fit: cover;" 
           onerror="this.parentElement.innerHTML='<div class=\\"no-photo\\">Photo Not Available</div>'">
    `;
  }
  return `<div class="no-photo">No Photo Available</div>`;
};

export const generateExamSlipTemplate = (
  data: ExamData,
  options: ExamSlipOptions = {}
): string => {
  const {
    logoUrl = "",
    isBackend = false,
    profilePhotoUrl = null,
    employeePhotoUrl = null,
  } = options;

  const currentYear = new Date().getFullYear();
  const examType =
    data?.exam?.examType?.toUpperCase() ||
    data?.examType?.toUpperCase() ||
    "PROMOTIONAL";

  const registrant = {
    examNumber: data?.exam?.examNumber || data?.examNumber || "N/A",
    fullName: `${data?.surname || ""} ${data?.firstName || ""} ${
      data?.middleName || ""
    }`.trim(),
    email: data?.email || "N/A",
    phone: data?.phone || "N/A",
    gender: data?.gender || "N/A",
    dateOfBirth: data?.dateOfBirth,
    staffVerificationNumber: data?.staffVerificationNumber || "N/A",
    nin: data?.nin || "N/A",
    cadre: data?.cadre || "N/A",
    mda: data?.mda || "N/A",
    disability: data?.disability,
    presentRank: data?.presentRank || "N/A",
    presentGradeLevel: data?.presentGradeLevel || "N/A",
    presentStep: data?.presentStep || "N/A",
    expectedRank: data?.expectedRank || "N/A",
    expectedGradeLevel: data?.expectedGradeLevel || "N/A",
    dateOfFirstAppointment: data?.dateOfFirstAppointment,
    examDate: data?.exam?.examDate ,
  };

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
                padding: ${isBackend ? '15px' : '20px'};
                background-color: ${isBackend ? 'white' : '#f5f5f5'};
            }
            .slip-container {
                background-color: white;
                padding: 25px;
                border-radius: 10px;
                box-shadow: ${isBackend ? 'none' : '0 4px 8px rgba(0,0,0,0.1)'};
            }
            .header {
                text-align: center;
                margin-bottom: 25px;
            }
            .logo {
                width: 140px;
                height: auto;
                margin-bottom: 15px;
                display: block;
                margin-left: auto;
                margin-right: auto;
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
                flex-wrap: wrap;
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
            @media print {
                body { 
                    background-color: white;
                    padding: 10px;
                }
                .slip-container { 
                    box-shadow: none; 
                    padding: 15px;
                }
            }
            @media (max-width: 768px) {
                .details-grid,
                .position-grid {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                .photos-section {
                    gap: 20px;
                }
                .photo-frame {
                    width: 120px;
                    height: 120px;
                }
            }
        </style>
    </head>
    <body>
        <div class="slip-container">
            <div class="header">
                ${logoUrl ? `<img src="${logoUrl}" alt="SEB Logo" class="logo" onerror="this.style.display='none'">` : ''}
                <h1 class="title">${currentYear} ${examType} EXAMINATION REGISTRATION SLIP</h1>
            </div>
            
            <div class="content-box">
                <h2 class="section-title">Registration Details</h2>
                
                <div class="photos-section">
                    <div class="photo-container">
                        <div class="photo-frame">
                            ${generatePhotoSection(profilePhotoUrl, 'Profile Photo (Uploaded)', 'Profile Photo')}
                        </div>
                        <div class="photo-label">Profile Photo (Uploaded)</div>
                    </div>
                    
                    <div class="photo-container">
                        <div class="photo-frame">
                            ${generatePhotoSection(employeePhotoUrl, 'Profile Photo (Nominal Roll)', 'Employee Photo')}
                        </div>
                        <div class="photo-label">Profile Photo (Nominal Roll)</div>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-box">
                        <div class="detail-item"><strong>Exam Number:</strong> ${registrant.examNumber}</div>
                        <div class="detail-item"><strong>Full Name:</strong> ${registrant.fullName}</div>
                        <div class="detail-item"><strong>Email:</strong> ${registrant.email}</div>
                        <div class="detail-item"><strong>Phone No:</strong> ${registrant.phone}</div>
                        <div class="detail-item"><strong>Gender:</strong> ${registrant.gender}</div>
                        <div class="detail-item"><strong>Date of Birth:</strong> ${formatDate(registrant.dateOfBirth)}</div>
                    </div>
                    
                    <div class="detail-box">
                        <div class="detail-item"><strong>Staff Verification Number:</strong> ${registrant.staffVerificationNumber}</div>
                        <div class="detail-item"><strong>NIN:</strong> ${registrant.nin}</div>
                        <div class="detail-item"><strong>Cadre:</strong> ${registrant.cadre}</div>
                        <div class="detail-item"><strong>MDA:</strong> ${registrant.mda}</div>
                        <div class="detail-item"><strong>Disability Status:</strong> ${registrant.disability ? 'Yes' : 'No'}</div>
                        <div class="detail-item"><strong>Exam Date:</strong> ${formatDate(registrant.examDate) !== 'N/A' ? formatDate(registrant.examDate) : 'TBD'}</div>
                    </div>
                </div>
                
                <div class="position-section">
                    <h3 class="section-title">Position Details</h3>
                    <div class="position-grid">
                        <div>
                            <div class="detail-item"><strong>Present Rank:</strong> ${registrant.presentRank}</div>
                            <div class="detail-item"><strong>Grade Level:</strong> ${registrant.presentGradeLevel}</div>
                            <div class="detail-item"><strong>Step:</strong> ${registrant.presentStep}</div>
                        </div>
                        <div>
                            <div class="detail-item"><strong>Expected Rank:</strong> ${registrant.expectedRank}</div>
                            <div class="detail-item"><strong>Expected Grade Level:</strong> ${registrant.expectedGradeLevel}</div>
                            <div class="detail-item"><strong>Date of First Appointment:</strong> ${formatDate(registrant.dateOfFirstAppointment)}</div>
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
};

/**
 * Frontend-specific function to generate and download PDF
 * Requires html2pdf.js library
 */

/**
 * Backend-specific function to generate PDF buffer
 * Requires puppeteer
 */
export const generateExamSlipPDFBuffer = async (
  registrantData: ExamData,
  options: ExamSlipOptions = {}
): Promise<string> => {
  const { logoUrl = "", profilePhotoUrl = null, employeePhotoUrl = null } =
    options;

  const htmlContent = generateExamSlipTemplate(registrantData, {
    logoUrl,
    profilePhotoUrl,
    employeePhotoUrl,
    isBackend: true,
  });

  return htmlContent;
};

// Example usage:
/*
// Frontend usage:
import { generateAndDownloadExamSlipPDF } from './examSlipTemplate.js';

const downloadSlip = async () => {
  await generateAndDownloadExamSlipPDF(registrantData, {
    logoImage: logoSrc,
    filename: 'custom_exam_slip.pdf'
  });
};

// Backend usage:
import { generateExamSlipPDFBuffer } from './examSlipTemplate.js';

const generatePDF = async (registrantData) => {
  const htmlContent = generateExamSlipPDFBuffer(registrantData, {
    logoUrl: process.env.SEB_LOGO_URL,
    profilePhotoUrl: registrantData.profilePassport,
    employeePhotoUrl: registrantData.employeePassport
  });
  
  // Use with puppeteer to generate PDF buffer
  const pdfBuffer = await page.pdf({
    // puppeteer options
  });
  
  return pdfBuffer;
};
*/
