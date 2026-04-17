import express from "express"
import { checkFraud, getFraudLogs } from "../controllers/fraudController.js"

const router = express.Router()

router.post("/check", checkFraud)
router.get("/logs",   getFraudLogs)

export default router
