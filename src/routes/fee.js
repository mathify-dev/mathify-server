import { Router } from "express";
const router = Router();
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import Fees from "../models/Fees.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import dayjs from "dayjs";
import moment from "moment";
import PDFDocument from "pdfkit";
import generateInvoicePDF from "../services/invoiceService.js";
import sendInvoiceEmail from "../services/emailService.js";



router.get(
  "/getStudentFees/:studentId",
  authMiddleware,
  async (req, res) => {
    const { studentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (userId !== studentId && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Get all attendance records for the student
      const attendanceRecords = await Attendance.find({ student: studentId });

      // Group attendance by month (YYYY-MM)
      const feesMap = {};

      for (const record of attendanceRecords) {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!feesMap[monthKey]) {
          feesMap[monthKey] = {
            totalHours: 0,
            payableAmount: 0,
            isSettled: false,
          };
        }

        feesMap[monthKey].totalHours += record.hours || 0;
      }

      // Multiply total hours with feesPerHour and check payment status
      for (const month of Object.keys(feesMap)) {
        feesMap[month].payableAmount = Math.round(
          feesMap[month].totalHours * student.feesPerHour
        );

        const feeRecord = await Fees.findOne({
          student: studentId,
          billingMonth: month,
        });

        if (feeRecord) {
          feesMap[month].isSettled = feeRecord.isSettled;
          feesMap[month].paidOn = feeRecord.paidOn;
          feesMap[month].paymentMethod = feeRecord.paymentMethod;
        }
      }

      res.json({
        student: {
          name: student.name,
          email: student.email,
          feesPerHour: student.feesPerHour,
        },
        feesSummary: feesMap,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

router.get("/generateInvoice/:studentId", authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  const { month } = req.query;
  const requester = req.user;

  if (!requester.isAdmin && requester._id !== studentId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const startOfMonth = moment(month).startOf("month").toDate();
    const endOfMonth = moment(month).endOf("month").toDate();

    const attendances = await Attendance.find({
      student: studentId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      isPresent: true,
    });

    const totalHours = attendances.reduce((sum, att) => sum + (att.hours || 0), 0);
    const rate = student.feesPerHour;
    const totalAmount = rate * totalHours;

    const invoiceNumber = `INV-${student._id.toString()}-${moment(
      month
    ).format("YYYYMM")}`;

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header Section
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating invoice" });
  }
});

router.post("/sendStudentInvoice",authMiddleware,adminMiddleware,async(req,res) => {
  const {studentId , month} = req.body

  if (!studentId || !month) {
    return res
      .status(400)
      .json({ error: "studentId and month are required" });
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const monthName = moment(month, "YYYY-MM").format("MMMM YYYY")

  try {
    const invoiceData = await generateInvoicePDF(student, month);
    const emailResult = await sendInvoiceEmail(
      student.email,
      student.name,
      invoiceData.buffer,
      invoiceData.invoiceNumber,
      monthName
    ); 
    res.json({ message : `email Sent sucessfully to ${student.email}` });
  } catch (error) {
    console.error(`Failed to send invoice to ${studentEmail}:`, error);
    res.status(500).json({ message: "Error generating invoice" });
  }
})

router.post(
  "/createNewFees",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const {
      studentId,
      billingMonth,
      paymentMethod = "cash",
      paidOn,
    } = req.body;

    if (!studentId || !billingMonth) {
      return res
        .status(400)
        .json({ error: "studentId and billingMonth are required" });
    }

    try {
      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Prevent duplicate fee record for the same month
      const existingFee = await Fees.findOne({
        student: studentId,
        billingMonth,
      });
      if (existingFee) {
        return res
          .status(400)
          .json({ error: `Fee already recorded for ${billingMonth}` });
      }

      const fee = new Fees({
        student: studentId,
        billingMonth,
        paymentMethod,
        isSettled: true,
        paidOn: paidOn ? new Date(paidOn) : undefined,
      });

      await fee.save();

      res.status(201).json({
        message: "Fee record created successfully",
        fee,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

router.put(
  "/updateFees/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
      const fee = await Fees.findById(id);
      if (!fee) {
        return res.status(404).json({ error: "Fee record not found" });
      }

      // Update allowed fields
      if (updates.billingMonth) fee.billingMonth = updates.billingMonth;
      if (updates.paymentMethod) fee.paymentMethod = updates.paymentMethod;
      if (typeof updates.isSettled === "boolean")
        fee.isSettled = updates.isSettled;
      if (updates.paidOn) fee.paidOn = new Date(updates.paidOn);

      await fee.save();

      res.json({ message: "Fee record updated", fee });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

router.delete(
  "/deleteFees/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { id } = req.params;

    try {
      const fee = await Fees.findByIdAndDelete(id);
      if (!fee) {
        return res.status(404).json({ error: "Fee record not found" });
      }

      res.json({ message: "Fee record deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);





export default router;
