
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import {
  GraduationCap,
  MessageCircleMore,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";
import Availability from "../../pages/TimeSlots"; // keep this import
import api from "../../Services/mainApi";

interface Doctor {
  _id: string;
  fullName: string;
  specialization: string;
  qualification: string;
  experience: string;
  consultationFee: number;
  language: string;
  MedicalRegistrationNumber?: string;
  photo?: string;
}

const ClinicDoctorProfile: React.FC = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const { drId } = useParams<{ drId: string }>();

  const faqs = [
    "Where does Dr Ridhima Lakhani practice?",
    "How can I book an appointment with Dr Ridhima Lakhani?",
    "What do patients say about Dr Ridhima Lakhani?",
    "What is Dr Ridhima Lakhani's educational qualification?",
    "How many years of experience does Dr Ridhima Lakhani have?",
    "What is Dr Ridhima Lakhani's medical specialty?",
    "What conditions does Dr Ridhima Lakhani treat?",
    "What is the consultation fee for Dr Ridhima Lakhani?",
    "Does Dr Ridhima Lakhani offer online consultations?",
  ];

  useEffect(() => {
    if (!drId) return;

    const fetchDoctor = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await api.get<{ doctor: Doctor }>(
          `/api/doctor/${drId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDoctor(res.data.doctor);
      } catch (err) {
        console.error("Error fetching doctor profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [drId]);

  if (loading) return <p className="p-4 text-center">Loading...</p>;

  return (
    <div className="m-4 md:m-8 flex flex-col gap-6">
      {/* Doctor Info Card */}
      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
        <img
          src={`http://localhost:3000/uploads/${doctor?.photo}`}
          alt={doctor?.fullName}
          className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover shadow-md"
        />

        <div className="flex flex-col gap-2 text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            {doctor?.fullName}
          </h2>
          <p className="text-blue-600 font-medium">{doctor?.specialization}</p>
          <p className="text-sm md:text-base text-gray-500">
            {doctor?.experience} years of experience
          </p>

          <div className="mt-2 flex flex-col gap-1 text-gray-700 text-sm">
            <p className="flex items-center gap-2">
              <GraduationCap className="text-blue-500" size={16} />
              {doctor?.qualification}
            </p>
            <p className="flex items-center gap-2">
              <MessageCircleMore className="text-blue-500" size={16} />
              Speaks: {doctor?.language}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-sm md:text-base font-medium ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Profile
          </button>

          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 text-sm md:text-base font-medium ${
              activeTab === "faq"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            FAQs
          </button>

          <button
            onClick={() => setActiveTab("availability")}
            className={`px-4 py-2 text-sm md:text-base font-medium ${
              activeTab === "availability"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Set Availability
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-4 text-gray-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="text-blue-500" size={18} />
                <h3 className="font-semibold">Education</h3>
              </div>
              <p className="ml-6 text-sm">{doctor?.qualification}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="text-blue-500" size={18} />
                <h3 className="font-semibold">Medical Registration</h3>
              </div>
              <p className="ml-6 text-sm">
                {doctor?.MedicalRegistrationNumber}
              </p>
            </div>
          </div>
        )}

        {activeTab === "faq" && (
          <div className="divide-y divide-gray-200">
            {faqs.map((q, i) => (
              <div key={i} className="py-2">
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex justify-between items-center text-left font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  {q}
                  {openFAQ === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {openFAQ === i && (
                  <p className="mt-2 text-sm text-gray-600">
                    This is a placeholder answer for the FAQ.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "availability" && (
          <div className="p-2 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Availability />
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicDoctorProfile;
