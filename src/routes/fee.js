import { Router } from "express";
const router = Router();
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";
import Fees from "../models/Fees.js";

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
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

export default router;
