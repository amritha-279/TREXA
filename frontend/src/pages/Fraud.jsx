import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Fraud() {
  const navigate = useNavigate();

  const [fraudChecks, setFraudChecks] = useState([
    { id: "duplicate", label: "Duplicate Claim Check", status: "pending", icon: "📄" },
    { id: "frequency", label: "Claim Frequency Analysis", status: "pending", icon: "📊" },
    { id: "location", label: "Worker Location Validation", status: "pending", icon: "🗺️" },
  ]);

  const [simulationComplete, setSimulationComplete] = useState(false);
  const [isLegitimate, setIsLegitimate] = useState(true);

  useEffect(() => {

    async function runFraudCheck() {

      try {

        const worker = JSON.parse(localStorage.getItem("worker"));

        const res = await fetch("http://localhost:4000/api/fraud/check",{
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            workerId:worker?._id
          })
        });

        const data = await res.json();

        let currentStep = 0;

        const interval = setInterval(()=>{

          setFraudChecks(prev=>{

            const updated = [...prev];

            if(currentStep < updated.length){
              updated[currentStep].status = "passed";
              currentStep++;
            }

            if(currentStep === updated.length){
              clearInterval(interval);
              setTimeout(()=>{

                setIsLegitimate(!data.fraud);
                setSimulationComplete(true);

              },800);
            }

            return updated;

          });

        },1500);

      } catch(err){
        console.error(err);
      }

    }

    runFraudCheck();

  },[]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.25 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const CheckItem = ({ item }) => {
     const isPassed = item.status === "passed";
     const isRejected = item.status === "failed";
     
     return (
        <motion.div 
           variants={itemVariants}
           className={`relative p-5 rounded-2xl flex items-center justify-between transition-all duration-500 border overflow-hidden ${
             isPassed 
             ? 'bg-emerald-50/90 border-emerald-200' 
             : isRejected
                ? 'bg-red-50/90 border-red-200'
                : 'bg-white/60 border-slate-200 shadow-sm'
           }`}
        >
           {item.status === 'pending' && (
              <div className="absolute inset-0 bg-blue-500/5 -translate-x-full animate-[shimmer_2s_infinite]"></div>
           )}

           <div className="flex items-center gap-4 relative z-10">
              <div className="text-2xl drop-shadow-sm">{item.icon}</div>
              <div>
                 <p className={`font-bold text-lg transition-colors duration-300 ${isPassed ? 'text-emerald-800' : isRejected ? 'text-red-800' : 'text-slate-700'}`}>
                    {item.label}
                 </p>
                 <AnimatePresence mode="wait">
                    {item.status === 'pending' && (
                       <motion.p key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-blue-500 font-medium flex items-center gap-1">
                          Analyzing records<span className="animate-pulse">...</span>
                       </motion.p>
                    )}
                    {isPassed && (
                       <motion.p key="passed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-600 font-medium">Clear</motion.p>
                    )}
                 </AnimatePresence>
              </div>
           </div>

           <div className="relative z-10">
              {item.status === "pending" && (
                 <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"></div>
                 </div>
              )}
              {isPassed && (
                 <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    ✓
                 </div>
              )}
           </div>
        </motion.div>
     );
  };

  return (
    <div className="min-h-screen bg-slate-900 relative pb-24 pt-20 px-4 md:px-8 text-slate-100 overflow-hidden font-sans">

      <div className="max-w-3xl mx-auto relative z-10">

        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-slate-800 rounded-2xl border border-slate-700 mb-6 drop-shadow-lg shadow-slate-900">
             {simulationComplete ? (
                 isLegitimate ? <span className="text-4xl">✅</span> : <span className="text-4xl text-red-500">❌</span>
             ) : (
                 <span className="text-4xl animate-spin delay-150 inline-block">🛡️</span>
             )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Fraud Detection AI
          </h1>

        </motion.div>

        <motion.div 
           variants={containerVariants}
           initial="hidden"
           animate="visible"
           className="space-y-4"
        >
          {fraudChecks.map((item) => (
             <CheckItem key={item.id} item={item} />
          ))}
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={simulationComplete && isLegitimate ? { opacity: 1, y: 0 } : {}}
           transition={{ delay: 0.2 }}
           className="mt-12 text-center"
        >
           {simulationComplete && isLegitimate && (
               <button
                 onClick={() => navigate("/final-payout")}
                 className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xl rounded-2xl shadow-xl"
               >
                 Approve Payout
               </button>
           )}
        </motion.div>

      </div>
    </div>
  );
}

export default Fraud;