import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/mainApi";
import toast, { Toaster } from "react-hot-toast";
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ShieldCheckIcon,
  PowerIcon,
  PlusIcon,
  // CreditCardIcon,
  ClipboardDocumentListIcon,
  // ArrowsRightLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  // TvIcon,
} from "@heroicons/react/24/outline";

// Interfaces
interface Hospital {
  _id: string;
  clinicName: string;
  clinicType: string;
  phone: string;
  email: string;
  staffName: string;
  staffEmail: string;
  staffId: string;
  status: string; // active | suspended | pending
  subdomain?: string;
  subscriptionPlan?: {
    name: string;
    priceMonthly: number;
  };
}

interface Plan {
  _id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  trialDays: number;
  features: string[];
}

interface PendingClinic {
  _id: string;
  clinicName: string;
  email: string;
  state: string;
  district: string;
  pincode: string;
  address: string;
  operatingHours: string;
  status: string;
}

interface PendingDoctor {
  _id: string;
  fullName: string;
  gender: string;
  consultationFee: number;
  dob: string;
  status: string;
  qualification: string;
  specialization: string;
  experience: number;
  MedicalRegistrationNumber?: string;
}

interface PendingLab {
  _id: string;
  name: string;
  email: string;
  address: string;
  operatingHours: string;
  contactNumber: string;
  status: string;
}

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"tenants" | "plans" | "logs" | "clinic_approvals" | "doctor_approvals" | "lab_approvals">("tenants");
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalClinics: 0,
    totalHospitals: 0,
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    newRegistrations: 0,
  });

  // Data lists
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pendingClinics, setPendingClinics] = useState<PendingClinic[]>([]);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [pendingLabs, setPendingLabs] = useState<PendingLab[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination and Search
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [hospitalPage, setHospitalPage] = useState(1);
  const hospitalsPerPage = 5;

  // Modals / Forms
  const [showAddHospitalModal, setShowAddHospitalModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);

  // New Hospital Form Data
  const [hospitalForm, setHospitalForm] = useState({
    clinicName: "",
    clinicType: "Private" as "Private" | "Government",
    specialities: "General Medicine",
    address: "",
    state: "",
    district: "",
    pincode: "",
    phone: "",
    email: "",
    staffName: "",
    staffEmail: "",
    staffPassword: "",
    staffId: "",
    panNumber: "",
    aadharNumber: "",
    subdomain: "",
    subscriptionPlan: "",
  });

  // New Plan Form Data
  const [planForm, setPlanForm] = useState({
    name: "",
    priceMonthly: 0,
    priceYearly: 0,
    trialDays: 14,
    features: [] as string[],
  });

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("superAdminToken");
    if (!token) {
      navigate("/super-admin-login");
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, hospRes, planRes, docRes, clinicRes, labRes] = await Promise.all([
        api.get("/api/saas/stats"),
        api.get("/api/saas/hospitals"),
        api.get("/api/saas/plans"),
        api.get("/api/admin/doctors/pending"),
        api.get("/api/admin/clinics/pending"),
        api.get("/api/admin/labs/pending")
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (hospRes.data.success) setHospitals(hospRes.data.hospitals);
      if (planRes.data.success) setPlans(planRes.data.plans);
      
      setPendingDoctors(docRes.data || []);
      setPendingClinics(clinicRes.data?.Clinics || []);
      setPendingLabs(labRes.data || []);
    } catch (err: any) {
      toast.error("Failed to load SaaS platform data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminInfo");
    toast.success("Successfully logged out");
    navigate("/super-admin-login");
  };

  const handleToggleHospitalStatus = async (hospitalId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      const res = await api.put(`/api/saas/hospitals/status/${hospitalId}`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`Hospital status set to ${nextStatus}`);
        fetchData();
      }
    } catch {
      toast.error("Failed to toggle hospital status");
    }
  };

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/saas/hospitals/add", {
        ...hospitalForm,
        pincode: Number(hospitalForm.pincode),
        aadharNumber: Number(hospitalForm.aadharNumber),
        specialities: hospitalForm.specialities.split(",").map((s) => s.trim()),
      });
      if (res.data.success) {
        toast.success("Hospital onboarding completed!");
        setShowAddHospitalModal(false);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to onboard hospital");
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/saas/plans/add", planForm);
      if (res.data.success) {
        toast.success("Subscription plan added!");
        setShowAddPlanModal(false);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create plan");
    }
  };

  const handleClinicAction = async (id: string, action: "approve" | "reject") => {
    try {
      await api.put(`/api/admin/clinic/${id}/${action}`);
      toast.success(`Clinic ${action === "approve" ? "approved" : "rejected"} successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} clinic`);
    }
  };

  const handleDoctorAction = async (id: string, action: "approve" | "reject") => {
    try {
      await api.post(`/api/admin/doctor/${id}/${action}`);
      toast.success(`Doctor ${action === "approve" ? "approved" : "rejected"} successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} doctor`);
    }
  };

  const handleLabAction = async (id: string, action: "approve" | "reject") => {
    try {
      await api.put(`/api/admin/lab/${id}/${action}`);
      toast.success(`Lab ${action === "approve" ? "approved" : "rejected"} successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action} lab`);
    }
  };

  const toggleFeature = (feature: string) => {
    setPlanForm((prev) => {
      const active = prev.features.includes(feature);
      const next = active ? prev.features.filter((f) => f !== feature) : [...prev.features, feature];
      return { ...prev, features: next };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading platform stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <Toaster position="top-right" toastOptions={{ duration: 1000 }} />
      
      {/* Platform Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/30">
            <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold">DoctorZ Super Admin</h1>
            <p className="text-xs text-slate-400">Platform Management System</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30 hover:bg-rose-500/20 transition-all font-semibold text-sm cursor-pointer"
        >
          <PowerIcon className="w-4 h-4" />
          Logout
        </button>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Statistics Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <BuildingOfficeIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Hospitals / Clinics</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalClinics + stats.totalHospitals}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <UserGroupIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Active Doctors</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalDoctors}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CurrencyRupeeIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Monthly SaaS Revenue</p>
              <h3 className="text-2xl font-bold mt-1">₹{stats.monthlyRevenue.toLocaleString("en-IN")}</h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <ClipboardDocumentListIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Consultations</p>
              <h3 className="text-2xl font-bold mt-1">{stats.totalAppointments}</h3>
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-6 overflow-x-auto whitespace-nowrap pb-1">
          <button
            onClick={() => setActiveTab("tenants")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "tenants" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Hospital Directory
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "plans" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab("clinic_approvals")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "clinic_approvals" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Clinic Approvals
            {pendingClinics.length > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingClinics.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("doctor_approvals")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "doctor_approvals" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Doctor Approvals
            {pendingDoctors.length > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingDoctors.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("lab_approvals")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "lab_approvals" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Lab Approvals
            {pendingLabs.length > 0 && (
              <span className="ml-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingLabs.length}</span>
            )}
          </button>
        </div>

        {/* Dynamic Panel body */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          {activeTab === "tenants" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold">Onboarded Medical Centers</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Manage subdomains, suspensions, and registration status</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search clinics..."
                    value={hospitalSearch}
                    onChange={(e) => {
                      setHospitalSearch(e.target.value);
                      setHospitalPage(1);
                    }}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
                  />
                  <button
                    onClick={() => setShowAddHospitalModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/20 cursor-pointer"
                  >
                    <PlusIcon className="w-4.5 h-4.5" />
                    Onboard Hospital
                  </button>
                </div>
              </div>

              {hospitals.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">No clinics or hospitals onboarding logs.</div>
              ) : (() => {
                const filteredHospitals = hospitals.filter(h => {
                  const nameMatch = h.clinicName ? h.clinicName.toLowerCase().includes(hospitalSearch.toLowerCase()) : false;
                  const subdomainMatch = h.subdomain ? h.subdomain.toLowerCase().includes(hospitalSearch.toLowerCase()) : false;
                  return nameMatch || subdomainMatch;
                });
                const totalPages = Math.ceil(filteredHospitals.length / hospitalsPerPage);
                const paginatedHospitals = filteredHospitals.slice(
                  (hospitalPage - 1) * hospitalsPerPage, 
                  hospitalPage * hospitalsPerPage
                );

                return (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="py-3 px-4">Center Details</th>
                            <th className="py-3 px-4">Admin Staff</th>
                            <th className="py-3 px-4">Subdomain</th>
                            <th className="py-3 px-4">Subscription</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {paginatedHospitals.map((h) => (
                        <tr key={h._id} className="hover:bg-slate-800/40">
                          <td className="py-4 px-4">
                            <h4 className="font-bold text-white text-base">{h.clinicName}</h4>
                            <p className="text-slate-400 text-xs mt-0.5">{h.clinicType} · {h.phone}</p>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-300">
                            <span className="font-semibold text-white block">{h.staffName}</span>
                            <span>ID: {h.staffId}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-xs">
                            {h.subdomain ? `${h.subdomain}.doctorz.com` : "Not assigned"}
                          </td>
                          <td className="py-4 px-4 text-slate-300">
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-xs">
                              {h.subscriptionPlan?.name || "Trial Mode"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                h.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : h.status === "suspended"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {h.status === "active" ? (
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                              ) : (
                                <ExclamationCircleIcon className="w-3.5 h-3.5" />
                              )}
                              {h.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleToggleHospitalStatus(h._id, h.status)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                h.status === "active"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                              }`}
                            >
                              {h.status === "active" ? "Suspend" : "Activate"}
                            </button>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-2 cursor-pointer">
                                Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {paginatedHospitals.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              No clinics match your search.
                            </td>
                          </tr>
                        )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                        <span className="text-xs text-slate-500">
                          Showing {(hospitalPage - 1) * hospitalsPerPage + 1} to {Math.min(hospitalPage * hospitalsPerPage, filteredHospitals.length)} of {filteredHospitals.length}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setHospitalPage(prev => Math.max(prev - 1, 1))}
                            disabled={hospitalPage === 1}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setHospitalPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={hospitalPage === totalPages}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 disabled:opacity-50 hover:bg-slate-700 cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === "plans" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Subscription Plan Matrix</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Control pricing tiers and product features</p>
                </div>
                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-blue-500/20 cursor-pointer"
                >
                  <PlusIcon className="w-4.5 h-4.5" />
                  Create Plan
                </button>
              </div>

              {plans.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">No active plans. Add a plan to start billing.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {plans.map((p) => (
                    <div key={p._id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-blue-400 uppercase tracking-wide">{p.name}</h4>
                        <div className="mt-4 flex items-baseline">
                          <span className="text-3xl font-extrabold">₹{p.priceMonthly}</span>
                          <span className="text-slate-400 text-sm ml-2">/ month</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">₹{p.priceYearly} billed yearly</p>
                        <p className="text-xs text-emerald-400 mt-2 font-semibold">{p.trialDays} days free trial</p>

                        <div className="border-t border-slate-800 my-4 pt-4 space-y-2">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Included Features:</p>
                          {p.features.map((f) => {
                            const featureNameMap: Record<string, string> = {
                              opd: "OPD & Consultations",
                              emr: "Electronic Medical Records",
                              patients: "Patient Management",
                              billing: "Billing, Expenses & Revenue",
                              inventory: "Inventory, Assets & Suppliers",
                              ipd: "IPD Admissions & Wards",
                              hr: "HR, Staff & Departments",
                              revenue: "Revenue Analytics",
                              communication: "Communication Hub",
                            };
                            return (
                              <div key={f} className="flex items-center gap-2 text-sm text-slate-300">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                {featureNameMap[f] || f}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "clinic_approvals" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Pending Clinic Registrations</h2>
                  <p className="text-slate-400 text-sm mt-1">Review and approve new clinics.</p>
                </div>
              </div>
              {pendingClinics.length === 0 ? (
                <div className="py-10 text-center text-slate-500">No pending clinic requests.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Clinic Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Hours</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pendingClinics.map((clinic) => (
                        <tr key={clinic._id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-semibold">{clinic.clinicName}</td>
                          <td className="px-4 py-3 text-slate-300">{clinic.email}</td>
                          <td className="px-4 py-3 text-slate-300">{clinic.district}, {clinic.state} - {clinic.pincode}</td>
                          <td className="px-4 py-3 text-slate-300">{clinic.operatingHours}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => handleClinicAction(clinic._id, "approve")} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/30">Approve</button>
                            <button onClick={() => handleClinicAction(clinic._id, "reject")} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded border border-rose-500/30">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "doctor_approvals" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Pending Doctor Registrations</h2>
                  <p className="text-slate-400 text-sm mt-1">Review and approve new doctors.</p>
                </div>
              </div>
              {pendingDoctors.length === 0 ? (
                <div className="py-10 text-center text-slate-500">No pending doctor requests.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Doctor Name</th>
                        <th className="px-4 py-3">Specialization</th>
                        <th className="px-4 py-3">Qualification</th>
                        <th className="px-4 py-3">Experience</th>
                        <th className="px-4 py-3">Reg. Number</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pendingDoctors.map((doc) => (
                        <tr key={doc._id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-semibold">{doc.fullName}</td>
                          <td className="px-4 py-3 text-slate-300">{doc.specialization}</td>
                          <td className="px-4 py-3 text-slate-300">{doc.qualification}</td>
                          <td className="px-4 py-3 text-slate-300">{doc.experience} yrs</td>
                          <td className="px-4 py-3 text-slate-300">{doc.MedicalRegistrationNumber || "-"}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => handleDoctorAction(doc._id, "approve")} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/30">Approve</button>
                            <button onClick={() => handleDoctorAction(doc._id, "reject")} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded border border-rose-500/30">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "lab_approvals" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Pending Lab Registrations</h2>
                  <p className="text-slate-400 text-sm mt-1">Review and approve new laboratories.</p>
                </div>
              </div>
              {pendingLabs.length === 0 ? (
                <div className="py-10 text-center text-slate-500">No pending lab requests.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Lab Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {pendingLabs.map((lab) => (
                        <tr key={lab._id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-semibold">{lab.name}</td>
                          <td className="px-4 py-3 text-slate-300">{lab.email}</td>
                          <td className="px-4 py-3 text-slate-300">{lab.contactNumber}</td>
                          <td className="px-4 py-3 text-slate-300 truncate max-w-[200px]" title={lab.address}>{lab.address}</td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <button onClick={() => handleLabAction(lab._id, "approve")} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/30">Approve</button>
                            <button onClick={() => handleLabAction(lab._id, "reject")} className="px-3 py-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded border border-rose-500/30">Reject</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Add Hospital Modal */}
      {showAddHospitalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-lg font-bold">Onboard New Medical Center</h3>
              <button onClick={() => setShowAddHospitalModal(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddHospital} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Center Name *</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.clinicName}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, clinicName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Center Type *</label>
                  <select
                    value={hospitalForm.clinicType}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, clinicType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  >
                    <option value="Private">Private Clinic</option>
                    <option value="Government">Government Hospital</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Subdomain *</label>
                  <input
                    type="text"
                    required
                    placeholder="apex-clinic"
                    value={hospitalForm.subdomain}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, subdomain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.phone}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={hospitalForm.email}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Address *</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.address}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.state}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">District *</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.district}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Pincode *</label>
                  <input
                    type="number"
                    required
                    value={hospitalForm.pincode}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">PAN Card Number *</label>
                  <input
                    type="text"
                    required
                    value={hospitalForm.panNumber}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, panNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Aadhar Number *</label>
                  <input
                    type="number"
                    required
                    value={hospitalForm.aadharNumber}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, aadharNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Subscription Plan</label>
                  <select
                    value={hospitalForm.subscriptionPlan}
                    onChange={(e) => setHospitalForm({ ...hospitalForm, subscriptionPlan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  >
                    <option value="">Trial Mode (No plan)</option>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <h4 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Hospital Admin Staff Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Staff Name *</label>
                    <input
                      type="text"
                      required
                      value={hospitalForm.staffName}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, staffName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Staff Email *</label>
                    <input
                      type="email"
                      required
                      value={hospitalForm.staffEmail}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, staffEmail: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Staff ID (Username) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. apexadmin"
                      value={hospitalForm.staffId}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, staffId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Staff Password *</label>
                    <input
                      type="password"
                      required
                      value={hospitalForm.staffPassword}
                      onChange={(e) => setHospitalForm({ ...hospitalForm, staffPassword: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-slate-800 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddHospitalModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm cursor-pointer shadow-lg hover:shadow-blue-500/20"
                >
                  Onboard Hospital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddPlanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl">
            <div className="bg-slate-950 px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-lg font-bold">Create Subscription Plan</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-white">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPlan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silver Plan"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Price Monthly (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.priceMonthly}
                    onChange={(e) => setPlanForm({ ...planForm, priceMonthly: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Price Yearly (₹) *</label>
                  <input
                    type="number"
                    required
                    value={planForm.priceYearly}
                    onChange={(e) => setPlanForm({ ...planForm, priceYearly: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">Free Trial Days *</label>
                <input
                  type="number"
                  required
                  value={planForm.trialDays}
                  onChange={(e) => setPlanForm({ ...planForm, trialDays: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Enable Platform Features:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  {Object.entries({
                    opd: "OPD & Consultations",
                    emr: "Electronic Medical Records",
                    patients: "Patient Management",
                    billing: "Billing, Expenses & Revenue",
                    inventory: "Inventory, Assets & Suppliers",
                    ipd: "IPD Admissions & Wards",
                    hr: "HR, Staff & Departments",
                    revenue: "Revenue Analytics",
                    communication: "Communication Hub",
                  }).map(([featKey, label]) => (
                    <label key={featKey} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={planForm.features.includes(featKey)}
                        onChange={() => toggleFeature(featKey)}
                        className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 border-t border-slate-800 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddPlanModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-bold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm cursor-pointer shadow-lg hover:shadow-blue-500/20"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
