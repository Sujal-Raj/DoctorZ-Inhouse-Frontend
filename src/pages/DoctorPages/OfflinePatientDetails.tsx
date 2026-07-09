import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Hash,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UserSquare2,
} from "lucide-react";
import api from "../../Services/mainApi";

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
  aadhar: string;
  diagnosis: string;
  diseases: string[];
  prescriptions: string[];
  currentMedications: string[];
  allergies: string[];
  pastSurgeries?: string[];
  reports: string[];
  createdAt: string;
}

interface EMRResponse {
  emr: EMRRecord[];
}

const themeColor = "#0c213e";

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

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "#fff7e6", text: "#b45309", label: "Pending" },
  completed: { bg: "#e6fef0", text: "#0a7d32", label: "Completed" },
  cancelled: { bg: "#fef2f2", text: "#b91c1c", label: "Cancelled" },
};

const OfflinePatientDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { drId, userId } = useParams<{ drId: string; userId: string }>();

  const [booking, setBooking] = useState<OfflineBooking | null>(
    location.state?.booking ?? null
  );
  const [appointmentHistory, setAppointmentHistory] = useState<OfflineBooking[]>([]);
  const [emrRecords, setEmrRecords] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(!location.state?.booking);

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

        setAppointmentHistory(history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (error) {
        console.error("Failed to load patient appointment history:", error);
      }
    };

    fetchHistory();
  }, [drId, userId]);

  const patientAadhar =
    typeof booking?.userId === "object" && booking.userId?.aadhar
      ? booking.userId.aadhar
      : (typeof booking?.userId === "object" && booking.userId?._id
        ? booking.userId._id
        : (typeof booking?.userId === "string"
          ? booking.userId
          : ""));

  useEffect(() => {
    if (!patientAadhar) return;

    const fetchEMR = async () => {
      try {
        const res = await api.get<EMRResponse>(`/api/emr/${patientAadhar}`);
        setEmrRecords(res.data.emr || []);
      } catch (error) {
        console.error("Failed to load patient EMR:", error);
        setEmrRecords([]);
      }
    };

    fetchEMR();
  }, [patientAadhar]);

  const patientName =
    typeof booking?.userId === "object" && booking.userId?.fullName
      ? booking.userId.fullName
      : booking?.patient || "Unknown Patient";

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

  const status = booking?.status ? statusStyles[booking.status] : statusStyles.pending;

  return (
    <main className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </button>

        {loading ? (
          <div className="flex min-h-96 items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-gray-500">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading patient details...
            </div>
          </div>
        ) : !booking ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">Patient details not found</h2>
            <p className="mt-2 text-sm text-gray-500">
              This offline patient record could not be loaded.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <section
              className="px-6 py-6 text-white"
              style={{ background: `linear-gradient(135deg, ${themeColor}, #173d68)` }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold shadow-inner">
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-100">
                      Offline Patient
                    </p>
                    <h1 className="text-2xl font-bold">{patientName}</h1>
                  </div>
                </div>

                <span
                  className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: status.bg, color: status.text }}
                >
                  {status.label}
                </span>
              </div>
            </section>

            <section className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Full Name
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">{patientName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Gender
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">{patientGender}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Age
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">{patientAge} yrs</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Contact
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {patientPhone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Email
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">{patientEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Booked By
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800 capitalize">
                        {booking.bookedBy || "Reception"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Appointment History</h2>
                  </div>

                  {appointmentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {appointmentHistory.map((entry) => (
                        <div key={entry._id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {formatDate(entry.date)}
                            </span>
                            <span
                              className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                              style={{
                                background: statusStyles[entry.status]?.bg || "#f3f4f6",
                                color: statusStyles[entry.status]?.text || "#374151",
                              }}
                            >
                              {statusStyles[entry.status]?.label || entry.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <Hash className="h-3 w-3" /> Token {entry.tokenNumber}
                            </span>
                            <span>₹{entry.fees}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No previous appointments found.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs md:col-span-2">
                  <div className="mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                    <Stethoscope className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-bold text-gray-900">Patient EMR Timeline</h2>
                  </div>

                  {emrRecords.length > 0 ? (
                    <div className="relative border-l border-gray-200 ml-4 space-y-6">
                      {emrRecords.map((record) => (
                        <div key={record._id} className="relative pl-6 pb-2">
                          <span className="absolute -left-3 top-1 flex items-center justify-center w-6 h-6 bg-blue-50 border-2 border-[#0c213e] rounded-full ring-4 ring-white">
                            <Stethoscope className="w-3 h-3 text-[#0c213e]" />
                          </span>
                          <div className="bg-gray-50/50 border border-gray-150 p-5 rounded-xl shadow-xs">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                              <h3 className="font-bold text-[#0c213e] text-base">
                                {record.diagnosis || "General Medical Consultation"}
                              </h3>
                              <span className="text-xs font-semibold text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                                {formatDate(record.createdAt)}
                              </span>
                            </div>

                            {/* Symptoms / Diseases */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-650">
                              <div>
                                <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Diagnosed Conditions</span>
                                <p className="mt-0.5 font-semibold text-gray-800">
                                  {record.diseases?.length ? record.diseases.join(", ") : "Not documented"}
                                </p>
                              </div>
                              <div>
                                <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-0.5">Allergies Flagged</span>
                                <p className="mt-0.5 font-bold text-red-650">
                                  {record.allergies?.length ? record.allergies.join(", ") : "None Reported"}
                                </p>
                              </div>
                            </div>

                            {/* Current Medications */}
                            {record.currentMedications && record.currentMedications.length > 0 && (
                              <div className="mt-4 text-xs">
                                <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-1">Prescribed Medication Course</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {record.currentMedications.map((med, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-semibold">
                                      {med}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Uploaded Diagnostic Reports */}
                            {record.reports && record.reports.length > 0 && (
                              <div className="mt-4 text-xs">
                                <span className="font-bold uppercase tracking-wider text-[9px] text-gray-400 block mb-1">Diagnostic Report Attachments</span>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                  {record.reports.map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-blue-600 font-bold transition-colors shadow-2xs"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                                      View Report #{idx + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic py-6 text-center">No consultation timeline history found.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Visit Details</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-500">Token Number</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <Hash className="h-4 w-4 text-gray-400" />
                        {booking.tokenNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-500">Visit Date</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        {formatDate(booking.date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-500">Consultation Fee</span>
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <CircleDollarSign className="h-4 w-4 text-gray-400" />
                        ₹{booking.fees}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                      <span className="text-sm text-gray-500">Payment Status</span>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          background: booking.paid ? "#e6fef0" : "#fef2f2",
                          color: booking.paid ? "#0a7d32" : "#b91c1c",
                        }}
                      >
                        {booking.paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
                  </div>

                  {emrRecords.some((record) => record.prescriptions?.length) ? (
                    <div className="space-y-2">
                      {emrRecords.flatMap((record) =>
                        record.prescriptions?.length
                          ? record.prescriptions.map((item, index) => (
                              <div key={`${record._id}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                {item}
                              </div>
                            ))
                          : []
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No prescriptions found.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Medical History</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Allergies</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {emrRecords[0]?.allergies?.length ? (
                          emrRecords[0].allergies.map((item, index) => (
                            <span key={`${item}-${index}`} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">None reported</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Diseases</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {emrRecords[0]?.diseases?.length ? (
                          emrRecords[0].diseases.map((item, index) => (
                            <span key={`${item}-${index}`} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No disease history found</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Current Medications</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {emrRecords[0]?.currentMedications?.length ? (
                          emrRecords[0].currentMedications.map((item, index) => (
                            <span key={`${item}-${index}`} className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No current medications listed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Past Surgeries</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {emrRecords[0]?.pastSurgeries?.length ? (
                          emrRecords[0].pastSurgeries.map((item, index) => (
                            <span key={`${item}-${index}`} className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">No past surgeries recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <UserSquare2 className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Booking Summary</h2>
                  </div>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Booking ID</span>
                      <span className="font-semibold">{booking._id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Booking Time</span>
                      <span className="font-semibold">{formatDateTime(booking.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default OfflinePatientDetails;
