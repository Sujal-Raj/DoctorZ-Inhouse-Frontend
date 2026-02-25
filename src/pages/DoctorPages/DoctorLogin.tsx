import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";
import { loginDoctor } from "../../Services/doctorApi";

export default function DoctorLogin() {
  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!doctorId || !password) {
      setErrorMsg("Please enter both Doctor ID and Password.");
      return;
    }

    try {
      setLoading(true);

      const res = await loginDoctor(doctorId, password);

      // Save token
      Cookies.set("doctorToken", res.token, { expires: 7 });

      // Optional save
      localStorage.setItem("doctorId", res.doctor._id);

      setSuccessMsg(`Welcome Dr. ${res.doctor.fullName}! Redirecting...`);

      setTimeout(() => {
        navigate(`/doctordashboard/${res.doctor._id}`);
      }, 1200);

    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid Doctor ID or Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Doctor Login | DoctorZ Healthcare</title>
      </Helmet>
      {/* <div className="w-full h-full"><canvas width="843" height="552" style ="width: 100%; height: 100%;"></canvas></div> */}

      <div className="fixed inset-0 flex items-center justify-center bg-white z-10">
        <div className="w-[90%] max-w-md bg-white rounded-2xl shadow-lg border border-[#dfe3f7] p-8 sm:p-10 text-center">
          <h1 className="text-3xl font-bold text-black mb-3">Doctor Login</h1>

          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Access your{" "}
            <span className="font-semibold text-[#0c213e]">
              appointments and dashboard
            </span>
            .
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

            {/* Doctor ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor ID
              </label>

              <input
                type="text"
                id="doctorId"
                placeholder="Enter your Doctor ID"
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0c213e] bg-gray-50 text-gray-800"
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
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:ring-2 focus:ring-[#0c213e] bg-gray-50 text-gray-800"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 inset-y-0 flex items-center text-gray-500 hover:text-[#0c213e]"
                >
                  {showPassword ? (
                    <EyeOff size={20} strokeWidth={1.8} />
                  ) : (
                    <Eye size={20} strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#0c213e] hover:bg-[#1f2870] text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6 text-sm">
            Don’t have an account?{" "}
            <a
              href="/doctor-register"
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
