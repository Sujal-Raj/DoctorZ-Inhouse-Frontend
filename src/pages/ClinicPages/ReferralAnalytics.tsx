import { useState, useEffect } from "react";
import api from "../../Services/mainApi";
import { toast } from "react-toastify";
import { ChartBarIcon, ArrowTrendingUpIcon, UserGroupIcon, HeartIcon } from "@heroicons/react/24/outline";

export default function ReferralAnalytics() {
  const [stats, setStats] = useState({
    totalIncoming: 0,
    totalOutgoing: 0,
    accepted: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Fallback/Simulated data fetching for analytics as it's purely UI driven for now.
      // In reality, this would hit an aggregated /api/referral/analytics endpoint
      const res = await api.get(`/api/referral`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("clinicToken")}` }
      });
      if (res.data.success) {
        const referrals = res.data.referrals;
        // Calculate basic stats manually for now
        let inc = 0, out = 0, acc = 0, rej = 0;
        referrals.forEach((r: any) => {
          if (r.status === "Accepted") acc++;
          if (r.status === "Rejected") rej++;
          // A bit hacky client side check for demo purposes
          inc++; 
        });
        
        setStats({ totalIncoming: inc, totalOutgoing: out, accepted: acc, rejected: rej });
      }
    } catch (err: any) {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Analytics...</div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
          <ChartBarIcon className="w-8 h-8 text-blue-600" />
          Referral Analytics
        </h1>
        <p className="text-slate-500 mt-1">Network performance and referral conversions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{stats.totalIncoming}</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">Total Incoming</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <HeartIcon className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{stats.totalOutgoing}</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">Total Outgoing</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{stats.accepted}</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">Accepted Referrals</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-800">{stats.rejected}</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">Rejected Referrals</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Network Value Realization</h2>
        <div className="h-64 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-slate-400 font-medium">Detailed charts will appear here (Requires Chart.js or Recharts)</p>
        </div>
      </div>
    </div>
  );
}
