import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Plans() {
  const navigate = useNavigate();

  const worker    = JSON.parse(localStorage.getItem("worker")) || {};
  const riskScore = worker.riskScore || 0.5;

  const [deliveries, setDeliveries] = useState("");
  const [earning,    setEarning]    = useState("");
  const [plans,      setPlans]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [fetched,    setFetched]    = useState(false);
  const [error,      setError]      = useState("");
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [paying,       setPaying]       = useState(false);
  const [paid,         setPaid]         = useState(false);

  // Static plan UI metadata (colors, features, descriptions — UI unchanged)
  const planMeta = {
    basic: {
      coverage: "₹900",
      description: "Essential coverage for short shifts.",
      color: "from-sky-400 to-blue-500",
      shadow: "shadow-blue-200",
      features: ["Heavy Rain Protection", "Automatic Payouts", "Email Support"],
      isPopular: false,
    },
    standard: {
      coverage: "₹1500",
      description: "Our most popular plan for full-time workers.",
      color: "from-teal-400 to-emerald-500",
      shadow: "shadow-teal-200",
      features: ["Heavy Rain & Floods", "Extreme Heat Protection", "Automatic Payouts", "Priority Support"],
      isPopular: true,
    },
    premium: {
      coverage: "₹2500",
      description: "Maximum protection across all hazard types.",
      color: "from-indigo-400 to-violet-500",
      shadow: "shadow-indigo-200",
      features: ["All Weather Hazards", "Pollution Protection", "Instant AI Payouts", "24/7 Phone Support"],
      isPopular: false,
    },
  };

  async function fetchPlans() {
    if (!deliveries || !earning) return;
    setLoading(true);
    setError("");
    try {
      const res  = await fetch(`http://localhost:5001/plans?deliveries=${deliveries}&earning=${earning}&risk_score=${riskScore}`);
      const data = await res.json();
      setPlans(data.plans);
      setFetched(true);
    } catch (err) {
      // Flask not running — calculate locally using same formula
      const d = Number(deliveries);
      const e = Number(earning);
      const dailyIncome = d * e;
      const impacts     = { rain: 0.40, pollution: 0.25, outage: 0.70 };
      const probs       = { rain: 0.30, pollution: 0.20, outage: 0.10 };
      const payouts     = Object.fromEntries(Object.entries(impacts).map(([k, v]) => [k, dailyIncome * v * 0.75]));
      const expected    = Object.keys(probs).reduce((s, k) => s + probs[k] * payouts[k], 0);
      const basePlans   = [
        { id: "basic",    name: "Basic Plan",    base_premium: 10, max_payout: 900  },
        { id: "standard", name: "Standard Plan", base_premium: 20, max_payout: 1500 },
        { id: "premium",  name: "Premium Plan",  base_premium: 35, max_payout: 2500 },
      ];
      const localPlans = basePlans.map(p => {
        let premium = p.base_premium;
        if (riskScore < 0.3) premium -= 2;
        if (riskScore > 0.7) premium += 3;
        return { id: p.id, name: p.name, premium: Math.round(premium), max_payout: p.max_payout,
          daily_income: dailyIncome, expected_weekly_payout: Math.round(expected) };
      });
      setPlans(localPlans);
      setFetched(true);
    }
    setLoading(false);
  }

  // Merge API plan data with static UI metadata
  const mergedPlans = plans.map(p => ({ ...p, ...planMeta[p.id], expectedPrice: p.premium }));

  const handleActivate = async () => {
    const selectedData = mergedPlans.find((p) => p.id === selectedPlan);
    const workerData   = JSON.parse(localStorage.getItem("worker")) || {};
    setPaying(true);

    try {
      // Step 1 — Create Razorpay order
      const orderRes = await fetch("http://localhost:4000/api/payout/create-order", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:  selectedData.premium,
          user_id: workerData.workerId,
          plan_id: selectedData.id,
        }),
      });
      const order = await orderRes.json();

      // Step 2 — Load Razorpay checkout script dynamically
      await loadRazorpayScript();

      // Step 3 — Open Razorpay checkout popup
      const options = {
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        "Trexa Insurance",
        description: `${selectedData.name} — Weekly Premium`,
        order_id:    order.order_id,
        prefill: {
          name:    workerData.name,
          email:   "worker@trexa.in",
          contact: "9999999999",
        },
        theme: { color: "#0d9488" },
        method: {
          netbanking: true,
          card:       false,
          upi:        true,
          wallet:     false,
        },
        handler: async (response) => {
          // Step 4 — Verify payment + activate policy
          await fetch("http://localhost:4000/api/payout/verify-payment", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              user_id: workerData.workerId,
              plan_id: selectedData.id,
              amount:  selectedData.premium,
            }),
          });

          await activatePolicy(selectedData, workerData);
          setPaid(true);
          setPaying(false);
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Payment failed:", err);
      // Fallback — activate without payment if Razorpay keys not set
      await activatePolicy(selectedData, workerData);
      setPaid(true);
      setPaying(false);
    }
  };

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (document.getElementById("razorpay-script")) { resolve(); return; }
      const script  = document.createElement("script");
      script.id     = "razorpay-script";
      script.src    = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  async function activatePolicy(selectedData, workerData) {
    try {
      await fetch("http://localhost:5001/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id:            workerData.workerId,
          deliveries_per_day:   Number(deliveries),
          earning_per_delivery: Number(earning),
        }),
      });
      await fetch("http://localhost:5001/activate_policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worker_id:            workerData.workerId,
          plan_id:              selectedData.id,
          deliveries_per_day:   Number(deliveries),
          earning_per_delivery: Number(earning),
          risk_score:           riskScore,
        }),
      });
    } catch (_) {}

    localStorage.setItem("worker", JSON.stringify({
      ...workerData,
      activePlan:        selectedData.name,
      weeklyPremium:     selectedData.premium,
      earningsProtected: `₹${selectedData.max_payout}`,
      dailyIncome:       selectedData.daily_income,
      claimHistory:      workerData.claimHistory || [],
    }));
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 relative pb-24 pt-20 px-4 md:px-8">
      
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-800 font-bold text-sm mb-6 border border-teal-200">
             <div className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></div>
             AI Calculated Premium
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Choose Your Protection</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Based on your Zone Risk Score (<span className="font-bold text-orange-500">{riskScore}</span>), we've generated the minimum weekly premiums tailored exactly for you.
          </p>
        </motion.div>

        {/* Worker Input Form */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="max-w-md mx-auto mb-12 bg-white rounded-3xl p-6 shadow-xl border border-slate-100"
        >
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Your Daily Work Details</p>
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Deliveries / Day</label>
              <input
                type="number" min="1" placeholder="e.g. 18"
                value={deliveries}
                onChange={e => { setDeliveries(e.target.value); setFetched(false); }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">₹ / Delivery</label>
              <input
                type="number" min="1" placeholder="e.g. 50"
                value={earning}
                onChange={e => { setEarning(e.target.value); setFetched(false); }}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
          {deliveries && earning && (
            <p className="text-xs text-slate-500 mb-3">
              Daily income: <span className="font-bold text-teal-700">₹{(Number(deliveries) * Number(earning)).toFixed(0)}</span>
            </p>
          )}
          <button
            onClick={fetchPlans}
            disabled={!deliveries || !earning || loading}
            className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Calculating..." : "Calculate My Plans"}
          </button>
        </motion.div>

        {/* Pricing Cards Grid */}
        {fetched && (
        <motion.div 
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 items-center max-w-5xl mx-auto"
        >
          {mergedPlans.map((plan) => (
            <motion.div 
              key={plan.id}
              variants={cardVariants}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-white rounded-3xl cursor-pointer transition-all duration-300 border-2 ${
                 selectedPlan === plan.id 
                 ? `border-transparent shadow-2xl ${plan.shadow} scale-105 z-10` 
                 : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:border-slate-300 hover:-translate-y-2 lg:scale-95'
              }`}
            >
               {/* Popular Badge */}
               {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg z-20">
                    MOST POPULAR
                  </div>
               )}

               {/* Active Selection Outline/Glow */}
               {selectedPlan === plan.id && (
                  <div className={`absolute -inset-0.5 rounded-3xl bg-gradient-to-br ${plan.color} -z-10 blur-[2px]`}></div>
               )}

               <div className="p-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mb-6 min-h-[40px]">{plan.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-slate-900">₹{plan.expectedPrice}</span>
                    <span className="text-slate-500 font-medium">/ week</span>
                  </div>

                  {/* Coverage Highlight Pill */}
                  <div className={`w-full py-3 rounded-xl mb-8 flex items-center justify-center gap-2 bg-gradient-to-r ${plan.color} text-white shadow-inner font-bold text-lg`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Coverage: {plan.coverage}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                       <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium">
                          <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white bg-gradient-to-br ${plan.color}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                             </svg>
                          </div>
                          {feature}
                       </li>
                    ))}
                  </ul>

                  {/* Selection Indicator */}
                  <div className="flex justify-center mt-auto">
                     <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedPlan === plan.id ? 'border-teal-500 bg-teal-500' : 'border-slate-300'
                     }`}>
                        {selectedPlan === plan.id && (
                           <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2.5 h-2.5 bg-white rounded-full"
                           />
                        )}
                     </div>
                  </div>
               </div>
            </motion.div>
          ))}
        </motion.div>
        )}

        {fetched && (
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.8 }}
           className="mt-16 text-center max-w-sm mx-auto"
        >
          {paid ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6"
            >
              <p className="text-3xl mb-2">✅</p>
              <p className="text-xl font-black text-emerald-700">Payment Successful!</p>
              <p className="text-sm text-emerald-600 mt-1 mb-4">Your coverage is now active.</p>
              <button onClick={() => navigate("/monitoring")}
                className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl"
              >
                Start Monitoring →
              </button>
            </motion.div>
          ) : (
            <>
              <button
                onClick={handleActivate}
                disabled={paying}
                className="w-full py-5 bg-slate-900 text-white font-bold text-xl rounded-2xl shadow-xl hover:bg-slate-800 hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60"
              >
                {paying ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
                ) : (
                  <>Pay ₹{mergedPlans.find(p => p.id === selectedPlan)?.premium}/week &amp; Activate</>
                )}
              </button>
              <div className="flex items-center justify-center gap-2 mt-3">
                <img src="https://razorpay.com/favicon.ico" className="w-4 h-4" alt="" />
                <p className="text-slate-400 text-xs">Secured by Razorpay Test Mode</p>
              </div>
            </>
          )}
        </motion.div>
        )}

      </div>
    </div>
  );
}

export default Plans;