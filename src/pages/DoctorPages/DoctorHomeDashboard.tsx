import React, { useEffect, useState } from "react";
import {
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  UserIcon as UserIconSolid,
  CalendarIcon as CalendarIconSolid,
  ClockIcon as ClockIconSolid,
} from "@heroicons/react/24/solid";
import api from "../../Services/mainApi";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

interface Doctor {
  _id: string;
  doctorId: string;
  fullName: string;
  email: string;
  photo:string;
}

interface DoctorResponse {
  message: string;
  doctor: Doctor;
}

interface Appointment {
  time: string;
  isActive: boolean;
}

interface TotalPatientsResponse {
  totalPatients: number;
}

const DoctorDashboardHome: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dateTime, setDateTime] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [todaysAppointments, setTodaysAppointments] = useState<number>(0);

  const navigate = useNavigate();
  const token = Cookies.get("doctorToken");
  const doctorId = localStorage.getItem("doctorId");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      setDateTime(formatted);
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch doctor details
  useEffect(() => {
    if (!token || !doctorId) {
      navigate("/doctor-login");
      return;
    }

    const fetchDoctor = async () => {
      try {
        const res = await api.get<DoctorResponse>(`/api/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctor(res.data.doctor);
      } catch (err) {
        console.error("Error fetching doctor:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [token, doctorId, navigate]);

  // Fetch today's appointments
  useEffect(() => {
    if (!token || !doctorId) return;

    const fetchTodaysAppointments = async () => {
      try {
        const res = await api.get<Appointment[]>(
          `/api/doctor/todays-appointments/${doctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTodaysAppointments(res.data.length);
      } catch (err) {
        console.error("Error fetching today's appointments:", err);
      }
    };

    fetchTodaysAppointments();
  }, [token, doctorId]);

  // Fetch total patients
  useEffect(() => {
    if (!token || !doctorId) return;

    const fetchTotalPatients = async () => {
      try {
        const res = await api.get<TotalPatientsResponse>(
          `/api/doctor/total-patients/${doctorId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTotalPatients(res.data.totalPatients);
      } catch (err) {
        console.error("Error fetching total patients:", err);
      }
    };

    fetchTotalPatients();
  }, [token, doctorId]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, Dr. {doctor?.fullName}
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <ClockIcon className="w-5 h-5" />
          <p className="text-sm">{dateTime}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Patients Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <UserIconSolid className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Patients</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{totalPatients}</p>
          <p className="text-sm text-gray-500">All registered patients</p>
        </div>

        {/* Today's Appointments Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CalendarIconSolid className="w-6 h-6 text-emerald-600" />
            </div>
            {todaysAppointments > 0 && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                Active
              </span>
            )}
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Today's Appointments</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">{todaysAppointments}</p>
          <p className="text-sm text-gray-500">Scheduled for today</p>
        </div>

        {/* Quick Access Card */}
        <div className="bg-[#0c213e] rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-white/10 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-white/80 text-sm font-medium mb-1">Quick Actions</h3>
          {/* <p className="text-2xl font-bold mb-4">Manage</p> */}
          <button
            onClick={() => navigate(`/doctordashboard/${doctorId}/time-slots`)}
            className="w-full bg-white text-[#0c213e] px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors mb-2"
          >
            Manage availability
          </button>
          <button
            onClick={() => navigate(`/doctordashboard/${doctorId}/appointments`)}
            className="w-full bg-white text-[#0c213e] px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            View Appointments
          </button>
        </div>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Overview</h2>
          
          <div className="space-y-6">
            {/* Summary Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Patient Records</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  Access and manage all patient information
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Appointments</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  View and manage your schedule
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Availability</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  Set your available time slots
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ChartBarIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900">Analytics</h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  Track your practice statistics
                </p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Welcome to your dashboard</h4>
                  <p className="text-sm text-blue-700">
                    Manage your appointments, view patient records, and track your practice performance all in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile</h2>
          
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-[#0c213e] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {/* {doctor?.fullName?.charAt(0).toUpperCase()} */}
                <img src={`${doctor?.photo}`} alt="" />
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Dr. {doctor?.fullName}
            </h3>
            <p className="text-sm text-gray-600">{doctor?.email}</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Doctor ID</p>
              <p className="text-sm font-medium text-gray-900">{doctor?.doctorId}</p>
            </div>

            <button
              onClick={() => navigate(`/doctordashboard/${doctorId}/doctorProfile`)}
              className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium text-sm transition-colors"
            >
              Edit Profile
            </button>

            {/* <button
              onClick={() => navigate(`/doctordashboard/${doctorId}/time-slots`)}
              className="w-full px-4 py-2 bg-[#0c213e] hover:bg-[#0a1a32] text-white rounded-lg font-medium text-sm transition-colors"
            >
              Manage Availability
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboardHome;