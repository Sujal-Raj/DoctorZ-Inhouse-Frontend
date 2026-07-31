import { useState } from "react";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";

export default function WalkInRegistration() {
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    dob: "",
    mobileNumber: "",
    aadhar: "",
    abhaId: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    familyOption: "none", // none | new | existing
    familyId: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.gender || !form.dob || !form.mobileNumber) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        fullName: form.fullName,
        gender: form.gender,
        dob: form.dob,
        mobileNumber: Number(form.mobileNumber),
        aadhar: form.aadhar || undefined,
        abhaId: form.abhaId || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactNumber: form.emergencyContactNumber || undefined,
        insuranceProvider: form.insuranceProvider || undefined,
        insurancePolicyNumber: form.insurancePolicyNumber || undefined,
        familyId: form.familyOption === "none" ? undefined : (form.familyOption === "new" ? "new" : form.familyId),
      };

      const res = await api.post("/api/receptionist/walkinregistration", payload);

      if (res.data.patient) {
        toast.success(res.data.message || "Walk-in patient registered successfully!");
        setForm({
          fullName: "",
          gender: "",
          dob: "",
          mobileNumber: "",
          aadhar: "",
          abhaId: "",
          emergencyContactName: "",
          emergencyContactNumber: "",
          insuranceProvider: "",
          insurancePolicyNumber: "",
          familyOption: "none",
          familyId: "",
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 p-4 font-sans text-gray-900">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Walk-in & Family Patient Onboarding
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Register new patients, link families, or map insurance details for billing
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Patient Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Mobile Number *</label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={form.mobileNumber}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-150" />

          {/* Section 2: National IDs */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">National Health IDs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Aadhaar Card Number</label>
                <input
                  type="text"
                  name="aadhar"
                  value={form.aadhar}
                  placeholder="e.g. 12-digit number"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">ABHA ID (Ayushman Bharat)</label>
                <input
                  type="text"
                  name="abhaId"
                  value={form.abhaId}
                  placeholder="e.g. ABHA-101"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-150" />

          {/* Section 3: Emergency & Insurance */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Emergency Contacts & Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={form.emergencyContactName}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Emergency Contact Number</label>
                <input
                  type="text"
                  name="emergencyContactNumber"
                  value={form.emergencyContactNumber}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Insurance Provider</label>
                <input
                  type="text"
                  name="insuranceProvider"
                  value={form.insuranceProvider}
                  placeholder="e.g. Star Health, HDFC Ergo"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Insurance Policy Number</label>
                <input
                  type="text"
                  name="insurancePolicyNumber"
                  value={form.insurancePolicyNumber}
                  placeholder="e.g. POL-99883"
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-150" />

          {/* Section 4: Family Grouping */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Family Registry Link</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Family Link Option</label>
                <select
                  name="familyOption"
                  value={form.familyOption}
                  onChange={handleChange}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="none">No Family Link (Individual)</option>
                  <option value="new">Generate New Family Group Code</option>
                  <option value="existing">Link to Existing Family Group Code</option>
                </select>
              </div>

              {form.familyOption === "existing" && (
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-1.5 block">Enter Family Group Code</label>
                  <input
                    type="text"
                    name="familyId"
                    value={form.familyId}
                    placeholder="e.g. FAM-902345"
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50/50"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#0c213e] hover:bg-[#1a3a5f] text-white py-3.5 rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Registering Patient Profile..." : "Register Walk-in Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}