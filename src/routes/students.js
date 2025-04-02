import { Router } from "express";
const router = Router();
import Student from "../models/Student.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";


router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    const { name, email, phone, batch, isAdmin } = req.body;
  
    try {
      const student = new Student({ name, email, phone, batch, isAdmin });
      await student.save();
      res.status(201).json({ message: "Student registered", student });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

export default router;