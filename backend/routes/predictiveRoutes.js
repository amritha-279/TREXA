import express from "express"
import { getPredictiveAnalytics } from "../controllers/predictiveController.js"

const router = express.Router()

router.get("/", getPredictiveAnalytics)

export default router
