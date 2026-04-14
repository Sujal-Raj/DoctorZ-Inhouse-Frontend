


import React, { useEffect, useState } from "react";
import api from "../../Services/mainApi";
import { Bell, Check, XCircle } from "lucide-react";

interface Notification {
  _id: string;
  clinicName: string;
  clinicId: string;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}
 

const DoctorNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const doctorId = localStorage.getItem("doctorId");

  // Fetch notifications
  const fetchNotifications = async () => {
    try {

        console.log("doctorId",doctorId);

      const res = await api.get(`/api/doctor/notifications/${doctorId}`);

    

      const data = res.data as { notifications: Notification[] };

      setNotifications(data.notifications || []);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Accept request
  const handleAccept = async (notificationId: string, clinicId: string) => {
    try {
      await api.post("/api/doctor/notifications/accept", {
        doctorId,
        notificationId,
        clinicId,
      });

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  // Reject request
  const handleReject = async (notificationId: string, clinicId: string) => {
    try {
      await api.post("/api/doctor/notifications/reject", {
        doctorId,
        notificationId,
        clinicId,
      });

      fetchNotifications();
    } catch (error) {
      console.log(error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-700">
        Loading notifications...
      </div>
    );
  }

  return (
  <div className="p-4 sm:p-6 max-w-4xl mx-auto">

    {/* Page Title */}
    <div className="flex items-center gap-3 mb-8">
      <div className="bg-[#0c213e]/10 p-3 rounded-full">
        <Bell className="text-[#0c213e]" size={26} />
      </div>
      <h1 className="text-3xl font-extrabold text-[#0c213e] tracking-tight">
        Notifications
      </h1>
    </div>

    {/* Empty State */}
    {notifications.length === 0 ? (
      <div className="bg-white p-10 text-center rounded-2xl shadow border">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4076/4076503.png"
          className="w-24 mx-auto opacity-80 mb-4"
        />
        <p className="text-gray-600 text-lg">No notifications found.</p>
      </div>
    ) : (
      <div className="space-y-6">
        {notifications.map((n) => (
          <div
            key={n._id}
            className="bg-white border rounded-2xl p-6 shadow hover:shadow-lg transition-all duration-300"
          >
            {/* Top Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                Clinic:{" "}
                <span className="text-[#0c213e]">{n.clinicName}</span>
              </h2>

              {/* Status Chip */}
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white shadow
                  ${
                    n.status === "pending"
                      ? "bg-yellow-500"
                      : n.status === "accepted"
                      ? "bg-green-600"
                      : "bg-red-600"
                  }
                `}
              >
                {n.status.toUpperCase()}
              </span>
            </div>

            {/* Message */}
            <p className="text-gray-700 mt-3 leading-relaxed">{n.message}</p>

            {/* Date */}
            <div className="mt-3 text-sm text-gray-500 border-l-4 border-[#0c213e] pl-3 italic">
              {new Date(n.createdAt).toLocaleString()}
            </div>

            {/* Buttons */}
            {n.status === "pending" && (
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => handleAccept(n._id, n.clinicId)}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-transform hover:scale-105"
                >
                  <Check size={18} />
                  Accept
                </button>

                <button
                  onClick={() => handleReject(n._id, n.clinicId)}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-transform hover:scale-105"
                >
                  <XCircle size={18} />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

};

export default DoctorNotifications;
