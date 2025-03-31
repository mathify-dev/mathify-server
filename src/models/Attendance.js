import { Schema, model } from "mongoose";

const attendanceSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  hours: { type: Number, default: 1, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  isPresent: { type: Boolean, default: true }
});

export default model("Attendance", attendanceSchema);