import Claim from "../models/Claim.js"
import axios from "axios"

function getPayoutTier(riskScore) {
  if (riskScore > 0.7) return { tier: "high",   multiplier: 1.0 }
  if (riskScore > 0.5) return { tier: "medium", multiplier: 0.6 }
  return                      { tier: "none",   multiplier: 0   }
}

export const createClaim = async (req, res) => {

  try {

    const { workerName, city, disruptionType, rain, aqi, traffic, deliveries } = req.body

    // ML risk check
    const riskResponse = await axios.post("http://localhost:5000/predict", {
      rain, aqi, traffic, deliveries
    })
    const riskScore = riskResponse.data.disruption_risk
    const payout    = getPayoutTier(riskScore)

    if (payout.tier === "none") {
      return res.json({ message: "No disruption detected. Claim rejected." })
    }

    // Income loss prediction
    const incomeResponse = await axios.post("http://localhost:5000/predict-income", {
      rain, aqi, traffic, deliveries
    })
    const estimatedIncomeLoss = incomeResponse.data.income_loss
    const payoutAmount        = estimatedIncomeLoss * payout.multiplier

    const claim = new Claim({
      workerName,
      city,
      disruptionType,
      estimatedIncomeLoss,
      payoutAmount,
      riskScore,
      payoutTier: payout.tier,
    })

    await claim.save()

    res.json({ message: "Income loss detected. Claim automatically generated.", payoutAmount, claim })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Claim creation failed" })
  }

}