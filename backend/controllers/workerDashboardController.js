import Claim   from "../models/Claim.js"
import Payment from "../models/Payment.js"
import Worker  from "../models/Worker.js"

const WEEKLY_PAYOUT_LIMIT = 2000
const WEEKLY_PREMIUM_MAP  = { Basic: 49, Standard: 99, Premium: 199 }

export const getWorkerDashboard = async (req, res) => {
  try {
    const { workerId } = req.params

    const worker = await Worker.findOne({ workerId })
    if (!worker) return res.status(404).json({ message: "Worker not found" })

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const allClaims  = await Claim.find({ workerName: worker.name }).sort({ createdAt: -1 })
    const weekClaims = allClaims.filter(c => new Date(c.createdAt) >= oneWeekAgo)

    const approvedClaims = allClaims.filter(c => c.status === "approved" || !c.status)

    const payments = await Payment.find({ user_id: workerId }).sort({ payout_timestamp: -1 })

    const totalPayoutReceived = payments
      .filter(p => p.payout_status === "completed")
      .reduce((sum, p) => sum + (p.payout_amount || 0), 0)

    const weeklyPayoutUsed = weekClaims
      .filter(c => c.status === "approved" || !c.status)
      .reduce((sum, c) => sum + (c.payoutAmount || 0), 0)

    const weeklyPremium    = WEEKLY_PREMIUM_MAP[worker.activePlan] || 0
    const totalPremiumPaid = weeklyPremium * 4   // approx 4 weeks

    const earningsProtected = allClaims.reduce((sum, c) => sum + (c.estimatedIncomeLoss || 0), 0)

    const recentClaims = allClaims.slice(0, 5).map(c => ({
      _id:            c._id,
      disruptionType: c.disruptionType,
      payoutAmount:   c.payoutAmount,
      payoutTier:     c.payoutTier,
      status:         c.status || "approved",
      createdAt:      c.createdAt,
    }))

    const recentPayments = payments.slice(0, 5).map(p => ({
      transaction_id:   p.transaction_id,
      payout_amount:    p.payout_amount,
      payout_status:    p.payout_status,
      payout_timestamp: p.payout_timestamp,
    }))

    res.json({
      workerName:            worker.name,
      city:                  worker.city,
      platform:              worker.platform,
      activePlan:            worker.activePlan || "None",
      weeklyPremium,
      weeklyPayoutUsed:      parseFloat(weeklyPayoutUsed.toFixed(2)),
      remainingWeeklyLimit:  parseFloat(Math.max(0, WEEKLY_PAYOUT_LIMIT - weeklyPayoutUsed).toFixed(2)),
      totalPremiumPaid,
      earningsProtected:     parseFloat(earningsProtected.toFixed(2)),
      totalClaimsApproved:   approvedClaims.length,
      totalPayoutReceived:   parseFloat(totalPayoutReceived.toFixed(2)),
      recentClaims,
      recentPayments,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Worker dashboard fetch failed" })
  }
}
