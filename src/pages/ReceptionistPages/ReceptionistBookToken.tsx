import { useEffect, useState } from "react";
import api from "../../Services/mainApi";

interface Doctor {
  _id: string;
  fullName: string;
}

interface FormErrors {
  doctorId?: string;
  fullName?: string;
  gender?: string;
  dob?: string;
  mobileNumber?: string;
  aadhar?: string;
  date?: string;
}

export default function BookToken() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    doctorId: "",
    fullName: "",
    gender: "",
    dob: "",
    mobileNumber: "",
    aadhar: "",
    date: "",
    paid: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("receptionToken");
      const res = await api.get(
        "/api/receptionist/getClinicDoctorsForReceptionist",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDoctors(res.data.doctors);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "doctorId":
        if (!value) return "Please select a doctor.";
        break;

      case "fullName":
        if (!value.trim()) return "Patient name is required.";
        if (value.trim().length < 3) return "Name must be at least 3 characters.";
        if (value.trim().length > 60) return "Name must not exceed 60 characters.";
        if (!/^[a-zA-Z\s'.'-]+$/.test(value.trim()))
          return "Name can only contain letters, spaces, and . ' -";
        break;

      case "gender":
        if (!value) return "Please select a gender.";
        break;

      case "dob": {
        if (!value) return "Date of birth is required.";
        const dob = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(dob.getTime())) return "Invalid date of birth.";
        if (dob >= today) return "Date of birth must be in the past.";
        const minDob = new Date();
        minDob.setFullYear(minDob.getFullYear() - 120);
        if (dob < minDob) return "Please enter a valid date of birth.";
        break;
      }

      case "mobileNumber":
        if (!value) return "Mobile number is required.";
        if (!/^\d{10}$/.test(value))
          return "Mobile number must be exactly 10 digits.";
        if (/^(.)\1{9}$/.test(value))
          return "Please enter a valid mobile number.";
        break;

      case "aadhar":
        if (value && !/^\d{12}$/.test(value))
          return "Aadhar must be exactly 12 digits.";
        break;

      case "date": {
        if (!value) return "Appointment date is required.";
        const appt = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(appt.getTime())) return "Invalid appointment date.";
        if (appt < today) return "Appointment date cannot be in the past.";
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() + 1);
        if (appt > maxDate)
          return "Appointment date cannot be more than 1 year ahead.";
        break;
      }
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // Allow only digits for numeric fields
    if (name === "mobileNumber" || name === "aadhar") {
      if (value && !/^\d*$/.test(value)) return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    // Live validation: clear error as soon as field becomes valid
    const fieldError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (["doctorId", "fullName", "gender", "dob", "mobileNumber", "aadhar", "date"] as (keyof FormErrors)[]).forEach((key) => {
      const msg = validateField(key, form[key as keyof typeof form] as string);
      if (msg) {
        newErrors[key] = msg;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateAll()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("receptionToken");
      console.log(form.paid)

      const res = await api.post(
        "/api/receptionist/book-token",
        {
          doctorId: form.doctorId,
          fullName: form.fullName.trim(),
          gender: form.gender,
          dob: form.dob,
          mobileNumber: form.mobileNumber,
          aadhar: form.aadhar || undefined,
          date: form.date,
          paid: form.paid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(
        `✅ Token booked successfully! Token No: #${res.data.tokenNumber}`
      );

      setForm({
        doctorId: "",
        fullName: "",
        gender: "",
        dob: "",
        mobileNumber: "",
        aadhar: "",
        date: "",
        paid: false,
      });
      setErrors({});
    } catch (err: any) {
      setError(err?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const maxDateStr = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  })();
  const minDobStr = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 120);
    return d.toISOString().split("T")[0];
  })();

  const inputClass = (field: keyof FormErrors) =>
    `w-full mt-1 border rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-200 focus:ring-blue-200"
    }`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Book Token
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a token for walk-in patient
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        {error && (
          <p className="mb-4 text-red-600 bg-red-100 p-2 rounded">{error}</p>
        )}
        {message && (
          <p className="mb-4 text-green-600 bg-green-100 p-2 rounded">
            {message}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Doctor */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Select Doctor</label>
            <select
              name="doctorId"
              value={form.doctorId}
              onChange={handleChange}
              className={inputClass("doctorId")}
              required
            >
              <option value="">Choose Doctor</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.fullName}
                </option>
              ))}
            </select>
            {errors.doctorId && (
              <p className="text-red-500 text-xs mt-1">{errors.doctorId}</p>
            )}
          </div>

          {/* Patient Name */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Patient Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              maxLength={60}
              className={inputClass("fullName")}
              required
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="text-sm text-gray-600">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className={inputClass("gender")}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="text-sm text-gray-600">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              max={todayStr}
              min={minDobStr}
              className={inputClass("dob")}
              required
            />
            {errors.dob && (
              <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-sm text-gray-600">Mobile Number</label>
            <input
              type="tel"
              name="mobileNumber"
              value={form.mobileNumber}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              maxLength={10}
              inputMode="numeric"
              className={inputClass("mobileNumber")}
              required
            />
            {errors.mobileNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>
            )}
          </div>

          {/* Aadhar (optional) */}
          <div>
            <label className="text-sm text-gray-600">
              Aadhar Number{" "}
              <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              name="aadhar"
              value={form.aadhar}
              onChange={handleChange}
              placeholder="12-digit Aadhar"
              maxLength={12}
              inputMode="numeric"
              className={inputClass("aadhar")}
            />
            {errors.aadhar && (
              <p className="text-red-500 text-xs mt-1">{errors.aadhar}</p>
            )}
          </div>

          {/* Appointment Date */}
          <div className="md:col-span-2">
            <label className="text-sm text-gray-600">Appointment Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={todayStr}
              max={maxDateStr}
              className={inputClass("date")}
              required
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Paid Checkbox */}
          <div className="md:col-span-2">
            <label
              className={`flex items-center gap-3 cursor-pointer select-none w-fit px-4 py-3 rounded-lg border transition-all ${
                form.paid
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  name="paid"
                  checked={form.paid}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                    form.paid
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {form.paid && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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
              <div>
                <p className={`text-sm font-medium ${form.paid ? "text-green-700" : "text-gray-700"}`}>
                  Mark as Paid
                </p>
                <p className="text-xs text-gray-400">
                  Check if the patient has paid the consultation fee
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#0c213e] text-white py-3 rounded-lg font-semibold transition ${
                loading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#1f2870]"
              }`}
            >
              {loading ? "Booking..." : "Book Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}