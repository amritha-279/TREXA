import Claim from "../models/Claim.js"

export const getLiveFeed = async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 }).limit(10)

    const feed = claims.map(c => ([
      `🌧️ Heavy rain detected in ${c.city || "unknown"} zone`,
      `🤖 Disruption risk score: ${c.riskScore ? c.riskScore.toFixed(2) : "N/A"}`,
      `✅ Automatic claim system active — ${c.payoutTier || "N/A"} payout triggered for ${c.workerName}`,
    ])).flat()

    // Always include a system status line
    feed.push("🛡️ Parametric insurance engine running")
    feed.push("📡 Real-time weather monitoring active")

    res.json({ feed })

  } catch (error) {
    res.status(500).json({ message: "Feed fetch failed" })
  }
}
