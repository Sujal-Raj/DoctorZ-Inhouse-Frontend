import { useState, useRef, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Stethoscope, Hospital, FlaskConical, User } from "lucide-react";
import Navbar from "../components/Navbar";

type RoleOption = {
  label: string;
  path: string;
  icon: ReactNode;
};

type RoleDropdownProps = {
  label: string;
  options: RoleOption[];
  variant: "primary" | "secondary";
};

const loginOptions: RoleOption[] = [
  { label: "Doctor", path: "/doctor-login", icon: <Stethoscope size={15} /> },
  { label: "Clinic / Hospital", path: "/clinic-login", icon: <Hospital size={15} /> },
  { label: "Lab", path: "/lab-login", icon: <FlaskConical size={15} /> },
  { label: "Clinic/Hospital Staff", path: "/receptionist-login", icon: <User size={15} /> },
];

const registerOptions: RoleOption[] = [
  { label: "Doctor", path: "/doctor-register", icon: <Stethoscope size={15} /> },
  { label: "Clinic / Hospital", path: "/clinic-register", icon: <Hospital size={15} /> },
  { label: "Lab", path: "/lab-register", icon: <FlaskConical size={15} /> },
];

function RoleDropdown({ label, options, variant }: RoleDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (!ref.current || !(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const isPrimary = variant === "primary";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-normal transition-all duration-200 cursor-pointer ${
          isPrimary
            ? "bg-[#0c213e] text-white hover:bg-[#162d52]"
            : "bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }`}
      >
        <span>{label}</span>
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 opacity-60 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-[0_8px_32px_rgba(12,33,62,0.10),0_2px_8px_rgba(12,33,62,0.06)] overflow-hidden z-20 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt: RoleOption) => (
            <button
              key={opt.path}
              onClick={() => { navigate(opt.path); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 text-left border-b border-gray-50 last:border-0 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-100 cursor-pointer"
            >
              <span className="text-gray-400 group-hover:text-blue-500">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
            <p className="text-[13.5px] text-gray-400 mb-7">Select your role to continue to your dashboard.</p>

            <p className="text-[10.5px] font-medium tracking-[0.12em] text-gray-400 uppercase mb-2">Sign in as</p>
            <RoleDropdown label="Login as" options={loginOptions} variant="primary" />

            <div className="flex items-center gap-2.5 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-300">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <p className="text-[10.5px] font-medium tracking-[0.12em] text-gray-400 uppercase mb-2">New here?</p>
            <RoleDropdown label="Register as" options={registerOptions} variant="secondary" />

            <div className="mt-7 pt-5 border-t border-gray-100 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[12px] text-gray-400">All systems operational · 256-bit encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}