import nodemailer from 'nodemailer'

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
      user: '', // your email
      pass: ''// your app password (not regular password)
    }
  });
};

// Function to send email with PDF attachment
const sendInvoiceEmail = async (studentEmail, studentName, pdfBuffer, invoiceNumber, month) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Invoice for ${month} - Mathify Tutoring`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Monthly Invoice - Mathify</h2>
          <p>Dear ${studentName},</p>
          <p>Please find attached your invoice for the month of <strong>${month}</strong>.</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
          <br>
          <p>Best regards,<br>
          Mathify Team</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated email. Please do not reply to this email address.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Invoice sent successfully to ${studentEmail}:`, result.messageId);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error(`Failed to send invoice to ${studentEmail}:`, error);
    return { success: false, error: error.message };
  }
};

export default sendInvoiceEmail