import { Schema, model } from "mongoose";

const studentSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default model("Student", studentSchema);