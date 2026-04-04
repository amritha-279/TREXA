import Worker from "../models/Worker.js"

export const getRiskHeatmap = async (req, res) => {

  try {

    const workers = await Worker.find()

    const zoneMap = {}

    workers.forEach(worker => {

      if(!zoneMap[worker.zone]){
        zoneMap[worker.zone] = []
      }

      zoneMap[worker.zone].push(worker.riskScore)

    })

    const heatmap = Object.keys(zoneMap).map(zone => {

      const scores = zoneMap[zone]

      const avgRisk =
        scores.reduce((a,b)=>a+b,0) / scores.length

      return {
        zone,
        risk: avgRisk
      }

    })

    res.json(heatmap)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message:"Heatmap generation failed"
    })

  }

}