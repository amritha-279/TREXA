import { NavLink, useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  useLocation();
  const isLoggedIn = !!localStorage.getItem("worker");

  function handleLogout() {
    localStorage.removeItem("worker");
    navigate("/");
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive ? "text-teal-600" : "text-slate-500 hover:text-slate-900"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
      <div className="w-full px-8 h-16 flex items-center justify-between">

        {/* Logo — far left */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">TX</span>
          </div>
          <span className="text-base font-bold text-slate-800 tracking-tight">trexa</span>
        </NavLink>

        {/* Links — far right */}
        <div className="flex items-center gap-8">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          {isLoggedIn && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
          <NavLink to="/admin" className={linkClass}>Admin</NavLink>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-all duration-200"
            >
              Login
            </NavLink>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
