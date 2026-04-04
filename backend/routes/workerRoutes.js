import express from "express"
import { getWorkerById, getWorkers } from "../controllers/workerController.js"

const router = express.Router()

router.get("/", getWorkers)
router.get("/:workerId", getWorkerById)

export default router