import mongoose from "mongoose"

const fraudLogSchema = new mongoose.Schema({
  user_id:     String,
  claim_id:    { type: mongoose.Schema.Types.ObjectId, ref: "Claim" },
  fraud_score: Number,
  fraud_flags: [String],
  decision:    { type: String, enum: ["approved", "review", "rejected"] },
  timestamp:   { type: Date, default: Date.now },
})

export default mongoose.model("FraudLog", fraudLogSchema)
