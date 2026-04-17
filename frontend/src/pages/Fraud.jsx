import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const CHECKS = [
  { id: "gps",      label: "GPS Spoofing Detection",       icon: "📍", scoreWeight: 30 },
  { id: "weather",  label: "Weather Authenticity Validation", icon: "🌧️", scoreWeight: 25 },
  { id: "frequency",label: "Excessive Claim Frequency",    icon: "📊", scoreWeight: 20 },
  { id: "activity", label: "Activity Anomaly Detection",   icon: "🔍", scoreWeight: 25 },
];

function decisionStyle(decision) {
  if (decision === "approved") return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "✅ Auto Approved" };
  if (decision === "review")   return { bg: "bg-orange-50 border-orange-200",   text: "text-orange-700",  label: "⚠️ Flagged for Review" };
  return                              { bg: "bg-red-50 border-red-200",          text: "text-red-700",     label: "❌ Claim Rejected" };
}

function Fraud() {
  const navigate = useNavigate();
  const [checks,   setChecks]   = useState(CHECKS.map(c => ({ ...c, status: "pending", flagged: false })));
  const [result,   setResult]   = useState(null);
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    async function run() {
      try {
        const worker = JSON.parse(localStorage.getItem("worker"));
        const claim  = JSON.parse(localStorage.getItem("claim"));

        const res  = await fetch("http://localhost:4000/api/fraud/check", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerName: worker?.name,
            workerId:   worker?.workerId,
            city:       worker?.location || worker?.city,
            rain:       claim?.rain ?? 0,
          }),
        });
        const data = await res.json();

        // Animate each check sequentially
        const flagMap = {
          gps:       data.fraud_flags?.some(f => f.includes("GPS")),
          weather:   data.fraud_flags?.some(f => f.includes("Weather")),
          frequency: data.fraud_flags?.some(f => f.includes("Excessive") || f.includes("max-payout")),
          activity:  data.fraud_flags?.some(f => f.includes("Activity") || f.includes("duplicate")),
        };

        for (let i = 0; i < CHECKS.length; i++) {
          await new Promise(r => setTimeout(r, 1200));
          setChecks(prev => prev.map((c, idx) =>
            idx === i ? { ...c, status: flagMap[c.id] ? "flagged" : "passed", flagged: !!flagMap[c.id] } : c
          ));
        }

        await new Promise(r => setTimeout(r, 600));
        setResult(data);
        setDone(true);

      } catch (err) {
        console.error(err);
      }
    }
    run();
  }, []);

  const handleContinue = () => {
    const claim = JSON.parse(localStorage.getItem("claim")) || {};
    localStorage.setItem("claim", JSON.stringify({ ...claim, fraud_decision: result?.decision, fraud_score: result?.fraud_score }));
    navigate("/final-payout");
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-24 pt-20 px-4 md:px-8 text-slate-100 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-slate-800 rounded-2xl border border-slate-700 mb-5">
            {!done ? (
              <span className="text-4xl animate-spin inline-block">🛡️</span>
            ) : result?.decision === "approved" ? (
              <span className="text-4xl">✅</span>
            ) : result?.decision === "review" ? (
              <span className="text-4xl">⚠️</span>
            ) : (
              <span className="text-4xl">❌</span>
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Fraud Detection Engine</h1>
          <p className="text-slate-400 text-sm">4-layer parametric fraud scoring system</p>
        </motion.div>

        {/* Checks */}
        <div className="space-y-3 mb-8">
          {checks.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 ${
                item.status === "passed"  ? "bg-emerald-900/30 border-emerald-700" :
                item.status === "flagged" ? "bg-red-900/30 border-red-700" :
                "bg-slate-800 border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-bold text-sm text-white">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Weight: +{item.scoreWeight} pts if flagged</p>
                </div>
              </div>
              <div>
                {item.status === "pending" && (
                  <div className="flex gap-1">
                    {[0,1,2].map(d => <div key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }}></div>)}
                  </div>
                )}
                {item.status === "passed"  && <span className="text-xs font-bold text-emerald-400 bg-emerald-900/50 px-2 py-1 rounded-full">✓ Clear</span>}
                {item.status === "flagged" && <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full">⚑ Flagged</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Score + Decision */}
        <AnimatePresence>
          {done && result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Score bar */}
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-bold text-slate-300">Fraud Score</p>
                  <span className={`text-2xl font-black ${result.fraud_score >= 60 ? "text-red-400" : result.fraud_score >= 30 ? "text-orange-400" : "text-emerald-400"}`}>
                    {result.fraud_score} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.fraud_score}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-3 rounded-full ${result.fraud_score >= 60 ? "bg-red-500" : result.fraud_score >= 30 ? "bg-orange-500" : "bg-emerald-500"}`}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0 — Auto Approve</span>
                  <span>30 — Review</span>
                  <span>60+ — Reject</span>
                </div>
              </div>

              {/* Flags */}
              {result.fraud_flags?.length > 0 && (
                <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fraud Flags Detected</p>
                  {result.fraud_flags.map((f, i) => (
                    <p key={i} className="text-xs text-red-300 flex items-start gap-2">
                      <span className="mt-0.5">⚑</span>{f}
                    </p>
                  ))}
                </div>
              )}

              {/* Decision badge */}
              {(() => {
                const s = decisionStyle(result.decision);
                return (
                  <div className={`rounded-2xl p-5 border text-center ${s.bg}`}>
                    <p className={`text-xl font-black ${s.text}`}>{s.label}</p>
                    <p className={`text-sm mt-1 ${s.text} opacity-80`}>
                      {result.decision === "approved" && "No fraud indicators. Payout cleared."}
                      {result.decision === "review"   && "Claim flagged for manual insurer review."}
                      {result.decision === "rejected" && "High fraud score. Payout blocked."}
                    </p>
                  </div>
                );
              })()}

              {/* CTA */}
              {(result.decision === "approved" || result.decision === "review") && (
                <button
                  onClick={handleContinue}
                  className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-lg rounded-2xl shadow-xl"
                >
                  {result.decision === "approved" ? "Approve Payout →" : "Submit for Review →"}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default Fraud;
