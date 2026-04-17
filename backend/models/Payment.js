import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema({
  claim_id:         { type: mongoose.Schema.Types.ObjectId, ref: "Claim", default: null },
  user_id:          String,
  transaction_id:   String,
  upi_ref:          String,
  order_id:         String,
  plan_id:          String,
  payout_amount:    Number,
  payout_status:    { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  payout_timestamp: { type: Date, default: Date.now },
  payment_type:     { type: String, enum: ["premium", "claim_payout"], default: "claim_payout" },
})

export default mongoose.model("Payment", paymentSchema)
