// 📁 src/pages/LoginClinic.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Eye, EyeOff } from "lucide-react";
import api from "../../Services/mainApi";

interface LoginResponse {
  message: string;
  clinic: {
    id: string;
    staffId: string;
    staffName: string;
    staffEmail: string;
    clinicName: string;
  };
  jwtToken: string;
}

export default function LoginClinic() {
  const [staffId, setStaffId] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!staffId || !staffPassword) {
      setErrorMsg("Please enter both Staff ID and Password.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post<LoginResponse>("/api/clinic/clinicLogin", {
        staffId,
        staffPassword,
      });

      // Save info
      localStorage.setItem("clinicToken", res.data.jwtToken);
      localStorage.setItem("authTokenClinic", res.data.jwtToken);
      localStorage.setItem("clinicId", res.data.clinic.id);

      setSuccessMsg(`Welcome ${res.data.clinic.staffName}! Redirecting...`);

      setTimeout(() => {
        navigate(`/clinicDashboard/${res.data.clinic.id}`);
      }, 1200);

    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Invalid credentials or unauthorized access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Clinic Login | DoctorZ Healthcare</title>
        <meta
          name="description"
          content="Login to your DoctorZ Clinic account to manage staff, appointments, and patient records."
        />
      </Helmet>

      <div className="fixed inset-0 flex items-center justify-center bg-white z-40">
        <div className="w-[90%] max-w-md bg-white rounded-2xl shadow-lg border border-[#dfe3f7] p-8 sm:p-10 text-center transition-all duration-300">

          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Clinic Login
          </h1>

          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Sign in to access your{" "}
            <span className="font-semibold text-[#0c213e]">
              clinic dashboard and records
            </span>.
          </p>

          {/* ❌ Error Message */}
          {errorMsg && (
            <p className="mb-4 text-red-600 text-sm font-medium bg-red-100 py-2 rounded-lg">
              {errorMsg}
            </p>
          )}

          {/* ✅ Success Message */}
          {successMsg && (
            <p className="mb-4 text-green-600 text-sm font-medium bg-green-100 py-2 rounded-lg">
              {successMsg}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">

            {/* Staff ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff ID
              </label>
              <input
                type="text"
                placeholder="Enter your Staff ID"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0c213e] bg-gray-50 transition"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-[#0c213e] bg-gray-50 transition"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-[#0c213e]"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#0c213e] hover:bg-[#1f2870] text-white font-semibold py-3 rounded-lg shadow-md transition ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6 text-sm sm:text-base">
            Don’t have an account?{" "}
            <a
              href="/clinic-register"
              className="text-[#0c213e] font-medium hover:underline"
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
