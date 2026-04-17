import Claim    from "../models/Claim.js"
import FraudLog from "../models/FraudLog.js"
import Payment  from "../models/Payment.js"
import Worker   from "../models/Worker.js"

export const getPredictiveAnalytics = async (req, res) => {
  try {
    const now        = Date.now()
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo= new Date(now - 14 * 24 * 60 * 60 * 1000)

    const lastWeekClaims = await Claim.find({ createdAt: { $gte: oneWeekAgo } })
    const prevWeekClaims = await Claim.find({ createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } })

    // Simple linear forecast: trend from prev week → last week
    const lastCount = lastWeekClaims.length
    const prevCount = prevWeekClaims.length || 1
    const growthRate = lastCount / prevCount
    const expectedClaimsNextWeek = Math.round(lastCount * growthRate)

    const avgPayout = lastWeekClaims.length
      ? lastWeekClaims.reduce((s, c) => s + (c.payoutAmount || 0), 0) / lastWeekClaims.length
      : 0
    const forecastedPayout = parseFloat((expectedClaimsNextWeek * avgPayout).toFixed(2))

    // Rain risk: ratio of weather_disruption claims in last week
    const rainClaims     = lastWeekClaims.filter(c => c.disruptionType === "weather_disruption").length
    const rainRiskPercent = lastWeekClaims.length
      ? Math.round((rainClaims / lastWeekClaims.length) * 100)
      : 40   // default baseline

    // Most triggered disruption type
    const typeCounts = {}
    const allClaims  = await Claim.find()
    allClaims.forEach(c => {
      const t = c.disruptionType || "unknown"
      typeCounts[t] = (typeCounts[t] || 0) + 1
    })
    const mostTriggered = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "weather_disruption"

    // Fraud stats
    const fraudLogs      = await FraudLog.find()
    const fraudAlertCount= fraudLogs.filter(f => f.decision === "review").length
    const rejectedCount  = fraudLogs.filter(f => f.decision === "rejected").length

    // Business metrics
    const totalWorkers   = await Worker.countDocuments()
    const totalPremium   = totalWorkers * 99 * 4   // mock: avg Standard plan × 4 weeks
    const payments       = await Payment.find({ payout_status: "completed" })
    const totalPaid      = payments.reduce((s, p) => s + (p.payout_amount || 0), 0)
    const lossRatio      = totalPremium > 0 ? parseFloat(((totalPaid / totalPremium) * 100).toFixed(1)) : 0

    // High risk zones: cities with most claims
    const zoneCounts = {}
    allClaims.forEach(c => { if (c.city) zoneCounts[c.city] = (zoneCounts[c.city] || 0) + 1 })
    const highRiskZones = Object.entries(zoneCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([city, count]) => ({ city, count }))

    res.json({
      predictedRainRiskPercent: rainRiskPercent,
      expectedClaimsNextWeek,
      forecastedPayout,
      mostTriggeredDisruption:  mostTriggered,
      highRiskZones,
      fraudAlertCount,
      rejectedCount,
      totalActivePolicies:      totalWorkers,
      totalPremiumCollected:    totalPremium,
      totalClaimsPaid:          parseFloat(totalPaid.toFixed(2)),
      lossRatio,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Predictive analytics failed" })
  }
}
