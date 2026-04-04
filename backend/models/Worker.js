import mongoose from "mongoose"

const workerSchema = new mongoose.Schema({
  workerId:     { type: String, unique: true },
  name:         String,
  city:         String,
  platform:     String,
  workingHours: Number,
  riskScore:    { type: Number, default: 0 },
})

const Worker = mongoose.model("Worker", workerSchema)
export default Worker