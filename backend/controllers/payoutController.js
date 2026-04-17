import Razorpay from "razorpay"
import Claim    from "../models/Claim.js"
import Payment  from "../models/Payment.js"

function getRazorpay() {
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID     || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
  })
}

function generateTxId() {
  return "TXN-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase()
}

function generateUpiRef() {
  return "UPI" + Date.now() + Math.floor(Math.random() * 10000)
}

// ── POST /api/payout/create-order  (Razorpay — premium collection) ────────────
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, user_id, plan_id } = req.body
    const razorpay = getRazorpay()

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100),   // paise
      currency: "INR",
      receipt:  `rcpt_${user_id}_${Date.now()}`,
      notes:    { user_id, plan_id },
    })

    res.json({
      order_id:   order.id,
      amount:     order.amount,
      currency:   order.currency,
      key_id:     process.env.RAZORPAY_KEY_ID,
    })

  } catch (error) {
    console.error("Razorpay order error:", error)
    res.status(500).json({ message: "Failed to create payment order" })
  }
}

// ── POST /api/payout/verify-payment  (Razorpay — after checkout success) ──────
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, user_id, plan_id, amount } = req.body

    // In test mode we trust the payment_id returned by Razorpay checkout
    const payment = new Payment({
      claim_id:         null,
      user_id,
      transaction_id:   razorpay_payment_id,
      payout_amount:    amount,
      payout_status:    "completed",
      payout_timestamp: new Date(),
      payment_type:     "premium",
      plan_id,
      order_id:         razorpay_order_id,
    })
    await payment.save()

    res.json({
      success:        true,
      payment_id:     razorpay_payment_id,
      order_id:       razorpay_order_id,
      amount,
      plan_id,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Payment verification failed" })
  }
}

// ── POST /api/payout/simulate  (Mock UPI payout — claim disbursement) ─────────
export const simulatePayout = async (req, res) => {
  try {
    const { claim_id, user_id, payout_amount } = req.body

    // Simulate UPI processing delay
    await new Promise(r => setTimeout(r, 800))

    const transaction_id = generateTxId()
    const upi_ref        = generateUpiRef()

    const payment = new Payment({
      claim_id,
      user_id,
      transaction_id,
      upi_ref,
      payout_amount,
      payout_status:    "completed",
      payout_timestamp: new Date(),
      payment_type:     "claim_payout",
    })
    await payment.save()

    if (claim_id) {
      await Claim.findByIdAndUpdate(claim_id, { status: "approved" })
    }

    res.json({
      transaction_id,
      upi_ref,
      payout_amount,
      payout_status:    "completed",
      payout_timestamp: payment.payout_timestamp,
      payment_method:   "UPI",
      bank_ref:         "TREXA" + upi_ref.slice(-6),
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Payout simulation failed" })
  }
}

// ── GET /api/payout/worker/:user_id ───────────────────────────────────────────
export const getPaymentsByWorker = async (req, res) => {
  try {
    const { user_id } = req.params
    const payments = await Payment.find({ user_id }).sort({ payout_timestamp: -1 })
    res.json(payments)
  } catch {
    res.status(500).json({ message: "Failed to fetch payments" })
  }
}
