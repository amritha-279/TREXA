import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Landing() {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger effect for child elements
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const featureCards = [
    {
      title: "Subscribe to Weekly Plan",
      description: "Choose an affordable weekly micro-insurance plan tailored for your location and delivery route.",
      icon: "📅"
    },
    {
      title: "AI Monitors Disruptions",
      description: "Our advanced AI continuously tracks severe weather and disruption events in real-time.",
      icon: "🤖"
    },
    {
      title: "Automatic Payout",
      description: "If weather halts your work, get instant, automatic payouts directly to your account. No claims needed.",
      icon: "💸"
    }
  ];

  const benefits = [
    { text: "Financial safety for gig workers", icon: "🛡️" },
    { text: "Automatic claim system", icon: "⚡" },
    { text: "Fraud protected insurance", icon: "🔒" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-teal-50 to-emerald-100 font-sans text-gray-800 overflow-x-hidden selection:bg-teal-300 selection:text-teal-900">
      
      {/* Navbar space is typically handled by App.jsx, assuming Navbar is sticky or fixed. We'll add some top padding just in case */}
      <div className="pt-24 pb-16 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto flex flex-col items-center">
        
        {/* HERO SECTION */}
        <motion.div 
          className="text-center w-full max-w-4xl flex flex-col items-center mt-10 md:mt-20"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="inline-block px-4 py-1.5 rounded-full bg-teal-100 text-teal-800 font-medium text-sm mb-6 border border-teal-200">
            For Delivery & Rideshare Workers
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8"
          >
            Trexa <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
              AI Powered Income Protection
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-2xl text-slate-600 mb-12 max-w-2xl leading-relaxed"
          >
            Don't let unexpected weather ruin your earnings. Secure your daily income against storms, floods, and extreme heat.
          </motion.p>

          <motion.div 
             variants={itemVariants}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => navigate("/register")}
              className="px-10 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-lg md:text-xl rounded-full shadow-[0_10px_40px_-10px_rgba(20,184,166,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(20,184,166,0.6)] hover:from-teal-500 hover:to-emerald-500 transition-all duration-300 flex items-center gap-3"
            >
              Get Protected Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </motion.div>
        </motion.div>

        {/* ILLUSTRATION/GRAPHIC PLACEHOLDER (CSS Art) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="w-full max-w-5xl mt-24 mb-32 relative"
        >
          {/* Abstract background blobs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-teal-300/30 blur-3xl rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-1/2 h-1/2 bg-sky-300/30 blur-3xl rounded-full"></div>
          
          <div className="relative bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="flex-1 space-y-6">
                 <h3 className="text-3xl font-bold text-slate-800">Weather stops your work.</h3>
                 <h3 className="text-3xl font-bold text-teal-600">Trexa pays your day.</h3>
                 <p className="text-slate-600 text-lg">When the city shuts down due to extreme weather, your bills don't. Our smart contracts instantly verify local weather data and trigger payouts without you ever filing a claim.</p>
               </div>
               <div className="flex-1 flex justify-center relative">
                  {/* Decorative UI element representing the app */}
                  <div className="w-64 h-80 bg-slate-800 rounded-2xl shadow-xl flex flex-col border-[6px] border-slate-700 overflow-hidden relative z-10">
                     <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                        <div className="text-white font-semibold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Live Radar</div>
                     </div>
                     <div className="flex-1 bg-slate-800 relative p-4 flex flex-col justify-end">
                       {/* Mock Weather */}
                       <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent animate-pulse"></div>
                       
                       {/* Mock Notification */}
                       <motion.div 
                         initial={{ y: 50, opacity: 0 }}
                         animate={{ y: 0, opacity: 1 }}
                         transition={{ delay: 1.5, type: 'spring' }}
                         className="bg-teal-500/90 backdrop-blur border border-teal-400 p-3 rounded-xl shadow-lg relative z-20"
                       >
                          <p className="text-white text-sm font-bold">Alert: Heavy Rain</p>
                          <p className="text-teal-50 text-xs mt-1">Work paused. Payout initiated: $45.00</p>
                       </motion.div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>


        {/* HOW IT WORKS SECTION */}
        <motion.div 
          className="w-full max-w-6xl mb-32"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How Trexa Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Three simple steps to weather-proof your income.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 -z-10"></div>
            
            {featureCards.map((card, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="bg-white/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-teal-50/50 hover:-translate-y-2 transition-transform duration-300 group"
              >
                <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 group-hover:bg-teal-500 transition-all duration-300">
                  <span className="group-hover:grayscale group-hover:brightness-200 transition-all duration-300">{card.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* BENEFITS SECTION */}
        <motion.div 
          className="w-full max-w-4xl text-center mb-20 bg-teal-900 rounded-3xl p-10 md:p-16 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">The Trexa Advantage</h2>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 mb-12">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex flex-col items-center max-w-xs">
                  <div className="w-14 h-14 bg-teal-800 rounded-full flex items-center justify-center text-2xl border border-teal-600 mb-4 shadow-lg">
                    {benefit.icon}
                  </div>
                  <p className="text-lg font-medium text-teal-50 tracking-wide">{benefit.text}</p>
                </div>
              ))}
            </div>

            <motion.button
               onClick={() => navigate("/register")}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               className="px-10 py-4 bg-white text-teal-900 font-bold text-lg rounded-full shadow-xl hover:bg-teal-50 transition-colors duration-300"
            >
              Start Your Coverage First Week Free
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default Landing;