import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const BASE = "http://localhost:4000/api/admin";

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const cardVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function riskColor(score) {
  if (score > 0.7) return "#ef4444";
  if (score > 0.5) return "#f97316";
  return "#22c55e";
}

function tierBadge(tier) {
  const map = {
    high:   "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    none:   "bg-slate-100 text-slate-500",
  };
  return map[tier] || "bg-slate-100 text-slate-500";
}

function AdminDashboard() {
  const [stats,        setStats]        = useState({ workers: 0, disruptions: 0, claims: 0, fraudAlerts: 0 });
  const [disruptions,  setDisruptions]  = useState([]);
  const [claims,       setClaims]       = useState([]);
  const [fraudAlerts,  setFraudAlerts]  = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [predictive,   setPredictive]   = useState(null);

  async function fetchAll() {
    try {
      const [dashRes, disRes, clRes, frRes, logRes, predRes] = await Promise.all([
        fetch(`${BASE}/dashboard`),
        fetch(`${BASE}/disruptions`),
        fetch(`${BASE}/claims`),
        fetch(`${BASE}/fraud-alerts`),
        fetch(`${BASE}/logs`),
        fetch("http://localhost:4000/api/predictive"),
      ]);
      const [dash, dis, cl, fr, log, pred] = await Promise.all([
        dashRes.json(), disRes.json(), clRes.json(), frRes.json(), logRes.json(), predRes.json(),
      ]);
      setStats({ workers: dash.totalWorkers, disruptions: dash.highRiskWorkers, claims: dash.totalClaims, fraudAlerts: fr.length });
      setDisruptions(dis);
      setClaims(cl);
      setFraudAlerts(fr);
      setLogs(log);
      setPredictive(pred);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 relative pb-20">
      <div className="absolute top-0 w-full h-80 bg-gradient-to-br from-teal-600 to-emerald-700"></div>
      <div className="absolute top-80 w-full rounded-t-[3rem] bg-slate-50 h-[100px] -mt-10"></div>

      <div className="relative pt-24 px-6 md:px-12 max-w-7xl mx-auto z-10">

        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Trexa Admin Dashboard</h1>
            <p className="text-teal-100 text-lg">Platform analytics and insurance insights</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-bold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block"></span>
            Live · updates every 10s
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
        >
          <motion.div variants={cardVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-2">Insured Workers</p>
            <h2 className="text-4xl font-black text-slate-800">{stats.workers}</h2>
          </motion.div>
          <motion.div variants={cardVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-2">Disruptions Detected Today</p>
            <h2 className="text-4xl font-black text-orange-500">{stats.disruptions}</h2>
          </motion.div>
          <motion.div variants={cardVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-2">Claims Processed</p>
            <h2 className="text-4xl font-black text-teal-600">{stats.claims}</h2>
          </motion.div>
          <motion.div variants={cardVariants} className="bg-white rounded-3xl p-6 shadow-xl">
            <p className="text-sm text-slate-500 font-semibold mb-2">Fraud Alerts</p>
            <h2 className="text-4xl font-black text-red-500">{stats.fraudAlerts}</h2>
          </motion.div>
        </motion.div>

        {/* ── Map + Weather side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Live Disruption Map */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-xl"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Live Disruption Map — Tamil Nadu
            </p>
            <div className="rounded-2xl overflow-hidden h-72">
              <MapContainer center={[11.1271, 78.6569]} zoom={7} style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {disruptions.map(d => (
                  <CircleMarker key={d.city}
                    center={[d.lat, d.lng]}
                    radius={14}
                    pathOptions={{ color: riskColor(d.riskScore), fillColor: riskColor(d.riskScore), fillOpacity: 0.55 }}
                  >
                    <Tooltip permanent direction="top" offset={[0, -10]}>
                      <span className="text-xs font-bold">{d.city}</span><br />
                      <span className="text-xs">Risk: {d.riskScore?.toFixed(2)}</span>
                    </Tooltip>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
            <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>High</span>
            </div>
          </motion.div>

          {/* Real-Time Weather + AI Risk */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-xl flex flex-col gap-4"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Real-Time Weather &amp; AI Risk Prediction
            </p>
            <div className="flex-1 overflow-y-auto space-y-3 max-h-80">
              {disruptions.map(d => (
                <div key={d.city} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{d.city}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      🌡 {d.temperature}°C &nbsp;·&nbsp; 🌧 {d.rainfall}mm &nbsp;·&nbsp; 💨 AQI {d.aqi}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{ background: riskColor(d.riskScore) + "22", color: riskColor(d.riskScore) }}
                    >
                      Risk {d.riskScore?.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              {disruptions.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">Fetching weather data…</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Claims Monitoring Table ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl p-6 shadow-xl mb-10"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Claims Monitoring</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-3 pr-4">Worker ID</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Platform</th>
                  <th className="pb-3 pr-4">City</th>
                  <th className="pb-3 pr-4">Disruption</th>
                  <th className="pb-3 pr-4">Payout</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {claims.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">{c.workerId}</td>
                    <td className="py-3 pr-4 font-semibold text-slate-800">{c.workerName}</td>
                    <td className="py-3 pr-4 text-slate-600">{c.platform}</td>
                    <td className="py-3 pr-4 text-slate-600">{c.city}</td>
                    <td className="py-3 pr-4 text-slate-600 capitalize">{c.disruptionType?.replace(/_/g, " ")}</td>
                    <td className="py-3 pr-4 font-bold text-teal-700">₹{c.payoutAmount?.toFixed(0)}</td>
                    <td className="py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${tierBadge(c.payoutTier)}`}>
                        {c.payoutTier}
                      </span>
                    </td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No claims yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Phase 3: Business + Predictive Summary ── */}
        {predictive && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl mb-10 text-white"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-5">Predictive Analytics — Next Week Forecast</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black">{predictive.predictedRainRiskPercent}%</p>
                <p className="text-indigo-200 text-xs mt-1">Rain Risk</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black">{predictive.expectedClaimsNextWeek}</p>
                <p className="text-indigo-200 text-xs mt-1">Expected Claims</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-black">₹{predictive.forecastedPayout?.toLocaleString("en-IN")}</p>
                <p className="text-indigo-200 text-xs mt-1">Forecasted Payout</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black ${predictive.lossRatio > 80 ? "text-red-300" : "text-green-300"}`}>{predictive.lossRatio}%</p>
                <p className="text-indigo-200 text-xs mt-1">Loss Ratio</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Fraud Alerts + System Log side by side ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Fraud Alert Panel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-xl"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Fraud Alert Panel</p>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {fraudAlerts.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-red-50 border border-red-100">
                  <span className="text-xl mt-0.5">🚨</span>
                  <div>
                    <p className="font-bold text-red-800 text-sm">{f.workerName}
                      <span className="ml-2 text-xs font-normal text-red-500">({f.workerId})</span>
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">{f.reason} · {f.city}</p>
                    <p className="text-xs text-red-400 mt-0.5">{f.claimCount} claims on record</p>
                  </div>
                </div>
              ))}
              {fraudAlerts.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100">
                  <span className="text-xl">✅</span>
                  <p className="text-sm font-semibold text-green-700">No fraud alerts detected</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* System Trigger Log */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-slate-900 rounded-3xl p-6 shadow-xl"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping inline-block"></span>
              System Trigger Log
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {logs.map((l, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xs text-slate-500 font-mono whitespace-nowrap mt-0.5">
                    {new Date(l.time).toLocaleTimeString()}
                  </span>
                  <p className="text-sm text-slate-300 font-medium">{l.event}</p>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">No events yet</p>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
