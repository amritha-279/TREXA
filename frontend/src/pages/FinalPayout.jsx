import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const UPI_STEPS = [
  { id: "init",     label: "Initiating UPI Transfer",        icon: "📲" },
  { id: "bank",     label: "Connecting to Worker Bank",      icon: "🏦" },
  { id: "transfer", label: "Transferring Funds",             icon: "💸" },
  { id: "confirm",  label: "Payment Confirmed by Bank",      icon: "✅" },
];

function FinalPayout() {
  const navigate = useNavigate();
  const claim = JSON.parse(localStorage.getItem("claim")) || {};

  const txId        = claim.transaction_id || "#TX-99824A";
  const fraudScore  = claim.fraud_score ?? null;
  const decision    = claim.fraud_decision || "approved";
  const gpsSpeed    = claim.gps_speed ?? null;
  const gpsDistance = claim.gps_distance ?? null;
  const timestamp   = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const [upiSteps,   setUpiSteps]   = useState(UPI_STEPS.map(s => ({ ...s, status: "pending" })));
  const [upiDone,    setUpiDone]    = useState(false);
  const [upiData,    setUpiData]    = useState(null);
  const [simRunning, setSimRunning] = useState(true);

  useEffect(() => {
    runUpiSimulation();
  }, []);

  async function runUpiSimulation() {
    for (let i = 0; i < UPI_STEPS.length; i++) {
      await delay(900);
      setUpiSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: "active" } : s
      ));
      await delay(1000);
      setUpiSteps(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: "done" } : s
      ));
    }

    // Call simulate payout API
    try {
      const res  = await fetch("http://localhost:4000/api/payout/simulate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id:     claim.claim_id || null,
          user_id:      JSON.parse(localStorage.getItem("worker"))?.workerId,
          payout_amount: claim.insurancePayout,
        }),
      });
      const data = await res.json();
      setUpiData(data);
    } catch (_) {
      setUpiData({
        transaction_id: txId,
        upi_ref:        "UPI" + Date.now(),
        bank_ref:       "TREXA" + Math.floor(Math.random() * 999999),
        payment_method: "UPI",
      });
    }

    setSimRunning(false);
    setUpiDone(true);
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  return (
    <div className="min-h-screen bg-emerald-50 relative flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-200/50 border border-white relative z-10"
      >

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className="absolute inset-0 bg-emerald-100 rounded-full"
            />
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.4 }}
              className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -25, opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="absolute -top-3 -right-1 text-xl">✨</motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -15, opacity: 1 }} transition={{ duration: 1, delay: 0.7 }} className="absolute bottom-3 -left-5 text-xl">🎉</motion.div>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">
            {decision === "review" ? "Claim Submitted" : "Payout Approved"}
          </h1>
          <div className="text-2xl font-black text-emerald-600 bg-emerald-50 py-2 px-5 rounded-2xl inline-block border border-emerald-100">
            ₹{claim.insurancePayout ? Number(claim.insurancePayout).toFixed(2) : "--"}
          </div>
        </div>

        {/* UPI Simulation Steps */}
        <div className="mb-6">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping inline-block"></span>
            UPI Payout Simulation
          </p>
          <div className="space-y-2">
            {upiSteps.map((step) => (
              <div key={step.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                step.status === "done"   ? "bg-emerald-50 border-emerald-200" :
                step.status === "active" ? "bg-blue-50 border-blue-200" :
                "bg-slate-50 border-slate-100"
              }`}>
                <span className="text-lg">{step.icon}</span>
                <p className={`flex-1 text-sm font-semibold ${
                  step.status === "done"   ? "text-emerald-700" :
                  step.status === "active" ? "text-blue-700" :
                  "text-slate-400"
                }`}>{step.label}</p>
                <div>
                  {step.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>}
                  {step.status === "active"  && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                  {step.status === "done"    && <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Details */}
        <AnimatePresence>
          {upiDone && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 mb-6"
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction Details</p>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Transaction ID</span>
                <span className="font-mono text-xs text-slate-800 font-bold">{upiData?.transaction_id || txId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">UPI Ref No.</span>
                <span className="font-mono text-xs text-slate-800 font-bold">{upiData?.upi_ref || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Bank Ref</span>
                <span className="font-mono text-xs text-slate-800 font-bold">{upiData?.bank_ref || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Payment Method</span>
                <span className="text-blue-700 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-md">📲 UPI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Status</span>
                <span className="text-emerald-600 font-bold text-sm bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Completed
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Timestamp</span>
                <span className="text-slate-700 text-sm font-medium">{timestamp}</span>
              </div>
              {fraudScore !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-semibold">Fraud Score</span>
                  <span className={`font-bold text-sm px-2 py-0.5 rounded-md ${fraudScore >= 60 ? "bg-red-100 text-red-600" : fraudScore >= 30 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                    {fraudScore} / 100
                  </span>
                </div>
              )}
              {gpsSpeed !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-semibold">GPS Speed Check</span>
                  <span className="text-green-700 font-bold text-sm bg-green-100 px-2 py-0.5 rounded-md">
                    {gpsSpeed} km/h · {gpsDistance} km ✓
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Disruption</span>
                <span className="text-slate-700 text-sm capitalize">{claim.disruptionType?.replace(/_/g, " ") || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm font-semibold">Payout Tier</span>
                <span className="text-slate-700 text-sm capitalize">{claim.payoutTier || "—"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Return button */}
        <AnimatePresence>
          {upiDone && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate("/dashboard")}
              className="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Return to Dashboard
            </motion.button>
          )}
        </AnimatePresence>

        {/* Processing state */}
        {simRunning && (
          <p className="text-center text-sm text-slate-400 font-medium mt-2 animate-pulse">
            Processing UPI transfer...
          </p>
        )}

      </motion.div>
    </div>
  );
}

export default FinalPayout;
