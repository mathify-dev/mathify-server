import PDFDocument from 'pdfkit';
import moment from 'moment';
import Student from '../models/Student.js'; // adjust path
import  Attendance  from '../models/Attendance.js'; // adjust path

// Generate PDF buffer (modified from your existing code)
const generateInvoicePDF = async (student, month) => {
  return new Promise(async (resolve, reject) => {
    try {
      const startOfMonth = moment(month).startOf("month").toDate();
      const endOfMonth = moment(month).endOf("month").toDate();

      const attendances = await Attendance.find({
        student: student._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        isPresent: true,
      });

      const totalHours = attendances.reduce((sum, att) => sum + (att.hours || 0), 0);
      
      // Skip students with 0 hours
      // if (totalHours === 0) {
      //   resolve(null);
      //   return;
      // }

      const rate = student.feesPerHour;
      const totalAmount = rate * totalHours;
      const invoiceNumber = `INV-${student._id.toString().slice(-6)}-${moment(month).format('YYYYMM')}`;

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          buffer: pdfBuffer,
          invoiceNumber,
          totalAmount,
          totalHours
        });
      });

      // Your existing PDF generation code here (from the previous artifact)
      let currentY = 50;

      // Logo (left side) - uncomment when you have logo
      // doc.image("public/logo.png", 50, currentY, { width: 100 });
  
      // Invoice details (right side)
      doc.fontSize(20).font("Helvetica-Bold").text("INVOICE", 250, currentY);
      doc.fontSize(12).font("Helvetica").text(`Invoice #: ${invoiceNumber}`, 400, currentY + 30);
      doc.text(`Date: ${moment().format("YYYY-MM-DD")}`, 400, currentY + 55);
  
      currentY += 100;
  
      // From/To and Period Section
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("FROM:", 50, currentY);
      doc.font("Helvetica");
      doc.text("Mathify", 50, currentY + 20);
      doc.text("Tutoring Services", 50, currentY + 35);
  
      doc.font("Helvetica-Bold");
      doc.text("TO:", 50, currentY + 70);
      doc.font("Helvetica");
      doc.text(`${student.name}`, 50, currentY + 90);
  
      // Period (right side)
      doc.font("Helvetica-Bold");
      doc.text("PERIOD:", 400, currentY);
      doc.font("Helvetica");
      doc.text(`${moment(startOfMonth).format("DD MMM YYYY")} to ${moment(endOfMonth).format("DD MMM YYYY")}`, 400, currentY + 20);
  
      currentY += 140;
  
      // Student Details Section
      doc.font("Helvetica-Bold");
      doc.text("STUDENT DETAILS:", 50, currentY);
      doc.font("Helvetica");
      currentY += 20;
      
      doc.text(`Name: ${student.name}`, 50, currentY);
      doc.text(`Email: ${student.email}`, 50, currentY + 15);
      doc.text(`Phone: ${student.phone}`, 50, currentY + 30);
      doc.text(`Registration No.: ${student._id}`, 50, currentY + 45);
  
      currentY += 80;
  
      // Table Section
      const tableTop = currentY;
      const tableLeft = 50;
      const col1X = tableLeft;      // S.No.
      const col2X = tableLeft + 60; // Service
      const col3X = tableLeft + 200; // Hrs
      const col4X = tableLeft + 260; // Rate
      const col5X = tableLeft + 320; // Amount
  
      // Table header with borders
      doc.rect(tableLeft, tableTop, 400, 25).stroke();
      
      // Header text
      doc.font("Helvetica-Bold").fontSize(11);
      doc.text("S.No.", col1X + 5, tableTop + 8);
      doc.text("Service", col2X + 5, tableTop + 8);
      doc.text("Hrs", col3X + 5, tableTop + 8);
      doc.text("Rate", col4X + 5, tableTop + 8);
      doc.text("Amount", col5X + 5, tableTop + 8);
  
      // Vertical lines for header
      doc.moveTo(col2X, tableTop).lineTo(col2X, tableTop + 25).stroke();
      doc.moveTo(col3X, tableTop).lineTo(col3X, tableTop + 25).stroke();
      doc.moveTo(col4X, tableTop).lineTo(col4X, tableTop + 25).stroke();
      doc.moveTo(col5X, tableTop).lineTo(col5X, tableTop + 25).stroke();
  
      // Table row with borders
      const rowTop = tableTop + 25;
      doc.rect(tableLeft, rowTop, 400, 25).stroke();
      
      // Row data
      doc.font("Helvetica").fontSize(10);
      doc.text("1", col1X + 5, rowTop + 8);
      doc.text("Tutoring", col2X + 5, rowTop + 8);
      doc.text(`${totalHours}`, col3X + 5, rowTop + 8);
      doc.text(`${rate}`, col4X + 5, rowTop + 8);
      doc.text(`${totalAmount}`, col5X + 5, rowTop + 8);
  
      // Vertical lines for row
      doc.moveTo(col2X, rowTop).lineTo(col2X, rowTop + 25).stroke();
      doc.moveTo(col3X, rowTop).lineTo(col3X, rowTop + 25).stroke();
      doc.moveTo(col4X, rowTop).lineTo(col4X, rowTop + 25).stroke();
      doc.moveTo(col5X, rowTop).lineTo(col5X, rowTop + 25).stroke();
  
      currentY = rowTop + 50;
  
      // Total Section
      doc.font("Helvetica-Bold").fontSize(12);
      doc.text(`Total: ${totalAmount}`, col5X - 50, currentY);
  
      // Footer Section (bottom right)
      const footerY = 650; // Fixed position near bottom
      doc.font("Helvetica").fontSize(10);
      doc.text("For Mathify", 400, footerY);
      doc.text("", 400, footerY + 30); // Space for signature
      doc.text("(Signature)", 400, footerY + 40);
      doc.text("Sir Name", 400, footerY + 60);
  
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

export default  generateInvoicePDF ;
