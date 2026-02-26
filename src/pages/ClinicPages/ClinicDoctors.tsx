import { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import { 
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  mode: string;
  photo?: string;
}

interface ApiResponse {
  message: string;
  doctors: Doctor[];
}

interface OutletContext {
  clinicId: string | undefined;
}

const getStatusColor = (mode: string) => {
  switch (mode) {
    case "online":
      return { bg: "bg-green-500", text: "text-green-700", label: "Online" };
    case "offline":
      return { bg: "bg-gray-400", text: "text-gray-700", label: "Offline" };
    default:
      return { bg: "bg-gray-300", text: "text-gray-600", label: "Unknown" };
  }
};

const ClinicDoctors = () => {
  const { clinicId } = useOutletContext<OutletContext>();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get<ApiResponse>(
          `/api/doctor/getClinicDoctors/${clinicId}`
        );
        if (Array.isArray(res.data.doctors)) {
          setDoctors(res.data.doctors);
        } else {
          setDoctors([]);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) fetchDoctors();
  }, [clinicId]);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || doctor.mode === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const onlineCount = doctors.filter(d => d.mode === "online").length;
  const offlineCount = doctors.filter(d => d.mode === "offline").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0c213e] mb-2">
                Doctor Team
              </h1>
              <p className="text-gray-600">
                Manage and view all doctors in your clinic
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full lg:w-[400px]">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0c213e] transition-colors" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-[#0c213e] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Search doctors..."
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Total Doctors</p>
                  <p className="text-2xl font-bold text-blue-900">{doctors.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium">Online Now</p>
                  <p className="text-2xl font-bold text-green-900">{onlineCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500 rounded-lg">
                  <XCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 font-medium">Offline</p>
                  <p className="text-2xl font-bold text-gray-900">{offlineCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-4">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <div className="flex gap-2">
              {[
                { value: "all", label: "All Doctors" },
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setFilterStatus(filter.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filterStatus === filter.value
                      ? "bg-[#0c213e] text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">No doctors found</h4>
            <p className="text-gray-600">
              {searchQuery 
                ? "Try adjusting your search or filters" 
                : "No doctors have been added to this clinic yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDoctors.map((doctor) => {
              const status = getStatusColor(doctor.mode || "offline");
              
              return (
                <div
                  key={doctor._id}
                  onMouseEnter={() => setHoveredCard(doctor._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(`clinic-doctor-profile/${doctor._id}`)}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={doctor.photo ? `http://localhost:3000/uploads/${doctor.photo}` : "/api/placeholder/400/400"}
                      alt={doctor.fullName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <div className={`flex items-center gap-2 ${status.bg} px-3 py-1.5 rounded-full backdrop-blur-sm`}>
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        <span className="text-xs font-semibold text-white">
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-[#0c213e] via-[#0c213e]/50 to-transparent transition-opacity duration-300 ${
                      hoveredCard === doctor._id ? "opacity-100" : "opacity-0"
                    }`}>
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                        <span className="text-sm font-semibold">View Profile</span>
                        <ArrowRightIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 truncate group-hover:text-[#0c213e] transition-colors">
                      {doctor.fullName}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {doctor.specialization}
                    </p>

                    {/* Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`clinic-doctor-profile/${doctor._id}`);
                      }}
                      className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-[#0c213e] hover:text-white transition-all group-hover:bg-[#0c213e] group-hover:text-white"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {filteredDoctors.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Showing {filteredDoctors.length} of {doctors.length} doctors
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicDoctors;