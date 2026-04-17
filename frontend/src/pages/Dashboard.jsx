import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

function Dashboard() {
  const navigate = useNavigate();
  const [worker,  setWorker]  = useState(null);
  const [stats,   setStats]   = useState(null);
  const [feed,    setFeed]    = useState(["📡 Real-time weather monitoring active", "🛡️ Parametric insurance engine running"]);
  const feedRef = useRef(null);

  useEffect(() => {
    const storedWorker = JSON.parse(localStorage.getItem("worker"));
    setWorker(storedWorker);

    async function fetchDashboard() {
      if (!storedWorker?.workerId) return;
      try {
        const res  = await fetch(`http://localhost:4000/api/worker-dashboard/${storedWorker.workerId}`);
        const data = await res.json();
        setStats(data);
      } catch (_) {}
    }

    async function fetchFeed() {
      try {
        const res  = await fetch("http://localhost:4000/api/feed");
        const data = await res.json();
        if (data.feed?.length) setFeed(data.feed);
      } catch (_) {}
    }

    fetchDashboard();
    fetchFeed();
    const interval = setInterval(() => { fetchDashboard(); fetchFeed(); }, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!worker) return null;

  const zoneRisk = worker.riskLevel || "Low";

  const getRiskBadgeColor = (risk) => {
    switch (risk.toLowerCase()) {
      case "low":    return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-orange-100 text-orange-800 border-orange-200";
      case "high":   return "bg-red-100 text-red-800 border-red-200";
      default:       return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleMonitorClick = () => navigate(worker?.activePlan ? "/monitoring" : "/plans");

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  const statCards = stats ? [
    { label: "Active Weekly Coverage",     value: stats.activePlan !== "None" ? stats.activePlan : "None",  accent: false },
    { label: "Weekly Premium",             value: stats.weeklyPremium ? `₹${stats.weeklyPremium}/wk` : "—", accent: false },
    { label: "Earnings Protected",         value: `₹${stats.earningsProtected?.toLocaleString("en-IN")}`,   accent: true  },
    { label: "Remaining Weekly Limit",     value: `₹${stats.remainingWeeklyLimit?.toLocaleString("en-IN")}`,accent: false },
    { label: "Total Premium Paid",         value: `₹${stats.totalPremiumPaid?.toLocaleString("en-IN")}`,    accent: false },
    { label: "Total Claims Approved",      value: stats.totalClaimsApproved,                                accent: false },
    { label: "Total Payout Received",      value: `₹${stats.totalPayoutReceived?.toLocaleString("en-IN")}`, accent: false },
  ] : [
    { label: "Insurance Status",  value: worker.activePlan ? "Active" : "Not Active", accent: false },
    { label: "Weekly Premium",    value: worker.weeklyPremium ? `₹${worker.weeklyPremium}/week` : "Not Selected", accent: false },
    { label: "Earnings Protected",value: worker.earningsProtected || "₹0", accent: true },
    { label: "Zone Risk Level",   value: zoneRisk, accent: false },
    { label: "Claim History",     value: worker.claimHistory?.length || 0, accent: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      <div className="absolute top-0 w-full h-80 bg-gradient-to-br from-teal-600 to-emerald-700"></div>
      <div className="absolute top-80 w-full rounded-t-[3rem] bg-slate-50 h-[100px] -mt-10"></div>

      <div className="relative pt-24 px-6 md:px-12 max-w-7xl mx-auto z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
              Welcome back, {stats?.workerName || worker.name}
            </h1>
            <p className="text-teal-100 text-lg font-medium">Here is your Trexa coverage overview.</p>
          </div>
          <div className={`mt-6 md:mt-0 px-6 py-2.5 rounded-full border-2 flex items-center gap-3 backdrop-blur-md shadow-lg ${getRiskBadgeColor(zoneRisk)}`}>
            <div className="w-3 h-3 rounded-full animate-pulse bg-green-500"></div>
            <span className="font-bold tracking-wide">Zone Risk: {zoneRisk.toUpperCase()}</span>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={cv} initial="hidden" animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12"
        >
          {statCards.map((card, i) => (
            <motion.div key={i} variants={iv}
              className={`rounded-3xl p-6 shadow-xl ${card.accent ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white" : "bg-white"}`}
            >
              <p className={`text-sm font-semibold mb-1 ${card.accent ? "text-teal-100" : "text-slate-500"}`}>{card.label}</p>
              <div className={`text-3xl font-black ${card.accent ? "text-white" : "text-slate-800"}`}>{card.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Claims */}
        {stats?.recentClaims?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-xl mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Claims</p>
            <div className="space-y-3">
              {stats.recentClaims.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm capitalize">{c.disruptionType?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-teal-700">₹{c.payoutAmount?.toFixed(0)}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                      c.status === "approved" ? "bg-green-100 text-green-700" :
                      c.status === "review"   ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Payments */}
        {stats?.recentPayments?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-xl mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Payment History</p>
            <div className="space-y-3">
              {stats.recentPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-mono text-xs text-slate-500">{p.transaction_id}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(p.payout_timestamp).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-teal-700">₹{p.payout_amount?.toFixed(0)}</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 capitalize">{p.payout_status}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Live Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900 rounded-3xl p-6 shadow-xl mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block"></span>
            Live System Feed
          </p>
          <div className="space-y-2 max-h-40 overflow-y-auto" ref={feedRef}>
            {feed.map((item, i) => <p key={i} className="text-sm text-slate-300 font-medium">{item}</p>)}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/risk")}
            className="flex-1 py-5 bg-white border-2 border-teal-100 text-teal-800 font-bold text-lg rounded-2xl shadow-lg"
          >
            View AI Risk Analysis
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleMonitorClick}
            className="flex-1 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-xl"
          >
            {worker?.activePlan ? "Start Monitoring" : "Choose Your Plan"}
          </motion.button>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
