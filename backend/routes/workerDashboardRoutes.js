import express from "express"
import { getWorkerDashboard } from "../controllers/workerDashboardController.js"

const router = express.Router()

router.get("/:workerId", getWorkerDashboard)

export default router
