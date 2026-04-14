// 📁 src/pages/LoginReceptionist.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Eye, EyeOff } from "lucide-react";
import api from "../../Services/mainApi";

interface LoginResponse {
  message: string;
  receptionist: {
    id: string;
    receptionId: string;
    name: string;
    email: string;
    clinicName: string;
    clinic: string;
  };
  token: string;
}

export default function LoginReceptionist() {
  const [receptionId, setReceptionId] = useState("");
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

    if (!receptionId || !password) {
      setErrorMsg("Please enter Reception ID and Password.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post<LoginResponse>(
        "/api/receptionist/login",
        {
          receptionId,
          password,
        }
      );
      console.log(res);

      // Save data
      localStorage.setItem("receptionToken", res.data.token);
      localStorage.setItem("authTokenReception", res.data.token);
      localStorage.setItem("receptionistId", res.data.receptionist.id);
      localStorage.setItem("clinicId", res.data.receptionist.clinic);

      setSuccessMsg(`Welcome ${res.data.receptionist.receptionId}! Redirecting...`);

      setTimeout(() => {
        navigate(`/receptionistDashboard/${res.data.receptionist.id}`);
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
        <title>Receptionist Login | DoctorZ Healthcare</title>
        <meta
          name="description"
          content="Login to your receptionist account to manage appointments and patient records."
        />
      </Helmet>

      <div className="fixed inset-0 flex items-center justify-center bg-white z-40">
        <div className="w-[90%] max-w-md bg-white rounded-2xl shadow-lg border border-[#dfe3f7] p-8 sm:p-10 text-center transition-all duration-300">

          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Receptionist Login
          </h1>

          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Sign in to access your{" "}
            <span className="font-semibold text-[#0c213e]">
              receptionist dashboard
            </span>.
          </p>

          {/* ❌ Error */}
          {errorMsg && (
            <p className="mb-4 text-red-600 text-sm font-medium bg-red-100 py-2 rounded-lg">
              {errorMsg}
            </p>
          )}

          {/* ✅ Success */}
          {successMsg && (
            <p className="mb-4 text-green-600 text-sm font-medium bg-green-100 py-2 rounded-lg">
              {successMsg}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">

            {/* Reception ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reception ID
              </label>
              <input
                type="text"
                placeholder="Enter your Reception ID"
                value={receptionId}
                onChange={(e) => setReceptionId(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Button */}
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
              href="/receptionist-register"
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