// import React, { useEffect, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { Phone, Search } from "lucide-react";
// import api from "../Services/mainApi";

// interface Patient {
//   _id: string;
//   name: string;
//   age: number;
//   gender: string;
//   contact: string;
//   aadhar: string;
//   photo?: string;
// }

// interface Booking {
//   _id: string;
//   patient: Patient | null;
//   mode: string;
//   fees: number;
//   roomId: string;
//   doctorId: string;
// }

// const AllPatient: React.FC = () => {
//   const navigate = useNavigate();
//   const { drId } = useParams<{ drId: string }>();

//   console.log("🚀 Doctor ID from params:", drId);

//   // Store the full bookings so you can access booking.roomId etc.
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     const fetchBookings = async () => {
//       if (!drId) return;
//       try {
//         const res = await api.get<{ bookings: Booking[] }>(
//           `/api/booking/doctor/${drId}/all-patient`
//         );
//         console.log("Bookings:", res.data.bookings);

//         setBookings(res.data.bookings);
//         // setBookings(res.data.bookings || []);
//       } catch (err) {
//         console.error("Error fetching patients:", err);
//       }
//     };
//     fetchBookings();
//   }, [drId]);

//   const handleViewEMR = (aadhar?: string) => {
//     if (!aadhar || !drId) return;
//     navigate(`/doctordashboard/${drId}/patientEMR/${aadhar}`);
//   };

//   const filteredPatients = bookings.filter((b) =>
//     b.patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//       {bookings.length === 0 ? (
//         <p className="text-gray-500 text-center sm:text-left">
//           No patients found.
//         </p>
//       ) : (
//         <div className="overflow-x-auto">
//           <table className="min-w-full text-left bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
//             <thead className="bg-gray-100 text-gray-700 text-xs sm:text-sm md:text-base">
//               <tr>
//                 <th className="px-3 sm:px-4 py-2">Name</th>
//                 <th className="px-3 sm:px-4 py-2">Gender</th>
//                 <th className="px-3 sm:px-4 py-2">Age</th>
//                 <th className="px-3 sm:px-4 py-2">Contact</th>
//                 <th className="px-3 sm:px-4 py-2">Call / Chat</th>
//               </tr>
//             </thead>
//             <tbody>
//               {bookings.map((booking) => {
//                 const patient = booking.patient;
//                 if (!patient) return null;
//                 return (
//                   <tr
//                     key={patient._id}
//                     className="border-t hover:bg-gray-50 text-xs sm:text-sm md:text-base"
//                   >
//                     <td className="px-3 sm:px-4 py-2 font-medium flex items-center gap-2">
//                       <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
//                       <span className="truncate">{patient.name || "-"}</span>
//                     </td>
//                     <td className="px-3 sm:px-4 py-2">{patient.gender || "-"}</td>
//                     <td className="px-3 sm:px-4 py-2">{patient.age ? `${patient.age} yrs` : "-"}</td>
//                     <td className="px-3 sm:px-4 py-2">
//                       <div className="flex items-center gap-2">
//                         <Phone size={18} className="text-gray-500 flex-shrink-0" />
//                         <span className="truncate">{patient.contact || "N/A"}</span>
//                       </div>
//                     </td>
//                     <td className="px-3 sm:px-4 py-2">
//                       <div className="flex flex-col sm:flex-row gap-2">
//                         <button
//                           onClick={() =>
//                             navigate(
//                               `/doctordashboard/${drId}/patientEMR/${patient.emrId}`
//                             )
//                           }
//                           className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm text-center"
//                         >
//                           View EMR
//                         </button>
//                         <a
//                           href={`tel:${patient.contact}`}
//                           className="px-2 sm:px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs sm:text-sm text-center"
//                         >
//                           Call
//                         </a>
//                         <button
//                           onClick={() =>
//                             navigate(`/doctor-chat/${booking.roomId}`, {
//                               state: {
//                                 patient,
//                                 doctorId: booking.doctorId,
//                                 roomId: booking.roomId,
//                               },
//                             })
//                           }
//                           className="px-2 sm:px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm text-center"
//                         >
//                           Chat
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Table */}
//         <div className="bg-white shadow-sm overflow-auto mt-6 rounded-lg">
//           {filteredPatients.length === 0 ? (
//             <p className="text-center text-gray-500 py-6">No patients found.</p>
//           ) : (
//             <table className="w-full text-left min-w-[900px] border-collapse">
//               <thead style={{ backgroundColor: themeColor }} className="text-white">
//                 <tr>
//                   <th className="px-4 py-3">Patient</th>
//                   <th className="px-4 py-3">Gender</th>
//                   <th className="px-4 py-3">Age</th>
//                   <th className="px-4 py-3">Contact</th>
//                   <th className="px-4 py-3 text-center">Actions</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {filteredPatients.map((booking) => (
//                   <tr key={booking._id} className="border-b border-gray-200 hover:bg-gray-50">

//                     {/* Patient */}
//                     <td className="px-4 py-4 flex items-center gap-3">
//                       <img
//                         src={
//                           booking.patient?.photo
//                             ? booking.patient.photo
//                             : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
//                         }
//                         alt="profile"
//                         className="w-12 h-12 rounded-lg object-cover border"
//                       />
//                       <div>
//                         <p className="font-semibold text-gray-900">
//                           {booking.patient?.name}
//                         </p>
//                         <p className="text-sm text-gray-500 capitalize">
//                           {booking.mode}
//                         </p>
//                       </div>
//                     </td>

//                     <td className="px-4 py-4">{booking.patient?.gender}</td>

//                     <td className="px-4 py-4">
//                       {booking.patient?.age ? `${booking.patient.age} yrs` : "-"}
//                     </td>

//                     {/* Contact */}
//                     <td className="px-4 py-4">
//                       <div className="flex items-center gap-2">
//                         <Phone className="w-5 h-5" style={{ color: themeColor }} />
//                         <span>{booking.patient?.contact}</span>
//                       </div>
//                     </td>

//                     {/* Actions */}
//                     <td className="px-4 py-4">
//                       <div className="flex flex-wrap gap-2 justify-center">

//                         <button
//                           onClick={() => handleViewEMR(booking.patient?.aadhar)}
//                           className="px-3 py-1 text-white rounded-lg text-sm"
//                           style={{ backgroundColor: emrColor }}
//                         >
//                           View EMR
//                         </button>

//                         <a
//                           href={`tel:${booking.patient?.contact}`}
//                           className="px-3 py-1 text-white rounded-lg text-sm"
//                           style={{ backgroundColor: callColor }}
//                         >
//                           Call
//                         </a>

//                         <button
//                           onClick={() =>
//                             navigate(`/doctor-chat/${booking.roomId}`, {
//                               state: {
//                                 patient: booking.patient,
//                                 doctorId: booking.doctorId,
//                                 roomId: booking.roomId,
//                               },
//                             })
//                           }
//                           className="px-3 py-1 text-white rounded-lg text-sm"
//                           style={{ backgroundColor: chatColor }}
//                         >
//                           Chat
//                         </button>

//                       </div>
//                     </td>

//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>

//       </div>
//     </main>
//   );
// };

// export default AllPatient;



import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Phone, Search, Video, MapPin, Hash } from "lucide-react";
import api from "../../Services/mainApi";

// ── Types ────────────────────────────────────────────────────────────────────

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  aadhar: string;
  photo?: string;
}

interface OnlineBooking {
  _id: string;
  patient: Patient | null;
  mode: string;
  fees: number;
  roomId: string;
  doctorId: string;
  meetingLink: string;
  source: "online";
}

interface OfflineBooking {
  _id: string;
  doctorId: string;
  userId: { _id: string; fullName: string };
  patient: string; // name string in offline
  tokenNumber: number;
  date: string;
  fees: number;
  status: "pending" | "completed" | "cancelled";
  paid?: boolean;
  bookedBy: string;
  source: "offline";
}

type AnyBooking = OnlineBooking | OfflineBooking;
type TabValue = "all" | "online" | "offline";

// ── Helpers ──────────────────────────────────────────────────────────────────

const isOnline = (b: AnyBooking): b is OnlineBooking => b.source === "online";
const isOffline = (b: AnyBooking): b is OfflineBooking => b.source === "offline";

const getPatientName = (b: AnyBooking) =>
  isOnline(b) ? b.patient?.name ?? "—" : b.patient;

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  pending:   { bg: "#fff7e6", text: "#b45309", label: "Pending" },
  completed: { bg: "#e6fef0", text: "#0a7d32", label: "Completed" },
  cancelled: { bg: "#fef2f2", text: "#b91c1c", label: "Cancelled" },
};

const themeColor = "#0c213e";
const emrColor   = "#28328C";
const callColor  = "#0a7d32";
const chatColor  = "#b434ef";

// ── Component ─────────────────────────────────────────────────────────────────

const AllPatient: React.FC = () => {
  const navigate = useNavigate();
  const { drId } = useParams<{ drId: string }>();

  const [onlineBookings, setOnlineBookings]   = useState<OnlineBooking[]>([]);
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState("");
  const [activeTab, setActiveTab]             = useState<TabValue>("all");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!drId) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [onlineRes, offlineRes] = await Promise.allSettled([
          api.get<{ bookings: Omit<OnlineBooking, "source">[] }>(
            `/api/booking/doctor/${drId}/all-patient`
          ),
          api.get<{ bookings: Omit<OfflineBooking, "source">[] }>(
            `/api/bookOffline/doctor/${drId}/all-patient`
          ),
        ]);

        if (onlineRes.status === "fulfilled") {
          setOnlineBookings(
            (onlineRes.value.data.bookings || []).map((b) => ({
              ...b,
              source: "online" as const,
            }))
          );
        }

        if (offlineRes.status === "fulfilled") {
          setOfflineBookings(
            (offlineRes.value.data.bookings || []).map((b) => ({
              ...b,
              source: "offline" as const,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [drId]);

  // ── Derived data ────────────────────────────────────────────────────────────

  const allBookings: AnyBooking[] = [...onlineBookings, ...offlineBookings];

  const visibleBookings = allBookings.filter((b) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "online"  && isOnline(b)) ||
      (activeTab === "offline" && isOffline(b));

    const matchesSearch = getPatientName(b)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const tabs: { label: string; value: TabValue; count: number }[] = [
    { label: "All Patients",       value: "all",     count: allBookings.length },
    { label: "Online",             value: "online",  count: onlineBookings.length },
    { label: "Offline / Walk-in",  value: "offline", count: offlineBookings.length },
  ];

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleViewEMR = (aadhar?: string) => {
    if (!aadhar || !drId) return;
    navigate(`/doctordashboard/${drId}/patientEMR/${aadhar}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 py-6 overflow-hidden">
      <title>Doctor Patients | Dashboard</title>

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 bg-gray-50 pb-3 z-30 border-b border-gray-200">
          <h1
            className="text-3xl font-bold text-center lg:text-left mb-1"
            style={{ color: themeColor }}
          >
            All Patients
          </h1>
          <p className="text-gray-500 text-sm text-center lg:text-left mb-4">
            View and manage online & offline patients
          </p>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                style={
                  activeTab === tab.value
                    ? { backgroundColor: themeColor, color: "#fff", boxShadow: "0 2px 8px rgba(12,33,62,0.25)" }
                    : { backgroundColor: "#fff", color: themeColor, border: `1.5px solid ${themeColor}` }
                }
              >
                {tab.label}
                <span
                  className="text-xs rounded-full px-2 py-0.5"
                  style={
                    activeTab === tab.value
                      ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }
                      : { backgroundColor: "#e8eef6", color: themeColor }
                  }
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto lg:mx-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: themeColor }}
            />
            <input
              type="text"
              placeholder="Search patient by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm placeholder-gray-400 bg-white"
            />
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white shadow-sm overflow-auto mt-6 rounded-xl border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading patients…
            </div>
          ) : visibleBookings.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No patients found.</p>
          ) : (
            <table className="w-full text-left min-w-[860px] border-collapse">
              <thead style={{ backgroundColor: themeColor }} className="text-white text-sm">
                <tr>
                  <th className="px-5 py-3 font-semibold">Patient</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Mode / Token</th>
                  <th className="px-5 py-3 font-semibold">Contact</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Fees</th>
                  <th className="px-5 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleBookings.map((booking) => {
                  const name = getPatientName(booking);
                  const online = isOnline(booking);
                  const offline = isOffline(booking);

                  // Status for online bookings has no status field in type, default to "-"
                  const statusKey = offline
                    ? booking.status
                    : undefined;

                  const badge = statusKey ? statusBadge[statusKey] : null;

                  return (
                    <tr
                      key={booking._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-100"
                    >
                      {/* Patient */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {online && booking.patient?.photo ? (
                            <img
                              src={booking.patient.photo}
                              alt="profile"
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base"
                              style={{ backgroundColor: themeColor }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{name}</p>
                            {online && booking.patient?.age && (
                              <p className="text-xs text-gray-400">
                                {booking.patient.gender}, {booking.patient.age} yrs
                              </p>
                            )}
                            {offline && (
                              <p className="text-xs text-gray-400 capitalize">
                                Booked by {booking.bookedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type badge */}
                      <td className="px-5 py-4">
                        {online ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "#e0f2fe", color: "#0369a1" }}>
                            <Video className="w-3 h-3" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: "#ede9fe", color: "#6d28d9" }}>
                            <MapPin className="w-3 h-3" /> Offline
                          </span>
                        )}
                      </td>

                      {/* Mode / Token */}
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {online ? (
                          <span className="capitalize">{booking.mode}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-600">
                            <Hash className="w-3.5 h-3.5 text-gray-400" />
                            Token {booking.tokenNumber}
                          </span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        {online && booking.patient?.contact ? (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {booking.patient.contact}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {badge ? (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* Fees */}
                      <td className="px-5 py-4 text-sm font-medium text-gray-800">
                        ₹{booking.fees}
                        {offline && (
                          <span
                            className="ml-1.5 text-xs px-1.5 py-0.5 rounded"
                            style={
                              booking.paid
                                ? { background: "#e6fef0", color: "#0a7d32" }
                                : { background: "#fef2f2", color: "#b91c1c" }
                            }
                          >
                            {booking.paid ? "Paid" : "Unpaid"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2 justify-center">

                          {online && (
                            <>
                              <button
                                onClick={() => handleViewEMR(booking.patient?.aadhar)}
                                className="px-3 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: emrColor }}
                              >
                                View EMR
                              </button>

                              <a
                                href={booking.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: callColor }}
                              >
                                Call
                              </a>

                              <button
                                onClick={() =>
                                  navigate(`/doctor-chat/${booking.roomId}`, {
                                    state: {
                                      patient: booking.patient,
                                      doctorId: booking.doctorId,
                                      roomId: booking.roomId,
                                    },
                                  })
                                }
                                className="px-3 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: chatColor }}
                              >
                                Chat
                              </button>
                            </>
                          )}

                          {offline && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/doctordashboard/${drId}/offline-patient/${booking.userId._id}`
                                )
                              }
                              className="px-3 py-1.5 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: emrColor }}
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {visibleBookings.length} of {allBookings.length} patients
          </p>
        )}
      </div>
    </main>
  );
};

export default AllPatient;