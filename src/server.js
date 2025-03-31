import express from "express";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import apiRoutes from "./routes/api.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./config/passport.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());
app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
