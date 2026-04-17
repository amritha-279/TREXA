import mongoose from "mongoose"

const claimSchema = new mongoose.Schema({
  workerName:          String,
  workerId:            String,
  city:                String,
  disruptionType:      String,
  estimatedIncomeLoss: Number,
  payoutAmount:        Number,
  riskScore:           Number,
  payoutTier:          String,
  status:              { type: String, enum: ["approved", "review", "rejected"], default: "approved" },
  fraudScore:          { type: Number, default: 0 },
  createdAt:           { type: Date, default: Date.now },
})

export default mongoose.model("Claim", claimSchema)
