import { useState, useEffect, useRef, useCallback } from "react";
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

// ── tiny helpers ────────────────────────────────────────────────────────────

const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const ModeIcon = ({ mode, active }: { mode: string; active: boolean }) =>
  mode === "offline" ? (
    <svg
      className={`w-5 h-5 ${active ? "text-white" : "text-slate-500"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ) : (
    <svg
      className={`w-5 h-5 ${active ? "text-white" : "text-slate-500"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

// ── stat pill ───────────────────────────────────────────────────────────────

const StatPill = ({
  active,
  total,
}: {
  active: number;
  total: number;
}) => {
  const pct = total ? Math.round((active / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
        {active}/{total}
      </span>
    </div>
  );
};

// ── main component ───────────────────────────────────────────────────────────

const TimeSlots = () => {
  const { drId } = useParams<{ drId: string }>();
  const doctorId = drId;
  const step2Ref = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const [step, setStep] = useState<number>(1);
  const [selectionType, setSelectionType] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<string>("");
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedSingleDate, setSelectedSingleDate] = useState<
    Date | undefined
  >(undefined);
  const [selectedMultipleDates, setSelectedMultipleDates] = useState<Date[]>(
    []
  );

  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    start: "",
    end: "",
  });

  const [savedSlots, setSavedSlots] = useState<TimeSlotItem[]>([]);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchSavedSlots = useCallback(async (): Promise<void> => {
    if (!doctorId) return;
    try {
      const res = await api.get<TimeSlotItem[]>(
        `/api/availability/getTimeSlots/${doctorId}`
      );
      setSavedSlots(res.data);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch time slots",
        confirmButtonColor: "#0f172a",
      });
    }
  }, [doctorId]);

  useEffect(() => {
    fetchSavedSlots();
  }, [fetchSavedSlots]);

  // ── disabled dates ─────────────────────────────────────────────────────────

  const disabledDatesForCalendar = selectedSingleDate
    ? savedSlots
        .filter((s) => s.mode === selectedMode)
        .map((s) => new Date(s.date))
        .filter((d) => d.toDateString() !== selectedSingleDate.toDateString())
    : savedSlots
        .filter((s) => s.mode === selectedMode)
        .map((s) => new Date(s.date));

  // ── month handler ──────────────────────────────────────────────────────────

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

  // ── save ───────────────────────────────────────────────────────────────────

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
        confirmButtonColor: "#0f172a",
      });
      return;
    }
    if (!workingHours.start || !workingHours.end) {
      Swal.fire({
        icon: "warning",
        title: "Missing hours",
        text: "Please enter working hours",
        confirmButtonColor: "#0f172a",
      });
      return;
    }
    if (!selectedMode) {
      Swal.fire({
        icon: "warning",
        title: "No mode selected",
        text: "Please select a mode",
        confirmButtonColor: "#0f172a",
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
          confirmButtonColor: "#0f172a",
        });
        setEditingSlotId(null);
      } else {
        const payload = { doctorId, dates, workingHours, mode: selectedMode };
        const res = await api.post<TimeSlotResponse>(
          "/api/availability/createTimeSlot",
          payload
        );
        const data = res.data;

        if (data.createdDates?.length) {
          Swal.fire({
            icon: "success",
            title: "Slots Created",
            html: `Successfully created slots for <strong>${data.createdDates.length}</strong> date(s)`,
            confirmButtonColor: "#0f172a",
          });
        }
        if (data.alreadyExistDates?.length) {
          Swal.fire({
            icon: "info",
            title: "Already Exist",
            html: `Slots already exist for <strong>${data.alreadyExistDates.length}</strong> date(s)`,
            confirmButtonColor: "#0f172a",
          });
        }
      }

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
        confirmButtonColor: "#0f172a",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── edit ───────────────────────────────────────────────────────────────────

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

  // ── toggle individual slot ─────────────────────────────────────────────────

  const toggleSlot = async (
    slotId: string,
    time: string,
    isActive: boolean
  ): Promise<void> => {
    const key = `${slotId}-${time}`;
    setTogglingSlot(key);
    try {
      await api.patch(`/api/availability/updateSlot/${slotId}`, {
        time,
        isActive,
      });
      // Optimistic local update — avoids full refetch for single toggle
      setSavedSlots((prev) =>
        prev.map((item) =>
          item._id === slotId
            ? {
                ...item,
                slots: item.slots.map((s) =>
                  s.time === time ? { ...s, isActive } : s
                ),
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update slot",
        confirmButtonColor: "#0f172a",
      });
      fetchSavedSlots(); // revert on error
    } finally {
      setTogglingSlot(null);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────

  const handleDeleteSlot = async (slotId: string): Promise<void> => {
    const result = await Swal.fire({
      title: "Delete this day?",
      text: "All time slots for this date will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/availability/deleteTimeSlot/${slotId}`);
      setSavedSlots((prev) => prev.filter((s) => s._id !== slotId));
      if (expandedCard === slotId) setExpandedCard(null);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete time slot",
        confirmButtonColor: "#0f172a",
      });
    }
  };

  const filteredSlots = savedSlots.filter((slot) =>
    filterMode === "all" ? true : slot.mode === filterMode
  );

  const dateCount =
    selectionType === "single"
      ? selectedSingleDate
        ? 1
        : 0
      : selectedMultipleDates.length;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* DayPicker global overrides */}
      <style>{`
        :root {
          --rdp-accent-color: #0f172a;
          --rdp-background-color: #f1f5f9;
          --rdp-accent-color-dark: #0f172a;
          --rdp-background-color-dark: #1e293b;
          --rdp-outline: 2px solid var(--rdp-accent-color);
          --rdp-outline-selected: 2px solid var(--rdp-accent-color);
        }
        .rdp-day_selected:not([disabled]) {
          background-color: #0f172a !important;
          color: white !important;
        }
        .rdp-day_today { font-weight: 700; }
        .ts-card-enter { animation: tsSlideUp 0.28s ease both; }
        @keyframes tsSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ts-fade { animation: tsFade 0.2s ease both; }
        @keyframes tsFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 font-sans">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-10">

          {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Doctor Dashboard
              </p>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Availability Management
              </h1>
              <p className="mt-1 text-slate-500 text-sm">
                Set your working hours and manage appointment slots
              </p>
            </div>

            {savedSlots.length > 0 && (
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-slate-900 inline-block" />
                  <span className="text-slate-700 font-medium">
                    {savedSlots.length} day{savedSlots.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-slate-700 font-medium">
                    {savedSlots.reduce(
                      (a, s) => a + s.slots.filter((sl) => sl.isActive).length,
                      0
                    )}{" "}
                    open slots
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── STEP 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="ts-card-enter bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500" />

              <div className="p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  Create New Availability
                </h2>
                <p className="text-sm text-slate-500 mb-8">
                  Choose consultation type, then pick your dates
                </p>

                {/* Mode */}
                <div className="mb-8">
                  <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                    Consultation Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                    {(["offline", "online"] as const).map((mode) => {
                      const isSelected = selectedMode === mode;
                      const color =
                        mode === "offline"
                          ? {
                              border: isSelected
                                ? "border-blue-600"
                                : "border-slate-200",
                              bg: isSelected ? "bg-blue-600" : "bg-slate-100",
                              pill: "bg-blue-50 text-blue-700",
                              ring: "ring-blue-100",
                            }
                          : {
                              border: isSelected
                                ? "border-emerald-600"
                                : "border-slate-200",
                              bg: isSelected
                                ? "bg-emerald-600"
                                : "bg-slate-100",
                              pill: "bg-emerald-50 text-emerald-700",
                              ring: "ring-emerald-100",
                            };

                      return (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          className={`group relative flex items-center gap-4 p-4 border-2 rounded-xl transition-all duration-200 text-left
                            ${color.border}
                            ${isSelected ? `${color.ring} ring-4` : "hover:border-slate-300 hover:shadow-sm"}
                          `}
                        >
                          <div
                            className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${color.bg}`}
                          >
                            <ModeIcon mode={mode} active={isSelected} />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {mode === "offline"
                                ? "In-Clinic Visit"
                                : "Telemedicine"}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {mode === "offline"
                                ? "In-person appointments"
                                : "Online video consultations"}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <svg
                                className="w-4 h-4 text-slate-900"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Selection Type */}
                {selectedMode && (
                  <div className="ts-fade">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                      Scheduling Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
                      {[
                        {
                          type: "single",
                          label: "Single Day",
                          desc: "One specific date",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          ),
                        },
                        {
                          type: "multiple",
                          label: "Multiple Days",
                          desc: "Hand-pick dates",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                              />
                            </svg>
                          ),
                        },
                        {
                          type: "month",
                          label: "Full Month",
                          desc: "All available days",
                          icon: (
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 6h16M4 10h16M4 14h16M4 18h16"
                              />
                            </svg>
                          ),
                        },
                      ].map(({ type, label, desc, icon }) => (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectionType(type);
                            setStep(2);
                          }}
                          className="group flex flex-col items-center gap-3 p-5 border-2 border-slate-200 rounded-xl
                            hover:border-slate-900 hover:shadow-md transition-all duration-200 text-center"
                        >
                          <div className="w-12 h-12 bg-slate-100 group-hover:bg-slate-900 rounded-xl flex items-center justify-center transition-colors duration-200 text-slate-600 group-hover:text-white">
                            {icon}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">
                              {label}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2 ───────────────────────────────────────────────────── */}
          <div ref={step2Ref}>
            {step === 2 && (
              <div className="ts-card-enter bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500" />

                {/* step header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectionType("");
                      setEditingSlotId(null);
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back
                  </button>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedMode === "offline"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <ModeIcon mode={selectedMode} active={false} />
                      {selectedMode === "offline"
                        ? "In-Clinic"
                        : "Telemedicine"}
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full capitalize">
                      {selectionType === "single"
                        ? "Single Day"
                        : selectionType === "multiple"
                        ? "Multiple Days"
                        : "Full Month"}
                    </span>
                    {editingSlotId && (
                      <span className="px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full">
                        Editing
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-3 bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-slate-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Select Date{selectionType !== "single" ? "s" : ""}
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
                            disabled={[
                              { before: new Date() },
                              ...disabledDatesForCalendar,
                            ]}
                          />
                        )}
                        {selectionType === "multiple" && (
                          <DayPicker
                            mode="multiple"
                            selected={selectedMultipleDates}
                            onSelect={(dates) =>
                              setSelectedMultipleDates(dates || [])
                            }
                            showOutsideDays
                            disabled={[
                              { before: new Date() },
                              ...disabledDatesForCalendar,
                            ]}
                          />
                        )}
                        {selectionType === "month" && (
                          <DayPicker
                            mode="multiple"
                            selected={selectedMultipleDates}
                            onSelect={handleMonthSelect}
                            disabled={[
                              { before: new Date() },
                              ...disabledDatesForCalendar,
                            ]}
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Panel */}
                    <div className="lg:col-span-2 flex flex-col gap-5">
                      {/* Working Hours */}
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Working Hours
                          <span className="text-xs text-slate-400 font-normal ml-auto">
                            24-hr format
                          </span>
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                              Start Time
                            </label>
                            <input
                              type="time"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white
                                focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                              value={workingHours.start}
                              onChange={(e) =>
                                setWorkingHours({
                                  ...workingHours,
                                  start: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                              End Time
                            </label>
                            <input
                              type="time"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white
                                focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all"
                              value={workingHours.end}
                              onChange={(e) =>
                                setWorkingHours({
                                  ...workingHours,
                                  end: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        {workingHours.start && workingHours.end && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="px-2 py-0.5 bg-slate-200 rounded text-slate-600 font-medium">
                              {formatTime(workingHours.start)} →{" "}
                              {formatTime(workingHours.end)}
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                          </div>
                        )}
                      </div>

                      {/* Selected Dates Summary */}
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-slate-700">
                            Selected Dates
                          </h3>
                          {dateCount > 0 && (
                            <span className="text-xs font-semibold bg-slate-900 text-white rounded-full px-2.5 py-0.5">
                              {dateCount}
                            </span>
                          )}
                        </div>

                        <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                          {selectionType === "single" && selectedSingleDate ? (
                            <div className="text-sm text-slate-700 bg-white px-3 py-2.5 rounded-lg border border-slate-200 font-medium">
                              {selectedSingleDate.toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </div>
                          ) : selectionType !== "single" &&
                            selectedMultipleDates.length > 0 ? (
                            <>
                              {selectedMultipleDates.slice(0, 6).map((date, i) => (
                                <div
                                  key={i}
                                  className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                  {date.toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                              ))}
                              {selectedMultipleDates.length > 6 && (
                                <div className="text-xs text-slate-400 text-center py-2 font-medium">
                                  + {selectedMultipleDates.length - 6} more
                                  dates
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <svg
                                className="w-8 h-8 text-slate-300 mb-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="text-xs text-slate-400">
                                Click dates on the calendar
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Save CTA */}
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="w-full relative overflow-hidden bg-slate-900 hover:bg-slate-800
                          text-white font-semibold text-sm py-3.5 px-6 rounded-xl
                          transition-all duration-200 shadow-sm hover:shadow-md
                          disabled:opacity-50 disabled:cursor-not-allowed
                          active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                            Saving…
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {editingSlotId
                              ? "Update Availability"
                              : "Save Availability"}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SAVED SLOTS ───────────────────────────────────────────────── */}
          {savedSlots.length > 0 && (
            <div className="mt-8 ts-card-enter">
              {/* section header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Your Availability Schedule
                  </h2>
                  <p className="text-sm text-slate-500">
                    Click a slot to toggle its availability
                  </p>
                </div>

                {/* filter tabs */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
                  {[
                    {
                      key: "all",
                      label: "All",
                      count: savedSlots.length,
                      color: "bg-slate-900 text-white",
                    },
                    {
                      key: "offline",
                      label: "In-Clinic",
                      count: savedSlots.filter((s) => s.mode === "offline")
                        .length,
                      color: "bg-blue-600 text-white",
                    },
                    {
                      key: "online",
                      label: "Telemedicine",
                      count: savedSlots.filter((s) => s.mode === "online")
                        .length,
                      color: "bg-emerald-600 text-white",
                    },
                  ].map(({ key, label, count, color }) => (
                    <button
                      key={key}
                      onClick={() => setFilterMode(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                        filterMode === key
                          ? color
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                          filterMode === key
                            ? "bg-white/20"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSlots.map((slotItem) => {
                  const activeCount = slotItem.slots.filter(
                    (s) => s.isActive
                  ).length;
                  const isExpanded = expandedCard === slotItem._id;

                  return (
                    <div
                      key={slotItem._id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden
                        hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                    >
                      {/* card top accent */}
                      <div
                        className={`h-0.5 w-full ${
                          slotItem.mode === "offline"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />

                      <div className="p-5">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-bold text-slate-900 text-base">
                                {formatDate(slotItem.date)}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  slotItem.mode === "offline"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {slotItem.mode === "offline"
                                  ? "In-Clinic"
                                  : "Telemedicine"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {new Date(slotItem.date).getFullYear()}
                            </p>
                          </div>

                          {/* actions */}
                          <div className="flex items-center gap-0.5 ml-2">
                            <button
                              onClick={() => handleEditSlots(slotItem)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50
                                rounded-lg transition-colors"
                              title="Edit"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slotItem._id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50
                                rounded-lg transition-colors"
                              title="Delete"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-slate-500">
                              Slot availability
                            </span>
                            <span
                              className={`text-xs font-semibold ${
                                activeCount > 0
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {activeCount} of {slotItem.slots.length} open
                            </span>
                          </div>
                          <StatPill
                            active={activeCount}
                            total={slotItem.slots.length}
                          />
                        </div>

                        {/* Time Slots Grid */}
                        <div
                          className={`grid grid-cols-3 gap-1.5 transition-all duration-300 overflow-hidden ${
                            isExpanded ? "" : "max-h-28"
                          }`}
                        >
                          {slotItem.slots.map((s) => {
                            const key = `${slotItem._id}-${s.time}`;
                            const isToggling = togglingSlot === key;
                            return (
                              <button
                                key={s.time}
                                disabled={isToggling}
                                onClick={() =>
                                  toggleSlot(slotItem._id, s.time, !s.isActive)
                                }
                                className={`relative py-1.5 px-1 rounded-lg text-xs font-medium
                                  transition-all duration-150 active:scale-95
                                  ${
                                    s.isActive
                                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-500"
                                  }
                                  ${isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"}
                                `}
                              >
                                {formatTime(s.time)}
                              </button>
                            );
                          })}
                        </div>

                        {/* Expand / Collapse */}
                        {slotItem.slots.length > 9 && (
                          <button
                            onClick={() =>
                              setExpandedCard(isExpanded ? null : slotItem._id)
                            }
                            className="mt-3 w-full flex items-center justify-center gap-1
                              text-xs text-slate-400 hover:text-slate-700 transition-colors py-1"
                          >
                            {isExpanded ? (
                              <>
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
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                                Show less
                              </>
                            ) : (
                              <>
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
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                                {slotItem.slots.length - 9} more slots
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── EMPTY STATE ───────────────────────────────────────────────── */}
          {savedSlots.length === 0 && step === 1 && (
            <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                No availability set yet
              </h3>
              <p className="text-sm text-slate-500">
                Create your first availability window above to start accepting
                appointments.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TimeSlots;