import React, { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Services/mainApi";

import { Phone, MapPin, Mail, Clock, Search } from "lucide-react";
// import clinicImage from "../../assets/clinic.jpg";

// ---------- Types ----------
interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  experience: number;
  consultationFee: number;
  gender: "Male" | "Female";
  photo?: string;
}

interface Clinic {
  _id: string;
  clinicName: string;
  clinicType: string;
  specialities: string[];
  address: string;
  district: string;
  state: string;
  phone: string;
  email: string;
  operatingHours: string;
  clinicImage?: string; //
}

interface ClinicResponse {
  clinic: Clinic;
}

interface DoctorsResponse {
  doctors: Doctor[];
}

type TabType = "overview" | "doctors" | "services";

interface Filters {
  gender: string[];
  fees: string[];
  experience: string[];
  search: string;
}

// ---------- Component ----------
const ClinicDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("doctors");

  const [filters, setFilters] = useState<Filters>({
    gender: [],
    fees: [],
    experience: [],
    search: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clinicRes, doctorRes] = await Promise.all([
          api.get<ClinicResponse>(`api/clinic/getClinicById/${id}`),
          api.get<DoctorsResponse>(`api/doctor/getClinicDoctors/${id}`),
        ]);

        setClinic(clinicRes.data.clinic);
        setDoctors(doctorRes.data.doctors || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleFilterChange = (type: keyof Filters, value: string) => {
    if (type === "search") {
      setFilters((prev) => ({ ...prev, search: value }));
      return;
    }

    setFilters((prev) => {
      // ✅ Special case: only one gender can be selected
      if (type === "gender") {
        const isAlreadySelected = prev.gender.includes(value);
        const selected = isAlreadySelected ? [] : [value]; // toggle single value
        return { ...prev, gender: selected };
      }

      // ✅ Default: multi-select for other array filters
      const currentValues = prev[type] as string[];

      const selected = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return { ...prev, [type]: selected };
    });
  };

  const filteredDoctors = doctors.filter((doc) => {
    const { gender, fees, experience, search } = filters;

    const genderMatch = gender.length === 0 || gender.includes(doc.gender);
    const feeMatch =
      fees.length === 0 ||
      fees.some((range) => {
        if (range === "0-500") return doc.consultationFee <= 500;
        if (range === "500-1000")
          return doc.consultationFee > 500 && doc.consultationFee <= 1000;
        if (range === "1000+") return doc.consultationFee > 1000;
        return false;
      });
    const experienceMatch =
      experience.length === 0 ||
      experience.some((range) => {
        if (range === "0-2") return doc.experience <= 2;
        if (range === "3-5") return doc.experience >= 3 && doc.experience <= 5;
        if (range === "5+") return doc.experience > 5;
        return false;
      });
    const searchMatch =
      search.trim() === "" ||
      doc.fullName.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(search.toLowerCase());

    return genderMatch && feeMatch && experienceMatch && searchMatch;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin h-8 w-8 border-4 border-bg-[#0c213e] border-t-transparent rounded-full"></div>
      </div>
    );

  if (!clinic)
    return (
      <div className="text-center text-gray-500 text-xl mt-20">
        Clinic not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ---------- Hero Section ---------- */}
      <section className="relative h-[380px] overflow-hidden shadow-lg">
        <div className="absolute inset-0">
          {/* <img
      src={clinicImage}
      alt="Clinic banner"
      className="w-full h-full object-center object-cover"
    /> */}
          <img
            src={
              clinic.clinicImage
                ? clinic.clinicImage.startsWith("http")
                  ? clinic.clinicImage
                  : `http://localhost:3000/uploads/${clinic.clinicImage}`
                : "https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
            }
            alt={clinic.clinicName}
            className="w-full h-full object-center object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c213e]/70 to-[#0c213e]/80"></div>
        </div>

        <div className="relative z-10 flex flex-col items-end justify-center h-full text-center text-white px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-2">
              <span className="text-sm font-medium">{clinic.clinicType}</span>
            </div>
            <h1 className="md:text-3xl lg:text-4xl font-bold mb-2">
              {clinic.clinicName}
            </h1>
            <p className="text-lg font-medium max-w-2xl mx-auto">
              Providing exceptional neurological care with compassion and
              expertise
            </p>

            <div className="flex flex-wrap justify-center gap-8 mt-5 text-base">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <MapPin size={20} className="text-blue-200" />
                <span>{clinic.district}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Mail size={20} className="text-blue-200" />
                <span>{clinic.email}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Clock size={20} className="text-blue-200 uppercase" />
                <span className=" uppercase">{clinic.operatingHours}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {/* <div className="inline-flex items-center gap-2 bg-white text-[#0c213e] px-6 py-2 rounded-full font-semibold shadow-lg">
                <Phone size={18} />
                {clinic.phone}
              </div> */}

              <a
                href={`tel:${clinic.phone}`}
                className="inline-flex items-center gap-2 bg-white text-[#0c213e] px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-gray-100 transition-colors"
              >
                <Phone size={18} />
                {clinic.phone}
              </a>

              <button className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-2 rounded-full font-semibold transition-all duration-300">
                <MapPin size={18} />
                Booking
              </button>
            </div>

            {/* option 2 clickable phone number


            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <a
                href={`tel:${clinic.phone}`}
                className="inline-flex items-center gap-2 bg-white text-[#0c213e] px-6 py-2 rounded-full font-semibold shadow-lg"
              >
                <Phone size={18} />
                {clinic.phone}
              </a>

              <button className="inline-flex items-center gap-2 bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-2 rounded-full font-semibold transition-all duration-300">
                <MapPin size={18} />
                Booking
              </button>
            </div> */}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* ---------- Tabs Navigation ---------- */}
      <div className="sticky top-0 z-20 bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-8 md:gap-12">
            {(["overview", "doctors", "services"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-5 text-lg font-semibold capitalize relative transition-all duration-300 ${
                  activeTab === tab
                    ? "text-[#0c213e] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-[#0c213e] after:rounded-t-full"
                    : "text-gray-500 hover:text-[#0c213e]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Tab Content ---------- */}
      <div className="max-w-[1500px] mx-auto px-4 py-6">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="md:flex">
                <div className="md:w-2/3 p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-[[#0c213e]]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      About {clinic.clinicName}
                    </h2>
                  </div>
                  <p className="text-gray-700 text-lg  mb-6">
                    Welcome to{" "}
                    <span className="font-semibold text-[#0c213e]">
                      {clinic.clinicName}
                    </span>{" "}
                    — a premier{" "}
                    <span className="capitalize font-medium">
                      {clinic.clinicType}
                    </span>{" "}
                    dedicated to excellence in neurological care. Our clinic
                    specializes in{" "}
                    <span className="text-[#0c213e] font-semibold">
                      {clinic.specialities.join(", ")}
                    </span>
                    , delivering comprehensive diagnostic, therapeutic, and
                    rehabilitative services.
                  </p>
                  <p className="text-gray-700 text-lg  mb-8">
                    Our team of board-certified neurologists and healthcare
                    professionals utilizes state-of-the-art technology and
                    evidence-based practices to provide personalized treatment
                    plans. We prioritize patient education, compassionate care,
                    and achieving the best possible outcomes for every
                    individual we serve.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    <div className="bg-indigo-50 p-6 rounded-xl">
                      <h3 className="font-bold text-[#0c213e] mb-3">
                        Our Mission
                      </h3>
                      <p className="text-gray-700">
                        To deliver exceptional neurological care through
                        innovation, compassion, and a patient-centered approach
                        that improves quality of life.
                      </p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <h3 className="font-bold text-[#0c213e] mb-3">
                        Our Vision
                      </h3>
                      <p className="text-gray-700">
                        To be the leading neurological center recognized for
                        clinical excellence, research, and transformative
                        patient outcomes.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/3 bg-[#0c213e] p-8 md:p-12 text-white">
                  <h3 className="text-2xl font-bold mb-6">Clinic Details</h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold">Operating Hours</h4>
                        <p>{clinic.operatingHours}</p>
                        <p className="text-sm text-blue-100 mt-1">
                          Emergency services available 24/7
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold">Location</h4>
                        <p>{clinic.district}</p>
                        <button className="text-sm text-blue-100 underline mt-1">
                          View on map
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">Insurance</h4>
                        <p>Most major providers accepted</p>
                        <button className="text-sm text-blue-100 underline mt-1">
                          Verify coverage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctors */}
        {activeTab === "doctors" && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:w-1/4 w-full">
              <button
                className="lg:hidden w-full bg-[#0c213e] text-white font-semibold px-5 py-3 rounded-lg mb-6 shadow-lg flex items-center justify-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Hide Filters
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Show Filters
                  </>
                )}
              </button>

              {(showFilters || window.innerWidth >= 1024) && (
                <section className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Filters
                    </h3>
                    <button
                      onClick={() => {
                        // Reset all filters logic would go here
                      }}
                      className="text-sm text-[#0c213e] hover:text-[#0c213e] font-medium"
                    >
                      Reset All
                    </button>
                  </div>
                  <div className="space-y-8">
                    {/* Search */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                        Search Doctors
                      </h4>
                      <div className="relative text-gray-600">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search size={20} className="text-gray-400" />
                        </div>
                        <input
                          type="search"
                          placeholder="Search by name or specialty..."
                          value={filters.search}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleFilterChange("search", e.target.value)
                          }
                          className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    {/* Gender */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                        Gender
                      </h4>

                      <div className="space-y-2">
                        {["Male", "Female"].map((g) => (
                          <label
                            key={g}
                            className="flex items-center space-x-3 cursor-pointer group"
                          >
                            <div className="relative">
                              <input
                                type="radio"
                                name="gender"
                                checked={filters.gender.includes(g)}
                                onChange={() => handleFilterChange("gender", g)}
                                className="sr-only"
                              />

                              <div
                                className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all ${
                                  filters.gender.includes(g)
                                    ? "bg-[#0c213e] border-[#0c213e]"
                                    : "border-gray-300 group-hover:border-[#0c213e]"
                                }`}
                              >
                                {filters.gender.includes(g) && (
                                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                                )}
                              </div>
                            </div>

                            <span className="text-gray-700 group-hover:text-[#0c213e] transition-colors">
                              {g}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Fees */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                        Consultation Fee
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: "₹0 - ₹500", value: "0-500" },
                          { label: "₹500 - ₹1000", value: "500-1000" },
                          { label: "₹1000+", value: "1000+" },
                        ].map(({ label, value }) => (
                          <label
                            key={value}
                            className="flex items-center space-x-3 cursor-pointer group"
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={filters.fees.includes(value)}
                                onChange={() =>
                                  handleFilterChange("fees", value)
                                }
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                                  filters.fees.includes(value)
                                    ? "bg-[#0c213e] border-[#0c213e]"
                                    : "border-gray-300 group-hover:border-[#0c213e]"
                                }`}
                              >
                                {filters.fees.includes(value) && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-700 group-hover:text-indigo-700 transition-colors">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                        Experience
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: "0 - 2 years", value: "0-2" },
                          { label: "3 - 5 years", value: "3-5" },
                          { label: "5+ years", value: "5+" },
                        ].map(({ label, value }) => (
                          <label
                            key={value}
                            className="flex items-center space-x-3 cursor-pointer group"
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={filters.experience.includes(value)}
                                onChange={() =>
                                  handleFilterChange("experience", value)
                                }
                                className="sr-only"
                              />
                              <div
                                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                                  filters.experience.includes(value)
                                    ? "bg-[#0c213e] border-[#0c213e]"
                                    : "border-gray-300 group-hover:border-indigo-400"
                                }`}
                              >
                                {filters.experience.includes(value) && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-700 group-hover:text-indigo-700 transition-colors">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </aside>

            {/* Doctors Grid */}
            <main className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Our Medical Team
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {filteredDoctors.length}{" "}
                    {filteredDoctors.length === 1 ? "doctor" : "doctors"} found
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <span className="text-gray-700 font-medium">Sort by:</span>
                  <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Relevance</option>
                    <option>Experience (High to Low)</option>
                    <option>Fee (Low to High)</option>
                    <option>Fee (High to Low)</option>
                  </select>
                </div>
              </div>

              {filteredDoctors.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10 text-indigo-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No doctors match your filters
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your filters or search terms to find what
                      you're looking for.
                    </p>
                    <button
                      onClick={() => {
                        // Reset filters logic
                      }}
                      className="bg-bg-[#0c213e] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0c213e] transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() =>
                        navigate(`/view-doctor-profile/${doc._id}`)
                      }
                      className="cursor-pointer bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-5">
                          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white shadow-lg group-hover:border-indigo-100 transition-colors">
                            {doc.photo ? (
                              <img
                                src={`http://localhost:3000/uploads/${doc.photo}`}
                                alt={doc.fullName}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                                <span className="text-[#0c213e] font-bold text-lg">
                                  {doc.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                            ✓
                          </div>
                        </div>

                        <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-[#0c213e] transition-colors">
                          {doc.fullName}
                        </h3>
                        <p className="text-bg-[#0c213e] font-semibold mb-2">
                          {doc.specialization}
                        </p>

                        <div className="flex items-center justify-center gap-4 text-sm text-gray-600 mb-4">
                          <span className="flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {doc.experience} years
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                              />
                            </svg>
                            95% satisfied
                          </span>
                        </div>

                        <div className="w-full bg-gray-100 rounded-lg p-4 mb-5">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">
                              Consultation Fee
                            </span>
                            <span className="text-lg font-bold text-gray-900">
                              ₹{doc.consultationFee}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3 w-full">
                          <button className="flex-1 bg-[#0c213e] text-white py-3 rounded-lg font-medium hover:bg-[#0a1a33] transition-colors">
                            Book Appointment
                          </button>
                          <button className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-gray-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}

        {/* Services */}
        {activeTab === "services" && (
          <div className="w-full mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Specialized Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive neurological care tailored to your specific needs
                with cutting-edge technology and compassionate expertise.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "Neurological Consultations",
                  description:
                    "Comprehensive evaluation and management of neurological disorders with personalized treatment plans.",
                  // icon: "🧠",
                  color: "from-purple-500 to-bg-[#0c213e]",
                },
                {
                  title: "Electroencephalogram (EEG)",
                  description:
                    "Advanced brain wave monitoring to diagnose epilepsy, sleep disorders, and other neurological conditions.",
                  // icon: "📊",
                  color: "from-blue-500 to-cyan-600",
                },
                {
                  title: "EMG/Nerve Conduction Studies",
                  description:
                    "Detailed assessment of nerve and muscle function to identify neuropathies and muscle disorders.",
                  // icon: "⚡",
                  color: "from-green-500 to-teal-600",
                },
                {
                  title: "Stroke Management",
                  description:
                    "Comprehensive stroke prevention, acute treatment, and rehabilitation services.",
                  // icon: "❤️",
                  color: "from-red-500 to-pink-600",
                },
                {
                  title: "Headache & Migraine Treatment",
                  description:
                    "Specialized care for chronic headaches and migraines with innovative treatment approaches.",
                  // icon: "🌀",
                  color: "from-orange-500 to-amber-600",
                },
                {
                  title: "Memory & Cognitive Disorders",
                  description:
                    "Evaluation and management of dementia, Alzheimer's, and other cognitive impairments.",
                  // icon: "🧩",
                  color: "from-indigo-500 to-purple-600",
                },
              ].map((service, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`h-2 bg-[#0c213e]`}></div>
                  <div className="p-6">
                    {/* <div className="text-4xl mb-4">{service.icon}</div> */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600">{service.description}</p>
                    <button className="mt-6 text-[#0c213e] font-semibold flex items-center gap-2 group-hover:text-[#0c213e] transition-colors">
                      Learn more
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0c213e] rounded-2xl shadow-xl p-8 mt-12 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">
                Can't find what you're looking for?
              </h3>
              <p className="text-blue-100 max-w-2xl mx-auto mb-6">
                Our team is here to help. Contact us to discuss your specific
                neurological concerns and how we can assist you.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <button className="bg-white text-[#0c213e] px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                  Contact Our Team
                </button>
                <button className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  Book Services
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicDetails;
