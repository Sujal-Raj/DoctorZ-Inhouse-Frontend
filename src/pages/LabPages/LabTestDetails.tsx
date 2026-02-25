// src/pages/LabTestDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../Services/mainApi";

import diabetes from "../../assets/Diabetes.png";
import fever from "../../assets/Fever and infections.png";
import Pregnancy from "../../assets/pregnancy.png";
import vitamin from "../../assets/vitamin.png";
import Liver from "../../assets/liver.png";
import kidney from "../../assets/kidney.png";
import Heart from "../../assets/Heart.png";
import Imaging from "../../assets/Imaging.png";

import toast from "react-hot-toast";

interface Test {
  _id: string;
  testName: string;
  price: number;
  labId: string;
  labName: string;
  category?: string;
  description?: string;
  precautions?: string;
  includedTests?: string[];
  reportFile?: string | null;
}

// ─── Booking Confirmation Modal ────────────────────────────────────────────────
interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  testName: string;
  labName: string;
  bookingDate: string;
  price: number;
  category: string;
}

function BookingConfirmationModal({
  isOpen,
  onClose,
  testName,
  labName,
  bookingDate,
  price,
  category,
}: BookingConfirmationModalProps) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // tiny delay so CSS transition picks up the change
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!visible) return null;

  // Format date for display  e.g. "14 February 2025"
  const formattedDate = bookingDate
    ? new Date(bookingDate + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Close only when clicking the backdrop (not the card)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: animate ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)",
        backdropFilter: animate ? "blur(4px)" : "blur(0px)",
        transition: "background-color 0.3s ease, backdrop-filter 0.3s ease",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "1.25rem",
          boxShadow: "0 25px 60px rgba(12,33,62,0.22), 0 4px 16px rgba(12,33,62,0.1)",
          maxWidth: "480px",
          width: "100%",
          overflow: "hidden",
          transform: animate ? "scale(1) translateY(0)" : "scale(0.92) translateY(24px)",
          opacity: animate ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: "5px", background: "linear-gradient(90deg, #0c213e 0%, #2a4a7f 60%, #4f7dc2 100%)" }} />

        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0c213e 0%, #1a3a6e 100%)",
            padding: "2rem 2rem 1.5rem",
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Checkmark circle */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "2px solid rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              style={{
                strokeDasharray: 60,
                strokeDashoffset: animate ? 0 : 60,
                transition: "stroke-dashoffset 0.6s ease 0.25s",
              }}
            >
              <circle cx="16" cy="16" r="14" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
              <polyline
                points="8,16 13,21 24,10"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <h2 style={{ color: "#ffffff", fontSize: "1.35rem", fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
            Booking Confirmed!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
            Your lab test has been successfully scheduled
          </p>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.7)",
              fontSize: "1.1rem",
              lineHeight: 1,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)")}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "1.75rem 2rem" }}>
          {/* Booking summary card */}
          <div
            style={{
              background: "#f8faff",
              border: "1px solid #dde8f8",
              borderRadius: "0.875rem",
              padding: "1.25rem",
              marginBottom: "1.25rem",
            }}
          >
            <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Booking Summary
            </p>

            <DetailRow label="Test Name" value={testName} bold />
            <DetailRow label="Lab / Clinic" value={labName} />
            <DetailRow label="Scheduled Date" value={formattedDate} />
            <DetailRow label="Category" value={category} />
            <DetailRow
              label="Amount"
              value={`₹${price}`}
              valueStyle={{ color: "#0c213e", fontWeight: 700, fontSize: "1.05rem" }}
              isLast
            />
          </div>

          {/* Info note */}
          {/* <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "0.625rem",
              padding: "0.75rem 1rem",
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-start",
              marginBottom: "1.5rem",
            }}
          >
            <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>ℹ️</span>
            <p style={{ fontSize: "0.8rem", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              Our team will contact you to confirm the sample collection time. Please keep your phone accessible.
            </p>
          </div> */}

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                border: "1.5px solid #d1d5db",
                background: "#ffffff",
                color: "#374151",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#0c213e";
                (e.currentTarget as HTMLButtonElement).style.background = "#f8faff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db";
                (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
              }}
            >
              Close
            </button>
            {/* <Link to={""}>
            <button
              // onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "0.625rem",
                border: "none",
                background: "linear-gradient(135deg, #0c213e 0%, #1a3a6e 100%)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "opacity 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              >
              View My Bookings
            </button>
              </Link> */}
          </div>
        </div>
      </div>
    </div>
  );
}

// Small reusable row inside the summary card
function DetailRow({
  label,
  value,
  bold,
  isLast,
  valueStyle,
}: {
  label: string;
  value: string;
  bold?: boolean;
  isLast?: boolean;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        paddingBottom: isLast ? 0 : "0.75rem",
        marginBottom: isLast ? 0 : "0.75rem",
        borderBottom: isLast ? "none" : "1px solid #e9eef8",
      }}
    >
      <span style={{ fontSize: "0.82rem", color: "#6b7280", flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: "0.875rem",
          color: "#111827",
          fontWeight: bold ? 600 : 500,
          textAlign: "right",
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

export default function LabTestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [otherTests, setOtherTests] = useState<Test[]>([]);
  const [bookingDate, setBookingDate] = useState<string>("");

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState<string>("");

  // category -> image map
  const categoryImages: Record<string, string> = {
    kidney,
    fever,
    pregnancy: Pregnancy,
    diabetes,
    vitamin,
    liver: Liver,
    heart: Heart,
    imaging: Imaging,
  };

  // compute today's date in yyyy-mm-dd for `min` attr
  const todayDateString = useMemo(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
    return localISO;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch test details by ID
  useEffect(() => {
    const fetchTestDetails = async () => {
      if (!id) {
        navigate("/all-lab-test");
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/api/lab/alllabtests`);
        if (Array.isArray(res.data)) {
          const foundTest = res.data.find((t: Test) => t._id === id);
          if (foundTest) {
            setTest(foundTest);
          } else {
            toast.error("Test not found");
            navigate("/all-lab-test");
          }
        }
      } catch (err) {
        console.error("Error fetching test details:", err);
        toast.error("Failed to load test details");
        navigate("/all-lab-test");
      } finally {
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [id, navigate]);

  // Fetch other tests from the same lab
  useEffect(() => {
    const fetchOtherTests = async () => {
      if (!test?.labId) return;
      try {
        const res = await api.get(`/api/lab/alllabtests`);
        if (Array.isArray(res.data)) {
          const sameLabTests = res.data.filter(
            (t: Test) => t.labId === test.labId && t._id !== test._id
          );
          setOtherTests(sameLabTests.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching other tests:", err);
      }
    };
    fetchOtherTests();
  }, [test]);

  // helper: check if a yyyy-mm-dd string is in the past (compares dates only)
  const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const s = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
    const today = new Date();
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return s < t;
  };

  const handleBookTest = async () => {
    if (!test) return;

    setBookingLoading(true);

    try {
      // extract token cookie (patientToken)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("patientToken="))
        ?.split("=")[1];

      if (!token) {
        toast.error("Please login to book the test.");
        setBookingLoading(false);
        return;
      }

      // decode token to get patient id (basic JWT decode)
      let patientId: string | null = null;
      try {
        const base64Payload = token.split(".")[1];
        const payload = JSON.parse(atob(base64Payload));
        patientId = payload.id;
      } catch (err) {
        toast.error("Invalid session. Please login again.");
        setBookingLoading(false);
        return;
      }

      // validate bookingDate
      if (!bookingDate) {
        toast.error("Please select a booking date before continuing.");
        setBookingLoading(false);
        return;
      }
      if (isPastDate(bookingDate)) {
        toast.error("Selected booking date cannot be in the past.");
        setBookingLoading(false);
        return;
      }

      const bookingDateISO = new Date(bookingDate + "T00:00:00Z").toISOString();

      const payload = {
        test: {
          labId: test.labId,
          name: test.testName,
          price: test.price,
          category: test.category || "General",
        },
        patientId,
        bookingDate: bookingDateISO,
      };

      const res = await api.post("/api/lab/bookTest", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Booking response:", res.data);

      // ── Show confirmation modal ──
      setConfirmedDate(bookingDate);
      setBookingDate("");
      setModalOpen(true);
    } catch (error: any) {
      console.error("❌ Booking error:", error);
      const errorMessage = error.response?.data?.message || "Booking failed. Try again.";
      toast.error(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleViewOtherTest = (selectedTest: Test) => {
    navigate(`/lab-test-details/${selectedTest._id}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading test details...</p>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const categoryKey = test.category?.toLowerCase() || "";
  const imageSrc = categoryImages[categoryKey] || "/placeholder-image.jpg";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Booking Confirmation Modal ── */}
      <BookingConfirmationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        testName={test.testName}
        labName={test.labName}
        bookingDate={confirmedDate}
        price={test.price}
        category={test.category || "General"}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {test.testName}
              </h1>
              <p className="text-gray-600 mt-1">
                Provided by{" "}
                <span className="font-semibold text-[#0c213e]">
                  {test.labName}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-indigo-100 text-[#0c213e] text-sm font-medium px-3 py-1 rounded-full">
                {test.category || "General"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Test Card */}
            <div className="bg-white rounded-xl border border-gray-300 p-6 text-center">
              <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 p-3 mb-4">
                <img
                  src={imageSrc}
                  alt={test.testName}
                  className="w-full h-full object-contain"
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {test.testName}
              </h2>

              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-gray-500 line-through text-sm">
                    ₹{test.price + 200}
                  </span>
                  <span className="text-3xl font-bold text-[#0c213e]">
                    ₹{test.price}
                  </span>
                </div>
                <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded">
                  Save ₹200
                </span>
              </div>

              {/* Features */}
              <div className="w-full space-y-2 mb-6">
                <FeatureItem text="Reports in 10 hours" />
                <FeatureItem text="2 hour collection window" />
                <FeatureItem text="NABL certified labs" />
              </div>

              {/* Date picker */}
              <div className="mt-4 mb-3 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose booking date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={todayDateString}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {bookingDate && isPastDate(bookingDate) && (
                  <p className="text-xs text-red-600 mt-1">
                    Selected date is in the past.
                  </p>
                )}
              </div>

              {/* Book Button */}
              <button
                onClick={handleBookTest}
                disabled={bookingLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  bookingLoading
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-[#0c213e] text-white hover:bg-[#1a3557]"
                }`}
              >
                {bookingLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Book Test Now"
                )}
              </button>

              {test.reportFile && (
                <a
                  href={test.reportFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Download Sample Report
                </a>
              )}
            </div>

            {/* Other Tests */}
            {otherTests.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-300 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Other Tests from {test.labName}
                </h3>
                <div className="space-y-3">
                  {otherTests.map((t) => (
                    <div
                      key={t._id}
                      onClick={() => handleViewOtherTest(t)}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-[#0c213e]">
                          {t.testName}
                        </p>
                        <p className="text-sm text-gray-500">{t.category}</p>
                      </div>
                      <span className="text-lg font-bold text-[#0c213e]">
                        ₹{t.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Test Overview
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {test.description ||
                  `The ${test.testName} is a diagnostic procedure designed to evaluate your ${
                    test.category?.toLowerCase() || "health"
                  } condition, providing valuable insights for accurate diagnosis and treatment planning.`}
              </p>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Test Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SpecItem label="Sample Type" value="Blood" />
                <SpecItem label="Gender" value="Both" />
                <SpecItem label="Age Group" value="7 years & above" />
                <SpecItem label="Fasting Required" value="10–12 hours" />
                <SpecItem
                  label="Test Category"
                  value={test.category || "General"}
                />
                <SpecItem label="Report Time" value="10 hours" />
              </div>
            </div>

            {/* Precautions */}
            {test.precautions && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-3">
                  Important Precautions
                </h3>
                <p className="text-orange-800 leading-relaxed">
                  {test.precautions}
                </p>
              </div>
            )}

            {/* Benefits */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-300 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-[#0c213e] mb-4">
                Why Choose This Test?
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BenefitItem
                  title="Accurate Results"
                  description="Precise testing with advanced equipment"
                />
                <BenefitItem
                  title="Expert Analysis"
                  description="Reviewed by certified pathologists"
                />
                <BenefitItem
                  title="Quick Turnaround"
                  description="Fast results without compromising quality"
                />
                <BenefitItem
                  title="Home Collection"
                  description="Convenient sample collection at your location"
                />
              </div>
            </div>

            {/* Lab Info */}
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                About {test.labName}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {test.labName} is a premier diagnostic center accredited with
                NABL certification, renowned for its commitment to accuracy and
                patient care. Equipped with state-of-the-art technology and
                staffed by experienced healthcare professionals, the lab ensures
                reliable results and a seamless testing experience.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <LabFeature feature="NABL Certified" />
                <LabFeature feature="Modern Equipment" />
                <LabFeature feature="Expert Technicians" />
                <LabFeature feature="Quick Results" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
const FeatureItem = ({ text }: { text: string }) => (
  <div className="text-sm text-gray-700">{text}</div>
);

const SpecItem = ({ label, value }: { label: string; value: string }) => (
  <div className="p-3 bg-gray-50 rounded-lg border border-gray-300">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold text-gray-900">{value}</p>
  </div>
);

const BenefitItem = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div>
    <p className="font-semibold text-[#0c213e]">{title}</p>
    <p className="text-sm text-indigo-700">{description}</p>
  </div>
);

const LabFeature = ({ feature }: { feature: string }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-[#28328C]">
    {feature}
  </span>
);