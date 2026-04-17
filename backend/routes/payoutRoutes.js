import express from "express"
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  simulatePayout,
  getPaymentsByWorker,
} from "../controllers/payoutController.js"

const router = express.Router()

router.post("/create-order",     createRazorpayOrder)
router.post("/verify-payment",   verifyRazorpayPayment)
router.post("/simulate",         simulatePayout)
router.get("/worker/:user_id",   getPaymentsByWorker)

export default router
