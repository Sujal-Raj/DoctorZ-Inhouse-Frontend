import { useState } from "react";
import api from "../../Services/mainApi";

export default function WalkInRegistration() {
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    dob: "",
    mobileNumber: "",
    aadhar: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setLoading(true);

      const res = await api.post("/api/receptionist/walkinregistration", form);

      setMessage(res.data.message);
      setForm({
        fullName: "",
        gender: "",
        dob: "",
        mobileNumber: "",
        aadhar: "",
      });

    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Walk-in Registration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Register a new patient visiting the clinic
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        
        {/* Messages */}
        {error && (
          <p className="mb-4 text-red-600 bg-red-100 p-2 rounded">
            {error}
          </p>
        )}

        {message && (
          <p className="mb-4 text-green-600 bg-green-100 p-2 rounded">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Full Name */}
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-[#0c213e]"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm text-gray-600">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-gray-50"
              required
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* DOB */}
          <div>
            <label className="text-sm text-gray-600">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-gray-50"
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm text-gray-600">Mobile Number</label>
            <input
              type="text"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-gray-50"
              required
            />
          </div>

          {/* Aadhar */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Aadhar Number</label>
            <input
              type="text"
              name="aadhar"
              value={form.aadhar}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-gray-50"
              required
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#0c213e] text-white py-3 rounded-lg font-semibold transition ${
                loading ? "opacity-70" : "hover:bg-[#1f2870]"
              }`}
            >
              {loading ? "Registering..." : "Register Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}