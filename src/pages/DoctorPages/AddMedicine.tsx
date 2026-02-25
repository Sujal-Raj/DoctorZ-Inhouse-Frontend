import React, { useEffect, useState } from "react";
import { Pill, Plus, Trash2, Search, Check } from "lucide-react";
import api from "../../Services/mainApi";

// const api = {
//   post: async (url: string, data: any) => {
//     console.log("POST", url, data);
//     return { data: { success: true, listOfMedicine: data.medicines } };
//   },
//   get: async (url: string) => {
//     console.log("GET", url);
//     return { data: { success: true, listOfMedicine: ["Paracetamol", "Ibuprofen", "Amoxicillin"] } };
//   },
//   delete: async (url: string, data: any) => {
//     console.log("DELETE", url, data);
//     return { data: { success: true } };
//   }
// };

const PRIMARY = "#0c213e";

const AddMedicine: React.FC = () => {
  const doctorId = localStorage.getItem("doctorId");
  
  const [medicines, setMedicines] = useState<string[]>([""]);
  const [savedMedicines, setSavedMedicines] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchMedicineList();
  }, []);

  const fetchMedicineList = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/doctor/medicine-list/${doctorId}`);
      if (res.data.success) {
        setSavedMedicines(res.data.listOfMedicine || []);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineChange = (index: number, value: string) => {
    const updated = [...medicines];
    updated[index] = value;
    setMedicines(updated);
  };

  const addMedicineField = () => {
    setMedicines([...medicines, ""]);
  };

  const removeMedicineField = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const handleSaveMedicines = async () => {
    const validMedicines = medicines.filter(m => m.trim() !== "");
    
    if (validMedicines.length === 0) {
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/api/doctor/add/medicine-to-list", {
        doctorId,
        medicines: validMedicines
      });

      if (res.data.success) {
        setSuccessMessage("Medicines added successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setMedicines([""]);
        fetchMedicineList();
      }
    } catch (error) {
      console.error("Error saving medicines:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedicine = async (medicineName: string) => {
    try {
      const res = await api.delete("/api/doctor/delete/medicine-from-list", {
        data: { doctorId, medicineName }
      });

      if (res.data.success) {
        setSavedMedicines(savedMedicines.filter(m => m !== medicineName));
      }
    } catch (error) {
      console.error("Error deleting medicine:", error);
    }
  };

  const filteredMedicines = savedMedicines.filter(m =>
    m.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 font-[Poppins]">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: PRIMARY }}>
            Medicine List Manager
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Add and manage your commonly prescribed medicines
          </p>
        </div>

        {/* Add Medicine Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Pill className="w-6 h-6" style={{ color: PRIMARY }} />
            Add New Medicines
          </h2>

          <div className="space-y-3 mb-6">
            {medicines.map((medicine, index) => (
              <div key={index} className="flex gap-2 items-center group">
                <input
                  type="text"
                  value={medicine}
                  onChange={(e) => handleMedicineChange(index, e.target.value)}
                  placeholder="Enter medicine name..."
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-[#0C213E] focus:ring-2 focus:ring-[#0C213E]/20 transition-all"
                />
                
                {index === medicines.length - 1 ? (
                  <button
                    onClick={addMedicineField}
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => removeMedicineField(index)}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">{successMessage}</span>
            </div>
          )}

          <button
            onClick={handleSaveMedicines}
            disabled={saving || medicines.every(m => m.trim() === "")}
            className="w-full sm:w-auto px-8 py-3 text-white rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: PRIMARY }}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add to Medicine List
              </>
            )}
          </button>
        </div>

        {/* Saved Medicines Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Pill className="w-6 h-6" style={{ color: PRIMARY }} />
              My Medicine List
              <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                {savedMedicines.length}
              </span>
            </h2>

            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-[#0C213E] focus:ring-2 focus:ring-[#0C213E]/20 transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredMedicines.length === 0 ? (
            <div className="text-center py-12">
              <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? "No medicines found matching your search" : "No medicines added yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMedicines.map((medicine, index) => (
                <div
                  key={index}
                  className="group relative bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 truncate">{medicine}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteMedicine(medicine)}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMedicine;