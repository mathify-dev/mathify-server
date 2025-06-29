import { Schema, model } from "mongoose";

// Schema for a single day's class time
const dayScheduleSchema = new Schema(
  {
    from: { type: String, required: true }, // e.g., "10:00"
    to: { type: String, required: true },   // e.g., "11:30"
  },
  { _id: false }
);

const studentSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  registrationNumber: { type: Number, required: true },
  feesPerHour: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },

  // Schedule: optional object with selected weekdays
  schedule: {
    type: Map,
    of: dayScheduleSchema,
    default: undefined,
  },
});

export default model("Student", studentSchema);

