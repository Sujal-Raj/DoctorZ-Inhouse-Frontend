

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../Services/mainApi";

import {
  User,
  Calendar,
  AlertCircle,
  Stethoscope,
  FileText,
  Pill,
} from "lucide-react";

interface EMRRecord {
  _id: string;
  aadhar: string;
  diagnosis: string;
  diseases: string[];
  prescriptions: string[];
  currentMedications: string[];
  allergies: string[];
  pastSurgeries?: string[];
  reports: string[];
  createdAt: string;
}

interface EMRResponse {
  emr: EMRRecord[];
}

const PatientEMR: React.FC = () => {
  const { aadhar } = useParams<{ aadhar: string }>();
  const [emrData, setEmrData] = useState<EMRRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEMR = async () => {
      if (!aadhar) return;
      try {
        setLoading(true);
        const res = await api.get<EMRResponse>(`/api/emr/${aadhar}`);
        setEmrData(res.data.emr || []);
      } catch (err) {
        console.error("Error fetching EMR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEMR();
  }, [aadhar]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN");

  return (
    <div className="p-6 font-[Poppins] min-h-screen ">

      <h2 className="text-2xl font-bold mb-6  text-gray-700">
        Patient EMR Details
      </h2>

      {loading ? (
        <p className="text-gray-500 text-center">Loading EMR...</p>
      ) : emrData.length === 0 ? (
        <p className="text-gray-500 text-center">No EMR records found.</p>
      ) : (
        <div className="space-y-6">
          {emrData.map((record) => (
            <div
              key={record._id}
              className="rounded-xl shadow-md border border-gray-200 bg-white overflow-hidden"
            >
              {/* Header */}
              <div className="bg-linear-to-r from-[#0c213e] to-[#164066] p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6" />
                    <div>
                      <h3 className="text-xl font-bold">Medical Record</h3>
                      <p className="text-blue-200 text-sm">
                        Aadhar: {record.aadhar}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Allergies */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#0c213e] font-semibold mb-3">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="text-lg">Allergies</h4>
                  </div>

                  {record.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {record.allergies.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">None reported</p>
                  )}
                </div>

                {/* Diseases */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#0c213e] font-semibold mb-3">
                    <Stethoscope className="w-5 h-5" />
                    <h4 className="text-lg">Diseases</h4>
                  </div>

                  {record.diseases.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {record.diseases.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">None reported</p>
                  )}
                </div>

                {/* Past Surgeries */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#0c213e] font-semibold mb-3">
                    <FileText className="w-5 h-5" />
                    <h4 className="text-lg">Past Surgeries</h4>
                  </div>

                  {record.pastSurgeries?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {record.pastSurgeries.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">None reported</p>
                  )}
                </div>

                {/* Current Medications */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#0c213e] font-semibold mb-3">
                    <Pill className="w-5 h-5" />
                    <h4 className="text-lg">Current Medications</h4>
                  </div>

                  {record.currentMedications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {record.currentMedications.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm border border-green-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">None reported</p>
                  )}
                </div>
              </div>

              {/* Reports */}
              {record.reports.length > 0 && (
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-[#0c213e] mb-3">
                      Attached Reports ({record.reports.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {record.reports.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white border-2 border-[#0c213e] text-[#0c213e] rounded-lg hover:bg-[#0c213e] hover:text-white transition-all text-sm font-medium"
                        >
                          Report {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientEMR;
