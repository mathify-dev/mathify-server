import { Router } from "express";
const router = Router();
import Student from "../models/Student.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import Batch from "../models/Batch.js";
import Attendance from "../models/Attendance.js";
import Fees from "../models/Fees.js";

// router.get(
//   "/allSummary/:batchId",
//   authMiddleware,
//   adminMiddleware,
//   async (req, res) => {
//     const { batchId } = req.params;

//     try {
//       const batch = await Batch.findById(batchId);
//       if (!batch) return res.status(404).json({ message: "Batch not found" });

//       const students = await Student.find({ batch: batchId });

//       console.log('students',students);

//       const now = new Date();
//       const currentMonth = now.getMonth();
//       const currentYear = now.getFullYear();

//       const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
//       const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

//       const currentMonthStart = new Date(currentYear, currentMonth, 1);
//       const currentMonthEnd = new Date(currentYear, currentMonth + 1, 1);

//       const prevMonthStart = new Date(prevYear, prevMonth, 1);
//       const prevMonthEnd = new Date(prevYear, prevMonth + 1, 1);

//       const summary = await Promise.all(
//         students.map(async (student) => {
//           // Current month attendance
//           const currentMonthAttendance = await Attendance.find({
//             student: student._id,
//             date: { $gte: currentMonthStart, $lt: currentMonthEnd },
//             isPresent: true,
//           });

//           const totalClassesThisMonth = currentMonthAttendance.length;
//           const totalHoursThisMonth = currentMonthAttendance.reduce(
//             (sum, a) => sum + a.hours,
//             0
//           );

//           // Previous month attendance
//           const prevMonthAttendance = await Attendance.find({
//             student: student._id,
//             date: { $gte: prevMonthStart, $lt: prevMonthEnd },
//             isPresent: true,
//           });

//           const totalClassesLastMonth = prevMonthAttendance.length;
//           const totalHoursLastMonth = prevMonthAttendance.reduce(
//             (sum, a) => sum + a.hours,
//             0
//           );

//           // Fees record
//           const billingMonthStr = `${prevYear}-${String(prevMonth + 1).padStart(
//             2,
//             "0"
//           )}`;
//           const feeRecord = await Fees.findOne({
//             student: student._id,
//             billingMonth: billingMonthStr,
//           });

//           return {
//             student: {
//               _id: student._id,
//               name: student.name,
//               email: student.email,
//               phone: student.phone,
//             },
//             totalClassesThisMonth,
//             totalHoursThisMonth,
//             totalClassesLastMonth,
//             totalHoursLastMonth,
//             feesPerHour: batch.feesPerHour,
//             feesPaidForPreviousMonth: !!feeRecord && feeRecord.isSettled,
//             totalFeeExpectedForThisMonth:
//               totalHoursThisMonth * batch.feesPerHour,
//             totalFeeExpectedForPreviousMonth:
//               totalHoursLastMonth * batch.feesPerHour,
//           };
//         })
//       );

//       res.status(200).json(summary);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ message: "Server error", error: err.message });
//     }
//   }
// );

// router.get(
//   "/studentMonthDetails/:studentId/:monthYear",
//   authMiddleware,
//   async (req, res) => {
//     const { studentId, monthYear } = req.params;
//     const userId = req.user.id;
//     const isAdmin = req.user.isAdmin;

//     if (userId !== studentId && !isAdmin) {
//       return res.status(403).json({ message: "Unauthorized" });
//     }

//     try {
//       const student = await Student.findById(studentId).populate("batch");
//       if (!student)
//         return res.status(404).json({ message: "Student not found" });

//       const [year, month] = monthYear.split("-").map(Number);
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 1);

//       // Attendance
//       const attendance = await Attendance.find({
//         student: studentId,
//         date: { $gte: startDate, $lt: endDate },
//       });

//       const totalClasses = attendance.filter((a) => a.isPresent).length;
//       const totalHours = attendance.reduce(
//         (sum, a) => (a.isPresent ? sum + a.hours : sum),
//         0
//       );

//       // Fee calculation
//       const feesPerHour = student.batch.feesPerHour;
//       const feesDue = totalHours * feesPerHour;

//       const feeRecord = await Fees.findOne({
//         student: studentId,
//         billingMonth: monthYear,
//       });

//       const feesPaid = !!feeRecord && feeRecord.isSettled;

//       res.json({
//         student: {
//           name: student.name,
//           email: student.email,
//           phone: student.phone,
//           batchName: student.batch.name,
//           totalClasses,
//           totalHours,
//           feesPaid,
//           feesDue,
//         },
//         attendance: attendance.map((a) => ({
//           date: a.date,
//           present: a.isPresent,
//           hours: a.hours,
//         })),
//       });
//     } catch (err) {
//       console.error("getStudentMonthDetails error", err);
//       res.status(500).json({ message: "Server error", error: err.message });
//     }
//   }
// );


router.get('/fetchAllStudents',  authMiddleware, adminMiddleware,async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server error while fetching students.' });
  }
});

router.post(
  "/createNewStudent",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        registrationNumber,
        feesPerHour,
        isAdmin = false,
        isActive = false,
        schedule
      } = req.body;
  
      // Check for duplicate email or reg number
      const existing = await Student.findOne({
        $or: [{ email }, { registrationNumber }]
      });
      // if (existing) {
      //   return res.status(400).json({ error: "Student with same email or registration number already exists." });
      // }
  
      const student = new Student({
        name,
        email,
        phone,
        registrationNumber,
        feesPerHour,
        isAdmin,
        isActive,
        schedule
      });
  
      await student.save();
  
      res.status(201).json({
        message: "Student registered successfully",
        student
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error while registering student" });
    }}
);

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, phone, batch, isAdmin } = req.body;

  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, batch, isAdmin },
      { new: true, runValidators: true }
    );

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ message: "Student updated", student });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
