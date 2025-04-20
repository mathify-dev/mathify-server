import { Router } from "express";
const router = Router();
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import Fees from "../models/Fees.js";
import Student from "../models/Student.js";
import Attendance from "../models/Attendance.js";
import dayjs from "dayjs";

router.get(
  "/feeDetails/:studentId/:monthYear",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { studentId, monthYear } = req.params;

    try {
      const student = await Student.findById(studentId).populate("batch");
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      const [year, month] = monthYear.split("-").map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 1);

      // Attendance
      const attendanceRecords = await Attendance.find({
        student: studentId,
        isPresent: true,
        date: { $gte: monthStart, $lt: monthEnd },
      });

      const totalHours = attendanceRecords.reduce((sum, a) => sum + a.hours, 0);
      const totalClasses = attendanceRecords.length;
      const feesPerHour = student.batch.feesPerHour;
      const totalFeeExpected = totalHours * feesPerHour;

      // Fee record
      const feeRecord = await Fees.findOne({
        student: studentId,
        billingMonth: monthYear,
      });

      const feesPaid = !!feeRecord && feeRecord.isSettled;

      res.status(200).json({
        studentId: student._id,
        studentName: student.name,
        totalHoursAttended: totalHours,
        feesPerHour,
        totalClasses,
        totalFeeExpected,
        feesPaid,
        billingMonth: monthYear,
        paymentMethod: feeRecord?.paymentMethod || null,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

router.get(
  "/studentFeeRecords/:studentId",
  authMiddleware,
  async (req, res) => {
    const { studentId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin;

    if (userId !== studentId && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const student = await Student.findById(studentId).populate("batch");
      if (!student)
        return res.status(404).json({ message: "Student not found" });

      const batchRate = student.batch.feesPerHour;

      // Get attendance grouped by month
      const rawAttendance = await Attendance.find({
        student: studentId,
        isPresent: true,
      });

      const attendanceByMonth = {};

      rawAttendance.forEach((record) => {
        const monthKey = dayjs(record.date).format("YYYY-MM");
        if (!attendanceByMonth[monthKey]) {
          attendanceByMonth[monthKey] = { totalHours: 0 };
        }
        attendanceByMonth[monthKey].totalHours += record.hours;
      });

      const result = [];

      for (const [month, data] of Object.entries(attendanceByMonth)) {
        const totalFeeExpected = data.totalHours * batchRate;

        const fee = await Fees.findOne({
          student: studentId,
          billingMonth: month,
        });

        result.push({
          month,
          totalFeeExpected,
          feesPaid: !!fee && fee.isSettled,
        });
      }

      // Sort by latest first
      result.sort((a, b) => (a.month < b.month ? 1 : -1));

      res.json(result);
    } catch (err) {
      console.error("getStudentFeeRecords error", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

router.post("/createNewFees", authMiddleware, adminMiddleware, async (req, res) => {
  const { student, billingMonth, paymentMethod , isSettled } = req.body;

  try {
    const fees = new Fees({
      student,
      billingMonth,
      paymentMethod,
      isSettled
    });
    await fees.save();
    res.status(201).json({ message: "Fee recorded", fees });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { student, billingMonth, paymentMethod, isSettled } = req.body;

  try {
    const fees = await Fees.findByIdAndUpdate(
      req.params.id,
      { student, billingMonth, paymentMethod, isSettled },
      { new: true, runValidators: true }
    );

    if (!fees) return res.status(404).json({ message: "Fee record not found" });

    res.json({ message: "Fee record updated", fees });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const fees = await Fees.findByIdAndDelete(req.params.id);
    if (!fees) return res.status(404).json({ message: "Fee record not found" });

    res.json({ message: "Fee record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
