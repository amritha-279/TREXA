import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const CITY_COORDS = {
  Chennai:         { lat: 13.0827, lon: 80.2707 },
  Coimbatore:      { lat: 11.0168, lon: 76.9558 },
  Madurai:         { lat: 9.9252,  lon: 78.1198 },
  Tiruchirappalli: { lat: 10.7905, lon: 78.7047 },
  Salem:           { lat: 11.6643, lon: 78.1460 },
  Tirunelveli:     { lat: 8.7139,  lon: 77.7567 },
  Vellore:         { lat: 12.9165, lon: 79.1325 },
  Erode:           { lat: 11.3410, lon: 77.7172 },
  Thanjavur:       { lat: 10.7870, lon: 79.1378 },
  Dindigul:        { lat: 10.3673, lon: 77.9803 },
  Kanchipuram:     { lat: 12.8185, lon: 79.6947 },
  Nagercoil:       { lat: 8.1833,  lon: 77.4119 },
}

function FlyToCity({ coords }) {
  const map = useMap()
  if (coords) map.flyTo([coords.lat, coords.lon], 11, { duration: 1.2 })
  return null
}

function Register() {
  const navigate = useNavigate()
  const [workerId, setWorkerId] = useState("")
  const [error,    setError]    = useState("")
  const [loading,  setLoading]  = useState(false)
  const [preview,  setPreview]  = useState(null) // worker preview before confirm

  const handleLogin = async () => {
    if (!workerId.trim()) return
    setLoading(true)
    setError("")
    setPreview(null)

    try {
      const res  = await fetch(`http://localhost:4000/api/workers/${workerId.trim().toUpperCase()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Worker ID not found")
        setLoading(false)
        return
      }

      setPreview(data)
    } catch {
      setError("Could not connect to server. Make sure backend is running.")
    }
    setLoading(false)
  }

  const handleConfirm = () => {
    localStorage.setItem("worker", JSON.stringify({
      ...preview,
      location:     preview.city,
      claimHistory: [],
      earningsProtected: "₹0",
    }))
    navigate("/dashboard")
  }

  const cityCoords = preview ? CITY_COORDS[preview.city] : null

  const PLATFORM_COLORS = {
    Swiggy:  "bg-orange-100 text-orange-700",
    Zomato:  "bg-red-100 text-red-700",
    Blinkit: "bg-yellow-100 text-yellow-700",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-10 px-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Left — Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Worker Login</h1>
          <p className="text-slate-500 mb-8 text-sm">Enter your Worker ID to access GigShield coverage.</p>

          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Worker ID</label>
          <input
            placeholder="e.g. SWG1001, ZMT2001, BLK3001"
            value={workerId}
            onChange={e => { setWorkerId(e.target.value); setError(""); setPreview(null) }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full border border-slate-200 p-3 rounded-xl mb-4 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 uppercase"
          />

          {error && (
            <p className="text-red-500 text-sm font-semibold mb-4">⚠ {error}</p>
          )}

          {/* Worker Preview Card */}
          {preview && (
            <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Worker Found</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-black text-lg">
                  {preview.name.charAt(0)}
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-lg">{preview.name}</p>
                  <p className="text-slate-500 text-sm">{preview.workerId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase">City</p>
                  <p className="font-bold text-slate-700 mt-0.5">📍 {preview.city}</p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100">
                  <p className="text-slate-400 text-xs font-bold uppercase">Platform</p>
                  <p className={`font-bold mt-0.5 text-xs px-2 py-0.5 rounded-full inline-block ${PLATFORM_COLORS[preview.platform] || "bg-slate-100 text-slate-700"}`}>
                    {preview.platform}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 border border-slate-100 col-span-2">
                  <p className="text-slate-400 text-xs font-bold uppercase">Working Hours</p>
                  <p className="font-bold text-slate-700 mt-0.5">⏱ {preview.workingHours} hrs / day</p>
                </div>
              </div>
            </div>
          )}

          {!preview ? (
            <button
              onClick={handleLogin}
              disabled={!workerId.trim() || loading}
              className="w-full mt-2 bg-teal-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-teal-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Login"}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="w-full mt-2 bg-slate-900 text-white p-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all"
            >
              Confirm & Continue →
            </button>
          )}

          <p className="text-xs text-slate-400 mt-4 text-center">
            Swiggy: SWG1001–SWG1010 &nbsp;|&nbsp; Zomato: ZMT2001–ZMT2010 &nbsp;|&nbsp; Blinkit: BLK3001–BLK3010
          </p>
        </div>

        {/* Right — Map */}
        <div className="w-full md:w-1/2 h-72 md:h-auto min-h-[400px] relative">
          {!preview && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/80 backdrop-blur-sm pointer-events-none">
              <span className="text-4xl mb-3">📍</span>
              <p className="text-slate-500 font-semibold text-sm">Enter your Worker ID to see your zone</p>
            </div>
          )}
          <MapContainer
            center={[10.8505, 78.6677]}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {cityCoords && (
              <>
                <FlyToCity coords={cityCoords} />
                <Marker position={[cityCoords.lat, cityCoords.lon]}>
                  <Popup>
                    <span className="font-bold">{preview.name}</span><br />
                    {preview.city}, Tamil Nadu
                  </Popup>
                </Marker>
              </>
            )}
          </MapContainer>
        </div>

      </div>
    </div>
  )
}

export default Register
