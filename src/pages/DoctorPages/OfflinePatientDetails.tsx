import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  Hash,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  Heart,
  AlertTriangle,
  IndianRupee,
  FileSpreadsheet,
  ChevronRight
} from "lucide-react";
import api from "../../Services/mainApi";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface UserProfile {
  _id?: string;
  fullName?: string;
  mobileNumber?: string;
  contact?: string;
  email?: string;
  age?: number;
  gender?: string;
  photo?: string;
  aadhar?: string;
}

interface OfflineBooking {
  _id: string;
  doctorId: string;
  userId: UserProfile | string | null;
  patient?: string;
  tokenNumber: number;
  date: string;
  fees: number;
  status: "pending" | "completed" | "cancelled";
  paid?: boolean;
  bookedBy?: string;
  source: "offline";
}

interface EMRRecord {
  _id: string;
  doctorId: string | null;
  fullName: string;
  mobileNumber: string;
  aadhar: string | null;
  allergies: string[];
  diseases: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  reports: string[];
  prescriptionId: string[];
  createdAt: string;
  updatedAt: string;
}

interface PrescriptionItem {
  _id: string;
  name?: string;
  patientAadhar?: string;
  mobileNumber?: string;
  diagnosis?: string;
  title?: string;
  notes?: string;
  pdfUrl?: string;
  recommendedTests?: string[];
  medicines?: Array<{ name?: string; dosage?: string; quantity?: string } | string>;
  prescriptions?: string[];
  doctorId?:
    | {
        _id?: string;
        fullName?: string;
        specialization?: string;
      }
    | string;
  createdAt?: string;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

export default function OfflinePatientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { drId, userId } = useParams<{ drId: string; userId: string }>();

  const [booking, setBooking] = useState<OfflineBooking | null>(
    location.state?.booking ?? null
  );
  const [appointmentHistory, setAppointmentHistory] = useState<OfflineBooking[]>([]);
  const [emrRecords, setEmrRecords] = useState<EMRRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // ─── Fetch Core Booking Data ────────────────────────────────────────────────

  useEffect(() => {
    if (location.state?.booking) {
      setBooking(location.state.booking as OfflineBooking);
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      if (!drId || !userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get<{ bookings: OfflineBooking[] }>(
          `/api/bookOffline/doctor/${drId}/all-patient`
        );

        const selected = (res.data.bookings || []).find((item) => {
          const itemUserId =
            typeof item.userId === "object" && item.userId ? item.userId._id : item.userId;
          return String(itemUserId) === String(userId);
        });

        setBooking(selected ?? null);
      } catch (error) {
        console.error("Failed to load offline patient details:", error);
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [drId, userId, location.state]);

  // ─── Fetch Appointment History ──────────────────────────────────────────────

  useEffect(() => {
    if (!drId || !userId) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get<{ bookings: OfflineBooking[] }>(
          `/api/bookOffline/doctor/${drId}/all-patient`
        );

        const history = (res.data.bookings || []).filter((item) => {
          const itemUserId =
            typeof item.userId === "object" && item.userId ? item.userId._id : item.userId;
          return String(itemUserId) === String(userId);
        });

        setAppointmentHistory(
          history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
      } catch (error) {
        console.error("Failed to load patient appointment history:", error);
      }
    };

    fetchHistory();
  }, [drId, userId]);

  // ─── Patient Details Resolution ─────────────────────────────────────────────

  const patientName =
    typeof booking?.userId === "object" && booking.userId?.fullName
      ? booking.userId.fullName
      : booking?.patient || "Walk-in Patient";

  const patientAge =
    typeof booking?.userId === "object" && booking.userId?.age ? booking.userId.age : "—";

  const patientGender =
    typeof booking?.userId === "object" && booking.userId?.gender ? booking.userId.gender : "—";

  const patientPhone =
    typeof booking?.userId === "object" && booking.userId?.mobileNumber
      ? booking.userId.mobileNumber
      : typeof booking?.userId === "object" && booking.userId?.contact
      ? booking.userId.contact
      : "—";

  const patientEmail =
    typeof booking?.userId === "object" && booking.userId?.email ? booking.userId.email : "—";

  const patientAadhar =
    typeof booking?.userId === "object" && booking.userId?.aadhar ? booking.userId.aadhar : "";

  // ─── Fetch EMR Profiles by Name ────────────────────────────────────────────

  useEffect(() => {
    const fetchEMR = async () => {
      const name = patientName?.trim();

      if (!name || name === "Walk-in Patient") {
        setEmrRecords([]);
        return;
      }

      try {
        const res = await api.get<{ message: string; emr: EMRRecord[] }>(
          `/api/emr/name/${encodeURIComponent(name)}`
        );
        setEmrRecords(res.data.emr || []);
      } catch (error) {
        console.error("Failed to load patient EMR:", error);
        setEmrRecords([]);
      }
    };

    fetchEMR();
  }, [patientName]);

  // ─── Fetch Prescriptions by Name/Mobile ─────────────────────────────────────

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const name = patientName?.trim();
      if (!name || name === "Walk-in Patient") {
        setPrescriptions([]);
        return;
      }

      try {
        setPrescriptionLoading(true);
        const queryParams = new URLSearchParams();
        queryParams.append("name", name);
        if (patientPhone !== "—") {
          queryParams.append("mobileNumber", String(patientPhone));
        }

        const res = await api.get<{ prescriptions: PrescriptionItem[] }>(
          `/api/prescription/prescriptions?${queryParams.toString()}`
        );
        setPrescriptions(res.data.prescriptions || []);
      } catch (error) {
        console.error("Failed to load prescriptions:", error);
        setPrescriptions([]);
      } finally {
        setPrescriptionLoading(false);
      }
    };

    fetchPrescriptions();
  }, [patientName, patientPhone]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium font-[Poppins]">Loading Clinical Profile Details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8 text-center max-w-xl mx-auto font-[Poppins]">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Patient Profile Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">
          The requested offline patient registration record could not be located in the database indexes.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 inline-flex items-center gap-2 bg-[#0c213e] hover:bg-blue-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
      </div>
    );
  }

  const activeStatus = statusStyles[booking.status] || statusStyles.pending;

  return (
    <main className="min-h-screen bg-gray-50/50 pb-12 font-[Poppins] px-6 py-6 w-full">
      <div className="max-w-full w-full mx-auto space-y-6">

        {/* ─── Header & Nav ─── */}
        <div className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl shadow-xs">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patient List
          </button>
          
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Clinical Registry /</span>
            <span className="font-semibold text-gray-700">{patientName}</span>
          </div>
        </div>

        {/* ─── Main Content Layout Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ─── Left Column (EMR & Prescriptions) ─── */}
          <section className="lg:col-span-8 space-y-6">
            
            {/* Patient Header Bio Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-50 text-[#0c213e] border border-blue-150 rounded-2xl flex items-center justify-center font-bold text-2xl">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 capitalize">{patientName}</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      {patientAge !== "—" ? `${patientAge} Yrs` : "Age: N/A"} • {patientGender}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Phone: {patientPhone} | Aadhar: {patientAadhar || "N/A"}
                    </p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold border ${activeStatus.bg} ${activeStatus.text} ${activeStatus.border} self-start sm:self-center`}>
                  Status: {booking.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Prescriptions History Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-gray-150 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-[#0c213e]" />
                  <h2 className="text-lg font-bold text-gray-900">Visit Prescriptions</h2>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded">
                  {prescriptions.length} Records
                </span>
              </div>

              {prescriptionLoading ? (
                <div className="flex items-center gap-2 py-8 text-gray-500 text-sm justify-center">
                  <div className="w-5 h-5 border-2 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
                  Loading prescription logs...
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions.map((item) => {
                    const doctorName =
                      typeof item.doctorId === "object" ? item.doctorId?.fullName || "—" : "—";
                    const specialization =
                      typeof item.doctorId === "object" ? item.doctorId?.specialization || "—" : "—";

                    const medicines =
                      item.medicines?.length
                        ? item.medicines
                            .map((m) => (typeof m === "string" ? m : m?.name || ""))
                            .filter(Boolean)
                        : [];

                    return (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 hover:border-blue-300 transition duration-150"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-gray-200 pb-3 mb-4">
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">
                              {item.diagnosis || "No Diagnosis Provided"}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Prescribed by: <span className="font-semibold text-gray-700">Dr. {doctorName}</span> • {specialization}
                            </p>
                          </div>

                          {item.createdAt && (
                            <span className="inline-flex w-fit rounded-lg bg-blue-50/60 border border-blue-100 px-2.5 py-1 text-xs font-bold text-[#0c213e]">
                              {formatDateTime(item.createdAt)}
                            </span>
                          )}
                        </div>

                        {/* Prescribed details grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="bg-white p-3.5 rounded-xl border border-gray-150">
                            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Medicines</span>
                            <p className="text-gray-800 font-semibold leading-relaxed">
                              {medicines.length > 0
                                ? medicines.join(", ")
                                : item.prescriptions?.length
                                ? item.prescriptions.join(", ")
                                : "No medicines added"}
                            </p>
                          </div>

                          <div className="bg-white p-3.5 rounded-xl border border-gray-150">
                            <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Recommended Tests</span>
                            <p className="text-gray-800 font-semibold leading-relaxed">
                              {item.recommendedTests?.length ? item.recommendedTests.join(", ") : "None"}
                            </p>
                          </div>

                          {item.notes && (
                            <div className="bg-white p-3.5 rounded-xl border border-gray-150 md:col-span-2">
                              <span className="text-gray-400 font-bold uppercase tracking-wider block mb-1">Clinical Notes</span>
                              <p className="text-gray-800 font-medium leading-relaxed">{item.notes}</p>
                            </div>
                          )}
                        </div>

                        {item.pdfUrl && (
                          <div className="mt-4 pt-3 border-t border-gray-150 flex justify-end">
                            <a
                              href={item.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-[#0c213e] hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              <FileText className="h-4.5 w-4.5" />
                              Print / View PDF
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 stroke-[1.2] mb-2" />
                  <p className="text-sm font-semibold">No Prescriptions Logged</p>
                  <p className="text-xs text-gray-400 mt-1">This patient does not have any saved visit drafts.</p>
                </div>
              )}
            </div>

          </section>

          {/* ─── Right Column (EMR & Booking metadata) ─── */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Vitals & Clinical History summary card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#0c213e]" />
                <h2 className="text-base font-bold text-gray-900">Medical Summary (EMR)</h2>
              </div>

              <div className="space-y-4">
                
                {/* Allergies */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Allergies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {emrRecords[0]?.allergies?.length ? (
                      emrRecords[0].allergies.map((item, idx) => (
                        <span key={idx} className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No allergies reported</span>
                    )}
                  </div>
                </div>

                {/* Chronic Diseases */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Chronic Diseases</span>
                  <div className="flex flex-wrap gap-1.5">
                    {emrRecords[0]?.diseases?.length ? (
                      emrRecords[0].diseases.map((item, idx) => (
                        <span key={idx} className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No chronic illness history</span>
                    )}
                  </div>
                </div>

                {/* Current medications */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Current Medications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {emrRecords[0]?.currentMedications?.length ? (
                      emrRecords[0].currentMedications.map((item, idx) => (
                        <span key={idx} className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No listed medications</span>
                    )}
                  </div>
                </div>

                {/* Past Surgeries */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1.5">Past Surgeries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {emrRecords[0]?.pastSurgeries?.length ? (
                      emrRecords[0].pastSurgeries.map((item, idx) => (
                        <span key={idx} className="bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-2.5 py-0.5 rounded-lg">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No surgeries reported</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Visit Details card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#0c213e]" />
                <h2 className="text-base font-bold text-gray-900">Visit Summary</h2>
              </div>

              <div className="space-y-3 text-xs">
                
                <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-150">
                  <span className="text-gray-400 font-bold uppercase">Token Number</span>
                  <span className="flex items-center gap-1 font-bold text-gray-800">
                    <Hash className="w-3.5 h-3.5 text-gray-400" />
                    Token #{booking.tokenNumber}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-150">
                  <span className="text-gray-400 font-bold uppercase">Date of Visit</span>
                  <span className="flex items-center gap-1.5 font-bold text-gray-800">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(booking.date)}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-150">
                  <span className="text-gray-400 font-bold uppercase">Consultation Fees</span>
                  <span className="flex items-center gap-1 font-bold text-gray-800">
                    <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                    {booking.fees}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-150">
                  <span className="text-gray-400 font-bold uppercase">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${booking.paid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {booking.paid ? "Paid" : "Unpaid"}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-150">
                  <span className="text-gray-400 font-bold uppercase">Booking ID</span>
                  <span className="font-semibold text-gray-700 font-mono select-all truncate max-w-[120px]">{booking._id}</span>
                </div>

              </div>
            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}