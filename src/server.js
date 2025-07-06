import express, { application } from "express";
import passport from "passport";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import batchesRoute from "./routes/batches.js"
import studentsRoute from "./routes/students.js"
import attendanceRoute from "./routes/attendance.js"
import feesRoute from "./routes/fee.js"
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from 'cors'
import "./config/passport.js";
import {sendMonthlyInvoices , scheduleMonthlyInvoices} from "./services/cronJob.js"


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

connectDB();

app.use(express.json());
app.use(passport.initialize());

// app.get("/", (req, res) => {
//   res.send("<a href='/auth/google'>Login with Google</a>");
// });


// scheduleMonthlyInvoices()

app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/batches",batchesRoute)
app.use("/api/students",studentsRoute)
app.use("/api/attendance",attendanceRoute)
app.use("/api/fees",feesRoute)

app.post('/api/admin/send-monthly-invoices', async (req, res) => {
    try {

      await sendMonthlyInvoices();
      res.json({ message: 'Monthly invoices sent successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error sending invoices', error: error.message });
    }
  });


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
