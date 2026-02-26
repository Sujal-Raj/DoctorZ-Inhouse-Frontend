import { useEffect, useState } from "react";
import ClinicDoctorCard from "../../components/ClinicDoctorCard";
import api from "../../Services/mainApi";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  qualification?: string;
  location?: string;
  city?: string;
  photo?: string;
  gender?: string;
}

interface SearchResponse {
  doctors: Doctor[];
}

export default function AddDoctor() {
  const [addedDoctors, setAddedDoctors] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 12;

  const fetchDoctors = async (query: string = "") => {
    if (!query.trim()) {
      setDoctors([]);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get<SearchResponse>(`/api/doctor/search?query=${encodeURIComponent(query)}`);
      setDoctors(res.data.doctors || []);
      setPage(1);
    } catch (error) {
      console.error("fetchDoctors error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSent = (doctorId: string) => {
    setPendingRequests((prev) => (prev.includes(doctorId) ? prev : [...prev, doctorId]));
  };

  useEffect(() => {
    const clinicId = localStorage.getItem("clinicId");
    if (!clinicId) return;

    api
      .get<{ addedDoctors: string[]; pendingRequests: string[] }>(`/api/clinic/doctor-status/${clinicId}`)
      .then((res) => {
        setAddedDoctors(res.data.addedDoctors || []);
        setPendingRequests(res.data.pendingRequests || []);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim()) fetchDoctors(search.trim());
      else setDoctors([]);
    }, 420);

    return () => clearTimeout(t);
  }, [search]);

  const filtered = doctors.filter((d) => {
    const genderOk = genderFilter ? d.gender === genderFilter : true;
    const specOk = specialization
      ? d.specialization?.toLowerCase().includes(specialization.toLowerCase())
      : true;
    return genderOk && specOk;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visibleDoctors = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [genderFilter, specialization, doctors]);

  const handleClearFilters = () => {
    setGenderFilter("");
    setSpecialization("");
  };

  const activeFiltersCount = [genderFilter, specialization].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0c213e] mb-2">
                Add Doctors
              </h1>
              <p className="text-gray-600 max-w-2xl">
                Discover verified doctors and add them to your clinic with one click
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full lg:w-[480px]">
              <div className="relative group">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0c213e] transition-colors" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-[#0c213e] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Search doctors by name or specialization..."
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 font-medium">Added Doctors</p>
                  <p className="text-2xl font-bold text-emerald-900">{addedDoctors.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-amber-700 font-medium">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-900">{pendingRequests.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-medium">Search Results</p>
                  <p className="text-2xl font-bold text-blue-900">{filtered.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-[#0c213e] flex items-center gap-2">
                  <FunnelIcon className="w-5 h-5" />
                  Filters
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-1 ">
                    {[
                      { key: "", label: "All" },
                      { key: "Male", label: "Male" },
                      { key: "Female", label: "Female" },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setGenderFilter(opt.key)}
                        className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                          genderFilter === opt.key
                            ? "bg-[#0c213e] text-white shadow-lg scale-105"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Specialization
                  </label>
                  <input
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cardiologist, Dentist"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-[#0c213e] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">
                  💡 Start typing in the search box to discover doctors. Results are filtered in real-time.
                </p>
              </div>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <span className="flex items-center gap-2 font-semibold text-gray-900">
                <FunnelIcon className="w-5 h-5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#0c213e] text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </span>
              <span className="text-gray-400">{showFilters ? "−" : "+"}</span>
            </button>

            {showFilters && (
              <div className="mt-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "", label: "All" },
                        { key: "Male", label: "Male" },
                        { key: "Female", label: "Female" },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setGenderFilter(opt.key)}
                          className={`py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                            genderFilter === opt.key
                              ? "bg-[#0c213e] text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Specialization
                    </label>
                    <input
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Cardiologist"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-[#0c213e] outline-none"
                    />
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <section className="lg:col-span-9">
            <div className="space-y-6">
              {/* Sort Header */}
              {doctors.length > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <p className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{visibleDoctors.length}</span> of{" "}
                    <span className="font-semibold text-gray-900">{filtered.length}</span> results
                  </p>
                  <select
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "name") setDoctors((s) => [...s].sort((a, b) => a.fullName.localeCompare(b.fullName)));
                      if (v === "spec") setDoctors((s) => [...s].sort((a, b) => (a.specialization || "").localeCompare(b.specialization || "")));
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-[#0c213e] focus:ring-2 focus:ring-blue-50 outline-none"
                  >
                    <option value="">Sort by Relevance</option>
                    <option value="name">Name (A–Z)</option>
                    <option value="spec">Specialization</option>
                  </select>
                </div>
              )}

              {/* Cards Grid */}
              {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-2xl p-6 border border-gray-200 h-64" />
                  ))}
                </div>
              ) : visibleDoctors.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserGroupIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No doctors found</h4>
                  <p className="text-gray-600 mb-6">
                    {search ? "Try a different search term or clear filters" : "Start typing to search for doctors"}
                  </p>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-3 bg-[#0c213e] text-white rounded-xl font-semibold hover:bg-[#081829] transition-all"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleDoctors.map((d) => (
                    <ClinicDoctorCard
                      key={d._id}
                      doctor={d}
                      doctorStatus={
                        addedDoctors.includes(d._id) ? "added" : pendingRequests.includes(d._id) ? "pending" : "none"
                      }
                      onRequestSent={handleRequestSent}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {visibleDoctors.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#0c213e] hover:text-[#0c213e] transition-all"
                  >
                    Previous
                  </button>

                  <div className="px-6 py-2 rounded-xl bg-[#0c213e] text-white font-semibold">
                    {page} of {totalPages}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl bg-white border-2 border-gray-200 font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#0c213e] hover:text-[#0c213e] transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}