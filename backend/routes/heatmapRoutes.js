import express from "express"
import { getRiskHeatmap } from "../controllers/heatmapController.js"

const router = express.Router()

router.get("/", getRiskHeatmap)

export default router