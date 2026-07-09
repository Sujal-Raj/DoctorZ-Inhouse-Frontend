import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function SuperAdminLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/admin/login", { 
        adminId: identifier, 
        password 
      });
      
      if (res.data.success) {
        localStorage.setItem("superAdminToken", res.data.token);
        localStorage.setItem("superAdminInfo", JSON.stringify(res.data.admin));
        toast.success("Welcome back, Super Admin!");
        
        setTimeout(() => {
          navigate("/super-admin-dashboard");
        }, 1000);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid Admin ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/30 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-3xl" />

      <div className="w-full max-w-md bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/30 mb-4 animate-pulse">
            <ShieldCheckIcon className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">DoctorZ Platform</h1>
          <p className="text-slate-400 text-sm mt-1">SaaS Portal Super Admin Login</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Super Admin ID
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin_96ced2"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 pr-10 text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Secure Access"}
          </button>
        </form>
      </div>
    </div>
  );
}
