import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function RiskProfile() {
  const navigate = useNavigate();

  const [riskData, setRiskData] = useState({ rain: 0, aqi: 0, riskScore: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRisk() {
      try {
        const worker = JSON.parse(localStorage.getItem("worker"));
        const res = await fetch("http://localhost:4000/api/risk/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerId: worker._id,
            city: worker.location || "Chennai",
            lat: 13.08,
            lon: 80.27,
            traffic: 5,
            deliveries: 10,
          }),
        });
        const data = await res.json();
        setRiskData({
          rain: Math.min(data.rain / 120, 1),
          aqi: Math.min(data.aqi / 300, 1),
          riskScore: data.riskScore,
        });
      } catch (err) {
        console.error("Risk fetch failed", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRisk();
  }, []);

  const rain = riskData.rain;
  const heat = 0.4;
  const pollution = riskData.aqi;

  // Risk Score Calculation
  const scoreRaw = (rain + heat + pollution) / 3;
  const scoreFormatted = scoreRaw.toFixed(2); // "0.53"

  // Determine Risk Level text and color
  const getRiskLevel = (score) => {
    if (score <= 0.3) return { text: "Low", color: "text-green-500", bg: "bg-green-100", border: "border-green-200" };
    if (score <= 0.6) return { text: "Medium", color: "text-orange-500", bg: "bg-orange-100", border: "border-orange-200" };
    return { text: "High", color: "text-red-500", bg: "bg-red-100", border: "border-red-200" };
  };

  const riskStatus = getRiskLevel(scoreRaw);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  // Reusable Risk Indicator Component
  const RiskBar = ({ title, value, icon, gradient, delay }) => {
    const percentage = value * 100;
    
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
             <div className={`text-2xl ${gradient}`}>{icon}</div>
             <h3 className="font-bold text-slate-700">{title}</h3>
          </div>
          <motion.span 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: delay + 0.5 }}
             className="text-lg font-black text-slate-800"
          >
            {value.toFixed(2)}
          </motion.span>
        </div>
        
        {/* Progress bar container */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
           <motion.div 
             className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${gradient}`}
             initial={{ width: 0 }}
             animate={{ width: `${percentage}%` }}
             transition={{ duration: 1.5, delay: delay, ease: "easeOut" }}
           />
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
           <span>0.0 (Safe)</span>
           <span>1.0 (Danger)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 relative pb-20 overflow-hidden">
      
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40"></div>

      <div className="relative pt-24 px-6 md:px-12 max-w-5xl mx-auto z-10">
        
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 h-16 w-16 text-3xl">
             🤖
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3">AI Risk Profiling</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Our smart contracts analyze live environmental data to determine coverage requirements for your delivery zone.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-8 lg:gap-12"
        >
          {/* Left Column: Environmental Variables */}
          <div className="space-y-6">
             <motion.h2 variants={itemVariants} className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
                 Live Environmental Metrics
             </motion.h2>
             
             <motion.div variants={itemVariants}>
               <RiskBar 
                  title="Rainfall Risk" 
                  value={rain} 
                  icon="🌧️" 
                  gradient="from-blue-400 to-indigo-500" 
                  delay={0.2}
               />
             </motion.div>

             <motion.div variants={itemVariants}>
               <RiskBar 
                  title="Heat Risk" 
                  value={heat} 
                  icon="☀️" 
                  gradient="from-amber-400 to-orange-500" 
                  delay={0.4}
               />
             </motion.div>

             <motion.div variants={itemVariants}>
               <RiskBar 
                  title="Pollution Risk" 
                  value={pollution} 
                  icon="🌫️" 
                  gradient="from-gray-400 to-slate-600" 
                  delay={0.6}
               />
             </motion.div>
          </div>

          {/* Right Column: AI Score Output & CTA */}
          <motion.div 
             variants={itemVariants}
             className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-teal-900/5 border border-slate-100 flex flex-col justify-center items-center relative overflow-hidden h-full min-h-[400px]"
          >
             {/* Decorative rings for the score */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-[30px] border-slate-50 rounded-full"></div>
             <motion.div 
                 initial={{ scale: 0, rotate: -90 }}
                 animate={{ scale: 1, rotate: 0 }}
                 transition={{ duration: 1, type: "spring", delay: 0.8 }}
                 className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] border-[6px] rounded-full border-t-transparent border-l-transparent ${riskStatus.border}`}
             ></motion.div>

             <div className="relative z-10 text-center flex flex-col items-center">
                 <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-2">Zone Risk Score</p>
                 
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1 }}
                    className="text-7xl font-black text-slate-800 mb-4"
                 >
                    {scoreFormatted}
                 </motion.div>
                 
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                    className={`px-6 py-2 rounded-full font-bold text-lg flex items-center gap-2 ${riskStatus.bg} ${riskStatus.color}`}
                 >
                    <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></div>
                    Risk Level: {riskStatus.text}
                 </motion.div>
             </div>

             <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="w-full mt-12 relative z-10"
             >
                <button
                  onClick={() => navigate("/plans")}
                  className="w-full py-5 bg-slate-900 text-white font-bold text-lg rounded-2xl shadow-xl hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  View Tailored Insurance Plans
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                     <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
             </motion.div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}

export default RiskProfile;