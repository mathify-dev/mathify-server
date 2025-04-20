import { Router } from "express";
const router = Router();
import Attendance from "../models/Attendance.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

router.post("/addAttendance", authMiddleware, adminMiddleware, async (req, res) => {
  const attendanceRecords = req.body; // Expecting an array of records

  // Validate that the request body is an array
  if (!Array.isArray(attendanceRecords)) {
    return res.status(400).json({ message: "Request body must be an array of attendance records" });
  }

  try {
    // Transform each record to match the Attendance schema
    const recordsToInsert = attendanceRecords.map((record) => ({
      student: record.student,
      hours: record.hours,
      date: new Date(record.date + "T00:00:00.000Z"), // Convert date string to Date object
      isPresent: record.isPresent,
    }));

    // Insert all records into the database
    const insertedRecords = await Attendance.insertMany(recordsToInsert);

    res.status(201).json({
      message: "Attendance records created successfully",
      attendance: insertedRecords,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { student, hours, date, isPresent } = req.body;
  const specificDate = new Date(date + "T00:00:00.000Z");

  try {
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { student, hours, date: specificDate, isPresent },
      { new: true, runValidators: true }
    );

    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Attendance updated", attendance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ message: "Attendance record not found" });

    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



export default router;
