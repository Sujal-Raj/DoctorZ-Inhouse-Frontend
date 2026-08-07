import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../Services/mainApi";
import {
  User, Calendar, AlertCircle, Stethoscope, FileText, Pill,
  ArrowLeft, ClipboardList, Paperclip, RefreshCw
} from "lucide-react";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface EMRRecord {
  _id: string;
  aadhar: string;
  diagnosis: string;
  diseases: string[];
  prescriptions: string[];
  currentMedications: string[];
  allergies: string[];
  pastSurgeries?: string[];
  reports: string[];
  createdAt: string;
  fullName?: string;
}

interface EMRResponse {
  emr: EMRRecord[];
}

export default function PatientEMR() {
  const { aadhar } = useParams<{ aadhar: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [emrData, setEmrData] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEMR = async () => {
      if (!aadhar) return;
      try {
        setLoading(true);
        let records: EMRRecord[] = [];
        
        // 1. If it's a valid numeric Aadhar, try fetching by Aadhar
        if (aadhar !== "unknown" && aadhar !== "undefined" && aadhar !== "null" && !isNaN(Number(aadhar))) {
          try {
            const res = await api.get<EMRResponse>(`/api/emr/${aadhar}`);
            if (res.data?.emr?.length > 0) {
              records = res.data.emr;
            }
          } catch (e) {
            // ignore to fallback
          }
        }
        
        // 2. Fallback to name-based query if no records found and name is in state
        const stateName = location.state?.name;
        if (records.length === 0 && stateName) {
          try {
            const res = await api.get<{ emr: EMRRecord[] }>(`/api/emr/name/${encodeURIComponent(stateName)}`);
            if (res.data?.emr?.length > 0) {
              records = res.data.emr;
            }
          } catch (e) {
            // ignore
          }
        }
        
        setEmrData(records);
      } catch (err) {
        console.error("Error fetching EMR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEMR();
  }, [aadhar, location.state]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] font-[Poppins]">
        <RefreshCw className="w-10 h-10 text-[#0c213e] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Retrieving Electronic Medical Records...</p>
      </div>
    );
  }

  // Fallback name if EMR list is empty
  const displayName = location.state?.name || "Patient";

  return (
    <div className="p-6 font-[Poppins] min-h-screen bg-gray-50/50 space-y-6 w-full">
      
      {/* ─── Navigation Header ─── */}
      <div className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Patient EMR /</span>
          <span className="font-semibold text-gray-700">{displayName}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-[#0c213e]" />
            Electronic Medical Records (EMR)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse structured clinical visit summaries, diagnosed illnesses, allergies, and reports.
          </p>
        </div>
      </div>

      {emrData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 max-w-xl mx-auto shadow-xs">
          <FileText className="w-16 h-16 mx-auto text-gray-300 stroke-[1.2] mb-3" />
          <h4 className="text-base font-bold text-gray-800">No EMR Logs Available</h4>
          <p className="text-xs text-gray-400 mt-1">No medical history records matching this patient were located.</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-6xl">
          {emrData.map((record) => (
            <div
              key={record._id}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:border-blue-300 transition duration-150"
            >
              
              {/* EMR Entry Title Block */}
              <div className="bg-[#0c213e] p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-200" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{record.fullName || displayName}</h3>
                    <p className="text-blue-200 text-xs mt-0.5">Aadhar Card: {record.aadhar || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
                  <Calendar className="w-4 h-4" />
                  <span>Recorded on {formatDate(record.createdAt)}</span>
                </div>
              </div>

              {/* Grid content columns */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Allergies Card */}
                <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-bold">
                    <AlertCircle className="w-4.5 h-4.5" />
                    <span className="text-xs uppercase tracking-wider">Allergies</span>
                  </div>

                  {record.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {record.allergies.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No allergies reported</p>
                  )}
                </div>

                {/* Chronic Diseases Card */}
                <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-700 font-bold">
                    <Stethoscope className="w-4.5 h-4.5" />
                    <span className="text-xs uppercase tracking-wider">Chronic Illnesses</span>
                  </div>

                  {record.diseases.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {record.diseases.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No chronic diseases registered</p>
                  )}
                </div>

                {/* Past Surgeries Card */}
                <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-700 font-bold">
                    <FileText className="w-4.5 h-4.5" />
                    <span className="text-xs uppercase tracking-wider">Past Surgeries</span>
                  </div>

                  {record.pastSurgeries?.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {record.pastSurgeries.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No past surgery logs</p>
                  )}
                </div>

                {/* Current Medications Card */}
                <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <Pill className="w-4.5 h-4.5" />
                    <span className="text-xs uppercase tracking-wider">Current Medications</span>
                  </div>

                  {record.currentMedications.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {record.currentMedications.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded-lg text-xs font-semibold"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No active medications registered</p>
                  )}
                </div>

              </div>

              {/* Reports block */}
              {record.reports.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-xl border border-gray-150 p-4">
                    <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                      <Paperclip className="w-4 h-4" />
                      <span>Attached Lab Diagnostics / Reports ({record.reports.length})</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {record.reports.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-blue-400 text-[#0c213e] hover:text-blue-900 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-gray-400" />
                          Diagnostic Report #{idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
