import  { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  CalendarDaysIcon,
  CheckIcon,
  XMarkIcon,
  // ClipboardDocumentCheckIcon,
  // EnvelopeOpenIcon,
} from "@heroicons/react/24/outline";

interface Staff {
  _id: string;
  fullName: string;
  role: string;
  department?: string;
  attendance: Array<{
    date: string;
    status: string;
  }>;
}

interface LeaveRequest {
  staffId: string;
  fullName: string;
  role: string;
  leaveId: string;
  date: string;
  reason: string;
  status: string; // Pending | Approved | Rejected
}

interface OutletContext {
  clinicId: string;
}

export default function HRManagement() {
  const { clinicId } = useOutletContext<OutletContext>();
  const [activeSubTab, setActiveSubTab] = useState<"attendance" | "leaves">("attendance");
  
  // Data states
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [leavesList, setLeavesList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter Date for Attendance Registry
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const [staffRes, leavesRes] = await Promise.all([
        api.get(`/api/staff/list/${clinicId}`),
        api.get(`/api/staff/leaves/list/${clinicId}`),
      ]);

      if (staffRes.data.success) setStaffList(staffRes.data.staff);
      if (leavesRes.data.success) setLeavesList(leavesRes.data.leaves);
    } catch {
      toast.error("Failed to load HR ledger logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [clinicId]);

  // Handlers
  const handleMarkAttendance = async (staffId: string, status: "Present" | "Absent" | "On Leave") => {
    try {
      const res = await api.put(`/api/staff/attendance/${staffId}`, {
        date: attendanceDate,
        status,
      });
      if (res.data.success) {
        toast.success(`Marked as ${status}`);
        fetchData();
      }
    } catch {
      toast.error("Failed to log attendance");
    }
  };

  const handleLeaveStatus = async (staffId: string, leaveId: string, status: "Approved" | "Rejected") => {
    try {
      const res = await api.put(`/api/staff/leaves/status/${staffId}/${leaveId}`, { status });
      if (res.data.success) {
        toast.success(`Leave request ${status.toLowerCase()}`);
        fetchData();
      }
    } catch {
      toast.error("Failed to update leave request");
    }
  };

  const getAttendanceStatusForDate = (staff: Staff, dateStr: string): string => {
    const day = new Date(dateStr).toDateString();
    const entry = staff.attendance?.find((a) => new Date(a.date).toDateString() === day);
    return entry?.status || "Unmarked";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-gray-900">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <CalendarDaysIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HR & Employee Registers</h1>
            <p className="text-gray-500 text-sm mt-0.5">Approve employee leaves and track daily attendance records</p>
          </div>
        </div>
      </div>

      {/* Tab selection */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveSubTab("attendance")}
          className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeSubTab === "attendance" ? "border-slate-900 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Daily Attendance Registry
        </button>
        <button
          onClick={() => setActiveSubTab("leaves")}
          className={`pb-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeSubTab === "leaves" ? "border-slate-900 text-slate-900" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Leave Applications ({leavesList.filter((l) => l.status === "Pending").length})
        </button>
      </div>

      {/* Roster & Work Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        {activeSubTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mark Attendance Roster</h3>
                <p className="text-gray-500 text-xs mt-0.5">Toggle employee shift attendance for the selected day</p>
              </div>

              {/* Date selector */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl">
                <span className="text-xs font-semibold text-gray-500 uppercase">Registry Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-gray-900 outline-none border-none cursor-pointer"
                />
              </div>
            </div>

            {staffList.length === 0 ? (
              <div className="py-20 text-center text-gray-400">No employees registered.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Logged Status</th>
                      <th className="py-3 px-4 text-right">Register Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffList.map((staff) => {
                      const currentStatus = getAttendanceStatusForDate(staff, attendanceDate);
                      return (
                        <tr key={staff._id} className="hover:bg-gray-50/50">
                          <td className="py-4 px-4 font-semibold text-gray-900">{staff.fullName}</td>
                          <td className="py-4 px-4 text-xs font-semibold text-gray-500 uppercase">{staff.role}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                currentStatus === "Present"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : currentStatus === "Absent"
                                  ? "bg-red-50 text-red-650 border-red-200"
                                  : currentStatus === "On Leave"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {currentStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleMarkAttendance(staff._id, "Present")}
                                className="px-2.5 py-1.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg cursor-pointer transition-colors"
                              >
                                Present
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(staff._id, "Absent")}
                                className="px-2.5 py-1.5 text-xs font-bold bg-red-50 text-red-650 border border-red-200 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
                              >
                                Absent
                              </button>
                              <button
                                onClick={() => handleMarkAttendance(staff._id, "On Leave")}
                                className="px-2.5 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                              >
                                On Leave
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "leaves" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Leave Applications Register</h3>
              <p className="text-gray-500 text-xs mt-0.5">Inspect leave dates, reasons, and approve or reject submissions</p>
            </div>

            {leavesList.length === 0 ? (
              <div className="py-20 text-center text-gray-400">No leave requests logged in the system.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Requested Date</th>
                      <th className="py-3 px-4">Leave Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leavesList.map((leave) => (
                      <tr key={leave.leaveId} className="hover:bg-gray-50/50">
                        <td className="py-4 px-4 font-semibold text-gray-900">
                          {leave.fullName}
                          <span className="block text-[10px] text-gray-400 font-bold uppercase">{leave.role}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-gray-800">
                          {new Date(leave.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-4 text-gray-650 italic">"{leave.reason}"</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              leave.status === "Approved"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : leave.status === "Rejected"
                                ? "bg-red-50 text-red-650 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {leave.status === "Pending" ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleLeaveStatus(leave.staffId, leave.leaveId, "Approved")}
                                className="p-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg cursor-pointer"
                                title="Approve"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleLeaveStatus(leave.staffId, leave.leaveId, "Rejected")}
                                className="p-1.5 bg-red-50 text-red-650 border border-red-200 hover:bg-red-100 rounded-lg cursor-pointer"
                                title="Reject"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
