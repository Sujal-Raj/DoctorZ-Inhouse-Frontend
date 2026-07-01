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
    typeof booking?.userId === "object" && booking.userId?.aadhar ? booking.userId.aadhar : "";

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
          <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-sm">
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

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-[#0c213e]" />
                    <h2 className="text-lg font-semibold text-gray-900">Consultation Records</h2>
                  </div>

                  {emrRecords.length > 0 ? (
                    <div className="space-y-3">
                      {emrRecords.slice(0, 3).map((record) => (
                        <div key={record._id} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {record.diagnosis || "General Consultation"}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(record.createdAt)}</span>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Diseases: {record.diseases?.length ? record.diseases.join(", ") : "None reported"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Reports: {record.reports?.length || 0}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No consultation records found.</p>
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
