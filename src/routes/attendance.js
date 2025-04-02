import { Router } from "express";
const router = Router();
import Attendance from "../models/Attendance.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { student, hours, date, isPresent } = req.body;

  const specificDate = new Date(date + "T00:00:00.000Z")

  try {
    const attendance = new Attendance({
      student,
      hours,
      date: specificDate,
      isPresent,
    });
    await attendance.save();
    res.status(201).json({ message: "Attendance recorded", attendance });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
