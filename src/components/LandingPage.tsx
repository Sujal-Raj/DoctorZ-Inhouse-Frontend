import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Hospital, FlaskConical } from "lucide-react";
import Navbar from "../components/Navbar";
import Cookies from "js-cookie";
import api from "../Services/mainApi";
import { loginDoctor } from "../Services/doctorApi";
import { loginLab } from "../Services/labApi";

const registerOptions = [
  { label: "Doctor", path: "/doctor-register", icon: <Stethoscope size={16} /> },
  { label: "Clinic / Hospital", path: "/clinic-register", icon: <Hospital size={16} /> },
  { label: "Lab", path: "/lab-register", icon: <FlaskConical size={16} /> },
];

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();

    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    let animId = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(126,184,247,${p.alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(126,184,247,${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function HomeLandingPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleUnifiedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    const id = username.trim();
    const pwd = password;

    try {
      // 1. Detect Doctor by DOC- prefix
      if (id.toUpperCase().startsWith("DOC-")) {
        const res = await loginDoctor(id, pwd);
        Cookies.set("doctorToken", res.token, { expires: 7 });
        localStorage.setItem("doctorId", res.doctor._id);
        setSuccessMsg(`Welcome Dr. ${res.doctor.fullName}! Redirecting...`);
        setTimeout(() => navigate(`/doctordashboard/${res.doctor._id}`), 1200);
        return;
      }

      // 2. Detect Clinic Owner / Super Admin or Staff by CLI- or STAFF- prefix
      if (id.toUpperCase().startsWith("CLI-") || id.toUpperCase().startsWith("STAFF-")) {
        try {
          // Attempt Clinic Admin Owner login first
          const res = await api.post("/api/clinic/clinicLogin", { staffId: id, staffPassword: pwd });
          if (res.status === 200 || res.data?.jwtToken) {
            localStorage.setItem("clinicToken", res.data.jwtToken);
            localStorage.setItem("authTokenClinic", res.data.jwtToken);
            localStorage.setItem("clinicId", res.data.clinic.id);
            localStorage.setItem("userRole", "Admin");
            localStorage.setItem("userPermissions", JSON.stringify(["all"]));
            localStorage.setItem("clinicFeatures", JSON.stringify(res.data.clinic.allowedFeatures || []));
            setSuccessMsg(`Welcome ${res.data.clinic.staffName}! Redirecting...`);
            setTimeout(() => navigate(`/clinicDashboard/${res.data.clinic.id}`), 1200);
            return;
          }
        } catch (e) {
          // If Clinic Owner login fails, fall through to try regular Staff login
        }

        // Attempt Clinic Staff Login
        const res = await api.post("/api/staff/login", { staffId: id, password: pwd });
        localStorage.setItem("clinicToken", res.data.token);
        localStorage.setItem("authTokenClinic", res.data.token);
        localStorage.setItem("clinicId", res.data.staff.clinicId);
        localStorage.setItem("userRole", res.data.staff.role);
        localStorage.setItem("userPermissions", JSON.stringify(res.data.staff.permissions));
        localStorage.setItem("clinicFeatures", JSON.stringify(res.data.staff.allowedFeatures || []));
        setSuccessMsg(`Welcome ${res.data.staff.fullName}! Redirecting...`);
        setTimeout(() => navigate(`/clinicDashboard/${res.data.staff.clinicId}`), 1200);
        return;
      }

      // 3. Detect Lab by LAB- prefix
      if (id.toUpperCase().startsWith("LAB-")) {
        const response = await loginLab(id, pwd);
        if (response.status === 200 && response.data?.token) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("labId", response.data.lab._id);
          localStorage.setItem("labName", response.data.lab.name);
          setSuccessMsg(`Welcome ${response.data.lab.name}! Redirecting...`);
          setTimeout(() => navigate("/lab-dashboard/patients"), 1200);
          return;
        } else {
          throw new Error("Invalid Lab credentials");
        }
      }

      // 4. Detect Receptionist by REC- prefix
      if (id.toUpperCase().startsWith("REC-")) {
        const res = await api.post("/api/receptionist/login", { receptionId: id, password: pwd });
        localStorage.setItem("receptionistToken", res.data.token);
        localStorage.setItem("authTokenReceptionist", res.data.token);
        localStorage.setItem("receptionistId", res.data.receptionist.id);
        localStorage.setItem("receptionistName", res.data.receptionist.name);
        setSuccessMsg(`Welcome ${res.data.receptionist.name}! Redirecting...`);
        setTimeout(() => navigate("/receptionistdashboard"), 1200);
        return;
      }

      // 5. Fallback/Waterfall if it is an Email or doesn't have standard prefixes
      
      // Try Super Admin Login
      try {
        const res = await api.post("/api/admin/login", { email: id, password: pwd });
        if (res.data.success) {
          localStorage.setItem("superadminToken", res.data.token);
          localStorage.setItem("userRole", "superadmin");
          setSuccessMsg("Welcome Super Admin! Redirecting...");
          setTimeout(() => navigate("/super-admin-dashboard"), 1200);
          return;
        }
      } catch (e) {
        // Ignore and try patient
      }

      // Try Patient Login
      try {
        const res = await api.post("/api/patient/login", { email: id, password: pwd });
        if (res.status === 200 || res.data?.token) {
          Cookies.set("patientToken", res.data.token || res.data.jwtToken, { expires: 7 });
          localStorage.setItem("patientId", res.data.patient._id);
          setSuccessMsg(`Welcome ${res.data.patient.fullName}! Redirecting...`);
          setTimeout(() => navigate("/"), 1200);
          return;
        }
      } catch (e) {
        // Ignore and try general staff login
      }

      // Try Staff Login
      try {
        const res = await api.post("/api/staff/login", { staffId: id, password: pwd });
        if (res.data.success) {
          localStorage.setItem("clinicToken", res.data.token);
          localStorage.setItem("authTokenClinic", res.data.token);
          localStorage.setItem("clinicId", res.data.staff.clinicId);
          localStorage.setItem("userRole", res.data.staff.role);
          localStorage.setItem("userPermissions", JSON.stringify(res.data.staff.permissions));
          localStorage.setItem("clinicFeatures", JSON.stringify(res.data.staff.allowedFeatures || []));
          setSuccessMsg(`Welcome ${res.data.staff.fullName}! Redirecting...`);
          setTimeout(() => navigate(`/clinicDashboard/${res.data.staff.clinicId}`), 1200);
          return;
        }
      } catch (e) {
        // Ignore and try clinic login
      }

      // Try Clinic Login
      try {
        const res = await api.post("/api/clinic/clinicLogin", { staffId: id, staffPassword: pwd });
        if (res.status === 200 || res.data?.jwtToken) {
          localStorage.setItem("clinicToken", res.data.jwtToken);
          localStorage.setItem("authTokenClinic", res.data.jwtToken);
          localStorage.setItem("clinicId", res.data.clinic.id);
          localStorage.setItem("userRole", "Admin");
          localStorage.setItem("userPermissions", JSON.stringify(["all"]));
          localStorage.setItem("clinicFeatures", JSON.stringify(res.data.clinic.allowedFeatures || []));
          setSuccessMsg(`Welcome ${res.data.clinic.staffName}! Redirecting...`);
          setTimeout(() => navigate(`/clinicDashboard/${res.data.clinic.id}`), 1200);
          return;
        }
      } catch (e) {
        // Ignore
      }

      throw new Error("Invalid credentials or account is suspended.");
    } catch (err: any) {
      console.error("Unified Login error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Invalid ID/Email or Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9f7]">
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] flex-1">
        {/* Left — hero panel */}
        <div className="relative hidden md:flex flex-col justify-between bg-[#0c213e] overflow-hidden">
          <ParticleCanvas />
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=70"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.22]"
          />
          <div className="absolute inset-0 bg-linear-to-br from-[#0c213e] via-[#162d52cc] to-transparent" />

          <div className="relative z-10 p-10 flex flex-col justify-between h-full">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#7eb8f7]" />
              <span className="text-[11px] font-medium tracking-[0.14em] text-white/50 uppercase">DoctorZ</span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="font-serif text-[42px] leading-[1.15] text-white mb-4 tracking-tight">
                Modern care,<br />
                <em className="text-[#7eb8f7] not-italic font-serif">beautifully</em><br />
                delivered.
              </h1>
              <p className="text-sm text-white/45 leading-relaxed max-w-70">
                A unified platform connecting doctors, clinics, labs, and receptionists in one seamless workflow.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              {[
                { value: "10K+", label: "Patients/month" },
                { value: "340+", label: "Providers" },
                { value: "99.9%", label: "Uptime" },
              ].map((s) => (
                <div key={s.label} className="bg-white/6 border border-white/12 rounded-xl px-4 py-3.5">
                  <strong className="block text-[22px] font-medium text-white leading-none mb-1">{s.value}</strong>
                  <span className="text-[11px] text-white/40 tracking-wide">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form panel */}
        <div className="flex items-center justify-center p-8 bg-[#faf9f7]">
          <div className="w-full max-w-85">
            <p className="text-[11px] font-medium tracking-[0.14em] text-blue-500 uppercase mb-2">Healthcare Portal</p>
            <h2 className="font-serif text-[30px] text-[#0c213e] leading-tight mb-1">Welcome back</h2>
            <p className="text-[13.5px] text-gray-400 mb-6">Enter your credentials to continue to your dashboard.</p>

            {/* ❌ Error Message */}
            {errorMsg && (
              <p className="mb-4 text-red-650 text-[12px] font-semibold bg-red-50 p-2.5 rounded-xl border border-red-100 animate-in fade-in duration-200">
                {errorMsg}
              </p>
            )}

            {/*  Success Message */}
            {successMsg && (
              <p className="mb-4 text-emerald-600 text-[12px] font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 animate-in fade-in duration-200">
                {successMsg}
              </p>
            )}

            <form onSubmit={handleUnifiedLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  User ID / Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DOC-1234, CLI-5678, or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c213e]/10 focus:border-[#0c213e] bg-white text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c213e]/10 focus:border-[#0c213e] bg-white text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0c213e] text-white rounded-xl font-semibold text-sm hover:bg-[#162d52] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#0c213e]/10 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Login to Dashboard"
                )}
              </button>
            </form>

            <div className="flex items-center gap-2.5 my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400">or register new account</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#0c213e]/70 mb-3">Register as</p>
            <div className="grid grid-cols-3 gap-2">
              {registerOptions.map((opt) => (
                <button
                  key={opt.path}
                  onClick={() => navigate(opt.path)}
                  className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-2xl hover:border-[#0c213e] hover:text-[#0c213e] hover:shadow-xs transition-all duration-200 cursor-pointer text-center group"
                >
                  <span className="text-gray-450 group-hover:text-[#0c213e] mb-1.5 transition-colors">{opt.icon}</span>
                  <span className="text-[10.5px] font-semibold leading-tight text-gray-600 group-hover:text-[#0c213e] transition-colors">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-gray-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[11px] text-gray-400">All systems operational · Encrypted connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}