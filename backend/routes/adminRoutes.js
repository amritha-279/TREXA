import express from "express"
import {
  getDashboardStats,
  getAdminClaims,
  getAdminDisruptions,
  getAdminFraudAlerts,
  getAdminLogs,
} from "../controllers/adminController.js"

const router = express.Router()

router.get("/dashboard",    getDashboardStats)
router.get("/claims",       getAdminClaims)
router.get("/disruptions",  getAdminDisruptions)
router.get("/fraud-alerts", getAdminFraudAlerts)
router.get("/logs",         getAdminLogs)

export default router