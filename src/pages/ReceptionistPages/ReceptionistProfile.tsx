// 📁 components/ReceptionistProfile.tsx
import { useEffect, useState } from "react";
import api from "../../Services/mainApi";

interface Receptionist {
  _id: string;
  receptionId: string;
  clinic: string;
  createdAt: string;
  updatedAt: string;
}

interface Clinic {
  _id: string;
  clinicName: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  clinicLicenseNumber?:string;
  clinicType?:string;

}

export default function ReceptionistProfile() {
  const [receptionist, setReceptionist] = useState<Receptionist | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("receptionToken");
      const receptionistId = localStorage.getItem("receptionistId");

      const res = await api.get("/api/receptionist/profile", {
  headers: { Authorization: `Bearer ${token}` },
  params: { receptionistId },
});

console.log(res.data);

      const data: Receptionist = res.data.reception;
      setReceptionist(data);
      const clinicId = data.clinic;

      // Fetch clinic using the clinic ID from profile
      if (clinicId) {
        // const clinicRes = await api.get(`/api/receptionist/clinic/${data.clinic}`, {
        //   headers: { Authorization: `Bearer ${token}` },
        // });
        const clinicRes = await api.get(`/api/clinic/get-clinic`, {
          // headers: { Authorization: `Bearer ${token}` },
          params:{clinicId}
        });
        console.log(clinicRes);
        setClinic(clinicRes.data.clinic);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getInitials = (id: string) => id?.slice(0, 2).toUpperCase() ?? "R";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Receptionist account details
        </p>
      </div>

      {/* Receptionist Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        {/* Avatar Row */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xl flex-shrink-0">
            {getInitials(receptionist?.receptionId ?? "")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900">
              Receptionist
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {receptionist?.receptionId}
            </p>
          </div>
          <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
            Active
          </span>
        </div>

        <hr className="my-4 border-gray-100" />

        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
          Account info
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Reception ID</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {receptionist?.receptionId}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              Receptionist
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Account ID</p>
            <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">
              {receptionist?._id}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Joined</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {receptionist?.createdAt ? formatDate(receptionist.createdAt) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {receptionist?.updatedAt ? formatDate(receptionist.updatedAt) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Clinic Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
          Clinic details
        </p>

        {clinic ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-base flex-shrink-0">
                {clinic.clinicName?.charAt(0).toUpperCase() ?? "C"}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {clinic.clinicName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{clinic.clinicType}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {clinic.city && (
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {clinic.city}
                  </p>
                </div>
              )}
              {clinic.address && (
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {clinic.address}
                  </p>
                </div>
              )}
              {clinic.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {clinic.phone}
                  </p>
                </div>
              )}
              {clinic.email && (
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">
                    {clinic.email}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Clinic ID</p>
                <p className="text-xs font-mono text-gray-400 mt-0.5 truncate">
                  {clinic._id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500  ">Clinic Licence Number</p>
                <p className=" font-mono text-gray-400 mt-0.5 truncate">
                  {clinic.clinicLicenseNumber}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">No clinic linked</p>
        )}
      </div>
    </div>
  );
}