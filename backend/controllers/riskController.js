import axios from "axios"

// Simulate live worker activity
function generateActivity() {
  return {
    deliveries: Math.floor(Math.random() * 12),
    activeOrders: Math.floor(Math.random() * 8),
    traffic: parseFloat((Math.random()).toFixed(2)),
  }
}

// Parametric trigger engine
function getPayoutTier(riskScore) {
  if (riskScore > 0.7) return { tier: "high",   multiplier: 1.0, label: "Full Payout" }
  if (riskScore > 0.5) return { tier: "medium", multiplier: 0.6, label: "Partial Payout" }
  return                      { tier: "none",   multiplier: 0,   label: "No Payout" }
}

export const calculateRisk = async (req, res) => {
  res.status(410).json({ message: "Use /analyze instead" })
}

// Analyze risk — no MongoDB ID needed
export const analyzeRisk = async (req, res) => {

  try {

    const { city } = req.body
    const activity = generateActivity()

    const weatherRes = await axios.get(
      `http://localhost:4000/api/weather/weather?city=${city}`
    )
    const rain        = weatherRes.data.rain
    const temperature = weatherRes.data.temperature
    const aqi         = 3

    const mlResponse = await axios.post("http://localhost:5000/predict", {
      rain,
      aqi,
      traffic:    activity.traffic,
      deliveries: activity.deliveries,
    })

    const riskScore = mlResponse.data.disruption_risk
    const payout    = getPayoutTier(riskScore)

    res.json({
      riskScore,
      rain,
      temperature,
      aqi,
      activity,
      payoutTier: payout.tier,
      payoutLabel: payout.label,
      triggerClaim: payout.tier !== "none",
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Risk analysis failed" })
  }

}