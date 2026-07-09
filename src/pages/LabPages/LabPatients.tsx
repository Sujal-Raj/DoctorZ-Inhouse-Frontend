import React, { useEffect, useMemo, useState, memo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Users,
  Calendar,
  TestTube,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Plus,
  IndianRupee,
  Archive,
} from "lucide-react";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";

interface PatientBooking {
  _id: string;
  userId:
    | {
        _id: string;
        fullName: string;
        email?: string;
        mobileNumber?: string;
      }
    | string
    | null;
  testName: string;
  bookingDate: string | null;
  status: string;
  bookedAt: string | Date;
  bookingType?: "test" | "package";
  reportUrl?: string;
  price?: number;
  packageId?: {
    _id: string;
    packageName: string;
    totalPrice?: number;
  };
  paymentStatus?: "paid" | "unpaid" | "pending";
  paymentMethod?: string;
  transactionId?: string;
}

interface LabDashboardContext {
  labId: string | null;
}

const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatDateTime = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const safeFullName = (userId: PatientBooking["userId"]) =>
  typeof userId === "object" && userId !== null
    ? userId.fullName
    : typeof userId === "string" && userId
    ? userId
    : "Unknown";

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const Patients: React.FC = memo(() => {
  const { labId } = useOutletContext<LabDashboardContext>();
  const [patients, setPatients] = useState<PatientBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowTab, setWorkflowTab] = useState<"worklist" | "billing" | "archives">("worklist");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;
  const [page, setPage] = useState(1);

  // New Booking States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState<"test" | "package">("test");
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    gender: "Male" as "Male" | "Female" | "Other",
    dob: "",
    mobileNumber: "",
    aadhar: "",
  });

  // Report Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<PatientBooking | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [uploadSaving, setUploadSaving] = useState(false);

  // Payment Collection States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<PatientBooking | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const handleOpenPaymentModal = (booking: PatientBooking) => {
    setSelectedBookingForPayment(booking);
    setPaymentMethod("cash");
    setTransactionId("");
    setShowPaymentModal(true);
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;
    setPaymentSaving(true);
    try {
      const type = selectedBookingForPayment.bookingType === "package" ? "labPackage" : "labTest";
      const payload = {
        paymentStatus: "paid",
        paymentMethod,
        transactionId: transactionId.trim() || undefined
      };
      const token = localStorage.getItem("token");
      const res = await api.put(`/api/revenue/payment/${type}/${selectedBookingForPayment._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success("Payment collected successfully!");
        setShowPaymentModal(false);
        setSelectedBookingForPayment(null);
        fetchPatients();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update payment status");
    } finally {
      setPaymentSaving(false);
    }
  };

  const openUploadModal = (booking: PatientBooking) => {
    setUploadTarget(booking);
    setReportFile(null);
    setShowUploadModal(true);
  };

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(
      () => setDebouncedSearch(searchTerm.trim()),
      300
    );
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchPatients = async () => {
    if (!labId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ labPatients: PatientBooking[] }>(
        `/api/lab/getLabPatients/${labId}`
      );
      setPatients(res.data.labPatients || []);
    } catch (err) {
      console.error("Failed to fetch lab patients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [labId]);

  // Fetch tests and packages for lab booking
  useEffect(() => {
    if (!labId) return;
    const fetchTestsAndPackages = async () => {
      try {
        const testRes = await api.get(`/api/lab/getAllTestByLabId/${labId}`);
        setAvailableTests(testRes.data.tests || []);
      } catch (err) {
        console.error("Failed to load tests", err);
      }
      try {
        const pkgRes = await api.get(`/api/lab/getAllPackagesByLabId/${labId}`);
        setAvailablePackages(pkgRes.data.packages || []);
      } catch (err) {
        console.error("Failed to load packages", err);
      }
    };
    fetchTestsAndPackages();
  }, [labId]);

  const handleBook = async () => {
    if (bookingType === "test" && !selectedTestId) {
      toast.error("Please select a test");
      return;
    }
    if (bookingType === "package" && !selectedPackageId) {
      toast.error("Please select a package");
      return;
    }
    if (!patientForm.fullName || !patientForm.gender || !patientForm.dob || !patientForm.mobileNumber || !bookingDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setBookingSaving(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      if (bookingType === "test") {
        await api.post(
          "/api/lab/labBookTest",
          {
            testId: selectedTestId,
            fullName: patientForm.fullName,
            gender: patientForm.gender,
            dob: patientForm.dob,
            mobileNumber: Number(patientForm.mobileNumber),
            aadhar: patientForm.aadhar || undefined,
            bookingDate,
          },
          { headers }
        );
      } else {
        await api.post(
          "/api/lab/labBookPackage",
          {
            packageId: selectedPackageId,
            fullName: patientForm.fullName,
            gender: patientForm.gender,
            dob: patientForm.dob,
            mobileNumber: Number(patientForm.mobileNumber),
            aadhar: patientForm.aadhar || undefined,
            bookingDate,
          },
          { headers }
        );
      }

      toast.success("Booking placed successfully!");
      setShowBookingModal(false);

      // Reset form
      setPatientForm({
        fullName: "",
        gender: "Male",
        dob: "",
        mobileNumber: "",
        aadhar: "",
      });
      setSelectedTestId("");
      setSelectedPackageId("");
      setBookingDate(new Date().toISOString().split("T")[0]);

      // Refresh list
      fetchPatients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to make booking");
    } finally {
      setBookingSaving(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTarget) return;
    if (!reportFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setUploadSaving(true);
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      };

      const formData = new FormData();
      formData.append("report", reportFile);

      // Determine correct endpoint based on bookingType
      const isPackage = uploadTarget.bookingType === "package";
      const url = isPackage
        ? `/api/lab/completePackage/${uploadTarget._id}`
        : `/api/lab/completeTest/${uploadTarget._id}`;

      await api.put(url, formData, { headers });

      toast.success("Report uploaded and test marked completed!");
      setShowUploadModal(false);
      setUploadTarget(null);
      setReportFile(null);

      // Refresh list
      fetchPatients();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload report");
    } finally {
      setUploadSaving(false);
    }
  };

  const tabCounts = useMemo(() => {
    let worklist = 0;
    let billing = 0;
    let archives = 0;

    patients.forEach((p) => {
      const statusLower = p.status?.toLowerCase();
      if (statusLower !== "completed" || !p.reportUrl) {
        worklist++;
      }
      if (p.paymentStatus !== "paid") {
        billing++;
      }
      if (statusLower === "completed" && p.paymentStatus === "paid") {
        archives++;
      }
    });

    return { worklist, billing, archives };
  }, [patients]);

  // Filter patients
  const filtered = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    return patients.filter((p) => {
      const statusLower = p.status?.toLowerCase();
      // 1. Filter by workflow tab
      if (workflowTab === "worklist") {
        const isWork = statusLower !== "completed" || !p.reportUrl;
        if (!isWork) return false;
      } else if (workflowTab === "billing") {
        const isBill = p.paymentStatus !== "paid";
        if (!isBill) return false;
      } else if (workflowTab === "archives") {
        const isArch = statusLower === "completed" && p.paymentStatus === "paid";
        if (!isArch) return false;
      }

      // 2. Filter by date range
      if (dateFrom || dateTo) {
        if (!p.bookingDate) return false;
        const d = new Date(p.bookingDate);
        if (dateFrom && d < new Date(dateFrom + "T00:00:00")) return false;
        if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      }

      // 3. Filter by status (only for worklist tab)
      if (workflowTab === "worklist" && statusFilter && statusLower !== statusFilter.toLowerCase()) return false;

      // 4. Search term
      if (!s) return true;
      const name = safeFullName(p.userId).toLowerCase();
      const test = (p.testName || "").toLowerCase();
      return name.includes(s) || test.includes(s);
    });
  }, [patients, workflowTab, debouncedSearch, dateFrom, dateTo, statusFilter]);

  const statusCounts = useMemo(() => {
    return patients.reduce((acc, p) => {
      const s = p.status?.toLowerCase() || "pending";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [patients]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    setPage((cur) => clamp(cur, 1, totalPages));
  }, [pageSize, filtered.length, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "in progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("");
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-white rounded-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c213e] mb-4"></div>
        <p className="text-gray-600 text-sm">Loading patient data...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              Patient Bookings
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-[52px]">
              View and manage all patient appointments
            </p>
          </div>
          <button
            onClick={() => setShowBookingModal(true)}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0c213e] text-white rounded-xl font-semibold shadow-sm hover:bg-[#1a3a5f] active:scale-95 transition-all duration-200 text-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Book Test/Package
          </button>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setWorkflowTab("worklist");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            workflowTab === "worklist"
              ? "bg-[#0c213e] text-white shadow-md"
              : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <TestTube className="w-4 h-4" />
          Diagnostic Worklist
          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
            workflowTab === "worklist"
              ? "bg-white text-[#0c213e]"
              : "bg-gray-100 text-gray-600"
          }`}>
            {tabCounts.worklist}
          </span>
        </button>

        <button
          onClick={() => {
            setWorkflowTab("billing");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            workflowTab === "billing"
              ? "bg-[#0c213e] text-white shadow-md"
              : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <IndianRupee className="w-4 h-4" />
          Billing & Payments
          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
            workflowTab === "billing"
              ? "bg-white text-[#0c213e]"
              : "bg-gray-100 text-gray-600"
          }`}>
            {tabCounts.billing}
          </span>
        </button>

        <button
          onClick={() => {
            setWorkflowTab("archives");
            setPage(1);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
            workflowTab === "archives"
              ? "bg-[#0c213e] text-white shadow-md"
              : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          <Archive className="w-4 h-4" />
          Archives & Receipts
          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
            workflowTab === "archives"
              ? "bg-white text-[#0c213e]"
              : "bg-gray-100 text-gray-600"
          }`}>
            {tabCounts.archives}
          </span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by patient name or test..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none transition-all"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(dateFrom || dateTo || statusFilter) && (
                <span className="w-2 h-2 bg-[#0c213e] rounded-full"></span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              {(dateFrom || dateTo || statusFilter) && (
                <div className="sm:col-span-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Test / Package
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Booking Date
                </th>
                {workflowTab === "worklist" && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Booked At
                  </th>
                )}
                {workflowTab !== "worklist" && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {workflowTab === "billing" ? "Fee Amount" : "Paid Amount"}
                  </th>
                )}
                {workflowTab === "worklist" && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Sample Status
                  </th>
                )}
                {workflowTab === "billing" && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Status
                  </th>
                )}
                {workflowTab === "archives" && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Settlement Info
                  </th>
                )}
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={workflowTab === "worklist" ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        No bookings found in this view
                      </p>
                      <p className="text-sm text-gray-400">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => {
                  const user =
                    typeof p.userId === "object" && p.userId !== null
                      ? p.userId
                      : null;
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#0c213e] to-[#1a3a5e] rounded-full flex items-center justify-center text-white font-semibold">
                            {safeFullName(p.userId).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {safeFullName(p.userId)}
                            </p>
                            {user?.email && (
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            )}
                            {user?.mobileNumber && (
                              <p className="text-xs text-gray-500">
                                {user.mobileNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${p.bookingType === "package" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                          <TestTube className="w-4 h-4" />
                          {p.testName || "—"}
                          {p.bookingType && (
                            <span className="text-[10px] font-bold uppercase ml-1 opacity-70">
                              ({p.bookingType})
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(p.bookingDate)}
                        </div>
                      </td>
                      {workflowTab === "worklist" && (
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {formatDateTime(p.bookedAt)}
                          </p>
                        </td>
                      )}
                      {workflowTab !== "worklist" && (
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            ₹{p.bookingType === "package" ? p.packageId?.totalPrice || "—" : p.price || 0}
                          </p>
                        </td>
                      )}
                      {workflowTab === "worklist" && (
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              p.status
                            )}`}
                          >
                            {p.status}
                          </span>
                        </td>
                      )}
                      {workflowTab === "billing" && (
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span
                              onClick={() => handleOpenPaymentModal(p)}
                              className={`inline-flex w-fit px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider cursor-pointer select-none transition-all ${
                                p.paymentStatus === "pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                              }`}
                            >
                              {p.paymentStatus || "unpaid"}
                            </span>
                          </div>
                        </td>
                      )}
                      {workflowTab === "archives" && (
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5 text-xs text-gray-500">
                            <span className="font-semibold text-gray-700 uppercase">
                              {p.paymentMethod || "online"}
                            </span>
                            {p.paymentDate && (
                              <span>
                                {new Date(p.paymentDate).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {p.transactionId && (
                              <span className="font-mono text-[10px] text-gray-400">
                                Ref: {p.transactionId}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        {workflowTab === "billing" && (
                          <button
                            onClick={() => handleOpenPaymentModal(p)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                          >
                            Collect Payment
                          </button>
                        )}
                        {workflowTab === "worklist" && (
                          p.status?.toLowerCase() === "completed" ? (
                            <span className="text-gray-400 text-xs italic">Completed</span>
                          ) : p.status?.toLowerCase() === "cancelled" ? (
                            <span className="text-gray-400 text-xs italic">Cancelled</span>
                          ) : (
                            <button
                              onClick={() => openUploadModal(p)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0c213e] hover:bg-[#1a3a5f] rounded-lg transition-colors cursor-pointer"
                            >
                              Upload Report
                            </button>
                          )
                        )}
                        {workflowTab === "archives" && (
                          p.reportUrl ? (
                            <a
                              href={p.reportUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              View Report
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs italic">No report uploaded</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {Math.min((page - 1) * pageSize + 1, filtered.length)}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(page * pageSize, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium">{filtered.length}</span> results
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) => clamp(p - 1, 1, totalPages))
                  }
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium">
                  Page {page} of {totalPages}
                </div>

                <button
                  onClick={() =>
                    setPage((p) => clamp(p + 1, 1, totalPages))
                  }
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                Book Test / Package
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setBookingType("test");
                    setSelectedPackageId("");
                  }}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all cursor-pointer ${
                    bookingType === "test"
                      ? "border-[#0c213e] bg-blue-50/50 text-[#0c213e]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Book individual Test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookingType("package");
                    setSelectedTestId("");
                  }}
                  className={`py-3 rounded-xl border-2 font-semibold transition-all cursor-pointer ${
                    bookingType === "package"
                      ? "border-[#0c213e] bg-blue-50/50 text-[#0c213e]"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Book Lab Package
                </button>
              </div>

              {bookingType === "test" ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Select Test*
                  </label>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    <option value="">-- Choose a Test --</option>
                    {availableTests.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.testName} (₹{t.price})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Select Package*
                  </label>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    <option value="">-- Choose a Package --</option>
                    {availablePackages.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.packageName} (₹{p.totalPrice})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h3 className="font-bold text-gray-900 text-base">Patient Information</h3>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Full Name*
                  </label>
                  <input
                    type="text"
                    value={patientForm.fullName}
                    onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Gender*
                    </label>
                    <select
                      value={patientForm.gender}
                      onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value as any })}
                      className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Date of Birth*
                    </label>
                    <input
                      type="date"
                      value={patientForm.dob}
                      onChange={(e) => setPatientForm({ ...patientForm, dob: e.target.value })}
                      className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Mobile Number*
                    </label>
                    <input
                      type="number"
                      value={patientForm.mobileNumber}
                      onChange={(e) => setPatientForm({ ...patientForm, mobileNumber: e.target.value })}
                      className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Aadhar Card Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={patientForm.aadhar}
                      onChange={(e) => setPatientForm({ ...patientForm, aadhar: e.target.value })}
                      className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="12 digit number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Booking Date*
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={bookingSaving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#0c213e] rounded-xl hover:bg-[#1a3a5f] disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {bookingSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && uploadTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Upload Test Report</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadTarget(null);
                }}
                className="text-gray-500 hover:bg-gray-100 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Patient:</p>
                <p className="font-semibold text-gray-800">{safeFullName(uploadTarget.userId)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Test/Package:</p>
                <p className="font-semibold text-gray-800">{uploadTarget.testName}</p>
              </div>
              
              <div className="pt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Report File (PDF/Image)*
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setReportFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadTarget(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploadSaving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#0c213e] rounded-xl hover:bg-[#1a3a5f] disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {uploadSaving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Submit & Complete
              </button>
            </div>
          </div>
        </div>
      )}
      {showPaymentModal && selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#0c213e] px-6 py-4 text-white">
              <h3 className="font-bold text-lg">Collect Lab Test Fee</h3>
              <p className="text-xs text-blue-200/80">Record details for lab test settlement</p>
            </div>
            
            <form onSubmit={handleCollectPaymentSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                <p className="text-xs text-gray-400">Patient: <span className="font-semibold text-gray-700">{safeFullName(selectedBookingForPayment.userId)}</span></p>
                <p className="text-xs text-gray-400">Test/Package: <span className="font-semibold text-gray-700">{selectedBookingForPayment.testName}</span></p>
                <p className="text-sm text-gray-700 font-bold mt-1">Total Fee: <span className="text-[#0c213e] text-lg">₹{selectedBookingForPayment.bookingType === "package" ? selectedBookingForPayment.packageId?.totalPrice || "—" : selectedBookingForPayment.price || 0}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Scanner</option>
                  <option value="card">Debit/Credit Card</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Transaction / Reference ID <span className="text-gray-300">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. UPI Ref Number, Card receipt number"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBookingForPayment(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-bold shadow transition cursor-pointer"
                >
                  {paymentSaving ? "Processing..." : "Record Settlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
});

export default Patients;
