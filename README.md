**TREXA**  
**Parametric Income Protection for Food Delivery Workers**

---

**OVERVIEW**

This project focuses on food delivery partners (Swiggy, Zomato) whose income depends entirely on completed deliveries.  

The main issue is not accidents or health, but income loss caused by external disruptions like heavy rain, pollution spikes, or platform outages. Existing insurance products do not cover this type of loss.  

Trexa is designed as a parametric micro-insurance system where payouts are triggered automatically based on real-world conditions, without requiring manual claims.

---

**PERSONA SCENARIO**

We focus on a typical food delivery worker operating in an urban area.  

A worker completes around 15–20 deliveries per day and earns approximately ₹800–₹1000 daily.  

On days with heavy rain or high pollution, the worker either cannot work efficiently or receives fewer orders, leading to direct income loss.  

For example, if heavy rain occurs for several hours, the worker may lose 30–40% of their daily earnings.  

Trexa is designed to protect against this kind of short-term income drop.

---

**APPLICATION WORKFLOW**

1. Worker logs in and provides basic details:  
   - deliveries per day  
   - earning per delivery  

2. System calculates baseline income  

3. Worker selects a weekly insurance plan  

4. System continuously monitors external data (weather, pollution, etc.)  

5. When a disruption occurs, the system checks:  
   - policy status  
   - worker location  
   - recent activity  

6. If conditions are satisfied, payout is automatically triggered  

No manual claim process is required.

---

**INCOME AND PAYOUT CALCULATION**

**Disruption Impact and Payout Logic**

Each disruption reduces income by a fixed percentage:

| Disruption Type       | Impact on Income |
|----------------------|----------------|
| Heavy Rain           | 40% reduction |
| High Pollution (AQI) | 25% reduction |
| Platform Outage      | 70% reduction |
| Curfew / Shutdown    | 100% reduction |

We first calculate the worker’s daily income based on their delivery pattern.  

Then, income loss is calculated using the disruption impact.  

Only **75% of the loss is compensated** to ensure sustainability.

---

**Example Calculation**

| Step | Description | Calculation | Result |
|------|------------|------------|--------|
| 1 | Daily income | 18 × 50 | ₹900 |
| 2 | Income loss (Rain 40%) | 900 × 0.40 | ₹360 |
| 3 | Payout (75%) | 360 × 0.75 | ₹270 |

Final payout = ₹270  

---

**WEEKLY PREMIUM MODEL**

Premium is calculated based on expected payout risk:

expected_payout =  
(prob_rain × payout_rain) +  
(prob_pollution × payout_pollution) +  
(prob_outage × payout_outage)

Example:

expected_payout ≈ ₹116  

However, this only represents the average payout. Charging this directly would make the system unstable.  

So we add a 40% margin to cover:

- operational costs (APIs, backend, payments)  
- sustainability (ensuring long-term viability)  

premium = expected_payout × (1 + margin)  
premium = 116 × 1.40 ≈ ₹162  

This is the theoretical premium.

Since this is not affordable, we redesign it into micro-insurance:

| Plan     | Premium  | Max Payout |
|----------|----------|------------|
| Basic    | ₹10/week | ₹900       |
| Standard | ₹20/week | ₹1500      |
| Premium  | ₹35/week | ₹2500      |

---

**WHY PAYOUT IS LIMITED**

We do not replace full income.

Example:  
5 bad days → ₹4500 loss  

If fully covered, the system becomes unsustainable.

So we cap payouts:

Standard plan → ₹1500 max/week  

---

**PARAMETRIC TRIGGERS**

rain_index = rainfall_mm × duration_hours  

If:

rain_index > threshold → disruption triggered  

---

**AI / ML INTEGRATION**

Risk Estimation using:
- rainfall forecast  
- AQI  
- historical patterns  
- seasonal factors  

Output: risk_score  

---

**FRAUD PREVENTION RULES**

policy_active == TRUE  
worker_location == event_zone  
worker_recent_activity == TRUE  

---

**TECH STACK**

Frontend: HTML, CSS, JavaScript  
Backend: Python (Flask)  
Database: MongoDB  

---
**PITCH DECK**
https://drive.google.com/file/d/1-rT6SugSNS4CZkc_QAXvJMD8NwFuhP_Z/view?usp=sharing

**CONCLUSION**

Trexa focuses on solving income loss for delivery workers using structured calculations, parametric triggers, and controlled payouts.



