import mongoose from "mongoose"

const claimSchema = new mongoose.Schema({
  workerName:          String,
  city:                String,
  disruptionType:      String,
  estimatedIncomeLoss: Number,
  payoutAmount:        Number,
  riskScore:           Number,
  payoutTier:          String,
  createdAt: { type: Date, default: Date.now }
})

const Claim = mongoose.model("Claim", claimSchema)
export default Claim