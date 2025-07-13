import { Router } from "express";
const router = Router();
import Student from "../models/Student.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import Batch from "../models/Batch.js";
import Attendance from "../models/Attendance.js";
import Fees from "../models/Fees.js";

import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = process.env.SPREADSHEET_NAME;


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
  "/fetchStudentDetailsFromSheet",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    const { rowNumber } = req.body;

    if (!rowNumber || isNaN(rowNumber) || rowNumber < 1) {
      return res.status(400).json({ error: "Invalid or missing rowNumber" });
    }

    try {
      const client = await auth.getClient();
      const sheets = google.sheets({ version: "v4", auth: client });

      // Fetch all rows (including header)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: SHEET_NAME,
      });

      const rows = response.data.values;
      if (!rows || rowNumber > rows.length - 1) {
        return res.status(404).json({ error: "Row not found" });
      }

      const headers = rows[0];
      const dataRow = rows[rowNumber-1]; // rowNumber is 1-based (excluding headers)

      const result = {};
      headers.forEach((key, idx) => {
        result[key] = dataRow[idx] || null;
      });
      const mappedStudent = {
        name: result["Student's Name"],
        phone: result["Contact Number (Whatsapp)"],
        email: result["Student's Email ID"],
        parentsName: result["Parent's Name"],
        dateOfBirth: result["Date of Birth"],
        gender: result["Student's Gender"],
        preferredModeOfLearning: result["Preferred Mode of Learning"],
        desiredNumberOfHours: result["Desired number of hours per week"]
          ? Number(result["Desired number of hours per week"])
          : null,
        goodAtMaths: result["On a scale of 1 to 10, how good do you think is the student at Maths?"]
          ? Number(result["On a scale of 1 to 10, how good do you think is the student at Maths?"])
          : null,
        wishToHaveDemoClass:
          result["Do you wish to have a demo class?"]?.toLowerCase() === "yes",
        objectiveOfEnrolling: result["What is your objective of enrolling with Mathify?"],
        examinationsTargetting: result["Please write the names of all the examinations that the students is targeting."],
      };
      
      res.json({ success: true, data: mappedStudent });
    } catch (err) {
      console.error("Error fetching row:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


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
        parentsName,
        dateOfBirth,
        gender,
        preferredModeOfLearning,
        desiredNumberOfHours,
        goodAtMaths,
        wishToHaveDemoClass,
        objectiveOfEnrolling,
        examinationsTargetting,
        registrationNumber,
        feesPerHour,
        isActive = true,
        schedule
      } = req.body;

      // Check for required fields
      if (
        !name || !email || !phone || !parentsName || !dateOfBirth ||
        !gender || !preferredModeOfLearning || desiredNumberOfHours == null ||
        goodAtMaths == null || wishToHaveDemoClass == null ||
        !objectiveOfEnrolling || !examinationsTargetting
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check for duplicate email
      const existingStudent = await Student.findOne({ email });
      if (existingStudent) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Create new student document
      const student = new Student({
        name,
        email,
        phone,
        parentsName,
        dateOfBirth,
        gender,
        preferredModeOfLearning,
        desiredNumberOfHours,
        goodAtMaths,
        wishToHaveDemoClass,
        objectiveOfEnrolling,
        examinationsTargetting,
        registrationNumber,
        feesPerHour,
        isActive,
        schedule
      });

      await student.save();

      return res.status(201).json({
        message: "Student registered successfully",
        student
      });

    } catch (err) {
      console.error("Error creating student:", err);
      return res.status(500).json({ error: "Server error while registering student" });
    }
  }
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
