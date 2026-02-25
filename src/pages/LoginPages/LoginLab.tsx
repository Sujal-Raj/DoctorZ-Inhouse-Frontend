// 📁 src/pages/LoginLab.tsx
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Eye, EyeOff } from "lucide-react";
import { loginLab } from "../../Services/labApi";


export default function LoginLab() {
  const [labId, setLabId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); // ❗ Inline error message

  const handleLogin = async () => {
    setErrorMsg("");

    if (!labId || !password) {
      setErrorMsg("Please enter both Lab ID and Password.");
      return;
    }

    try {
      setLoading(true);
      const response = await loginLab(labId, password);

      if (response.status === 200 && response.data?.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("labId", response.data.lab._id);
        localStorage.setItem("labName", response.data.lab.name);


        setTimeout(() => {
          window.location.href = "/lab-dashboard/patients";
        }, 1500);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg("Invalid credentials or your lab is not approved yet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>Lab Login | DoctorZ Healthcare</title>
        <meta
          name="description"
          content="Login to your DoctorZ Lab account to manage diagnostic tests, reports, and patients efficiently."
        />
        <meta
          name="keywords"
          content="Lab Login, DoctorZ Healthcare, Diagnostics, Medical Reports"
        />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* UI */}
      <div className="fixed inset-0 flex items-center justify-center bg-white z-40">
        <div className="w-[90%] max-w-md bg-white rounded-2xl shadow-lg border border-[#dfe3f7] p-8 sm:p-10 text-center">

          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
            Lab Login
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mb-6">
            Use your{" "}
            <span className="font-semibold text-[#0c213e]">Lab ID</span> and
            password to access your{" "}
            <span className="font-semibold text-[#0c213e]">dashboard</span>.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-5 text-left"
          >
            {/* Lab ID */}
            <div>
              <label
                htmlFor="labId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Lab ID
              </label>
              <input
                id="labId"
                type="text"
                placeholder="Enter your Lab ID"
                value={labId}
                onChange={(e) => setLabId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#0c213e] bg-gray-50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0c213e] bg-gray-50"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            )}

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

          <p className="text-center text-gray-600 mt-6 text-sm">
            Don't have an account?{" "}
            <a
              href="/lab-register"
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


// import React from 'react'
// import JitsiMeetComponent from '../../components/JitsiMeetComponent'

// function LoginLab() {
//   return (
//     <>
//       <JitsiMeetComponent roomName="MyCoolMeetingRoom123" />

//     </>
//   )
// }

// export default LoginLab