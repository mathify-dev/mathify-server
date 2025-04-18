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

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, feesPerHour, isActive } = req.body;

  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { name, feesPerHour, isActive },
      { new: true, runValidators: true }
    );

    if (!batch) return res.status(404).json({ message: "Batch not found" });

    res.json({ message: "Batch updated", batch });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    res.json({ message: "Batch deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



export default router;