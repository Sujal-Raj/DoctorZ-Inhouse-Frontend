import React from "react";
import { User, Activity, AlertCircle, CheckCircle, Video } from "lucide-react";

interface StickyPatientHeaderProps {
  patientInfo: {
    name: string;
    age: string | number;
    gender: string;
    mobileNumber: string;
    aadhar: string;
    dob?: string;
    bloodGroup?: string;
  };
  displayAge: string;
  allergies: string[];
  language: "en" | "hi";
  setLanguage: (lang: "en" | "hi") => void;
  isVideoCallActive: boolean;
  setIsVideoCallActive: (active: boolean) => void;
}

export const StickyPatientHeader: React.FC<StickyPatientHeaderProps> = ({
  patientInfo,
  displayAge,
  allergies,
  language,
  setLanguage,
  isVideoCallActive,
  setIsVideoCallActive,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 shadow-sm">
      <div className="max-w-full w-full mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Patient Bio */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-[#0c213e] rounded-full flex items-center justify-center font-bold text-lg border border-blue-100">
            {patientInfo.name ? patientInfo.name.charAt(0).toUpperCase() : <User />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 capitalize">{patientInfo.name}</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md border border-gray-200">
                {displayAge} • {patientInfo.gender}
              </span>
              {patientInfo.bloodGroup && (
                <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">
                  Blood: {patientInfo.bloodGroup}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Phone: <span className="text-gray-800">{patientInfo.mobileNumber || "N/A"}</span> | 
              Aadhar ID: <span className="text-gray-800">{patientInfo.aadhar || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* Vitals Summary */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 px-2.5 py-1 border-r border-gray-200 last:border-0">
            <Activity className="w-3.5 h-3.5 text-red-500" />
            <span>Vitals:</span>
            <span className="text-gray-950 font-bold">Stable</span>
          </div>
          {allergies.length > 0 ? (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-xs text-red-800 font-bold animate-pulse">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Allergies: {allergies.join(", ")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg text-xs text-green-700 font-bold">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>No Known Allergies</span>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Language:</span>
          <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === "en" ? "bg-white text-[#0c213e] shadow" : "text-gray-500 hover:text-gray-800"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${language === "hi" ? "bg-white text-[#0c213e] shadow" : "text-gray-500 hover:text-gray-800"}`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Video Teleconsult Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVideoCallActive(!isVideoCallActive)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              isVideoCallActive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <Video className="w-4 h-4" />
            {isVideoCallActive ? "End Video Consult" : "Start Video Consult"}
          </button>
        </div>

      </div>
    </div>
  );
};
