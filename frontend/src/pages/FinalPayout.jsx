import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function FinalPayout() {
  const navigate = useNavigate();
  const claim = JSON.parse(localStorage.getItem("claim")) || {};

  return (
    <div className="min-h-screen bg-emerald-50 relative flex flex-col items-center justify-center p-4 overflow-hidden">
      
      {/* Success Confetti/Glow aesthetic background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse-slow"></div>
      <div className="absolute top-[20%] right-[10%] w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30"></div>
      <div className="absolute bottom-[20%] left-[10%] w-64 h-64 bg-green-300 rounded-full mix-blend-multiply filter blur-[80px] opacity-30"></div>

      <motion.div 
         initial={{ opacity: 0, scale: 0.9, y: 30 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         transition={{ type: "spring", stiffness: 200, damping: 20 }}
         className="w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-[2.5rem] p-10 md:p-14 shadow-2xl shadow-emerald-200/50 border border-white text-center relative z-10"
      >
          {/* Animated Confirmation Icon */}
          <div className="relative w-32 h-32 mx-auto mb-8">
             <motion.div 
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
               className="absolute inset-0 bg-emerald-100 rounded-full"
             ></motion.div>
             <motion.div 
               initial={{ scale: 0, rotate: -180 }}
               animate={{ scale: 1, rotate: 0 }}
               transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.4 }}
               className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-300"
             >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
             </motion.div>
             
             {/* Floating Confetti Particles Simulator */}
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -30, opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="absolute -top-4 -right-2 text-2xl">✨</motion.div>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -20, opacity: 1 }} transition={{ duration: 1, delay: 0.7 }} className="absolute bottom-4 -left-6 text-2xl">🎉</motion.div>
          </div>

          <motion.h1 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.8 }}
             className="text-4xl font-extrabold text-slate-800 mb-4"
          >
             Payout Approved
          </motion.h1>

          <motion.p 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1 }}
             className="text-xl text-emerald-700 font-medium bg-emerald-50 py-3 px-6 rounded-2xl inline-block border border-emerald-100"
          >
             <span className="font-black text-emerald-600 mr-2">₹{claim.insurancePayout ? Number(claim.insurancePayout).toFixed(2) : "--"}</span>
             credited to worker wallet
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1.4 }}
             className="w-full mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-10 text-left"
          >
             <div className="flex justify-between items-center mb-2">
                 <span className="text-slate-500 font-semibold text-sm">Transaction ID</span>
                 <span className="text-slate-800 font-bold font-mono">#TX-99824A</span>
             </div>
             <div className="flex justify-between items-center">
                 <span className="text-slate-500 font-semibold text-sm">Status</span>
                 <span className="text-emerald-600 font-bold flex items-center gap-1 text-sm bg-emerald-100 px-2 py-0.5 rounded-md">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    Completed
                 </span>
             </div>
          </motion.div>

          <motion.button 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 1.6 }}
             onClick={() => navigate("/dashboard")}
             className="w-full py-5 bg-slate-900 border-2 border-slate-800 text-white font-bold text-xl rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 flex justify-center items-center gap-2"
          >
             Return to Dashboard
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
             </svg>
          </motion.button>

      </motion.div>
    </div>
  );
}

export default FinalPayout;
