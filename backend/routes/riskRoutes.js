import express from "express"
import { calculateRisk, analyzeRisk } from "../controllers/riskController.js"

const router = express.Router()

router.post("/calculate", calculateRisk)
router.post("/analyze", analyzeRisk)

export default router