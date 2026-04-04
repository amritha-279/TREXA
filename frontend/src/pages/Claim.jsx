import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Claim() {
  const navigate = useNavigate();

  const [checks, setChecks] = useState([
    { id: "login", label: "Platform Logged In", status: "pending", icon: "📱" },
    { id: "gps", label: "Location in Delivery Zone", status: "pending", icon: "📍" },
    { id: "activity", label: "Delivery Activity Confirmed", status: "pending", icon: "🛵" },
  ]);

  const [allVerified, setAllVerified] = useState(false);

  useEffect(() => {
    let currentStep = 0;

    const interval = setInterval(() => {
      setChecks((prevChecks) => {
        const newChecks = [...prevChecks];

        if (currentStep < newChecks.length) {
          newChecks[currentStep].status = "passed";
          currentStep++;
        }

        if (currentStep === newChecks.length) {
          clearInterval(interval);
          setTimeout(() => setAllVerified(true), 600);
        }

        return newChecks;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  const CheckItem = ({ item }) => {
    const isPassed = item.status === "passed";

    return (
      <motion.div
        variants={itemVariants}
        className={`relative p-5 rounded-2xl flex items-center gap-4 transition-all duration-500 border ${
          isPassed
            ? "bg-green-50/80 border-green-200 shadow-sm shadow-green-100/50"
            : "bg-white/50 border-slate-100 shadow-sm"
        }`}
      >
        <div
          className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg transition-colors duration-300 ${
            isPassed ? "bg-green-500 text-white" : "bg-slate-200 text-slate-400"
          }`}
        >
          {isPassed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        <div className="flex-1">
          <p
            className={`font-bold text-lg transition-colors duration-300 ${
              isPassed ? "text-green-800" : "text-slate-500"
            }`}
          >
            {item.label}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            {isPassed ? "Verified successfully" : "Analyzing historical data..."}
          </p>
        </div>

        <div
          className="text-2xl opacity-60 grayscale transition-all duration-500"
          style={isPassed ? { filter: "grayscale(0)", opacity: 1 } : {}}
        >
          {item.icon}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 relative pb-24 pt-20 px-4 md:px-8">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 w-20 h-20">
            {allVerified ? (
              <div className="text-green-500">✓</div>
            ) : (
              <div className="text-indigo-500 animate-pulse">🧠</div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">
            Activity Verification
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            GigShield is confirming your platform activity and GPS logs during the disruption period.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
            {checks.map((item) => (
              <CheckItem key={item.id} item={item} />
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={allVerified ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mt-12 text-center"
        >
          {allVerified && (
            <button
              onClick={async () => {
                try {
                  const worker = JSON.parse(localStorage.getItem("worker"));

                  const weatherRes = await fetch(
                    `http://localhost:4000/api/weather/weather?city=${worker.location || "Chennai"}`
                  );
                  const weatherData = await weatherRes.json();

                  const res = await fetch("http://localhost:4000/api/claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      workerId: worker._id,
                      disruptionType: "weather_disruption",
                      rain: weatherData.rain,
                      aqi: 3,
                      traffic: 5,
                      deliveries: 10,
                    }),
                  });

                  const data = await res.json();

                  if (!data.claim) {
                    alert(data.message || "Claim rejected");
                    return;
                  }

                  localStorage.setItem("claim", JSON.stringify({
                    disruptionType: data.claim.disruptionType,
                    incomeLoss: data.claim.estimatedIncomeLoss,
                    insurancePayout: data.payoutAmount,
                  }));

                  navigate("/payout");
                } catch (err) {
                  console.error("Claim failed:", err);
                  alert("Claim creation failed");
                }
              }}
              className="w-full py-5 bg-slate-900 text-white font-bold text-xl rounded-2xl shadow-xl hover:bg-slate-800 hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              Generate Claim
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Claim;