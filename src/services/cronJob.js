import { schedule } from 'node-cron';
import moment from 'moment';
import  generateInvoicePDF  from './invoiceService.js';
import sendInvoiceEmail  from './emailService.js';
import Student from '../models/Student.js';

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

// Optional: Send summary to admin
export const sendAdminSummary = async (results, month, successCount, failCount) => {
  try {
    
    const summaryHtml = `
      <h2>Monthly Invoice Summary - ${month}</h2>
      <p><strong>Total Processed:</strong> ${results.length}</p>
      <p><strong>Successful:</strong> ${successCount}</p>
      <p><strong>Failed:</strong> ${failCount}</p>
      <hr>
      <h3>Details:</h3>
      <ul>
        ${results.map(r => `
          <li>
            <strong>${r.student}</strong> (${r.email}) - 
            <span style="color: ${r.status === 'success' ? 'green' : 'red'}">
              ${r.status.toUpperCase()}
            </span>
            ${r.invoiceNumber ? `- Invoice: ${r.invoiceNumber}` : ''}
            ${r.error ? `- Error: ${r.error}` : ''}
          </li>
        `).join('')}
      </ul>
    `;

    // This is a simplified version - you might want to create a proper admin email function
    console.log('Admin Summary:', summaryHtml);
    
  } catch (error) {
    console.error('Error sending admin summary:', error);
  }
};

// Schedule the cron job to run on 1st of every month at 9 AM
const scheduleMonthlyInvoices = () => {
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

