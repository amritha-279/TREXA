import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

function Dashboard() {
  const navigate = useNavigate();

  const [worker,   setWorker]   = useState(null);
  const [feed,     setFeed]     = useState(["📡 Real-time weather monitoring active", "🛡️ Parametric insurance engine running"]);
  const feedRef = useRef(null);

  useEffect(() => {
    const storedWorker = JSON.parse(localStorage.getItem("worker"));
    setWorker(storedWorker);

    async function fetchFeed() {
      try {
        const res  = await fetch("http://localhost:4000/api/feed");
        const data = await res.json();
        if (data.feed?.length) setFeed(data.feed);
      } catch (_) {}
    }
    fetchFeed();
    const interval = setInterval(fetchFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!worker) {
    return null;
  }

  const dashboardData = {
    workerName: worker.name || "Worker",

    insuranceStatus: worker.activePlan ? "Active" : "Not Active",

    weeklyPremium: worker.weeklyPremium
      ? `₹${worker.weeklyPremium}/week`
      : "Not Selected",

    zoneRisk: worker.riskLevel || "Low",

    earningsProtected: worker.earningsProtected
      ? `${worker.earningsProtected}`
      : "₹0",

    claimHistory: worker.claimHistory ? worker.claimHistory.length : 0,
  };

  const getRiskBadgeColor = (risk) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200 shadow-green-200/50";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200 shadow-orange-200/50";
      case "high":
        return "bg-red-100 text-red-800 border-red-200 shadow-red-200/50";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleMonitorClick = () => {
    if (!worker?.activePlan) {
      navigate("/plans");
    } else {
      navigate("/monitoring");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      <div className="absolute top-0 w-full h-80 bg-gradient-to-br from-teal-600 to-emerald-700 animate-pulse-slow"></div>
      <div className="absolute top-80 w-full rounded-t-[3rem] bg-slate-50 h-[100px] -mt-10"></div>

      <div className="relative pt-24 px-6 md:px-12 max-w-7xl mx-auto z-10">

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 shadow-sm drop-shadow-md">
              Welcome back, {dashboardData.workerName}
            </h1>
            <p className="text-teal-100 text-lg font-medium">
              Here is your Trexa coverage overview.
            </p>
          </div>

          <div
            className={`mt-6 md:mt-0 px-6 py-2.5 rounded-full border-2 flex items-center gap-3 backdrop-blur-md shadow-lg ${getRiskBadgeColor(
              dashboardData.zoneRisk
            )}`}
          >
            <div className="w-3 h-3 rounded-full animate-pulse bg-green-500"></div>
            <span className="font-bold tracking-wide">
              Zone Risk: {dashboardData.zoneRisk.toUpperCase()}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-1">Insurance Status</p>
            <div className="text-3xl font-black text-slate-800">
              {dashboardData.insuranceStatus}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-1">Weekly Premium Plan</p>
            <div className="text-3xl font-black text-slate-800">
              {dashboardData.weeklyPremium}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm font-semibold mb-1">Earnings Protected This Week</p>
            <div className="text-4xl font-black">
              {dashboardData.earningsProtected}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-1">Zone Risk Level</p>
            <div className="text-3xl font-black text-slate-800">
              {dashboardData.zoneRisk}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-1">Claim History</p>
            <div className="text-3xl font-black text-slate-800">
              {dashboardData.claimHistory}
            </div>
          </motion.div>

        </motion.div>

        {/* Live Feed */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.div variants={itemVariants} className="bg-slate-900 rounded-3xl p-6 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block"></span>
              Live System Feed
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto" ref={feedRef}>
              {feed.map((item, i) => (
                <p key={i} className="text-sm text-slate-300 font-medium">{item}</p>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-6"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/risk")}
            className="flex-1 py-5 bg-white border-2 border-teal-100 text-teal-800 font-bold text-lg rounded-2xl shadow-lg"
          >
            View AI Risk Analysis
          </motion.button>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleMonitorClick}
            className="flex-1 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-lg rounded-2xl shadow-xl"
          >
            Choose Your Plan
          </motion.button>
        </motion.div>

      </div>
    </div>
  );
}

export default Dashboard;