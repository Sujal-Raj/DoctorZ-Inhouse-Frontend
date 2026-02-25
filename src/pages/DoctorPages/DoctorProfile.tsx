import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import api from "../../Services/mainApi";
import { toast, Toaster } from "react-hot-toast";

const PRIMARY = "#0C213E";

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  qualification: string;
  experience: number;
  dob: string;
  consultationFee: number;
  language: string;
  MobileNo: string;
  email: string;
  MedicalRegistrationNumber: string;
  Aadhar: number;
  photo?: string;
  signature?: string;
  DegreeCertificate?: string;
}

const DoctorProfile: React.FC = () => {
  const navigate = useNavigate();
  const storedDoctorId = localStorage.getItem("doctorId");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Doctor>>({});
  const [isSaving, setIsSaving] = useState(false);

  // FETCH DOCTOR DATA
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get<{ doctor: Doctor }>(
          `/api/doctor/${storedDoctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDoctor(res.data.doctor);
        setFormData(res.data.doctor);
      } catch {
        toast.error("Failed to load doctor data");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, []);

  const handlePhotoChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewPhoto(file);
    setDoctor((prev) =>
      prev ? { ...prev, photo: URL.createObjectURL(file) } : prev
    );
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;

    if (name === "dob") {
      setFormData({ ...formData, dob: value });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const form = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          form.append(key, String(value));
        }
      });

      if (newPhoto) {
        form.append("photo", newPhoto);
      }
      // console.log(newPhoto)
      // console.log(form)

      const res = await api.put(
        `/api/doctor/updateDoctor/${doctor?._id}`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Profile updated successfully!");
      setDoctor(res.data.doctor);
      setEditMode(false);
      setNewPhoto(null);
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDMY = (dateString: string | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const labelClass = "text-sm font-semibold text-gray-700 mb-2 block";
  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0C213E] focus:ring-2 focus:ring-[#0C213E]/20 transition-all";
  const displayClass = "text-gray-900 font-medium";

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2400,
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        }}
      />

      <Helmet>
        <title>Dr. {doctor?.fullName} | Profile</title>
      </Helmet>

      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-xl border-4 border-gray-100 shadow-lg overflow-hidden bg-gray-50">
                {newPhoto ? (
                  <img
                    src={URL.createObjectURL(newPhoto)}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : doctor?.photo ? (
                  <img
                    // src={`http://localhost:3000/uploads/${doctor.photo}?t=${Date.now()}`}
                    src={doctor.photo}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0c213e] text-white text-4xl font-bold">
                    {doctor?.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {editMode && (
                <label className="absolute bottom-0 right-0 z-20 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-100 transition border-2 border-gray-200">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                  <svg
                    className="w-5 h-5 text-[#0c213e]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
              )}
            </div>

            {/* Doctor Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dr. {doctor?.fullName}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                <span className="px-3 py-1 bg-[#0c213e] text-white text-sm font-medium rounded-full">
                  {doctor?.specialization}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                  {doctor?.experience} years experience
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {doctor?.email}
                </p>
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {doctor?.MobileNo}
                </p>
                <p className="flex items-center justify-center md:justify-start gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Reg No: {doctor?.MedicalRegistrationNumber}
                </p>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex gap-3">
              {!editMode ? (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-6 py-2.5 bg-[#0c213e] hover:bg-[#0a1a32] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0c213e]/20"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNewPhoto(null);
                      setFormData(doctor || {});
                    }}
                    className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileUpdate}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Professional Details - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Professional Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#0c213e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Professional Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Qualification */}
                <div>
                  <label className={labelClass}>Qualification</label>
                  {editMode ? (
                    <input
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{doctor?.qualification}</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label className={labelClass}>Experience (Years)</label>
                  {editMode ? (
                    <input
                      name="experience"
                      type="number"
                      value={formData.experience}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{doctor?.experience} years</p>
                  )}
                </div>

                {/* Languages */}
                <div>
                  <label className={labelClass}>Languages</label>
                  {editMode ? (
                    <input
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{doctor?.language}</p>
                  )}
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className={labelClass}>Consultation Fee</label>
                  {editMode ? (
                    <input
                      name="consultationFee"
                      type="number"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>₹{doctor?.consultationFee}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  {editMode ? (
                    <input
                      name="dob"
                      type="date"
                      value={formData.dob?.slice(0, 10)}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{formatDMY(doctor?.dob)}</p>
                  )}
                </div>

                {/* Aadhar */}
                <div>
                  <label className={labelClass}>Aadhar Number</label>
                  {editMode ? (
                    <input
                      name="Aadhar"
                      value={formData.Aadhar}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{doctor?.Aadhar}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Certificates & Signature */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#0c213e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Certificates & Signature
              </h2>

              <div className="space-y-6">
                {doctor?.signature && (
                  <div>
                    <label className={labelClass}>Digital Signature</label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 inline-block">
                      <img
                        src={doctor.signature}
                        className="h-20 object-contain"
                        alt="Signature"
                      />
                    </div>
                  </div>
                )}

                {doctor?.DegreeCertificate && (
                  <div>
                    <label className={labelClass}>Degree Certificate</label>
                    <a
                      href={`http://localhost:3000/uploads/${doctor.DegreeCertificate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c213e] hover:bg-[#0a1a32] text-white rounded-lg font-medium transition-colors shadow-lg shadow-[#0c213e]/20"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Certificate
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information - 1 column */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-[#0c213e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Information
              </h2>

              <div className="space-y-5">
                {/* Phone */}
                <div>
                  <label className={labelClass}>Phone Number</label>
                  {editMode ? (
                    <input
                      name="MobileNo"
                      value={formData.MobileNo}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{doctor?.MobileNo}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address</label>
                  {editMode ? (
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  ) : (
                    <p className={displayClass}>{doctor?.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-[#0c213e] to-[#1a3a5f] rounded-xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/20">
                  <span className="text-white/80">Specialization</span>
                  <span className="font-semibold">{doctor?.specialization}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-white/20">
                  <span className="text-white/80">Experience</span>
                  <span className="font-semibold">{doctor?.experience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Consultation Fee</span>
                  <span className="font-semibold">₹{doctor?.consultationFee}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorProfile;