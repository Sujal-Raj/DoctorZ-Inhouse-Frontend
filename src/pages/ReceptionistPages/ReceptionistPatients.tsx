// 📁 components/Patients.tsx
import { useEffect, useState } from "react";
import api from "../../Services/mainApi";

interface Patient {
  bookingId: string;
  doctor: {
    fullName: string;
    specialization: string;
  };
  patient: string;
  mobileNumber: string;
  mode: string;
  bookedBy: string;
  fees: number;
  status: string;
  date: Date;
  paid: boolean;
}

interface EditModalProps {
  patient: Patient;
  onClose: () => void;
  onSave: (updated: Patient) => void;
}

function EditModal({ patient, onClose, onSave }: EditModalProps) {
  const [form, setForm] = useState<Patient>({ ...patient });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof Patient, value: string | number |boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("receptionToken");
      await api.put(
        `/api/receptionist/clinic-patients/${patient.bookingId}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      onSave(form);
      onClose();
    } catch {
      alert("Failed to update patient details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Patient Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Patient Name
            </label>
            <input
              type="text"
              value={form.patient}
              onChange={(e) => handleChange("patient", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => handleChange("mobileNumber", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Fees (₹)
            </label>
            <input
              type="number"
              value={form.fees}
              onChange={(e) => handleChange("fees", Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={form.paid}
    onChange={(e) => handleChange("paid", e.target.checked)}
  />
  <label className="text-sm text-gray-700">Paid</label>
</div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("receptionToken");
      const res = await api.get("/api/receptionist/clinic-patients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(res);
      setPatients(res.data.patients);
      setTotalPatients(res.data.totalPatients);
    } catch {
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSave = (updated: Patient) => {
    setPatients((prev) =>
      prev.map((p) => (p.bookingId === updated.bookingId ? updated : p)),
    );
  };

  const filteredPatients = patients.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.patient?.toLowerCase().includes(q) ||
      item.mobileNumber?.toLowerCase().includes(q) ||
      item.doctor?.fullName?.toLowerCase().includes(q) ||
      item.doctor?.specialization?.toLowerCase().includes(q) ||
      item.mode?.toLowerCase().includes(q) ||
      item.bookedBy?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      String(item.fees).includes(q) ||
      new Date(item.date).toLocaleDateString().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingPatient && (
        <EditModal
          patient={editingPatient}
          onClose={() => setEditingPatient(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Patients
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            All patients across your clinic bookings
          </p>
          <p className="text-sm text-gray-500 font-bold tracking-tight">
            Total Patients: {totalPatients}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by name, mobileNumber, doctor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        {loading && (
          <p className="text-sm text-gray-500">Loading patients...</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && patients.length === 0 && (
          <p className="text-sm text-gray-500">No patients found.</p>
        )}
        {!loading && patients.length > 0 && filteredPatients.length === 0 && (
          <p className="text-sm text-gray-500">No results match your search.</p>
        )}

        {/* Desktop Table */}
        {!loading && filteredPatients.length > 0 && (
          <>
            {/* Table — hidden on small screens */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-gray-600">
                  <tr>
                    <th className="py-3 text-left">Patient</th>
                    <th className="text-left">Contact </th>
                    <th className="text-left">Doctor</th>
                    <th className="text-left">Mode / Booked by</th>
                    <th className="text-left">Fees</th>
                    <th className="text-left">Paid</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((item) => (
                    <tr
                      key={item.bookingId}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="py-3 font-medium text-gray-900">
                        {item.patient}
                      </td>

                      <td className="text-gray-700">
                        {item.mobileNumber ? (
                          <a
                            href={`tel:${item.mobileNumber}`}
                            className="hover:text-blue-600 transition"
                          >
                            {item.mobileNumber}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {item.doctor?.fullName || "—"}
                        <p className="text-xs text-gray-500">
                          {item.doctor?.specialization}
                        </p>
                      </td>

                      <td>
                        <span className="capitalize text-gray-700">
                          {item.mode ? item.mode : item.bookedBy}
                        </span>
                      </td>

                      <td>₹{item.fees}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.paid
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.paid ? "Paid" : "Unpaid"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : item.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td>
                        {new Date(item.date).toLocaleDateString()}
                        <p className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleTimeString()}
                        </p>
                      </td>

                      <td>
                        <button
                          onClick={() => setEditingPatient(item)}
                          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-2.5 py-1.5 transition"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 1 1 2.828 2.828L11.828 15.828a2 2 0 0 1-1.414.586H9v-2a2 2 0 0 1 .586-1.414z"
                            />
                          </svg>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* mobileNumber Cards — shown only on small screens */}
            <div className="flex flex-col gap-4 md:hidden">
              {filteredPatients.map((item) => (
                <div
                  key={item.bookingId}
                  className="border border-gray-200 rounded-xl p-4 space-y-3"
                >
                  {/* Top row: name + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.patient}
                      </p>
                      {item.mobileNumber ? (
                        <a
                          href={`tel:${item.mobileNumber}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {item.mobileNumber}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-400">No mobileNumber</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : item.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Doctor */}
                  <div className="text-sm text-gray-700">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Doctor
                    </span>
                    <p>{item.doctor?.fullName || "—"}</p>
                    {item.doctor?.specialization && (
                      <p className="text-xs text-gray-500">
                        {item.doctor.specialization}
                      </p>
                    )}
                  </div>

                  {/* Mode, Fees, Date */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Mode
                      </p>
                      <p className="capitalize text-gray-700">
                        {item.mode ? item.mode : item.bookedBy || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Fees
                      </p>
                      <p className="text-gray-700">₹{item.fees}</p>
                    </div>
                    <div>
  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Paid</p>
  <p className={item.paid ? "text-green-600" : "text-red-600"}>
    {item.paid ? "Paid" : "Unpaid"}
  </p>
</div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Date
                      </p>
                      <p className="text-gray-700">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => setEditingPatient(item)}
                    className="w-full flex items-center justify-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 1 1 2.828 2.828L11.828 15.828a2 2 0 0 1-1.414.586H9v-2a2 2 0 0 1 .586-1.414z"
                      />
                    </svg>
                    Edit Details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
