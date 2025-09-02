import { schedule } from 'node-cron';
import moment from 'moment';
import  generateInvoicePDF, { generatePDFSummary }  from './invoiceService.js';
import sendInvoiceEmail  from './emailService.js';
import Student from '../models/Student.js';
import { createTransporter } from './emailService.js';

// Function to send invoices to all students
export const sendMonthlyInvoices = async () => {
  try {
    console.log('Starting monthly invoice generation and sending...');
    
    // Get previous month
    const lastMonth = moment().subtract(1, 'month').format('YYYY-MM');
    const monthName = moment().subtract(1, 'month').format('MMMM YYYY');
    
    // Get all active students
    const students = await Student.find({ _id: '6858258c73d31d5890d6b6f5'}); // adjust query as needed
    // console.log('students',students);
    
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (const student of students) {
      try {
        console.log(`Processing invoice for ${student.name}...`);
        
        // Generate PDF
        const invoiceData = await generateInvoicePDF(student, lastMonth);
        
        // if (!invoiceData) {
        //   console.log(`Skipping ${student.name} - no attendance records`);
        //   continue;
        // }

        // Send email
        const emailResult = await sendInvoiceEmail(
          student.email,
          student.name,
          invoiceData.buffer,
          invoiceData.invoiceNumber,
          monthName
        );

        if (emailResult.success) {
          successCount++;
          results.push({
            student: student.name,
            email: student.email,
            status: 'success',
            invoiceNumber: invoiceData.invoiceNumber,
            amount: invoiceData.totalAmount
          });
        } else {
          failCount++;
          results.push({
            student: student.name,
            email: student.email,
            status: 'failed',
            error: emailResult.error
          });
        }

        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing ${student.name}:`, error);
        failCount++;
        results.push({
          student: student.name,
          email: student.email,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`Monthly invoice sending completed:`);
    console.log(`Success: ${successCount}, Failed: ${failCount}`);
    console.log('Results:', results);

    // Optionally, send summary email to admin
    await sendAdminSummary(results, monthName, successCount, failCount);

  } catch (error) {
    console.error('Error in monthly invoice process:', error);
  }
};

const sendAdminSummary = async (results, month, successCount, failCount) => {
  try {
    const adminEmail = 'softsitar@gmail.com';
    const adminName = 'Admin';
    
    // Generate PDF
    console.log('📄 Generating PDF summary...');
    const { buffer, filename } = await generatePDFSummary(results, month, successCount, failCount);
    
    // Calculate total revenue for email subject
    const totalRevenue = results
      .filter(r => r.status === 'success' && r.amount)
      .reduce((sum, r) => sum + r.amount, 0);
    
    // Create simple HTML email body
    const currentDateTime = moment().format('DD MMM YYYY, hh:mm A');
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0;">📊 Monthly Invoice Summary</h1>
          <h2 style="margin: 10px 0 0 0; font-weight: normal;">${month}</h2>
        </div>
        
        <div style="margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0;">Summary</h3>
          <p><strong>Total Processed:</strong> ${results.length}</p>
          <p><strong>Successful:</strong> ${successCount}</p>
          <p><strong>Failed:</strong> ${failCount}</p>
          <p><strong>Total Revenue:</strong> ₹${totalRevenue}</p>
        </div>
        
        <div style="padding: 20px; background: #e3f2fd; border-radius: 8px; text-align: center;">
          <h3 style="margin: 0 0 10px 0;">📎 Detailed Report</h3>
          <p style="margin: 0;">Please find the detailed invoice summary attached as a PDF file.</p>
        </div>
        
        ${failCount > 0 ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Action Required</h4>
            <p style="color: #856404; margin: 0;">
              ${failCount} invoice(s) failed to send. Please review the attached PDF for details.
            </p>
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #6c757d; font-size: 0.9em;">
            This is an automated summary from Mathify Invoice System<br>
            Generated on ${currentDateTime}
          </p>
        </div>
      </div>
    `;
    
    // Send admin summary email with PDF attachment
    const emailResult = await sendAdminEmail(adminEmail, adminName, emailHtml, month, results.length, successCount, failCount, buffer, filename);
    
    if (emailResult.success) {
      console.log('✅ Admin summary email with PDF sent successfully');
    } else {
      console.error('❌ Failed to send admin summary email:', emailResult.error);
    }
    
  } catch (error) {
    console.error('Error sending admin summary:', error);
  }
};


const sendAdminEmail = async (adminEmail, adminName, htmlContent, month, totalProcessed, successCount, failCount, pdfBuffer, pdfFilename) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `📊 Monthly Invoice Summary - ${month} | ${successCount}/${totalProcessed} Successful`,
      html: htmlContent,
      attachments: [
        {
          filename: pdfFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ],
      priority: 'high',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Admin summary with PDF sent to ${adminEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`Failed to send admin summary to ${adminEmail}:`, error);
    return { success: false, error: error.message };
  }
};

// Schedule the cron job to run on 1st of every month at 9 AM
export const scheduleMonthlyInvoices = () => {
  // '0 9 1 * *' means: at 9:00 AM on the 1st day of every month
  schedule('0 9 1 * *', () => {
    console.log('Monthly invoice cron job triggered');
    sendMonthlyInvoices();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });

  console.log('Monthly invoice cron job scheduled for 1st of every month at 9 AM');
};

// For testing - run immediately
export const testInvoiceSending = async () => {
  console.log('Testing invoice sending...');
  await sendMonthlyInvoices();
};

