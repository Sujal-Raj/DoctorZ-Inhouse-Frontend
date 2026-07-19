import React, { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import { toast } from "react-toastify";
import { PlusIcon, UserGroupIcon, BuildingOffice2Icon, HeartIcon } from "@heroicons/react/24/outline";

interface Referral {
  _id: string;
  referralId: string;
  type: string;
  patientId: any;
  referredByDoctorId: any;
  referredToDoctorId: any;
  referredToHospitalId: any;
  referredToLabId: any;
  externalHospitalName?: string;
  externalLabName?: string;
  reason: string;
  priority: string;
  status: string;
  createdAt: string;
  attachments?: any[];
}

export default function ReferralManagement() {
  const { clinicId } = useParams();
  const isLab = window.location.pathname.includes("lab-dashboard");
  const currentUserId = isLab ? localStorage.getItem("labId") : clinicId;
  const authToken = isLab ? localStorage.getItem("token") : localStorage.getItem("clinicToken");

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clinicPatients, setClinicPatients] = useState<any[]>([]);
  
  const [newReferral, setNewReferral] = useState({
    type: "HOSPITAL_TO_HOSPITAL",
    patientId: "",
    referredToHospitalId: "",
    referredToLabId: "",
    reason: "",
    priority: "Routine"
  });
  const [creating, setCreating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState<string | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const res = await api.get(`/api/referral/searchTargets?query=${searchTerm}`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (res.data.success) {
            // Filter out the current user itself
            setSearchResults(res.data.results.filter((r: any) => r._id !== currentUserId));
          }
        } catch (err) {
          console.error("Failed to search targets", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  useEffect(() => {
    fetchReferrals();
    if (clinicId) {
      fetchClinicPatients();
    }
  }, [clinicId]);

  const fetchClinicPatients = async () => {
    try {
      const res = await api.get(`/api/clinic/getAllClinicPatients/${clinicId}`);
      if (res.data.patients) {
        setClinicPatients(res.data.patients);
      }
    } catch (err) {
      console.error("Failed to fetch clinic patients", err);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/referral`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data.success) {
        setReferrals(res.data.referrals);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch referrals");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await api.put(`/api/referral/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data.success) {
        toast.success(`Referral marked as ${status}`);
        fetchReferrals();
      }
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReferral.patientId || !newReferral.reason) {
      return toast.error("Please fill required fields (Patient ID, Reason)");
    }
    
    try {
      setCreating(true);
      const res = await api.post(`/api/referral/create`, newReferral, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data.success) {
        toast.success("Referral created successfully");
        setShowCreateModal(false);
        fetchReferrals();
        setNewReferral({
          type: "HOSPITAL_TO_HOSPITAL",
          patientId: "",
          referredToHospitalId: "",
          referredToLabId: "",
          reason: "",
          priority: "Routine"
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create referral");
    } finally {
      setCreating(false);
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadModal) return;

    try {
      setUploading(true);
      const formData = new FormData();
      if (reportFile) formData.append("report", reportFile);
      if (reportMessage) formData.append("message", reportMessage);

      const res = await api.post(`/api/referral/${showUploadModal}/upload-report`, formData, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data" 
        }
      });

      if (res.data.success) {
        toast.success("Report uploaded successfully!");
        setShowUploadModal(null);
        setReportFile(null);
        setReportMessage("");
        fetchReferrals();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredReferrals = referrals.filter(ref => {
    const isSender = isLab ? false : (ref.referredByHospitalId?._id === currentUserId || ref.referredByHospitalId === currentUserId);
    if (activeTab === "incoming") return !isSender;
    return isSender;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{isLab ? "Lab Referrals" : "Referral Network"}</h1>
          <p className="text-slate-500 mt-1">Manage incoming and outgoing patient referrals</p>
        </div>
        {!isLab && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Create Referral</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "incoming" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Incoming Referrals
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
            activeTab === "outgoing" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Outgoing Referrals
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReferrals.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
            <UserGroupIcon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700">No Referrals Found</h3>
            <p className="text-slate-500">Your {activeTab} referral inbox is currently empty.</p>
          </div>
        ) : (
          filteredReferrals.map((ref) => (
            <div key={ref._id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  ref.priority === "Emergency" ? "bg-red-100 text-red-600" :
                  ref.priority === "Urgent" ? "bg-orange-100 text-orange-600" :
                  "bg-blue-100 text-blue-600"
                }`}>
                  {ref.priority}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  ref.status === "Pending" ? "bg-amber-100 text-amber-700" :
                  ref.status === "Accepted" ? "bg-emerald-100 text-emerald-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {ref.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {ref.patientId?.fullName || "Unknown Patient"}
              </h3>
              <p className="text-sm text-slate-500 mb-4">{ref.reason}</p>

              <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded-xl mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <BuildingOffice2Icon className="w-4 h-4 text-slate-400" />
                  <span>From: {ref.referredByDoctorId?.fullName || "Hospital"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <HeartIcon className="w-4 h-4 text-slate-400" />
                  <span>To: {ref.referredToDoctorId?.fullName || ref.referredToHospitalId?.clinicName || ref.externalHospitalName || ref.referredToLabId?.name || ref.externalLabName || "External Organization"}</span>
                </div>
              </div>

              {ref.status === "Pending" && activeTab === "incoming" && (
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => updateStatus(ref._id, "Accepted")}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-sm transition-colors"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => updateStatus(ref._id, "Rejected")}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}

              {ref.status === "Accepted" && activeTab === "incoming" && isLab && (
                <div className="mt-4">
                  <button 
                    onClick={() => setShowUploadModal(ref._id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" /> Upload Report
                  </button>
                </div>
              )}

              {ref.status === "Completed" && ref.attachments && ref.attachments.length > 0 && (
                <div className="mt-4">
                  <a 
                    href={ref.attachments[0].url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 block text-center"
                  >
                    View Report
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create Referral</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Referral Type</label>
                <select 
                  value={newReferral.type} 
                  onChange={(e) => setNewReferral({...newReferral, type: e.target.value, referredToHospitalId: "", referredToLabId: ""})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="HOSPITAL_TO_HOSPITAL">To Another Hospital/Clinic</option>
                  <option value="HOSPITAL_TO_LAB">To a Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Select Patient <span className="text-red-500">*</span></label>
                <select 
                  value={newReferral.patientId}
                  onChange={(e) => setNewReferral({...newReferral, patientId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  required
                >
                  <option value="">-- Choose a patient --</option>
                  {clinicPatients.filter(p => p.patientId).map(p => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.patientName} (Phone: {p.contact || "N/A"})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Only registered app patients can be referred.</p>
              </div>

              <div className="relative">
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  {newReferral.type === "HOSPITAL_TO_HOSPITAL" ? "Referred To Hospital" : "Referred To Lab"}
                </label>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                    if (newReferral.type === "HOSPITAL_TO_HOSPITAL") {
                      setNewReferral({...newReferral, referredToHospitalId: e.target.value, referredToLabId: ""});
                    } else {
                      setNewReferral({...newReferral, referredToLabId: e.target.value, referredToHospitalId: ""});
                    }
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  placeholder={`Search ${newReferral.type === "HOSPITAL_TO_HOSPITAL" ? "Hospital" : "Lab"} Name or ID...`}
                />
                
                {showDropdown && (searchTerm.length >= 2) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-slate-500 text-center">Searching...</div>
                    ) : searchResults.filter(r => r.type === (newReferral.type === "HOSPITAL_TO_HOSPITAL" ? "HOSPITAL" : "LAB")).length > 0 ? (
                      searchResults.filter(r => r.type === (newReferral.type === "HOSPITAL_TO_HOSPITAL" ? "HOSPITAL" : "LAB")).map((result) => (
                        <div 
                          key={result._id} 
                          className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                          onClick={() => {
                            setSearchTerm(result.name);
                            if (newReferral.type === "HOSPITAL_TO_HOSPITAL") {
                              setNewReferral({...newReferral, referredToHospitalId: result._id, referredToLabId: ""});
                            } else {
                              setNewReferral({...newReferral, referredToLabId: result._id, referredToHospitalId: ""});
                            }
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-semibold text-slate-800">{result.name}</div>
                          <div className="text-xs text-slate-500">{result.customId} • {result.location}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-slate-500">
                        No registered match found. This will be sent as an external referral.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Priority</label>
                <select 
                  value={newReferral.priority} 
                  onChange={(e) => setNewReferral({...newReferral, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Reason <span className="text-red-500">*</span></label>
                <textarea 
                  value={newReferral.reason}
                  onChange={(e) => setNewReferral({...newReferral, reason: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50 h-24"
                  placeholder="Why is this patient being referred?"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Submit Referral"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Upload Lab Report</h2>
            <form onSubmit={handleUploadReport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Upload File (PDF/Image) <span className="text-red-500">*</span></label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Message / Remarks (Optional)</label>
                <textarea 
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 min-h-[100px]"
                  placeholder="Any notes for the referring doctor?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowUploadModal(null);
                    setReportFile(null);
                    setReportMessage("");
                  }}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading || !reportFile}
                  className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? "Uploading..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
