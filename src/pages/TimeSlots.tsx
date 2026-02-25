import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useParams } from "react-router-dom";
import api from "../Services/mainApi";
import Swal from "sweetalert2";

interface Slot {
  time: string;
  isActive: boolean;
}

interface TimeSlotItem {
  _id: string;
  date: string;
  mode: "offline" | "online";
  slots: Slot[];
}

interface WorkingHours {
  start: string;
  end: string;
}

interface TimeSlotResponse {
  createdDates?: string[];
  alreadyExistDates?: string[];
}

const TimeSlots = () => {
  const { drId } = useParams<{ drId: string }>();
  const doctorId = drId;
  const step2Ref = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // UI State
  const [step, setStep] = useState<number>(1);
  const [selectionType, setSelectionType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Date Selection
  const [selectedSingleDate, setSelectedSingleDate] = useState<Date | undefined>(undefined);
  const [selectedMultipleDates, setSelectedMultipleDates] = useState<Date[]>([]);
  
  // Working Hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>({ start: "", end: "" });
  
  // Saved Slots
  const [savedSlots, setSavedSlots] = useState<TimeSlotItem[]>([]);
  const [filterMode, setFilterMode] = useState<string>("all");

  // Fetch saved slots
  const fetchSavedSlots = async (): Promise<void> => {
    if (!doctorId) return;
    try {
      const res = await api.get<TimeSlotItem[]>(`/api/availability/getTimeSlots/${doctorId}`);
      console.log(res)
      setSavedSlots(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch time slots",
        confirmButtonColor: "#111827",
      });
    }
  };

  useEffect(() => {
    fetchSavedSlots();
  }, [doctorId]);

  // Helper: Format time to 12-hour
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Helper: Get disabled dates
  const disabledDatesForCalendar = selectedSingleDate
    ? savedSlots
        .filter(s => s.mode === selectedMode)
        .map((s) => new Date(s.date))
        .filter((d) => d.toDateString() !== selectedSingleDate.toDateString())
    : savedSlots
        .filter(s => s.mode === selectedMode)
        .map((s) => new Date(s.date));

  // Handler: Month selection
  const handleMonthSelect = (selected: Date[] | undefined): void => {
    if (!selected?.length) return;
    const firstDate = selected[0];
    const year = firstDate.getFullYear();
    const month = firstDate.getMonth();
    const today = new Date();

    const dates: Date[] = [];
    const d = new Date(year, month, 1);

    while (d.getMonth() === month) {
      if (
        d >= today &&
        !disabledDatesForCalendar.some(
          (dd) => dd.toDateString() === d.toDateString()
        )
      ) {
        dates.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }

    setSelectedMultipleDates(dates);
  };

  // Handler: Save slots
  const handleSave = async (): Promise<void> => {
    const dates =
      selectionType === "single"
        ? selectedSingleDate
          ? [selectedSingleDate.toLocaleDateString("en-CA")]
          : []
        : selectedMultipleDates.map((d) => d.toLocaleDateString("en-CA"));

    if (!dates.length) {
      Swal.fire({
        icon: "warning",
        title: "No dates selected",
        text: "Please select at least one date",
        confirmButtonColor: "#111827",
      });
      return;
    }
    if (!workingHours.start || !workingHours.end) {
      Swal.fire({
        icon: "warning",
        title: "Missing hours",
        text: "Please enter working hours",
        confirmButtonColor: "#111827",
      });
      return;
    }
    if (!selectedMode) {
      Swal.fire({
        icon: "warning",
        title: "No mode selected",
        text: "Please select a mode",
        confirmButtonColor: "#111827",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (editingSlotId && selectedSingleDate) {
        const payload = {
          doctorId,
          date: selectedSingleDate.toLocaleDateString("en-CA"),
          workingHours,
          mode: selectedMode,
        };

        await api.put("/api/availability/editTimeSlot", payload);
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Time slots updated successfully",
          confirmButtonColor: "#111827",
        });
        setEditingSlotId(null);
      } else {
        const payload = { doctorId, dates, workingHours, mode: selectedMode };
        const res = await api.post<TimeSlotResponse>("/api/availability/createTimeSlot", payload);
        const data = res.data;

        if (data.createdDates?.length && data.createdDates.length > 0) {
          Swal.fire({
            icon: "success",
            title: "Slots Created",
            html: `Successfully created slots for <strong>${data.createdDates.length}</strong> date(s)`,
            confirmButtonColor: "#111827",
          });
        }

        if (data.alreadyExistDates?.length && data.alreadyExistDates.length > 0) {
          Swal.fire({
            icon: "info",
            title: "Already Exist",
            html: `Slots already exist for <strong>${data.alreadyExistDates.length}</strong> date(s)`,
            confirmButtonColor: "#111827",
          });
        }
      }

      // Reset form
      setStep(1);
      setSelectionType("");
      setSelectedMode("");
      setSelectedSingleDate(undefined);
      setSelectedMultipleDates([]);
      setWorkingHours({ start: "", end: "" });

      fetchSavedSlots();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#111827",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Edit slot
  const handleEditSlots = (slotItem: TimeSlotItem): void => {
    setEditingSlotId(slotItem._id);
    setStep(2);
    setSelectionType("single");
    setSelectedMode(slotItem.mode);
    const slotDate = new Date(slotItem.date);
    setSelectedSingleDate(slotDate);
    setCurrentMonth(slotDate);

    setWorkingHours({
      start: slotItem.slots[0]?.time || "",
      end: slotItem.slots[slotItem.slots.length - 1]?.time || "",
    });
    
    setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  };

  // Handler: Toggle individual slot
  const toggleSlot = async (slotId: string, time: string, isActive: boolean): Promise<void> => {
    try {
      await api.patch(`/api/availability/updateSlot/${slotId}`, {
        time,
        isActive,
      });
      fetchSavedSlots();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update slot",
        confirmButtonColor: "#111827",
      });
    }
  };

  // Handler: Delete slot
  const handleDeleteSlot = async (slotId: string): Promise<void> => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the entire day's time slots",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111827",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;
    
    try {
      await api.delete(`/api/availability/deleteTimeSlot/${slotId}`);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Time slot deleted successfully",
        confirmButtonColor: "#111827",
      });
      fetchSavedSlots();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete time slot",
        confirmButtonColor: "#111827",
      });
    }
  };

  // Filter saved slots by mode
  const filteredSlots = savedSlots.filter(slot => 
    filterMode === "all" ? true : slot.mode === filterMode
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Availability Management
          </h1>
          <p className="text-gray-600">
            Manage your appointment slots and working hours
          </p>
        </div>

        {/* Step 1 - Selection Type & Mode */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Create New Availability
              </h2>
              
              {/* Mode Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <button
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedMode === "offline"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedMode("offline")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedMode === "offline" ? "bg-blue-600" : "bg-gray-100"
                      }`}>
                        <svg className={`w-5 h-5 ${selectedMode === "offline" ? "text-white" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">In-Clinic</div>
                        <div className="text-sm text-gray-500">Offline visits</div>
                      </div>
                    </div>
                  </button>

                  <button
                    className={`p-4 border-2 rounded-lg transition-all ${
                      selectedMode === "online"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedMode("online")}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedMode === "online" ? "bg-green-600" : "bg-gray-100"
                      }`}>
                        <svg className={`w-5 h-5 ${selectedMode === "online" ? "text-white" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Telemedicine</div>
                        <div className="text-sm text-gray-500">Online consultations</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Selection Type */}
              {selectedMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How would you like to set availability?
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                    {["single", "multiple", "month"].map(type => (
                      <button
                        key={type}
                        className="p-5 border-2 border-gray-200 rounded-lg hover:border-gray-400 transition-all"
                        onClick={() => {
                          setSelectionType(type);
                          setStep(2);
                        }}
                      >
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3 mx-auto">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="font-medium text-gray-900 mb-1 capitalize">
                            {type === "single" ? "Single Day" : type === "multiple" ? "Multiple Days" : "Full Month"}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {type === "single" ? "One specific date" : type === "multiple" ? "Select multiple dates" : "Entire month"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 - Date Selection */}
        <div ref={step2Ref}>
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => {
                    setStep(1);
                    setSelectionType("");
                    setEditingSlotId(null);
                  }}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    selectedMode === "offline" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                  }`}>
                    {selectedMode === "offline" ? "In-Clinic" : "Telemedicine"}
                  </span>
                  <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                    {selectionType === "single" && "Single Day"}
                    {selectionType === "multiple" && "Multiple Days"}
                    {selectionType === "month" && "Full Month"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar Section */}
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Select Dates
                  </h3>
                  <div className="flex justify-center">
                    {selectionType === "single" && (
                      <DayPicker
                        mode="single"
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        selected={selectedSingleDate}
                        onSelect={setSelectedSingleDate}
                        showOutsideDays
                        disabled={[{ before: new Date() }, ...disabledDatesForCalendar]}
                      />
                    )}
                    {selectionType === "multiple" && (
                      <DayPicker
                        mode="multiple"
                        selected={selectedMultipleDates}
                        onSelect={(dates) => setSelectedMultipleDates(dates || [])}
                        showOutsideDays
                        disabled={[{ before: new Date() }, ...disabledDatesForCalendar]}
                      />
                    )}
                    {selectionType === "month" && (
                      <DayPicker
                        mode="multiple"
                        selected={selectedMultipleDates}
                        onSelect={handleMonthSelect}
                        disabled={[{ before: new Date() }, ...disabledDatesForCalendar]}
                      />
                    )}
                  </div>
                </div>

                {/* Working Hours & Preview */}
                <div className="space-y-6">
                  {/* Working Hours */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Working Hours <span className="font-bold">(24 hrs)</span> 
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={workingHours.start}
                          onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={workingHours.end}
                          onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selected Dates Preview */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-3">Selected Dates</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {selectionType === "single" && selectedSingleDate ? (
                        <div className="text-sm text-gray-700 bg-white p-3 rounded border">
                          {selectedSingleDate.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      ) : selectionType !== "single" && selectedMultipleDates.length > 0 ? (
                        <>
                          {selectedMultipleDates.slice(0, 5).map((date, index) => (
                            <div key={index} className="text-sm text-gray-700 bg-white p-3 rounded border">
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          ))}
                          {selectedMultipleDates.length > 5 && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              +{selectedMultipleDates.length - 5} more dates
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-4">
                          No dates selected yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Availability"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Saved Slots */}
        {savedSlots.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Your Availability Schedule
              </h2>
              
              {/* Mode Filter */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterMode === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({savedSlots.length})
                </button>
                <button
                  onClick={() => setFilterMode("offline")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterMode === "offline" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  In-Clinic ({savedSlots.filter(s => s.mode === "offline").length})
                </button>
                <button
                  onClick={() => setFilterMode("online")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filterMode === "online" ? "bg-green-600 text-white" : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  Telemedicine ({savedSlots.filter(s => s.mode === "online").length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSlots.map((slotItem) => (
                <div
                  key={slotItem._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {new Date(slotItem.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                          {/* {slotItem.date} */}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          slotItem.mode === "offline" 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {slotItem.mode === "offline" ? "In-Clinic" : "Telemedicine"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(slotItem.date).getFullYear()}
                      </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditSlots(slotItem)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slotItem._id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Slot Stats */}
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      slotItem.slots.filter((s) => s.isActive).length > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {slotItem.slots.filter((s) => s.isActive).length} / {slotItem.slots.length} active
                    </span>
                  </div>

                  {/* Time Slots */}
                  <div className="grid grid-cols-3 gap-2">
                    {slotItem.slots.map((s) => (
                      <button
                        key={s.time}
                        className={`p-2 rounded text-xs font-medium transition-all ${
                          s.isActive
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-500"
                        }`}
                        onClick={() => toggleSlot(slotItem._id, s.time, !s.isActive)}
                      >
                        {formatTime(s.time)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlots;