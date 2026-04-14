import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Stethoscope, UserCircle2, Hospital, FlaskConical, User, FileText } from "lucide-react";
import Navbar from "../components/Navbar";

const loginOptions = [
  { label: "Patient", path: "/patient-login", icon: <UserCircle2 size={15} /> },
  { label: "Doctor", path: "/doctor-login", icon: <Stethoscope size={15} /> },
  { label: "Clinic / Hospital", path: "/clinic-login", icon: <Hospital size={15} /> },
  { label: "Lab", path: "/lab-login", icon: <FlaskConical size={15} /> },
  { label: "Receptionist", path: "/receptionist-login", icon: <User size={15} /> },
];

const registerOptions = [
  { label: "Patient", path: "/patient-register", icon: <UserCircle2 size={15} /> },
  { label: "Doctor", path: "/doctor-register", icon: <Stethoscope size={15} /> },
  { label: "Clinic / Hospital", path: "/clinic-register", icon: <Hospital size={15} /> },
  { label: "Lab", path: "/lab-register", icon: <FlaskConical size={15} /> },
];

function RoleDropdown({ label, options, btnClass, menuItemClass }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${btnClass}`}
      >
        <span>{label}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-10">
          {options.map((opt) => (
            <button
              key={opt.path}
              onClick={() => { navigate(opt.path); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors border-b border-gray-50 last:border-0 ${menuItemClass}`}
            >
              <span className="text-gray-400">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomeLandingPage() {
  return (
    <div className="max-h-screen flex flex-col">
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
        {/* Image side */}
        <div className="relative hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=70"
            alt="Doctor"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-[#0c213e]/35 to-transparent" />
          <div className="absolute bottom-8 left-8 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-5 py-3 text-white">
            <strong className="block text-lg font-medium">10,000+</strong>
            <span className="text-sm">Patients served this month</span>
          </div>
        </div>

        {/* Form side */}
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <p className="text-[11px] font-medium tracking-widest text-blue-500 uppercase mb-2">Healthcare Portal</p>
            <h1 className="text-3xl font-serif text-[#0c213e] mb-1 tracking-tight">Welcome back</h1>
            <p className="text-sm text-gray-400 mb-7">Select your role to continue.</p>

            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Sign in as</label>
            <RoleDropdown
              label="Login as"
              options={loginOptions}
              btnClass="bg-[#0c213e] text-white hover:bg-[#162d52]"
              menuItemClass="text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            />

            <div className="flex items-center gap-3 my-5 text-gray-300 text-xs">
              <div className="flex-1 h-px bg-gray-100" />
              or
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <label className="block text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">New here?</label>
            <RoleDropdown
              label="Register as"
              options={registerOptions}
              btnClass="bg-white border border-gray-200 text-slate-700 hover:bg-gray-50"
              menuItemClass="text-slate-600 hover:bg-green-50 hover:text-green-700"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-10 py-3.5 flex items-center justify-between text-xs text-gray-400">
        <span>© 2026 DoctorZ. All rights reserved.</span>
        <div className="flex gap-5">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Support</a>
        </div>
      </footer>
    </div>
  );
}