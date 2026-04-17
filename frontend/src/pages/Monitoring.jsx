import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGPS } from "../hooks/useGPS";

const STEPS = [
  { id: "weather", label: "Fetching Live Weather Data",     icon: "🌦️" },
  { id: "risk",    label: "Running ML Disruption Analysis", icon: "🤖" },
  { id: "fraud",   label: "Running Fraud Detection",        icon: "🛡️" },
  { id: "claim",   label: "Auto-Generating Claim",          icon: "📋" },
];

const RAIN_THRESHOLD = 60;

function Monitoring() {
  const navigate  = useNavigate();
  const claimedRef = useRef(false); // prevent duplicate claims across polls

  const [weatherData, setWeatherData] = useState({ zone: "Chennai", temperature: 0, rainfall: 0, aqi: 3 });
  const [activity,    setActivity]    = useState({ deliveries: 0, activeOrders: 0, traffic: 0 });
  const [steps,       setSteps]       = useState(STEPS.map(s => ({ ...s, status: "pending" })));
  const [statusMsg,   setStatusMsg]   = useState("");
  const [done,        setDone]        = useState(false);
  const [rejected,    setRejected]    = useState(false);
  const [riskScore,   setRiskScore]   = useState(null);
  const [alertActive, setAlertActive] = useState(false);
  const pipelineStarted = useRef(false);
  const { getLocation } = useGPS();

  const markStep = (id, status) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));

  const resetSteps = () => {
    setSteps(STEPS.map(s => ({ ...s, status: "pending" })));
    setStatusMsg("");
    setRejected(false);
  };

  useEffect(() => {
    const worker = JSON.parse(localStorage.getItem("worker"));
    if (!worker?.name) return;
    const city = worker.location || "Chennai";

    // ── Weather polling every 10 seconds ──────────────────────────────
    async function fetchWeather() {
      try {
        const res  = await fetch(`http://localhost:4000/api/weather/weather?city=${city}`);
        const data = await res.json();
        setWeatherData({ zone: city, temperature: data.temperature, rainfall: data.rain, aqi: 3 });
        if (data.rain > RAIN_THRESHOLD) setAlertActive(true);
      } catch (err) {
        console.error("Weather poll failed", err);
      }
    }

    async function startPipeline() {
      if (pipelineStarted.current) return;
      pipelineStarted.current = true;
      let rain = 0;
      try {
        const res  = await fetch(`http://localhost:4000/api/weather/weather?city=${city}`);
        const data = await res.json();
        rain = data.rain;
        setWeatherData({ zone: city, temperature: data.temperature, rainfall: data.rain, aqi: 3 });
        if (data.rain > RAIN_THRESHOLD) setAlertActive(true);
      } catch (err) {
        console.error("Weather fetch failed", err);
      }
      const sim = {
        deliveries:   Math.floor(Math.random() * 12),
        activeOrders: Math.floor(Math.random() * 8),
        traffic:      parseFloat(Math.random().toFixed(2)),
      };
      setActivity(sim);
      runPipeline(worker, city, rain, sim);
    }

    startPipeline();
    const interval = setInterval(fetchWeather, 10000);
    return () => clearInterval(interval);
  }, []);

  async function runPipeline(worker, city, rain, sim) {
    claimedRef.current = true;
    resetSteps();

    try {
      // STEP 1 — Weather
      markStep("weather", "running");
      await delay(2000);
      markStep("weather", "done");
      await delay(800);

      // STEP 2 — ML Risk
      markStep("risk", "running");
      await delay(1500); // visible "thinking" pause
      const riskRes  = await fetch("http://localhost:4000/api/risk/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, traffic: sim.traffic, deliveries: sim.deliveries }),
      });
      const riskData = await riskRes.json();
      setRiskScore(riskData.riskScore);
      await delay(1000);
      markStep("risk", "done");
      await delay(800);

      if (!riskData.triggerClaim) {
        setStatusMsg(`Risk score ${riskData.riskScore?.toFixed(2)} — below trigger threshold. No claim needed.`);
        setRejected(true);
        claimedRef.current = false;
        return;
      }

      // STEP 3 — Fraud (GPS + scoring)
      markStep("fraud", "running");
      await delay(1500);

      // Capture real device GPS coords
      let gpsCoords = null;
      let gpsCheck  = null;
      try {
        gpsCoords = await getLocation();
      } catch (_) {
        // GPS denied — skip GPS check, continue with other fraud checks
      }

      if (gpsCoords) {
        const gpsRes = await fetch("http://localhost:5001/fraud_check/gps", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id:          worker.workerId,
            claim_id:         "",
            current_location: gpsCoords,
            timestamp:        new Date().toISOString(),
          }),
        });
        gpsCheck = await gpsRes.json();

        if (gpsCheck.gps_flag) {
          markStep("fraud", "failed");
          await delay(600);
          setStatusMsg(`GPS spoofing detected — speed ${gpsCheck.calculated_speed} km/h exceeds 60 km/h limit for delivery workers. Over ${gpsCheck.distance} km in ${gpsCheck.time_minutes} min. Payout blocked.`);
          setRejected(true);
          claimedRef.current = false;
          return;
        }
      }

      const fraudRes  = await fetch("http://localhost:4000/api/fraud/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerName: worker.name, city, workerId: worker.workerId, rain }),
      });
      const fraudData = await fraudRes.json();
      await delay(1000);

      if (fraudData.fraud && fraudData.decision === "rejected") {
        markStep("fraud", "failed");
        await delay(600);
        setStatusMsg(`Fraud detected (score: ${fraudData.fraud_score}): ${fraudData.reason}. Payout blocked.`);
        setRejected(true);
        claimedRef.current = false;
        return;
      }
      markStep("fraud", "done");
      await delay(800);

      // STEP 4 — Auto Claim
      markStep("claim", "running");
      await delay(1500);
      const claimRes  = await fetch("http://localhost:4000/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerName:     worker.name,
          workerId:       worker.workerId,
          city,
          disruptionType: "weather_disruption",
          rain,
          aqi:        3,
          traffic:    sim.traffic,
          deliveries: sim.deliveries,
        }),
      });
      const claimData = await claimRes.json();
      await delay(1000);

      if (!claimData.claim) {
        markStep("claim", "failed");
        await delay(600);
        setStatusMsg(claimData.message || "Claim rejected.");
        setRejected(true);
        claimedRef.current = false;
        return;
      }

      // Simulate instant payout
      const payoutRes = await fetch("http://localhost:4000/api/payout/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_id:     claimData.claim._id,
          user_id:      worker.workerId,
          payout_amount: claimData.payoutAmount,
        }),
      });
      const payoutData = await payoutRes.json();

      markStep("claim", "done");
      localStorage.setItem("claim", JSON.stringify({
        disruptionType:  claimData.claim.disruptionType,
        incomeLoss:      claimData.claim.estimatedIncomeLoss,
        insurancePayout: claimData.payoutAmount,
        riskScore:       claimData.claim.riskScore,
        payoutTier:      claimData.claim.payoutTier,
        transaction_id:  payoutData.transaction_id,
        fraud_score:     fraudData.fraud_score,
        fraud_decision:  fraudData.decision,
        gps_speed:       gpsCheck?.calculated_speed ?? null,
        gps_distance:    gpsCheck?.distance ?? null,
      }));

      setDone(true);
      await delay(2500);
      navigate("/final-payout");

    } catch (err) {
      console.error("Pipeline failed", err);
      setStatusMsg("System error. Please try again.");
      setRejected(true);
      claimedRef.current = false;
    }
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  const isHeavyRain = weatherData.rainfall > RAIN_THRESHOLD;

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-24 pt-20 px-4 md:px-8 overflow-hidden">

      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className={`absolute top-[-20%] left-[-10%] w-full h-[80%] rounded-full mix-blend-multiply filter blur-[150px] opacity-20 ${isHeavyRain ? "bg-orange-500 animate-pulse" : "bg-sky-400"}`}></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 text-slate-800 font-bold text-sm mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              Live Feed Tracker
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">Real-Time Monitoring</h1>
            <p className="text-lg text-slate-600 mt-2">
              Continuous environmental tracking for <span className="font-bold text-slate-800">{weatherData.zone}</span>.
            </p>
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl">📡</div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">System Status</p>
              <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Sensors Active
              </p>
            </div>
          </div>
        </motion.div>

        {/* ⚠ Disruption Alert Banner */}
        <AnimatePresence>
          {alertActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-5 rounded-2xl bg-orange-500 text-white font-bold flex items-center gap-4 shadow-xl"
            >
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="text-lg">Heavy rain detected in {weatherData.zone}</p>
                <p className="text-sm font-medium opacity-90">Delivery disruption risk HIGH — Automatic payout protection active</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weather Metrics */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center text-3xl mb-4">☀️</div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Temperature</p>
            <div className="flex items-start text-5xl font-black text-slate-800">
              {weatherData.temperature}<span className="text-2xl mt-1">°C</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className={`bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border flex flex-col items-center justify-center text-center ${isHeavyRain ? "shadow-blue-200/50 border-blue-100" : "shadow-slate-200/50 border-slate-100"}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${isHeavyRain ? "bg-blue-100 text-blue-500" : "bg-sky-100 text-sky-500"}`}>
              {isHeavyRain ? "⛈️" : "🌧️"}
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Rainfall Level</p>
            <div className="flex items-start text-5xl font-black text-slate-800">
              {weatherData.rainfall}<span className="text-2xl mt-1 pl-1">mm</span>
            </div>
            {isHeavyRain && <span className="mt-3 px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">Exceeds Threshold</span>}
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center text-3xl mb-4">💨</div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Air Quality (AQI)</p>
            <div className="flex items-start text-5xl font-black text-slate-800">{weatherData.aqi}</div>
            <span className="mt-3 text-sm font-medium text-orange-500">Moderate Warning</span>
          </motion.div>
        </motion.div>

        {/* Live Worker Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: "Deliveries/hr",   value: activity.deliveries,               icon: "🛵" },
            { label: "Active Orders",   value: activity.activeOrders,             icon: "📦" },
            { label: "Traffic Level",   value: activity.traffic?.toFixed(2),      icon: "🚦" },
          ].map(item => (
            <div key={item.label} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-md border border-slate-100 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-2xl font-black text-slate-800">{item.value}</div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* AI Pipeline Steps */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Pipeline — Auto Processing</p>
            {riskScore !== null && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${riskScore > 0.7 ? "bg-red-100 text-red-600" : riskScore > 0.5 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                Risk Score: {riskScore.toFixed(2)}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${
                step.status === "done"    ? "bg-green-50 border-green-200" :
                step.status === "running" ? "bg-blue-50 border-blue-200" :
                step.status === "failed"  ? "bg-red-50 border-red-200" :
                "bg-slate-50 border-slate-100"
              }`}>
                <div className="text-2xl">{step.icon}</div>
                <p className={`flex-1 font-bold ${
                  step.status === "done"    ? "text-green-800" :
                  step.status === "running" ? "text-blue-800" :
                  step.status === "failed"  ? "text-red-800" :
                  "text-slate-400"
                }`}>{step.label}</p>
                <div>
                  {step.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>}
                  {step.status === "running" && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                  {step.status === "done"    && <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>}
                  {step.status === "failed"  && <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✕</div>}
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {rejected && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-bold text-center"
              >
                {statusMsg}
              </motion.div>
            )}
            {done && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 font-bold text-center"
              >
                ✅ Income loss detected. Claim automatically generated. Redirecting to payout...
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}

export default Monitoring;
