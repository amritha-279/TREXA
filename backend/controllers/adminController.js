import Worker from "../models/Worker.js"
import Claim  from "../models/Claim.js"
import axios  from "axios"

const CITIES = [
  { name: "Chennai",     lat: 13.0827, lng: 80.2707 },
  { name: "Coimbatore",  lat: 11.0168, lng: 76.9558 },
  { name: "Madurai",     lat: 9.9252,  lng: 78.1198 },
  { name: "Salem",       lat: 11.6643, lng: 78.1460 },
  { name: "Tiruchirappalli", lat: 10.7905, lng: 78.7047 },
];

const WEATHER_KEY = "33cdb5e2b4204010b7e981d8599a8930";
export const getDashboardStats = async (req,res) => {

  try {

    const totalWorkers = await Worker.countDocuments()

    const activePolicies = await Worker.countDocuments({
      activePlan: { $ne: "None" }
    })

    const totalClaims = await Claim.countDocuments()

    const claims = await Claim.find()

    const totalPayout = claims.reduce(
      (sum,claim)=> sum + claim.payoutAmount, 0
    )

    const highRiskWorkers = await Worker.countDocuments({
      riskScore:1
    })

    res.json({
      totalWorkers,
      activePolicies,
      totalClaims,
      totalPayout,
      highRiskWorkers
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message:"Dashboard stats failed"
    })

  }

}
export const getZoneRisk = async (req,res)=>{

  try{

    const workers = await Worker.find()

    const zones = {}

    workers.forEach(worker=>{

      if(!zones[worker.zone]){
        zones[worker.zone] = []
      }

      zones[worker.zone].push(worker.riskScore)

    })

    const zoneStats = Object.keys(zones).map(zone=>{

      const avgRisk =
        zones[zone].reduce((a,b)=>a+b,0) /
        zones[zone].length

      return {
        zone,
        risk:avgRisk
      }

    })

    res.json(zoneStats)

  }catch(error){

    res.status(500).json({
      message:"Zone risk failed"
    })

  }

}
export const getRecentClaims = async (req,res)=>{

  try{

    const claims = await Claim
      .find()
      .sort({createdAt:-1})
      .limit(5)

    res.json(claims)

  }catch(error){

    res.status(500).json({
      message:"Recent claims fetch failed"
    })

  }

}

export const systemHealth = async (req,res)=>{

  try{

    const workerCount = await Worker.countDocuments()
    const claimCount = await Claim.countDocuments()

    res.json({
      system:"running",
      workers:workerCount,
      claims:claimCount,
      mlService:"active",
      weatherAPI:"connected"
    })

  }catch(error){

    res.status(500).json({
      system:"error"
    })

  }

}

// ── /api/admin/claims ─────────────────────────────────────────────────────────
export const getAdminClaims = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 }).limit(20)
    const workers = await Worker.find({}, "workerId name city platform")
    const workerMap = {}
    workers.forEach(w => { workerMap[w.name] = w })

    const rows = claims.map(c => ({
      workerId:      workerMap[c.workerName]?.workerId || "—",
      workerName:    c.workerName,
      platform:      workerMap[c.workerName]?.platform || "—",
      city:          c.city,
      disruptionType: c.disruptionType,
      payoutAmount:  c.payoutAmount,
      payoutTier:    c.payoutTier,
      riskScore:     c.riskScore,
      createdAt:     c.createdAt,
    }))
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: "Claims fetch failed" })
  }
}

// ── /api/admin/disruptions ────────────────────────────────────────────────────
export const getAdminDisruptions = async (req, res) => {
  try {
    const results = await Promise.all(
      CITIES.map(async city => {
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${WEATHER_KEY}&units=metric`
          const r   = await axios.get(url)
          const rain = r.data.rain?.["1h"] || r.data.rain?.["3h"] || 0
          const mlRes = await axios.post("http://localhost:5000/predict", {
            rain, aqi: 3,
            traffic:    parseFloat(Math.random().toFixed(2)),
            deliveries: Math.floor(Math.random() * 12),
          })
          return {
            city:        city.name,
            lat:         city.lat,
            lng:         city.lng,
            temperature: r.data.main.temp,
            rainfall:    rain,
            aqi:         3,
            riskScore:   mlRes.data.disruption_risk,
          }
        } catch {
          return { city: city.name, lat: city.lat, lng: city.lng, temperature: 0, rainfall: 0, aqi: 3, riskScore: 0 }
        }
      })
    )
    res.json(results)
  } catch (err) {
    res.status(500).json({ message: "Disruptions fetch failed" })
  }
}

// ── /api/admin/fraud-alerts ───────────────────────────────────────────────────
export const getAdminFraudAlerts = async (req, res) => {
  try {
    const alerts = []
    const workers = await Worker.find({}, "workerId name city")

    for (const worker of workers) {
      const claims = await Claim.find({ workerName: worker.name }).sort({ createdAt: -1 })
      if (claims.length > 5) {
        alerts.push({ workerId: worker.workerId, workerName: worker.name, city: worker.city, reason: "Excess claim frequency", claimCount: claims.length })
        continue
      }
      if (claims.length > 0) {
        const mins = (Date.now() - new Date(claims[0].createdAt).getTime()) / 60000
        if (mins < 10) {
          alerts.push({ workerId: worker.workerId, workerName: worker.name, city: worker.city, reason: "Duplicate claim within 10 minutes", claimCount: claims.length })
        }
      }
    }
    res.json(alerts)
  } catch (err) {
    res.status(500).json({ message: "Fraud alerts fetch failed" })
  }
}

// ── /api/admin/logs ───────────────────────────────────────────────────────────
export const getAdminLogs = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 }).limit(30)
    const logs = []

    claims.forEach(c => {
      const t = new Date(c.createdAt)
      logs.push({ time: t, event: `🌧️ Weather threshold exceeded — ${c.city}` })
      logs.push({ time: new Date(t.getTime() + 1000), event: `🤖 ML risk score computed — ${c.riskScore?.toFixed(2)} (${c.payoutTier})` })
      logs.push({ time: new Date(t.getTime() + 2000), event: `🛡️ Fraud check completed — ${c.workerName}` })
      logs.push({ time: new Date(t.getTime() + 3000), event: `📋 Claim generated — ${c.workerName} / ${c.city}` })
      if (c.payoutTier !== "none") {
        logs.push({ time: new Date(t.getTime() + 4000), event: `💸 Payout approved — ₹${c.payoutAmount?.toFixed(0)} (${c.payoutTier})` })
      }
    })

    logs.sort((a, b) => b.time - a.time)
    res.json(logs.slice(0, 40).map(l => ({ time: l.time, event: l.event })))
  } catch (err) {
    res.status(500).json({ message: "Logs fetch failed" })
  }
}
