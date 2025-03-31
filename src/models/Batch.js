import { Schema, model } from "mongoose";

const batchSchema = new Schema({
  name: { type: String, required: true, unique: true },
  feesPerHour: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export default model("Batch", batchSchema);