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
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  parentsName:{ type: String, required: true },
  dateOfBirth:{ type: String, required: true },
  gender:{ type: String, required: true },
  preferredModeOfLearning:{ type: String },
  desiredNumberOfHours:{ type: Number },
  goodAtMaths:{ type: Number },//rating out of 10
  wishToHaveDemoClass:{ type: Boolean }, // true or false
  objectiveOfEnrolling:{ type: String },
  examinationsTargetting:{ type: String },
  registrationNumber: { type: Number}, // sheet sequence number
  isActive: { type: Boolean, default: true },
  feesPerHour: { type: Number, min: 0 },
  createdAt: { type: Date, default: Date.now },
  // Schedule: optional object with selected weekdays
  schedule: {
    type: Map,
    of: dayScheduleSchema,
    default: undefined,
  },
});

export default model("Student", studentSchema);

