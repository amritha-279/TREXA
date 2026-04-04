import express from "express"
import { getWeather, getAirQuality } from "../controllers/weatherController.js"

const router = express.Router()

router.get("/weather", getWeather)
router.get("/aqi", getAirQuality)

export default router