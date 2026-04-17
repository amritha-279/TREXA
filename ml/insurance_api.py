from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timezone
import random
import math

app = Flask(__name__)
CORS(app)

client = MongoClient("mongodb://localhost:27017/")
db = client["trexa"]
workers_col   = db["workers"]
policies_col  = db["policies"]
claims_col    = db["insurance_claims"]
gps_logs_col  = db["gps_fraud_logs"]

# ── Fixed disruption impact factors ──────────────────────────────────────────
IMPACTS = {
    "rain":      0.40,
    "pollution": 0.25,
    "outage":    0.70,
}

# ── Risk probabilities (simulated) ───────────────────────────────────────────
PROBS = {
    "rain":      0.3,
    "pollution": 0.2,
    "outage":    0.1,
}

# ── Plan definitions ──────────────────────────────────────────────────────────
BASE_PLANS = [
    { "id": "basic",    "name": "Basic Plan",    "base_premium": 10, "max_payout": 900  },
    { "id": "standard", "name": "Standard Plan", "base_premium": 20, "max_payout": 1500 },
    { "id": "premium",  "name": "Premium Plan",  "base_premium": 35, "max_payout": 2500 },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def calculate_premium(base_premium, risk_score):
    premium = base_premium
    if risk_score < 0.3:
        premium -= 2
    elif risk_score > 0.7:
        premium += 3
    return round(premium, 2)


def compute_plan_data(deliveries_per_day, earning_per_delivery, risk_score=0.5):
    daily_income = deliveries_per_day * earning_per_delivery

    # Income loss per event type
    losses = { k: daily_income * v for k, v in IMPACTS.items() }

    # Payout = 75% of loss
    payouts = { k: round(v * 0.75, 2) for k, v in losses.items() }

    # Expected weekly payout
    expected_payout = sum(PROBS[k] * payouts[k] for k in PROBS)

    # Raw premium with 40% margin
    raw_premium = expected_payout * 1.4

    plans = []
    for p in BASE_PLANS:
        adj_premium = calculate_premium(p["base_premium"], risk_score)
        plans.append({
            "id":          p["id"],
            "name":        p["name"],
            "premium":     adj_premium,
            "max_payout":  p["max_payout"],
            "daily_income": round(daily_income, 2),
            "expected_weekly_payout": round(expected_payout, 2),
            "raw_premium": round(raw_premium, 2),
            "rain_payout":      payouts["rain"],
            "pollution_payout": payouts["pollution"],
            "outage_payout":    payouts["outage"],
        })

    return plans


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return "Trexa Insurance API Running"


# GET /plans?deliveries=18&earning=50&risk_score=0.5
@app.route("/plans", methods=["GET"])
def get_plans():
    try:
        deliveries    = float(request.args.get("deliveries", 18))
        earning       = float(request.args.get("earning", 50))
        risk_score    = float(request.args.get("risk_score", 0.5))
        plans = compute_plan_data(deliveries, earning, risk_score)
        return jsonify({ "plans": plans, "risk_score": risk_score })
    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# POST /profile  — save worker income profile
@app.route("/profile", methods=["POST"])
def save_profile():
    try:
        data = request.json
        worker_id          = data.get("worker_id")
        deliveries_per_day = float(data.get("deliveries_per_day", 0))
        earning_per_delivery = float(data.get("earning_per_delivery", 0))
        daily_income       = deliveries_per_day * earning_per_delivery

        workers_col.update_one(
            { "workerId": worker_id },
            { "$set": {
                "deliveries_per_day":    deliveries_per_day,
                "earning_per_delivery":  earning_per_delivery,
                "daily_income":          daily_income,
            }},
            upsert=True
        )
        return jsonify({ "daily_income": daily_income })
    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# POST /activate_policy
@app.route("/activate_policy", methods=["POST"])
def activate_policy():
    try:
        data      = request.json
        worker_id = data.get("worker_id")
        plan_id   = data.get("plan_id")
        deliveries    = float(data.get("deliveries_per_day", 18))
        earning       = float(data.get("earning_per_delivery", 50))
        risk_score    = float(data.get("risk_score", 0.5))

        plans     = compute_plan_data(deliveries, earning, risk_score)
        plan      = next((p for p in plans if p["id"] == plan_id), plans[1])

        policy = {
            "worker_id":   worker_id,
            "plan_id":     plan["id"],
            "plan_name":   plan["name"],
            "premium":     plan["premium"],
            "max_payout":  plan["max_payout"],
            "daily_income": plan["daily_income"],
            "weekly_payout_used": 0,
            "active":      True,
            "start_time":  datetime.now(timezone.utc),
        }

        policies_col.update_one(
            { "worker_id": worker_id },
            { "$set": policy },
            upsert=True
        )
        return jsonify({ "message": "Policy activated", "policy": {
            **policy, "start_time": policy["start_time"].isoformat()
        }})
    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# GET /check_event?city=Chennai
@app.route("/check_event", methods=["GET"])
def check_event():
    try:
        city = request.args.get("city", "Chennai")
        # Simulated event detection
        rand = random.random()
        if rand < 0.3:
            event_type = "rain"
            severity   = round(random.uniform(0.4, 1.0), 2)
        elif rand < 0.5:
            event_type = "pollution"
            severity   = round(random.uniform(0.25, 0.8), 2)
        elif rand < 0.6:
            event_type = "outage"
            severity   = round(random.uniform(0.5, 1.0), 2)
        else:
            event_type = "none"
            severity   = 0.0

        return jsonify({ "city": city, "event_type": event_type, "severity": severity })
    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# POST /process_claim
@app.route("/process_claim", methods=["POST"])
def process_claim():
    try:
        data       = request.json
        worker_id  = data.get("worker_id")
        event_type = data.get("event_type")
        city       = data.get("city", "Chennai")

        # Fetch policy
        policy = policies_col.find_one({ "worker_id": worker_id, "active": True })
        if not policy:
            return jsonify({ "status": "Rejected", "reason": "No active policy found" })

        daily_income = policy.get("daily_income", 0)
        max_payout   = policy.get("max_payout", 900)
        weekly_used  = policy.get("weekly_payout_used", 0)

        # Validate event
        if event_type == "none" or event_type not in IMPACTS:
            return jsonify({ "status": "Rejected", "reason": "No qualifying event detected" })

        # Calculate payout
        loss         = daily_income * IMPACTS[event_type]
        payout       = round(loss * 0.75, 2)

        # Weekly cap check
        if weekly_used + payout > max_payout:
            payout = round(max_payout - weekly_used, 2)
            if payout <= 0:
                return jsonify({ "status": "Rejected", "reason": "Weekly payout cap reached" })

        # Update weekly used
        policies_col.update_one(
            { "worker_id": worker_id },
            { "$inc": { "weekly_payout_used": payout } }
        )

        # ── GPS Spoofing Check ─────────────────────────────────────────────────────
        gps_result   = {}
        current_loc  = data.get("current_location")
        current_ts   = data.get("timestamp", datetime.now(timezone.utc).isoformat())

        if current_loc:
            curr_lat  = float(current_loc.get("lat", 0))
            curr_lng  = float(current_loc.get("lng", 0))
            curr_time = datetime.fromisoformat(current_ts) if isinstance(current_ts, str) else current_ts
            if curr_time.tzinfo is None:
                curr_time = curr_time.replace(tzinfo=timezone.utc)

            last_log = gps_logs_col.find_one({ "user_id": worker_id }, sort=[("timestamp", -1)])

            gps_flag         = False
            calculated_speed = 0.0
            distance         = 0.0
            time_minutes     = 0.0
            fraud_points     = 0

            if last_log:
                prev_lat  = last_log["current_location"]["lat"]
                prev_lng  = last_log["current_location"]["lng"]
                prev_time = last_log["timestamp"]
                if prev_time.tzinfo is None:
                    prev_time = prev_time.replace(tzinfo=timezone.utc)

                distance     = round(haversine(prev_lat, prev_lng, curr_lat, curr_lng), 4)
                time_minutes = round((curr_time - prev_time).total_seconds() / 60, 4)

                if time_minutes > 0:
                    calculated_speed = round((distance / time_minutes) * 60, 2)

                if calculated_speed > 60:
                    gps_flag     = True
                    fraud_points = 30

            gps_logs_col.insert_one({
                "user_id":           worker_id,
                "claim_id":          str(claims_col.estimated_document_count()),
                "previous_location": { "lat": last_log["current_location"]["lat"], "lng": last_log["current_location"]["lng"] } if last_log else None,
                "current_location":  { "lat": curr_lat, "lng": curr_lng },
                "distance_km":       distance,
                "time_minutes":      time_minutes,
                "calculated_speed":  calculated_speed,
                "gps_flag":          gps_flag,
                "fraud_points":      fraud_points,
                "timestamp":         curr_time,
            })

            gps_result = {
                "gps_flag":         gps_flag,
                "calculated_speed": calculated_speed,
                "distance":         distance,
                "time_minutes":     time_minutes,
                "fraud_points":     fraud_points,
            }

            if gps_flag:
                return jsonify({
                    "status":  "Rejected",
                    "reason":  f"GPS spoofing detected — speed {calculated_speed} km/h over {distance} km in {time_minutes} min",
                    "gps_check": gps_result,
                })

        claim = {
            "worker_id":    worker_id,
            "city":         city,
            "event_type":   event_type,
            "payout_amount": payout,
            "income_loss":  round(loss, 2),
            "timestamp":    datetime.now(timezone.utc),
            "status":       "Approved",
            "gps_check":    gps_result,
        }
        claims_col.insert_one(claim)

        return jsonify({
            "status":       "Approved",
            "event_type":   event_type,
            "payout_amount": payout,
            "income_loss":  round(loss, 2),
            "gps_check":    gps_result,
        })

    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# GET /claims?worker_id=SWG1001
@app.route("/claims", methods=["GET"])
def get_claims():
    try:
        worker_id = request.args.get("worker_id")
        query     = { "worker_id": worker_id } if worker_id else {}
        claims    = list(claims_col.find(query, { "_id": 0 }).sort("timestamp", -1).limit(20))
        for c in claims:
            if isinstance(c.get("timestamp"), datetime):
                c["timestamp"] = c["timestamp"].isoformat()
        return jsonify(claims)
    except Exception as e:
        return jsonify({ "error": str(e) }), 500


# ── Haversine distance (km) ───────────────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── POST /fraud_check/gps ─────────────────────────────────────────────────────
@app.route("/fraud_check/gps", methods=["POST"])
def gps_fraud_check():
    try:
        data             = request.json
        user_id          = data.get("user_id")
        claim_id         = data.get("claim_id", "")
        current_location = data.get("current_location", {})
        current_ts       = data.get("timestamp")

        curr_lat = float(current_location.get("lat", 0))
        curr_lng = float(current_location.get("lng", 0))
        curr_time = datetime.fromisoformat(current_ts) if current_ts else datetime.now(timezone.utc)

        # Fetch last known GPS log for this user
        last_log = gps_logs_col.find_one(
            { "user_id": user_id },
            sort=[("timestamp", -1)]
        )

        gps_flag         = False
        calculated_speed = 0.0
        distance         = 0.0
        time_minutes     = 0.0
        fraud_points     = 0

        if last_log:
            prev_lat   = last_log["current_location"]["lat"]
            prev_lng   = last_log["current_location"]["lng"]
            prev_time  = last_log["timestamp"]

            # Ensure both timestamps are timezone-aware
            if prev_time.tzinfo is None:
                prev_time = prev_time.replace(tzinfo=timezone.utc)
            if curr_time.tzinfo is None:
                curr_time = curr_time.replace(tzinfo=timezone.utc)

            distance     = round(haversine(prev_lat, prev_lng, curr_lat, curr_lng), 4)
            time_minutes = round((curr_time - prev_time).total_seconds() / 60, 4)

            if time_minutes > 0:
                # speed in km/h
                calculated_speed = round((distance / time_minutes) * 60, 2)
            else:
                calculated_speed = 0.0

            # Flag if speed > 60 km/h (delivery workers ride motorbikes in city traffic)
            if calculated_speed > 60:
                gps_flag     = True
                fraud_points = 30

        # Persist this GPS check
        gps_logs_col.insert_one({
            "user_id":          user_id,
            "claim_id":         claim_id,
            "previous_location": { "lat": last_log["current_location"]["lat"], "lng": last_log["current_location"]["lng"] } if last_log else None,
            "current_location": { "lat": curr_lat, "lng": curr_lng },
            "distance_km":      distance,
            "time_minutes":     time_minutes,
            "calculated_speed": calculated_speed,
            "gps_flag":         gps_flag,
            "fraud_points":     fraud_points,
            "timestamp":        curr_time,
        })

        return jsonify({
            "gps_flag":         gps_flag,
            "calculated_speed": calculated_speed,
            "distance":         distance,
            "time_minutes":     time_minutes,
            "fraud_points":     fraud_points,
        })

    except Exception as e:
        return jsonify({ "error": str(e) }), 500


if __name__ == "__main__":
    app.run(port=5001, debug=False)
