
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// import axios from "axios";
import { User, User2, Phone, Calendar } from "lucide-react";
import api from "../../Services/mainApi";

interface Patient {
  patientName: string;
  age: number;
  gender?: string;
  contact: string;
  appointedTo: string;
  specialization: string;
  datetime: string;
  mode: string;
  status: string;
  fees: number;
}

interface GetPatientsResponse {
  patients: Patient[];
  message?: string;
}

export default function AllClinicPatients() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!clinicId) return;
      try {
        setLoading(true);
        const res = await api.get<GetPatientsResponse>(
          `api/clinic/getAllClinicPatients/${clinicId}`
        );
        setPatients(res.data.patients || []);
      } catch {
        setError("Error fetching patients.");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [clinicId]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-lg font-poppins">
        Loading patients...
      </div>
    );

  if (error)
    return (
  <div className="text-center mt-8 font-poppins">
  <p className="text-blue-600 font-semibold">No patients found</p>
  <p className="text-sm text-gray-500 mt-1">
       {/* {error} */}
    Please check back later or update your filters.
  </p>
</div>
    );

  if (patients.length === 0)
    return (
      <div className="text-center text-gray-600 font-medium mt-8 font-poppins ">
        No patients found for this clinic.
      </div>
    );

  return (
    <div className="w-full bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Patients List
      </h2>

      {/* 👇 Only this wrapper scrolls horizontally */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm text-left text-gray-700 whitespace-nowrap">
          <thead className="bg-indigo-100 text-gray-700 uppercase text-xs font-semibold">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Specialization</th>
              <th className="px-4 py-3 min-w-[130px]">Contact</th>
              <th className="px-4 py-3 min-w-[170px]">Date & Time</th>
              <th className="px-4 py-3">Mode</th>
              <th className="px-4 py-3">Fees</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p, index) => {
              const gender = p.gender?.toLowerCase() || "unknown";
              const isFemale = gender === "female";
              const formattedDate = p.datetime
                ? new Date(p.datetime).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "N/A";

              return (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-indigo-50 transition-all"
                >
                  <td className="px-4 py-3 flex items-center gap-2 font-medium text-gray-800">
                    {isFemale ? (
                      <User2 className="text-pink-500" size={18} />
                    ) : (
                      <User className="text-blue-500" size={18} />
                    )}
                    <span className="truncate max-w-[160px]">
                      {p.patientName || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.gender || "N/A"}</td>
                  <td className="px-4 py-3">{p.age ? `${p.age} yrs` : "N/A"}</td>
                  <td className="px-4 py-3 font-medium">
                    {p.appointedTo || "N/A"}
                  </td>
                  <td className="px-4 py-3">{p.specialization || "N/A"}</td>

                  {/* CONTACT COLUMN */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 break-words">
                      <Phone size={15} className="text-gray-500 shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {p.contact || "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* DATE & TIME COLUMN */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 break-words">
                      <Calendar size={15} className="text-gray-500 shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {formattedDate}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 capitalize">{p.mode || "N/A"}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-600">
                    ₹{p.fees ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
