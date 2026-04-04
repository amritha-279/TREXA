import Worker from "../models/Worker.js"

export const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findOne({ workerId: req.params.workerId })
    if (!worker) return res.status(404).json({ message: "Worker ID not found" })
    res.json(worker)
  } catch (error) {
    res.status(500).json({ message: "Login failed" })
  }
}

export const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find()
    res.json(workers)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workers" })
  }
}