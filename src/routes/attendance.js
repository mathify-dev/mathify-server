import { Router } from "express";
const router = Router();
import Attendance from "../models/Attendance.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import Student from "../models/Student.js";

router.get("/getAttendance/:studentId", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Check if the user is either admin or the student themself
    if (!req.user.isAdmin && req.user.id !== studentId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const records = await Attendance.find({ student: studentId }).sort({
      date: -1,
      createdAt: -1,
    })
    // .populate('student'); // optional, if you want full student details

    res.json({ data: records });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/addAttendance",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { studentId, startTime, endTime, date, isPresent = true } = req.body;

      const studentExists = await Student.findById(studentId);
      if (!studentExists) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const recordDate = new Date(date + "T00:00:00.000Z");

      // Check for an open session (no endTime) for this student on the same date
      const openSession = await Attendance.findOne({
        student: studentId,
        date: recordDate,
        endTime: { $in: [null, undefined, ''] },
      });

      if (openSession) {
        // Allow the new record only if both its startTime and endTime are
        // strictly before the open session's startTime
        if (endTime && startTime) {
          const [osh, osm] = openSession.startTime.split(':').map(Number);
          const [nsh, nsm] = startTime.split(':').map(Number);
          const [neh, nem] = endTime.split(':').map(Number);

          const openStart = osh * 60 + osm;
          const newStart = nsh * 60 + nsm;
          const newEnd = neh * 60 + nem;

          if (newStart >= openStart || newEnd > openStart) {
            return res.status(409).json({
              error:
                'A class session is currently in progress for this student today. ' +
                'You can only add records with start and end times before the active session starts (' +
                openSession.startTime + '). Please end the active session first.',
            });
          }
        } else {
          // Trying to start another open session while one is already open
          return res.status(409).json({
            error:
              'A class session is already in progress for this student today (started at ' +
              openSession.startTime + '). Please end the active session before starting a new one.',
          });
        }
      }

      const record = new Attendance({
        student: studentId,
        startTime,
        endTime: endTime || undefined,
        isPresent,
        date: recordDate,
      });

      await record.validate(); // ensure schema validation
      await record.save();

      res
        .status(201)
        .json({ message: "Attendance added successfully", data: record });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.put(
  "/updateAttendance/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { startTime, endTime, date, isPresent } = req.body;

      const updateData = {};

      if (startTime) updateData.startTime = startTime;
      if (endTime) updateData.endTime = endTime;
      if (isPresent !== undefined) updateData.isPresent = isPresent;
      if (date) updateData.date = new Date(date + "T00:00:00.000Z");

      const attendance = await Attendance.findById(req.params.id);

      if (!attendance) {
        return res.status(404).json({ error: "Attendance not found" });
      }

      Object.assign(attendance, updateData);
      await attendance.validate(); // triggers validation and `pre` middleware
      await attendance.save();

      res.json({
        message: "Attendance updated successfully",
        data: attendance,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.delete(
  "/deleteAttendance/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const attendance = await Attendance.findByIdAndDelete(req.params.id);

      if (!attendance) {
        return res.status(404).json({ error: "Attendance not found" });
      }

      res.json({ message: "Attendance deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
