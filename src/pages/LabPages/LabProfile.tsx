import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Helmet } from "react-helmet";
import toast, { Toaster } from "react-hot-toast";
import {
  Building2,
  Mail,
  MapPin,
  Save,
  Edit3,
  Lock,
  MapPinned,
  Hash,
} from "lucide-react";
import api from "../../Services/mainApi";

interface Lab {
  labId: string;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  password?: string;
}

interface LabDashboardContext {
  labId: string | null;
}

interface GetLabResponse {
  labDetails: Lab;
}

interface UpdateLabResponse {
  lab: Lab;
}

const PRIMARY = "#0C213E";

const LabProfile = () => {
  const { labId: contextLabId } = useOutletContext<LabDashboardContext>();

  const [lab, setLab] = useState<Lab>({
    labId: "",
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // Fetch lab details
  useEffect(() => {
    if (!contextLabId) return;

    const fetchLab = async () => {
      try {
        const res = await api.get<GetLabResponse>(
          `/api/lab/getLabById/${contextLabId}`
        );
        setLab(res.data.labDetails);
      } catch {
        toast.error("Failed to load lab profile");
      }
    };

    fetchLab();
  }, [contextLabId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLab({ ...lab, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextLabId) return;

    setSaving(true);

    try {
      const payload = {
        ...lab,
        ...(passwordInput ? { password: passwordInput } : {}),
      };

      const res = await api.put<UpdateLabResponse>(
        `/api/lab/updateLabProfile/${contextLabId}`,
        payload
      );

      setLab(res.data.lab);
      toast.success("Lab profile updated successfully!");
      setIsEditing(false);
      setPasswordInput("");
    } catch {
      toast.error("Failed to update profile");
    }

    setSaving(false);
  };

  const inputBase =
    "w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition outline-none";
  const inputActive =
    inputBase +
    " border-gray-300 focus:border-[#0C213E] focus:ring-2 focus:ring-[#0C213E]/15";
  const inputDisabled =
    inputBase + " border-gray-200 bg-gray-100 cursor-not-allowed";

  const withIcon = (editing: boolean) =>
    (editing ? inputActive : inputDisabled) + " pl-10";

  const simple = (editing: boolean) => (editing ? inputActive : inputDisabled);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3400,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />

      <Helmet>
        <title>Lab Profile | Lab Dashboard</title>
      </Helmet>

      <div className="min-h-[calc(100vh-80px)] bg-gray-50">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Top header card matching dashboard theme */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0c213e] flex items-center justify-center shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Laboratory Profile
                </h1>
                <p className="text-sm text-gray-500">
                  View and manage your lab’s account details
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-black shadow-sm hover:bg-yellow-500 transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Quick summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-gray-500">Lab Name</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {lab.name || "—"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-gray-500">Contact Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {lab.email || "—"}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MapPinned className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-gray-500">Location</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {lab.city && lab.state ? `${lab.city}, ${lab.state}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Main form card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-6"
          >
            {/* Section: Basic info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Basic Information
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  These details identify your lab in the system.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Lab Name */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Lab Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    name="name"
                    value={lab.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={withIcon(isEditing)}
                    placeholder="Enter lab name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={lab.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={withIcon(isEditing)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Section: Address */}
            <div className="pt-2 border-t border-gray-100" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Address Details
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Used on reports and patient communications.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Address line */}
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    name="address"
                    value={lab.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={withIcon(isEditing)}
                    placeholder="Street, area, landmark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    City
                  </label>
                  <input
                    name="city"
                    value={lab.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={simple(isEditing)}
                    placeholder="City"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    State
                  </label>
                  <input
                    name="state"
                    value={lab.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={simple(isEditing)}
                    placeholder="State"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Pincode
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      name="pincode"
                      value={lab.pincode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={withIcon(isEditing)}
                      placeholder="e.g. 560001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Security (password change) */}
            <div className="pt-2 border-t border-gray-100" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-semibold text-gray-900">
                  Security
                </h2>
                <p className="text-xs md:text-sm text-gray-500">
                  Set a new password only when you need to change it.
                </p>
              </div>
            </div>

            <div className="max-w-md">
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                New Password (optional)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={!isEditing}
                  className={withIcon(isEditing)}
                  placeholder={
                    isEditing
                      ? "Leave empty to keep current password"
                      : "Enable edit mode to change password"
                  }
                />
              </div>
            </div>

            {/* Actions */}
            {isEditing && (
              <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setPasswordInput("");
                  }}
                  className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0C213E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-70 transition"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default LabProfile;
