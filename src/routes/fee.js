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
