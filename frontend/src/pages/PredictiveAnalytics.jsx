import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function PredictiveAnalytics() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("http://localhost:4000/api/predictive");
        const d   = await res.json();
        setData(d);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetch_();
    const id = setInterval(fetch_, 30000);
    return () => clearInterval(id);
  }, []);

  const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const iv = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const businessCards = [
    { label: "Total Active Policies",    value: data?.totalActivePolicies,                    icon: "📋", color: "text-teal-700" },
    { label: "Total Premium Collected",  value: `₹${data?.totalPremiumCollected?.toLocaleString("en-IN")}`, icon: "💰", color: "text-emerald-700" },
    { label: "Total Claims Paid",        value: `₹${data?.totalClaimsPaid?.toLocaleString("en-IN")}`,       icon: "💸", color: "text-blue-700" },
    { label: "Loss Ratio",               value: `${data?.lossRatio}%`,                        icon: "📉", color: data?.lossRatio > 80 ? "text-red-600" : "text-green-600" },
  ];

  const fraudCards = [
    { label: "Fraud Alerts (Review)",    value: data?.fraudAlertCount, icon: "⚠️", color: "text-orange-600" },
    { label: "Rejected Claims",          value: data?.rejectedCount,   icon: "❌", color: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      <div className="absolute top-0 w-full h-80 bg-gradient-to-br from-indigo-600 to-purple-700"></div>
      <div className="absolute top-80 w-full rounded-t-[3rem] bg-slate-50 h-[100px] -mt-10"></div>

      <div className="relative pt-24 px-6 md:px-12 max-w-7xl mx-auto z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-md">Predictive Analytics</h1>
          <p className="text-indigo-100 text-lg font-medium">AI-powered forecasting for insurer risk management</p>
        </motion.div>

        {/* Forecast Highlight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-2xl mb-10 text-white"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-6">Next Week Forecast</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">🌧️</p>
              <p className="text-3xl font-black">{data?.predictedRainRiskPercent}%</p>
              <p className="text-indigo-200 text-sm mt-1">Predicted Rain Risk</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-3xl font-black">{data?.expectedClaimsNextWeek}</p>
              <p className="text-indigo-200 text-sm mt-1">Expected Claims</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-4xl mb-2">💸</p>
              <p className="text-3xl font-black">₹{data?.forecastedPayout?.toLocaleString("en-IN")}</p>
              <p className="text-indigo-200 text-sm mt-1">Forecasted Payout Liability</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-white/10 rounded-2xl text-sm text-indigo-100 text-center font-medium">
            "Expected Claims Next Week: {data?.expectedClaimsNextWeek}" &nbsp;·&nbsp;
            "Forecasted Payout: ₹{data?.forecastedPayout?.toLocaleString("en-IN")}"
          </div>
        </motion.div>

        {/* Business Metrics */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Business Metrics</p>
        <motion.div variants={cv} initial="hidden" animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          {businessCards.map((c, i) => (
            <motion.div key={i} variants={iv} className="bg-white rounded-3xl p-6 shadow-xl">
              <p className="text-2xl mb-2">{c.icon}</p>
              <p className="text-sm text-slate-500 font-semibold mb-1">{c.label}</p>
              <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Fraud + Risk side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Fraud Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Fraud Metrics</p>
            <div className="space-y-4">
              {fraudCards.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.icon}</span>
                    <p className="font-semibold text-slate-700 text-sm">{c.label}</p>
                  </div>
                  <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Risk Metrics */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Metrics</p>
            <div className="mb-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
              <p className="text-xs text-indigo-500 font-bold uppercase mb-1">Most Triggered Disruption</p>
              <p className="text-xl font-black text-indigo-800 capitalize">{data?.mostTriggeredDisruption?.replace(/_/g, " ")}</p>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">High Risk Zones</p>
            <div className="space-y-2">
              {data?.highRiskZones?.map((z, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-red-500" : i === 1 ? "bg-orange-500" : "bg-yellow-500"}`}></span>
                    <p className="font-semibold text-slate-700 text-sm">{z.city}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-500">{z.count} claims</p>
                </div>
              ))}
              {!data?.highRiskZones?.length && <p className="text-sm text-slate-400 text-center py-4">No data yet</p>}
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}

export default PredictiveAnalytics;
