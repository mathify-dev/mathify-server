import { Router } from "express";
const router = Router();
import Batch from "../models/Batch.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";


router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, feesPerHour } = req.body;

  try {
    const batch = new Batch({ name, feesPerHour });
    await batch.save();
    res.status(201).json({ message: "Batch created", batch });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;