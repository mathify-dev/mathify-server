import express, { application } from "express";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
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
app.use("/api/profile", profileRoutes);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
