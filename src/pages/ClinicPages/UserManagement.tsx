import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

interface Staff {
  _id: string;
  staffId: string;
  fullName: string;
  email?: string;
  mobileNo?: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  department?: string;
  salary: number;
  shiftStart: string;
  shiftEnd: string;
}

interface OutletContext {
  clinicId: string;
}

export default function UserManagement() {
  const { clinicId } = useOutletContext<OutletContext>();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [role, setRole] = useState("Receptionist");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState(0);
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("17:00");

  const roles = ["Admin", "Receptionist", "Cashier", "Accountant", "HR", "Store Manager"];
  const availablePermissions = ["opd", "emr", "billing", "hr", "inventory", "ipd"];

  const fetchStaff = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/staff/list/${clinicId}`);
      if (res.data.success) {
        setStaffList(res.data.staff);
      }
    } catch {
      toast.error("Failed to load staff roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [clinicId]);

  const openAdd = () => {
    setEditStaff(null);
    setFullName("");
    setEmail("");
    setMobileNo("");
    setRole("Receptionist");
    setPassword("");
    setPermissions(["opd", "billing"]);
    setDepartment("");
    setSalary(0);
    setShiftStart("09:00");
    setShiftEnd("17:00");
    setShowModal(true);
  };

  const openEdit = (staff: Staff) => {
    setEditStaff(staff);
    setFullName(staff.fullName);
    setEmail(staff.email || "");
    setMobileNo(staff.mobileNo || "");
    setRole(staff.role);
    setPassword("");
    setPermissions(staff.permissions);
    setDepartment(staff.department || "");
    setSalary(staff.salary);
    setShiftStart(staff.shiftStart);
    setShiftEnd(staff.shiftEnd);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || (!editStaff && !password)) {
      toast.error("Required fields are missing");
      return;
    }

    try {
      if (editStaff) {
        const res = await api.put(`/api/staff/update/${editStaff._id}`, {
          fullName,
          email,
          mobileNo,
          role,
          permissions,
          department,
          salary,
          shiftStart,
          shiftEnd,
          password: password || undefined,
        });
        if (res.data.success) {
          toast.success("Employee details updated");
          setShowModal(false);
          fetchStaff();
        }
      } else {
        const res = await api.post("/api/staff/add", {
          clinicId,
          fullName,
          email,
          mobileNo,
          role,
          password,
          permissions,
          department,
          salary,
          shiftStart,
          shiftEnd,
        });
        if (res.data.success) {
          toast.success("Employee onboarding complete!");
          setShowModal(false);
          fetchStaff();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save staff record");
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await api.delete(`/api/staff/delete/${staffId}`);
      if (res.data.success) {
        toast.success("Employee removed");
        fetchStaff();
      }
    } catch {
      toast.error("Failed to delete staff record");
    }
  };

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <UserGroupIcon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User & Role Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Define employee login IDs, roles, salary, shifts, and permissions</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs cursor-pointer transition-colors"
        >
          <UserPlusIcon className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* Roster Grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {staffList.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No staff members onboarded yet. Add employees to start.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <th className="py-4 px-6">Name / Role</th>
                  <th className="py-4 px-6">Staff ID</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Salary & Shifts</th>
                  <th className="py-4 px-6">Permissions Scope</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-6">
                      <h4 className="font-bold text-gray-950 text-base">{staff.fullName}</h4>
                      <span className="inline-flex px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 border border-blue-100">
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-gray-500">{staff.staffId}</td>
                    <td className="py-4 px-6 text-gray-600">{staff.department || "General"}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-semibold text-gray-900 flex items-center gap-0.5">
                          <BanknotesIcon className="w-3.5 h-3.5 text-gray-450" />
                          ₹{staff.salary.toLocaleString("en-IN")}
                        </span>
                        <span className="text-gray-400 flex items-center gap-0.5">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {staff.shiftStart} - {staff.shiftEnd}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                        {staff.permissions.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-md text-[10px] font-bold uppercase"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(staff)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl cursor-pointer transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(staff._id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl cursor-pointer transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-bold">{editStaff ? "Edit Employee Records" : "Onboard New Employee"}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                    {editStaff ? "Password (Leave blank to keep same)" : "Password *"}
                  </label>
                  <input
                    type="password"
                    required={!editStaff}
                    placeholder={editStaff ? "••••••••" : ""}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Reception, HR, Accounts"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Shift Start</label>
                    <input
                      type="time"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Shift End</label>
                    <input
                      type="time"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Configure System Permissions Access:</label>
                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium select-none capitalize">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded border-gray-300 text-[#0c213e] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-250 py-3.5 rounded-xl font-bold text-sm text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  {editStaff ? "Save Changes" : "Onboard Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
