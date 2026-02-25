import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react";
import { loginPatient } from "../../Services/patientApi";
import { AuthContext } from "../../Context/AuthContext";

export default function LoginPatient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Please enter both Email and Password.");
      return;
    }

    try {
      setLoading(true);

      const res = await loginPatient({ email, password });

      if (res.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
        localStorage.setItem("userId", res.user._id);
      }

      Cookies.set("patientToken", res.token, { expires: 7 });

      login(res.token);

      setSuccessMsg(`Welcome ${res.user.email || "Patient"}! Redirecting...`);

      setTimeout(() => navigate("/"), 1200);

    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg("Invalid Email or Password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Patient Login | DoctorZ Healthcare</title>
      </Helmet>

      <div className="fixed inset-0 flex items-center justify-center bg-white z-10">
        <div className="w-[90%] max-w-md bg-white rounded-2xl shadow-lg border border-[#dfe3f7] p-8 sm:p-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Patient Login
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Sign in to manage your{" "}
            <span className="font-semibold text-[#0c213e]">
              health records & appointments
            </span>
            .
          </p>

          {errorMsg && (
            <p className="mb-4 text-red-600 text-sm font-medium bg-red-100 py-2 rounded-lg text-center">
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="mb-4 text-green-600 text-sm font-medium bg-green-100 py-2 rounded-lg text-center">
              {successMsg}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-left">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#0c213e] bg-gray-50 text-gray-800"
                required
              />
            </div>

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
              href="/patient-register"
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
