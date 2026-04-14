// 📁 components/Doctors.tsx
import { useEffect, useState } from "react";
import api from "../../Services/mainApi";

interface Doctor {
  _id: string;
  fullName: string;
  specialization?: string;
  experience?: number;
  MobileNo?: string;
  consultationFee?:number;
}

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("receptionToken");
      const clinicId = localStorage.getItem("clinicId")

      const res = await api.get("/api/receptionist/getClinicDoctorsForReceptionist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
    clinicId,
  },
      });

      setDoctors(res.data.doctors);
    } catch (err: any) {
      setError("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Doctors
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          All doctors available in your clinic
        </p>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        
        {loading && (
          <p className="text-gray-500 text-sm">Loading doctors...</p>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {!loading && doctors.length === 0 && (
          <p className="text-gray-500 text-sm">
            No doctors found.
          </p>
        )}

        {/* Table */}
        {!loading && doctors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="border-b">
                <tr className="text-gray-600">
                  <th className="py-3">Name</th>
                  <th>Specialization</th>
                  <th>Experience</th>
                  <th>Contact</th>
                  <th>Fees</th>
                </tr>
              </thead>

              <tbody>
                {doctors.map((doc) => (
                  <tr
                    key={doc._id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-3 font-medium text-gray-900">
                      {doc.fullName}
                    </td>
                    <td>{doc.specialization || "—"}</td>
                    <td>
                      {doc.experience ? `${doc.experience} yrs` : "—"}
                    </td>
                    <td>{doc.MobileNo || "—"}</td>
                    <td>{doc.consultationFee || "—"}</td>
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