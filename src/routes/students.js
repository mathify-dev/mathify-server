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