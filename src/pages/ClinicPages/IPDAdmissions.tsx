import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  UserPlusIcon,
  XMarkIcon,
  // CalendarDaysIcon,
  ClipboardDocumentListIcon,
  // SparklesIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
}

interface Patient {
  _id: string;
  fullName: string;
  mobileNumber: number;
  gender: string;
  age: number;
}

interface Bed {
  _id: string;
  bedNumber: string;
  status: string;
}

interface Ward {
  _id: string;
  name: string;
  type: string;
  chargePerDay: number;
  beds: Bed[];
}

interface Admission {
  _id: string;
  patientId: Patient;
  doctorId: Doctor;
  wardId: Ward;
  bedNumber: string;
  admissionDate: string;
  dischargeDate?: string;
  reasonForAdmission: string;
  initialDeposit: number;
  status: "Admitted" | "Discharged";
}

interface OutletContext {
  clinicId: string;
}

export default function IPDAdmissions() {
  const { clinicId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [searchText, setSearchText] = useState("");

  // Auto-suggest patient search states
  // const [searchMobile, setSearchMobile] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form states (Admit)
  const [doctorId, setDoctorId] = useState("");
  const [wardId, setWardId] = useState("");
  const [bedId, setBedId] = useState("");
  const [reason, setReason] = useState("");
  const [emName, setEmName] = useState("");
  const [emRelation, setEmRelation] = useState("");
  const [emPhone, setEmPhone] = useState("");
  const [deposit, setDeposit] = useState(0);

  // Form states (Discharge)
  const [dischargeCondition, setDischargeCondition] = useState("");
  const [dischargeAdvice, setDischargeAdvice] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const fetchData = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const [admRes, docRes, wardRes] = await Promise.all([
        api.get(`/api/ipd/admissions/${clinicId}`),
        api.get(`/api/doctor/getClinicDoctors/${clinicId}`),
        api.get(`/api/ipd/wards/${clinicId}`),
      ]);

      if (admRes.data.success) setAdmissions(admRes.data.admissions);
      if (Array.isArray(docRes.data.doctors)) setDoctors(docRes.data.doctors);
      if (wardRes.data.success) setWards(wardRes.data.wards);
    } catch {
      toast.error("Failed to load IPD admissions register");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clinicId]);

  // const handlePatientSearch = async (mobile: string) => {
  //   setSearchMobile(mobile);
  //   if (mobile.length < 3) {
  //     setPatientSuggestions([]);
  //     return;
  //   }
  //   try {
  //     const token = localStorage.getItem("clinicToken") || localStorage.getItem("receptionToken") || localStorage.getItem("doctorToken") || localStorage.getItem("clinic_portal_token");
  //     const res = await api.get(`/api/receptionist/search-patient/${mobile}`, {
  //       headers: { Authorization: `Bearer ${token}` }
  //     });
  //     if (res.data.success && Array.isArray(res.data.patients)) {
  //       setPatientSuggestions(res.data.patients);
  //     }
  //   } catch {
  //     // Fail silently
  //   }
  // };

  const handlePatientSearch = async (value: string) => {
  setSearchText(value);

  if (value.trim().length < 2) {
    setPatientSuggestions([]);
    return;
  }

  try {
    const token =
      localStorage.getItem("clinicToken") ||
      localStorage.getItem("receptionToken") ||
      localStorage.getItem("doctorToken") ||
      localStorage.getItem("clinic_portal_token");

    const res = await api.get(
      `/api/receptionist/search-patient/${encodeURIComponent(value)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.data.success) {
      setPatientSuggestions(res.data.patients || []);
    }
  } catch {
    setPatientSuggestions([]);
  }
};

  // const handleSelectPatient = (p: Patient) => {
  //   setSelectedPatient(p);
  //   setSearchMobile(p.fullName);
  //   setPatientSuggestions([]);
  // };
  const handleSelectPatient = (patient: Patient) => {
  setSelectedPatient(patient);
  setSearchText(`${patient.fullName} (${patient.mobileNumber})`);
  setPatientSuggestions([]);
};

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !doctorId || !wardId || !bedId || !reason) {
      toast.error("Required fields are missing");
      return;
    }

    try {
      const res = await api.post("/api/ipd/admit", {
        clinicId,
        patientId: selectedPatient._id,
        doctorId,
        wardId,
        bedId,
        reasonForAdmission: reason,
        emergencyContactName: emName,
        emergencyContactRelation: emRelation,
        emergencyContactPhone: emPhone,
        initialDeposit: deposit,
      });

      if (res.data.success) {
        toast.success("Patient admitted to ward successfully!");
        setShowAdmitModal(false);
        // Clear
        setSelectedPatient(null);
        // setSearchMobile("");
        setDoctorId("");
        setWardId("");
        setBedId("");
        setReason("");
        setEmName("");
        setEmRelation("");
        setEmPhone("");
        setDeposit(0);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Admission allocation failed");
    }
  };

  const openDischarge = (adm: Admission) => {
    setSelectedAdmission(adm);
    setDischargeCondition("Recovered");
    setDischargeAdvice("");
    setFollowUpDate("");
    setShowDischargeModal(true);
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission || !dischargeCondition || !dischargeAdvice) {
      toast.error("Condition and Advice are required");
      return;
    }

    try {
      const res = await api.post(`/api/ipd/discharge/${selectedAdmission._id}`, {
        conditionAtDischarge: dischargeCondition,
        advice: dischargeAdvice,
        followUpDate: followUpDate || undefined,
      });

      if (res.data.success) {
        toast.success("Patient discharged. Bed released.");
        setShowDischargeModal(false);
        fetchData();
      }
    } catch {
      toast.error("Failed to process patient discharge");
    }
  };

  // Get available beds based on selected ward
  const availableBeds = wards.find((w) => w._id === wardId)?.beds.filter((b) => b.status === "Available") || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full font-sans text-gray-900">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <ClipboardDocumentListIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">In-Patient Admissions (IPD)</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track current ward occupancy, admit patients, and charting notes</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdmitModal(true)}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-colors"
        >
          <UserPlusIcon className="w-5 h-5" />
          Admit Patient
        </button>
      </div>

      {/* Roster Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {admissions.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No inpatient admission records registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">Admitting Doctor</th>
                  <th className="py-4 px-6">Location Allocated</th>
                  <th className="py-4 px-6">Date Admitted</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {admissions.map((adm) => (
                  <tr key={adm._id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <h4 className="font-bold text-gray-950 text-base">{adm.patientId?.fullName}</h4>
                      <span className="text-xs text-gray-400">
                        {adm.patientId?.gender}, {adm.patientId?.age} yrs • {adm.patientId?.mobileNumber}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <h4 className="font-semibold text-gray-800">Dr. {adm.doctorId?.fullName}</h4>
                      <span className="text-xs text-gray-450">{adm.doctorId?.specialization}</span>
                    </td>
                    <td className="py-4 px-6">
                      <h4 className="font-semibold text-gray-800">{adm.wardId?.name}</h4>
                      <span className="text-xs text-gray-450">Bed: {adm.bedNumber}</span>
                    </td>
                    <td className="py-4 px-6 text-xs font-semibold text-gray-500">
                      {new Date(adm.admissionDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          adm.status === "Admitted"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }`}
                      >
                        {adm.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/clinicDashboard/${clinicId}/patient-charting/${adm._id}`)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer font-bold text-xs"
                        >
                          View Chart
                        </button>
                        {adm.status === "Admitted" && (
                          <button
                            onClick={() => openDischarge(adm)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 cursor-pointer font-bold text-xs"
                          >
                            Discharge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admit Patient Modal */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">IPD Patient Intake Admission</h3>
              <button onClick={() => setShowAdmitModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAdmit} className="p-6 space-y-5">
              
              {/* Search Patient Box */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Search Patient *</label>
                <div className="relative">
                  {/* <input
                    type="text"
                    required
                    placeholder="Enter mobile number to search patient"
                    value={search}
                    onChange={(e) => handlePatientSearch(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none"
                  /> */}
                  <input
  type="text"
  required
  placeholder="Search by patient name or mobile number"
  value={searchText}
  onChange={(e) => handlePatientSearch(e.target.value)}
  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none"
/>
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                </div>
                
                {patientSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {patientSuggestions.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => handleSelectPatient(p)}
                        className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm font-semibold"
                      >
                        <span>{p.fullName}</span>
                        <span className="text-xs text-gray-400">{p.mobileNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedPatient && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs text-blue-800 font-semibold flex items-center justify-between">
                    <span>Selected: {selectedPatient.fullName} ({selectedPatient.mobileNumber})</span>
                    <button type="button" onClick={() => setSelectedPatient(null)} className="text-blue-500 hover:underline">Clear</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Select Admitting Doctor *</label>
                  <select
                    required
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.fullName} ({doc.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Select Ward *</label>
                  <select
                    required
                    value={wardId}
                    onChange={(e) => {
                      setWardId(e.target.value);
                      setBedId("");
                    }}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                  >
                    <option value="">Select Ward</option>
                    {wards.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.type} Ward - ₹{w.chargePerDay}/day)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Select Available Bed *</label>
                  <select
                    required
                    value={bedId}
                    onChange={(e) => setBedId(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                    disabled={!wardId}
                  >
                    <option value="">Select Bed</option>
                    {availableBeds.map((b) => (
                      <option key={b._id} value={b._id}>
                        Bed {b.bedNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Initial Advance Deposit (₹)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Reason for Admission *</label>
                <textarea
                  required
                  placeholder="Primary clinical complaints or diagnosis summary..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl p-3 text-sm outline-none resize-none"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <span className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Emergency Contact Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={emName}
                      onChange={(e) => setEmName(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={emRelation}
                      onChange={(e) => setEmRelation(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={emPhone}
                      onChange={(e) => setEmPhone(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3.5 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdmitModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discharge Modal */}
      {showDischargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">Process Patient Discharge</h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleDischarge} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Condition at Discharge *</label>
                <select
                  value={dischargeCondition}
                  onChange={(e) => setDischargeCondition(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="Recovered">Recovered</option>
                  <option value="Improved">Improved</option>
                  <option value="Referred">Referred</option>
                  <option value="LAMA">LAMA (Left Against Medical Advice)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Discharge Advice / Medicines *</label>
                <textarea
                  required
                  placeholder="Enter medical instructions, dosage advice, etc."
                  value={dischargeAdvice}
                  onChange={(e) => setDischargeAdvice(e.target.value)}
                  rows={4}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl p-4 text-sm outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Follow-up Date (optional)</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  Discharge Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
