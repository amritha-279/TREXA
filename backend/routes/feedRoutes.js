import express from "express"
import { getLiveFeed } from "../controllers/feedController.js"

const router = express.Router()

router.get("/", getLiveFeed)

export default router
