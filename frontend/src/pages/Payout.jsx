import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function Payout() {
  const navigate = useNavigate();

  // Mock Claim Data
  const [claimData, setClaimData] = useState(null);

useEffect(() => {
  const claim = JSON.parse(localStorage.getItem("claim"));
  setClaimData(claim);
}, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  if (!claimData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 relative pb-24 pt-20 px-4 md:px-8 flex flex-col items-center justify-center">
      
      {/* Background blobs */}
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-[150px] opacity-50"></div>
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-[150px] opacity-40"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl relative z-10"
      >
        
        {/* System Message Alert */}
        <motion.div variants={itemVariants} className="mb-8 relative">
           <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-30 animate-pulse"></div>
           <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-xl flex items-center justify-center text-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shrink-0">
                  <span className="text-2xl text-white">⚡</span>
              </div>
              <p className="text-white font-bold text-lg leading-snug">
                 "Income loss detected. Claim automatically generated."
              </p>
           </div>
        </motion.div>

        {/* Claim Summary Card */}
        <motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden relative">
           
           {/* Card Header */}
           <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Claim ID // #GS-8914-X</p>
                 <h2 className="text-xl font-black text-slate-800">Claim Summary</h2>
              </div>
              <div className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                 Auto-Generated
              </div>
           </div>

           {/* Card Body (Details) */}
           <div className="p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-6 border-b border-slate-100/60">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                       🌧️
                    </div>
                    <span className="font-semibold text-slate-500">Disruption Type</span>
                 </div>
                 <span className="text-xl font-bold text-slate-800">{claimData.disruptionType}</span>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-6 border-b border-slate-100/60">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                       🔻
                    </div>
                    <span className="font-semibold text-slate-500">Estimated Income Loss</span>
                 </div>
                 <span className="text-xl font-bold text-slate-800">{claimData.incomeLoss}</span>
              </div>

              {/* Highlighted Payout */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-2">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 shadow-inner">
                       💸
                    </div>
                    <div>
                       <span className="block font-bold text-teal-700 text-lg">Insurance Payout</span>
                       <span className="text-xs font-medium text-teal-600 opacity-80">Approved for transfer</span>
                    </div>
                 </div>
                 <span className="text-5xl font-black text-slate-900 drop-shadow-sm">{claimData.insurancePayout}</span>
              </div>

           </div>
        </motion.div>

        {/* Global Action Button */}
        <motion.div variants={itemVariants} className="mt-10 text-center">
           <button
             onClick={() => navigate("/fraud")}
             className="w-full py-5 bg-slate-900 border-2 border-slate-800 text-white font-bold text-xl rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95 group"
           >
             <div className="bg-white/20 rounded-full p-1 group-hover:bg-teal-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
             </div>
             Run Fraud Check
           </button>
           <p className="text-slate-500 text-sm mt-4 font-medium flex items-center justify-center gap-1">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
             </svg>
             Mandatory security step before funds are released
           </p>
        </motion.div>

      </motion.div>
    </div>
  );
}

export default Payout;