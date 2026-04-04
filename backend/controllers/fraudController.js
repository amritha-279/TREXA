import Claim from "../models/Claim.js"

export const checkFraud = async (req, res) => {

  try {

    const { workerName, city } = req.body

    const claims = await Claim.find({ workerName }).sort({ createdAt: -1 })

    // Check 1 — excess claim frequency (more than 5 total)
    if (claims.length > 5) {
      return res.json({ fraud: true, reason: "Excess claim frequency" })
    }

    // Check 2 — duplicate claim in last 10 minutes
    if (claims.length > 0) {
      const lastClaim    = claims[0]
      const minutesSince = (Date.now() - new Date(lastClaim.createdAt).getTime()) / 60000
      if (minutesSince < 10) {
        return res.json({ fraud: true, reason: "Duplicate claim detected within 10 minutes" })
      }
    }

    // Check 3 — location mismatch (city must match stored claim city if exists)
    if (city && claims.length > 0 && claims[0].city && claims[0].city !== city) {
      return res.json({ fraud: true, reason: "Location mismatch detected" })
    }

    res.json({ fraud: false })

  } catch (error) {
    res.status(500).json({ message: "Fraud check failed" })
  }

}