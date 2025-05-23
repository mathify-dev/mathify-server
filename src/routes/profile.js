import express from "express";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  res.json(req.user); 
});

export default router;
