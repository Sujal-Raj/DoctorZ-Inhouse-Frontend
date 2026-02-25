


import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { updateDoctor } from "../Services/doctorApi";

function EditDoctorProfile() {
  const { drId } = useParams<{ drId: string }>();
  const navigate = useNavigate();

  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await updateDoctor(drId!, doctorId, password);
      alert("Profile updated successfully!");
      navigate(`/doctordashboard/${drId}`);
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="flex  w-full  items-center ml-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
          Edit Profile
        </h2>

        {error && (
          <p className="text-red-500 mb-4 text-center font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Doctor ID */}
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-gray-700">
              New Doctor ID
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={doctorId}
              onChange={(e:React.ChangeEvent<HTMLInputElement>) => setDoctorId(e.target.value)}
              placeholder="Enter new Doctor ID"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label className="font-semibold mb-2 text-gray-700">
              New Password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={password}
              onChange={(e:React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition flex justify-center items-center gap-2"
          >
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
      </div>
 </div>
  );
}

export default EditDoctorProfile;
