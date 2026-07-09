import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import toast from "react-hot-toast";
import {
  BuildingOffice2Icon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  // CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
}

interface Department {
  _id: string;
  name: string;
  description?: string;
  headDoctorId?: Doctor;
  doctors: Doctor[];
}

interface OutletContext {
  clinicId: string;
}

export default function DepartmentManagement() {
  const { clinicId } = useOutletContext<OutletContext>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headDoctorId, setHeadDoctorId] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState<string[]>([]);

  const fetchClinicDoctors = async () => {
    if (!clinicId) return;
    try {
      const res = await api.get(`/api/doctor/getClinicDoctors/${clinicId}`);
      if (Array.isArray(res.data.doctors)) {
        setDoctorsList(res.data.doctors);
      }
    } catch {
      toast.error("Failed to load clinic doctor associations");
    }
  };

  const fetchDepartments = async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/staff/departments/${clinicId}`);
      if (res.data.success) {
        setDepartments(res.data.departments);
      }
    } catch {
      toast.error("Failed to load departments list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicDoctors();
    fetchDepartments();
  }, [clinicId]);

  const openAdd = () => {
    setEditDept(null);
    setName("");
    setDescription("");
    setHeadDoctorId("");
    setSelectedDoctors([]);
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditDept(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setHeadDoctorId(dept.headDoctorId?._id || "");
    setSelectedDoctors(dept.doctors.map((d) => d._id));
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Department name is required");
      return;
    }

    const payload = {
      clinicId,
      name,
      description,
      headDoctorId: headDoctorId || undefined,
      doctors: selectedDoctors,
    };

    try {
      if (editDept) {
        const res = await api.put(`/api/staff/departments/update/${editDept._id}`, payload);
        if (res.data.success) {
          toast.success("Department updated successfully");
          setShowModal(false);
          fetchDepartments();
        }
      } else {
        const res = await api.post("/api/staff/departments/add", payload);
        if (res.data.success) {
          toast.success("Department created successfully");
          setShowModal(false);
          fetchDepartments();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save department");
    }
  };

  const handleDelete = async (deptId: string) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      const res = await api.delete(`/api/staff/departments/delete/${deptId}`);
      if (res.data.success) {
        toast.success("Department deleted successfully");
        fetchDepartments();
      }
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const handleToggleDoctor = (docId: string) => {
    setSelectedDoctors((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-gray-900">
      

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <BuildingOffice2Icon className="w-6 h-6 text-[#0c213e]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Department Configuration</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage medical departments and assign clinical practitioners</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#0c213e] hover:bg-[#1a3a5f] text-white px-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Add Department
        </button>
      </div>

      {/* Department Cards */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-gray-400">
          No medical departments configured yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept._id} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-[#0c213e]">{dept.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(dept)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept._id)}
                      className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-500 text-sm mt-2">{dept.description || "No description configured."}</p>

                <div className="border-t border-gray-100 my-4 pt-4 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Department Head</span>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                      {dept.headDoctorId ? `Dr. ${dept.headDoctorId.fullName}` : "Not Assigned"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Practicing Doctors ({dept.doctors.length})</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dept.doctors.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No doctors mapped</span>
                      ) : (
                        dept.doctors.map((doc) => (
                          <span
                            key={doc._id}
                            className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-md text-xs font-medium"
                          >
                            Dr. {doc.fullName}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white rounded-t-3xl">
              <h3 className="text-lg font-bold">{editDept ? "Edit Department" : "Add Department"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white cursor-pointer">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pediatrics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Description</label>
                <textarea
                  placeholder="Provide department info..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl p-4 text-sm outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Department Head Doctor</label>
                <select
                  value={headDoctorId}
                  onChange={(e) => setHeadDoctorId(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-[#0c213e] rounded-xl px-4 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="">Select Doctor</option>
                  {doctorsList.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.fullName} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Map Practicing Doctors</label>
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl max-h-40 overflow-y-auto space-y-2">
                  {doctorsList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No doctors registered in this clinic.</p>
                  ) : (
                    doctorsList.map((doc) => (
                      <label key={doc._id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedDoctors.includes(doc._id)}
                          onChange={() => handleToggleDoctor(doc._id)}
                          className="rounded border-gray-300 text-[#0c213e] w-4 h-4 cursor-pointer"
                        />
                        Dr. {doc.fullName} ({doc.specialization})
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-4 border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3.5 rounded-xl font-bold text-sm text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0c213e] hover:bg-[#1a3a5f] py-3.5 text-white rounded-xl font-bold text-sm cursor-pointer"
                >
                  {editDept ? "Save Changes" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
