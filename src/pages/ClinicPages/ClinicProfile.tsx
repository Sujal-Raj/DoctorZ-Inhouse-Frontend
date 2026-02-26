import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import { Helmet } from "react-helmet";
import toast, { Toaster } from "react-hot-toast";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  BuildingOfficeIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  LightBulbIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface Clinic {
  _id: string;
  clinicName: string;
  clinicType: "Private" | "Government";
  operatingHours: string;
  specialities: string[];
  phone: string;
  email: string;
  address: string;
  state: string;
  district: string;
  pincode: number;
  clinicLicenseNumber: string;
  registrationCertificate?: string;
  aadharNumber: number;
  panNumber: string;
  staffName: string;
  staffEmail: string;
  staffId: string;
  staffPassword?: string;
  doctors: string[];
  about?: string;
  mission?: string;
  vision?: string;
}

interface OutletContext {
  clinicId: string;
}

export default function ClinicProfile() {
  const { clinicId } = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState<Partial<Clinic>>({});
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const fetchClinicData = async () => {
    if (!clinicId) return;
    try {
      const res = await api.get<{ clinic: Clinic }>(
        `/api/clinic/getClinicById/${clinicId}`
      );
      setClinic(res.data.clinic);
      setFormData(res.data.clinic);
    } catch {
      toast.error("Failed to load clinic profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicData();
  }, [clinicId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "staffPassword") {
      setPasswordInput(value);
      return;
    }

    const updatedValue =
      name === "specialities"
        ? value.split(",").map((s) => s.trim())
        : value;

    setFormData({ ...formData, [name]: updatedValue });
  };

  const handleUpdate = async () => {
    if (!formData?._id) return;

    try {
      setSaving(true);
      const payload = {
        ...formData,
        ...(passwordInput ? { staffPassword: passwordInput } : {}),
      };

      await api.put(`/api/clinic/update/${formData._id}`, payload);
      toast.success("Clinic profile updated successfully");
      setEditMode(false);
      setPasswordInput("");
      fetchClinicData();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clinic) return;
    try {
      await api.delete(`/api/clinic/delete/${clinic._id}`);
      toast.success("Clinic deleted successfully");
      localStorage.removeItem("clinicId");
      navigate("/");
    } catch {
      toast.error("Failed to delete clinic");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clinic profile...</p>
        </div>
      </div>
    );
  }

  const InfoField = ({ icon, label, value, name, type = "text", editable = true, textarea = false }: any) => (
    <div 
      className="group transition-all duration-200"
      onMouseEnter={() => setHoveredCard(name)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
        <span className={`transition-colors duration-200 ${hoveredCard === name ? 'text-[#0c213e]' : 'text-gray-500'}`}>
          {icon}
        </span>
        {label}
      </label>
      {editMode && editable ? (
        textarea ? (
          <textarea
            name={name}
            value={name === "specialities" ? (value || []).join(", ") : value || ""}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 resize-none"
          />
        ) : (
          <input
            type={type}
            name={name}
            value={name === "specialities" ? (value || []).join(", ") : value || ""}
            onChange={handleChange}
            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
          />
        )
      ) : (
        <p className={`p-3 text-gray-800 bg-gray-50 rounded-xl transition-all duration-200 ${hoveredCard === name ? 'bg-gray-100' : ''}`}>
          {name === "specialities" ? (value || []).join(", ") : value || "-"}
        </p>
      )}
    </div>
  );

  const tabs = [
    { id: "details", label: "Clinic Details", icon: <BuildingOfficeIcon className="w-5 h-5" /> },
    { id: "overview", label: "Overview", icon: <InformationCircleIcon className="w-5 h-5" /> },
    { id: "legal", label: "Legal Info", icon: <DocumentTextIcon className="w-5 h-5" /> },
    { id: "staff", label: "Staff", icon: <UserIcon className="w-5 h-5" /> },
  ];

  return (
    <>
      <Toaster position="top-right" />
      <Helmet>
        <title>{clinic?.clinicName || "Clinic"} | Clinic Profile</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0c213e] to-[#1a3a5f] px-6 sm:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                      <BuildingOfficeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        {formData.clinicName}
                      </h1>
                      <p className="text-gray-300 text-sm">{formData.clinicType} Clinic</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{formData.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4" />
                      <span>{formData.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>{formData.operatingHours}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  {!editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white text-[#0c213e] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <PencilIcon className="w-5 h-5" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setShowConfirm(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <TrashIcon className="w-5 h-5" />
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleUpdate}
                        disabled={saving}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                      >
                        <CheckIcon className="w-5 h-5" />
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false);
                          setPasswordInput("");
                        }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <XMarkIcon className="w-5 h-5" />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "text-[#0c213e] border-b-2 border-[#0c213e]"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {activeTab === "details" && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-[#0c213e] mb-6 flex items-center gap-2">
                    <BuildingOfficeIcon className="w-6 h-6" />
                    Basic Information
                  </h2>
                  <div className="space-y-6">
                    <InfoField
                      icon={<BuildingOfficeIcon className="w-4 h-4" />}
                      label="Clinic Name"
                      value={formData.clinicName}
                      name="clinicName"
                    />
                    <InfoField
                      icon={<ShieldCheckIcon className="w-4 h-4" />}
                      label="Clinic Type"
                      value={formData.clinicType}
                      name="clinicType"
                    />
                    <InfoField
                      icon={<ClockIcon className="w-4 h-4" />}
                      label="Operating Hours"
                      value={formData.operatingHours}
                      name="operatingHours"
                    />
                    <InfoField
                      icon={<DocumentTextIcon className="w-4 h-4" />}
                      label="Specialities"
                      value={formData.specialities}
                      name="specialities"
                      textarea
                    />
                  </div>
                </div>
              )}

              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-[#0c213e] mb-6 flex items-center gap-2">
                      <InformationCircleIcon className="w-6 h-6" />
                      About Us
                    </h2>
                    <InfoField
                      icon={<InformationCircleIcon className="w-4 h-4" />}
                      label="About"
                      value={formData.about}
                      name="about"
                      textarea
                    />
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-[#0c213e] mb-6 flex items-center gap-2">
                      <LightBulbIcon className="w-6 h-6" />
                      Mission
                    </h2>
                    <InfoField
                      icon={<LightBulbIcon className="w-4 h-4" />}
                      label="Mission Statement"
                      value={formData.mission}
                      name="mission"
                      textarea
                    />
                  </div>

                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-[#0c213e] mb-6 flex items-center gap-2">
                      <EyeIcon className="w-6 h-6" />
                      Vision
                    </h2>
                    <InfoField
                      icon={<EyeIcon className="w-4 h-4" />}
                      label="Vision Statement"
                      value={formData.vision}
                      name="vision"
                      textarea
                    />
                  </div>
                </div>
              )}

              {activeTab === "legal" && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-[#0c213e] mb-6 flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    Legal Information
                  </h2>
                  <div className="space-y-6">
                    <InfoField
                      icon={<DocumentTextIcon className="w-4 h-4" />}
                      label="License Number"
                      value={formData.clinicLicenseNumber}
                      name="clinicLicenseNumber"
                    />
                    <InfoField
                      icon={<DocumentTextIcon className="w-4 h-4" />}
                      label="Aadhar Number"
                      value={formData.aadharNumber}
                      name="aadharNumber"
                    />
                    <InfoField
                      icon={<DocumentTextIcon className="w-4 h-4" />}
                      label="PAN Number"
                      value={formData.panNumber}
                      name="panNumber"
                    />
                  </div>
                </div>
              )}

              {activeTab === "staff" && (
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-[#0c213e] mb-6 flex items-center gap-2">
                    <UserIcon className="w-6 h-6" />
                    Staff Credentials
                  </h2>
                  <div className="space-y-6">
                    <InfoField
                      icon={<UserIcon className="w-4 h-4" />}
                      label="Staff Name"
                      value={formData.staffName}
                      name="staffName"
                    />
                    <InfoField
                      icon={<EnvelopeIcon className="w-4 h-4" />}
                      label="Staff Email"
                      value={formData.staffEmail}
                      name="staffEmail"
                      type="email"
                    />
                    {editMode && (
                      <InfoField
                        icon={<KeyIcon className="w-4 h-4" />}
                        label="New Password (Leave blank to keep current)"
                        value={passwordInput}
                        name="staffPassword"
                        type="password"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location Info */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-[#0c213e] mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" />
                  Location
                </h3>
                <div className="space-y-4">
                  <InfoField
                    icon={<MapPinIcon className="w-4 h-4" />}
                    label="Address"
                    value={formData.address}
                    name="address"
                    textarea
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoField
                      icon={<MapPinIcon className="w-4 h-4" />}
                      label="State"
                      value={formData.state}
                      name="state"
                    />
                    <InfoField
                      icon={<MapPinIcon className="w-4 h-4" />}
                      label="District"
                      value={formData.district}
                      name="district"
                    />
                  </div>
                  <InfoField
                    icon={<MapPinIcon className="w-4 h-4" />}
                    label="Pincode"
                    value={formData.pincode}
                    name="pincode"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-[#0c213e] to-[#1a3a5f] p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-lg font-bold mb-4">Clinic Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <span className="text-sm">Total Doctors</span>
                    <span className="font-bold">{formData.doctors?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <span className="text-sm">Specialities</span>
                    <span className="font-bold">{formData.specialities?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <span className="text-sm">Status</span>
                    <span className="font-bold text-green-400">Active ✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Clinic?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              This action cannot be undone. All clinic data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}