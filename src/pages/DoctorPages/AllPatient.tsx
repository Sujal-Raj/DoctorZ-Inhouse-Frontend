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
import { Phone, Search } from "lucide-react";
import api from "../../Services/mainApi";

interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  aadhar: string;
  photo?: string;
}

interface Booking {
  _id: string;
  patient: Patient | null;
  mode: string;
  fees: number;
  roomId: string;
  doctorId: string;
  meetingLink:string;
}

const AllPatient: React.FC = () => {
  const navigate = useNavigate();
  const { drId } = useParams<{ drId: string }>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      if (!drId) return;
      try {
        const res = await api.get<{ bookings: Booking[] }>(
          `/api/booking/doctor/${drId}/all-patient`
        );
        console.log(res)
        setBookings(res.data.bookings || []);
        console.log(bookings)
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    };
    fetchBookings();
  }, [drId]);

  const handleViewEMR = (aadhar?: string) => {
    if (!aadhar || !drId) return;
    navigate(`/doctordashboard/${drId}/patientEMR/${aadhar}`);
  };

  const filteredPatients = bookings.filter((b) =>
    b.patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const themeColor = "#0c213e";

  // Different button colors
  const emrColor = "#28328C"; // Blue
  const callColor = "#0a7d32"; // Green
  const chatColor = "#b434ef"; // Purple

  return (
    <main className="min-h-screen bg-gray-50 py-6 overflow-hidden font-[Poppins]">
      <title>Doctor Patients | Dashboard</title>

      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gray-50 pb-3 z-30 border-b border-gray-200">

          <h1
            className="text-3xl sm:text-5xl font-bold text-center lg:text-left mb-2"
            style={{ color: themeColor }}
          >
            All Patients
          </h1>

          <p className="text-gray-600 text-base sm:text-lg text-center lg:text-left">
            View patients, check EMR, call, or chat instantly
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mt-5 mx-auto lg:mx-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
              style={{ color: themeColor }}
            />
            <input
              type="text"
              placeholder="Search patient by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-sm overflow-auto mt-6 rounded-lg">
          {filteredPatients.length === 0 ? (
            <p className="text-center text-gray-500 py-6">No patients found.</p>
          ) : (
            <table className="w-full text-left min-w-[900px] border-collapse">
              <thead style={{ backgroundColor: themeColor }} className="text-white">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((booking) => (
                  <tr key={booking._id} className="border-b border-gray-200 hover:bg-gray-50">

                    {/* Patient */}
                    <td className="px-4 py-4 flex items-center gap-3">
                      <img
                        src={
                          booking.patient?.photo
                            ? booking.patient.photo
                            : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        alt="profile"
                        className="w-12 h-12 rounded-lg object-cover border"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {booking.patient?.name}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {booking.mode}
                        </p>
                      </div>
                    </td>

                    <td className="px-4 py-4">{booking.patient?.gender}</td>

                    <td className="px-4 py-4">
                      {booking.patient?.age ? `${booking.patient.age} yrs` : "-"}
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" style={{ color: themeColor }} />
                        <span>{booking.patient?.contact}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2 justify-center">

                        <button
                          onClick={() => handleViewEMR(booking.patient?.aadhar)}
                          className="px-3 py-1 text-white rounded-lg text-sm"
                          style={{ backgroundColor: emrColor }}
                        >
                          View EMR
                        </button>

                        <a
                          href={`${booking.meetingLink}`}
                          target="_blank"
                          className="px-3 py-1 text-white rounded-lg text-sm"
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
                          className="px-3 py-1 text-white rounded-lg text-sm"
                          style={{ backgroundColor: chatColor }}
                        >
                          Chat
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
};

export default AllPatient;