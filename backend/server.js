import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import { startRiskScheduler } from "./services/riskScheduler.js"
import workerRoutes from "./routes/workerRoutes.js"
import weatherRoutes from "./routes/weatherRoutes.js"
import riskRoutes from "./routes/riskRoutes.js"
import claimRoutes from "./routes/claimRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import heatmapRoutes from "./routes/heatmapRoutes.js"
import fraudRoutes from "./routes/fraudRoutes.js"
import feedRoutes from "./routes/feedRoutes.js"
import payoutRoutes from "./routes/payoutRoutes.js"
import workerDashboardRoutes from "./routes/workerDashboardRoutes.js"
import predictiveRoutes from "./routes/predictiveRoutes.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/workers", workerRoutes)
app.use("/api/weather", weatherRoutes)
app.use("/api/risk", riskRoutes)
app.use("/api/claim", claimRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/heatmap", heatmapRoutes)
app.use("/api/fraud", fraudRoutes)
app.use("/api/feed", feedRoutes)
app.use("/api/payout", payoutRoutes)
app.use("/api/worker-dashboard", workerDashboardRoutes)
app.use("/api/predictive", predictiveRoutes)

mongoose.connect(process.env.MONGO_URI)
.then(()=> {
  console.log("MongoDB Connected")
  startRiskScheduler()
})
.catch(err => console.log(err))

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})