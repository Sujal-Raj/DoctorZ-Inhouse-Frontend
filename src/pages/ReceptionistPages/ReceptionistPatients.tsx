// 📁 components/Patients.tsx
import { useEffect, useState } from "react";
import api from "../../Services/mainApi";

interface Patient {
  bookingId: string;
  doctor: {
    fullName: string;
    specialization: string;
  };
  patient: string;
  mode: string;
  bookedBy:string;
  fees: number;
  status: string;
  date: Date;
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients,setTotalPatients] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("receptionToken");

      const res = await api.get("/api/receptionist/clinic-patients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPatients(res.data.patients);
      setTotalPatients(res.data.totalPatients);
    } catch (err: any) {
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Patients
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          All patients across your clinic bookings
        </p>
        <p className="text-sm text-gray-500 font-bold tracking-tight">Total Patients:{totalPatients}</p>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">

        {loading && (
          <p className="text-sm text-gray-500">Loading patients...</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {!loading && patients.length === 0 && (
          <p className="text-sm text-gray-500">No patients found.</p>
        )}

          

        {/* Table */}
        {!loading && patients.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="py-3 text-left">Patient</th>
                  <th className="text-left">Doctor</th>
                  <th className="text-left">Mode/Booked by</th>
                  <th className="text-left">Fees</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((item) => (
                  <tr
                    key={item.bookingId}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    {/* Patient */}
                    <td className="py-3 font-medium text-gray-900">
                      {item.patient}
                    </td>

                    {/* Doctor */}
                    <td>
                      {item.doctor?.fullName || "—"}
                      <p className="text-xs text-gray-500">
                        {item.doctor?.specialization}
                      </p>
                    </td>

                    {/* Mode */}
                    <td>
                      <span className="capitalize text-gray-700">
                        {item.mode ? `${item.mode}` :`${item.bookedBy}` }
                      </span>
                    </td>

                    {/* Fees */}
                    <td>₹{item.fees}</td>

                    {/* Status */}
                    <td>
                      <span
                        className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${
                            item.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : item.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        `}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      {new Date(item.date).toLocaleDateString()}
                      <p className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleTimeString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}