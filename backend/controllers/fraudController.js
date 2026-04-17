import Claim from "../models/Claim.js"
import FraudLog from "../models/FraudLog.js"

// Thresholds
const SPEED_THRESHOLD_KM_PER_MIN = 1.0   // >1 km/min = 60 km/h = suspicious for delivery motorbike
const CLAIMS_PER_WEEK_THRESHOLD  = 5
const MAX_PAYOUT_REPEAT_THRESHOLD = 3

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const CITY_COORDS = {
  Chennai:         { lat: 13.0827, lon: 80.2707 },
  Coimbatore:      { lat: 11.0168, lon: 76.9558 },
  Madurai:         { lat: 9.9252,  lon: 78.1198 },
  Salem:           { lat: 11.6643, lon: 78.1460 },
  Tiruchirappalli: { lat: 10.7905, lon: 78.7047 },
  Tirunelveli:     { lat: 8.7139,  lon: 77.7567 },
  Vellore:         { lat: 12.9165, lon: 79.1325 },
  Erode:           { lat: 11.3410, lon: 77.7172 },
  Thanjavur:       { lat: 10.7870, lon: 79.1378 },
  Dindigul:        { lat: 10.3673, lon: 77.9803 },
  Kanchipuram:     { lat: 12.8185, lon: 79.6947 },
  Nagercoil:       { lat: 8.1833,  lon: 77.4119 },
}

export const checkFraud = async (req, res) => {
  try {
    const { workerName, city, workerId, rain } = req.body

    const now    = Date.now()
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    const allClaims  = await Claim.find({ workerName }).sort({ createdAt: -1 })
    const weekClaims = allClaims.filter(c => new Date(c.createdAt) >= oneWeekAgo)

    let fraud_score = 0
    const fraud_flags = []

    // ── Check 1: GPS Spoofing Detection ──────────────────────────────
    if (allClaims.length > 0) {
      const lastClaim     = allClaims[0]
      const lastCity      = lastClaim.city
      const currentCity   = city
      const lastCoords    = CITY_COORDS[lastCity]
      const currentCoords = CITY_COORDS[currentCity]

      if (lastCoords && currentCoords && lastCity !== currentCity) {
        const distKm      = haversineKm(lastCoords.lat, lastCoords.lon, currentCoords.lat, currentCoords.lon)
        const minutesSince = (now - new Date(lastClaim.createdAt).getTime()) / 60000
        const speed        = minutesSince > 0 ? distKm / minutesSince : Infinity

        if (speed > SPEED_THRESHOLD_KM_PER_MIN) {
          fraud_score += 30
          fraud_flags.push(`GPS spoofing: ${distKm.toFixed(1)}km in ${minutesSince.toFixed(1)}min (${speed.toFixed(1)} km/min)`)
        }
      }
    }

    // ── Check 2: Weather Authenticity Validation ──────────────────────
    const rainValue = typeof rain === "number" ? rain : 0
    if (rainValue < 1) {
      fraud_score += 25
      fraud_flags.push("Weather invalid: no matching disruption event at claim location/time")
    }

    // ── Check 3: Excessive Claim Frequency ───────────────────────────
    if (weekClaims.length >= CLAIMS_PER_WEEK_THRESHOLD) {
      fraud_score += 20
      fraud_flags.push(`Excessive claims: ${weekClaims.length} claims this week (threshold: ${CLAIMS_PER_WEEK_THRESHOLD})`)
    }

    const maxPayoutClaims = allClaims.filter(c => c.payoutTier === "high").length
    if (maxPayoutClaims >= MAX_PAYOUT_REPEAT_THRESHOLD) {
      fraud_score += 10
      fraud_flags.push(`Repeated max-payout claims: ${maxPayoutClaims} high-tier claims`)
    }

    // ── Check 4: Activity Anomaly Detection ──────────────────────────
    if (allClaims.length > 0) {
      const minutesSinceLast = (now - new Date(allClaims[0].createdAt).getTime()) / 60000
      if (minutesSinceLast < 10) {
        fraud_score += 25
        fraud_flags.push(`Activity anomaly: duplicate claim within ${minutesSinceLast.toFixed(1)} minutes`)
      }
    }

    // ── Decision ─────────────────────────────────────────────────────
    let decision
    if (fraud_score >= 60)      decision = "rejected"
    else if (fraud_score >= 30) decision = "review"
    else                        decision = "approved"

    // ── Persist fraud log ─────────────────────────────────────────────
    const log = new FraudLog({
      user_id:     workerId || workerName,
      fraud_score,
      fraud_flags,
      decision,
    })
    await log.save()

    res.json({
      fraud:       decision !== "approved",
      fraud_score,
      fraud_flags,
      decision,
      reason:      fraud_flags[0] || null,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Fraud check failed" })
  }
}

export const getFraudLogs = async (req, res) => {
  try {
    const logs = await FraudLog.find().sort({ timestamp: -1 }).limit(50)
    res.json(logs)
  } catch {
    res.status(500).json({ message: "Failed to fetch fraud logs" })
  }
}
