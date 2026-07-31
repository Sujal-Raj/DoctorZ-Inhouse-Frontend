import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  ClockIcon,
} from "@heroicons/react/24/solid";
import {
  UsersIcon,
  UserPlusIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  BanknotesIcon,
  DocumentTextIcon,
  // EnvelopeIcon,
} from "@heroicons/react/24/outline";
import api from "../../Services/mainApi";
import { useNavigate } from "react-router-dom";

interface Clinic {
  _id: string;
  clinicId: string;
  clinicName: string;
  email: string;
}

interface ClinicStats {
  totalDoctors: number;
  totalDepartments: number;
}

interface ClinicResponse {
  clinic: Clinic;
  message: string;
}

interface StatsResponse {
  stats: ClinicStats;
  message: string;
}

interface AnalyticsData {
  financials: {
    totalRevenue: number;
    totalPaid: number;
    totalDue: number;
    totalExpenses: number;
    netProfit: number;
  };
  departmentRevenue: {
    opd: number;
    hospitalization: number;
    pharmacy: number;
  };
  bedOccupancy: {
    total: number;
    occupied: number;
    available: number;
    cleaning: number;
    maintenance: number;
  };
  stayStats: {
    totalDischarged: number;
    averageLengthOfStay: string;
  };
  timeSeries?: {
    revenueTrend: { name: string; revenue: number; expenses: number }[];
  };
}

const ClinicHomeDashboard: React.FC = () => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [clinicStats, setClinicStats] = useState<ClinicStats>({
    totalDoctors: 0,
    totalDepartments: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("clinicToken") || localStorage.getItem("clinic_portal_token");
  const clinicId = localStorage.getItem("clinicId");

  // Date/time updater
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

  // Fetch clinic profile + stats + analytics
  useEffect(() => {
    if (!token || !clinicId) {
      navigate(`/clinicDashboard/${clinicId || ""}`);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [profileRes, statsRes, analyticsRes] = await Promise.all([
          api.get<ClinicResponse>(`/api/clinic/getClinicById/${clinicId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get<StatsResponse>(`/api/clinic/getClinicStats/${clinicId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          api.get(`/api/analytics/summary/${clinicId}`),
        ]);

        if (profileRes.data?.clinic) setClinic(profileRes.data.clinic);
        if (statsRes.data?.stats) setClinicStats(statsRes.data.stats);
        if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.analytics);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, clinicId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Bed occupancy rate percentage
  const totalBeds = analytics?.bedOccupancy?.total || 0;
  const occupiedBeds = analytics?.bedOccupancy?.occupied || 0;
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(0) : "0";

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 font-sans text-gray-900">
      <div className="w-full space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] bg-blue-600 text-white font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Hospital Admin Dashboard
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2">
                Welcome, {clinic?.clinicName || "Clinic Admin"}
              </h1>
              <div className="flex items-center gap-2 text-gray-300 text-xs mt-1.5 font-medium">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{dateTime}</span>
              </div>
            </div>
            <div className="flex gap-3 text-xs bg-slate-800/40 p-4 rounded-2xl border border-slate-700/30">
              <div>
                <span className="text-gray-450 block uppercase font-bold text-[9px] tracking-wider">Doctors Registered</span>
                <span className="font-semibold text-sm">{clinicStats.totalDoctors} Active</span>
              </div>
              <div className="border-l border-slate-700/50 pl-3">
                <span className="text-gray-450 block uppercase font-bold text-[9px] tracking-wider">Departments</span>
                <span className="font-semibold text-sm">{clinicStats.totalDepartments} Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Total Invoiced Amount</span>
              <h3 className="text-xl font-bold text-gray-900 mt-1">₹{analytics.financials.totalRevenue.toLocaleString("en-IN")}</h3>
              <p className="text-[10px] text-gray-400 mt-1">Sum of all generated bills</p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Payments Collected</span>
              <h3 className="text-xl font-bold text-green-700 mt-1">₹{analytics.financials.totalPaid.toLocaleString("en-IN")}</h3>
              <p className="text-[10px] text-gray-450 mt-1">Actual credit in clinic account</p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Dues / Pending Receivables</span>
              <h3 className="text-xl font-bold text-red-650 mt-1">₹{analytics.financials.totalDue.toLocaleString("en-IN")}</h3>
              <p className="text-[10px] text-gray-450 mt-1">Post-discount outstanding balances</p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-gray-400">Simulated Net Profit / Loss</span>
              <h3 className={`text-xl font-bold mt-1 ${analytics.financials.netProfit >= 0 ? "text-blue-700" : "text-red-700"}`}>
                ₹{analytics.financials.netProfit.toLocaleString("en-IN")}
              </h3>
              <p className="text-[10px] text-gray-450 mt-1">Paid Revenue minus expense logs</p>
            </div>

          </div>
        )}

        {/* Advanced Analytics Graphs */}
        {analytics?.timeSeries && (
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-gray-900">Revenue & Expense Trend</h3>
            </div>
            <div className="h-75 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.timeSeries.revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value: number) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`₹${typeof value === 'number' ? value.toLocaleString('en-IN') : value}`]}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main body split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bed Occupancy and Admission stats */}
          {analytics && (
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-700" />
                <h3 className="font-bold text-base text-gray-900">Bed Occupancy Monitor</h3>
              </div>

              <div className="flex justify-between items-center bg-gray-50 border border-gray-150 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400">Current Occupancy Rate</span>
                  <h4 className="text-2xl font-black text-[#0c213e] mt-1">{occupancyRate}%</h4>
                </div>
                <div className="text-right text-xs font-semibold text-gray-500">
                  <p>{occupiedBeds} occupied</p>
                  <p className="mt-0.5">{totalBeds} total beds</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: `${occupancyRate}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                <div className="bg-green-50/50 border border-green-100 p-2.5 rounded-xl text-green-700">
                  <p className="font-bold text-sm">{analytics.bedOccupancy.available}</p>
                  <p className="text-[9px] uppercase font-bold text-green-600/80 mt-0.5">Available</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl text-blue-700">
                  <p className="font-bold text-sm">{analytics.bedOccupancy.cleaning}</p>
                  <p className="text-[9px] uppercase font-bold text-blue-600/80 mt-0.5">Cleaning</p>
                </div>
                <div className="bg-yellow-50/50 border border-yellow-100 p-2.5 rounded-xl text-yellow-700">
                  <p className="font-bold text-sm">{analytics.bedOccupancy.maintenance}</p>
                  <p className="text-[9px] uppercase font-bold text-yellow-600/80 mt-0.5">Repair</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between text-xs text-gray-500">
                <span>Average Stay Length: <strong>{analytics.stayStats.averageLengthOfStay} days</strong></span>
                <span>Total Discharges: <strong>{analytics.stayStats.totalDischarged}</strong></span>
              </div>
            </div>
          )}

          {/* Department-Wise Revenue Distribution */}
          {analytics && (
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <BanknotesIcon className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-base text-gray-900">Revenue Contributions</h3>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 text-gray-700">
                    <span>OPD Consultation Desk</span>
                    <span>₹{analytics.departmentRevenue.opd.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: `${
                          analytics.financials.totalRevenue > 0
                            ? (analytics.departmentRevenue.opd / analytics.financials.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 text-gray-700">
                    <span>Inpatient (IPD) Stays</span>
                    <span>₹{analytics.departmentRevenue.hospitalization.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: `${
                          analytics.financials.totalRevenue > 0
                            ? (analytics.departmentRevenue.hospitalization / analytics.financials.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1 text-gray-700">
                    <span>Pharmacy / Consumables Sales</span>
                    <span>₹{analytics.departmentRevenue.pharmacy.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{
                        width: `${
                          analytics.financials.totalRevenue > 0
                            ? (analytics.departmentRevenue.pharmacy / analytics.financials.totalRevenue) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <UsersIcon className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-base text-gray-900">Hospital Shortcuts</h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => navigate(`/clinicDashboard/${clinicId}/add-doctor`)}
                className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                    <UserPlusIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Register Doctor</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Map medical practitioner profiles</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => navigate(`/clinicDashboard/${clinicId}/all-clinic-patients`)}
                className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Patients Registry</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Check clinical demographic data</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </button>

              <button
                onClick={() => navigate(`/clinicDashboard/${clinicId}/billing-ledger`)}
                className="flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Financial Ledgers</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Reconcile patient bills and claims</p>
                  </div>
                </div>
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

        </div>

        {/* Notices and Alerts */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
            <span className="text-lg">📌</span>
            <h4 className="font-bold text-sm text-amber-900">Institutional Notice Board</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              "Audit daily ward bed occupancy levels before evening shifts.",
              "Verify pending insurance settlements and claim payments.",
              "Track inventory low-stock alerts and request medicine orders.",
            ].map((notice, idx) => (
              <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-100/50 text-xs text-gray-650 flex items-start gap-2 shadow-3xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <p>{notice}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClinicHomeDashboard;
