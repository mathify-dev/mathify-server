import { Schema, model } from "mongoose";

const feesSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  paidOn: { type: Date, default: Date.now },
  billingMonth: { type: String, required: true }, // e.g., "2025-03"
  isSettled: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ["cash", "UPI"], default: "cash" }
});

export default model("Fees", feesSchema);