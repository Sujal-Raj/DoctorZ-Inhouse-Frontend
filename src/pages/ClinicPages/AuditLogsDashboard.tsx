import  { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";

export default function AuditLogsDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    module: "",
    action: "",
    userId: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("clinicToken") || localStorage.getItem("token") || localStorage.getItem("receptionToken") || localStorage.getItem("authTokenClinic");
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axios.get(`http://localhost:3000/api/audit?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const exportToCSV = () => {
    if (logs.length === 0) return;
    const header = Object.keys(logs[0]).join(",");
    const rows = logs.map(obj =>
      Object.values(obj)
        .map(val => (typeof val === "object" ? `"${JSON.stringify(val).replace(/"/g, '""')}"` : `"${val}"`))
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 w-full min-h-screen pb-20 pt-16 hide-on-print print-container">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Audit Logs (Enterprise)</h1>
        <div className="flex space-x-4">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 font-medium"
          >
            Export CSV
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-rose-600 text-white rounded-md shadow hover:bg-rose-700 font-medium"
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 no-print">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Module (e.g. Patient)"
            className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
          />
          <input
            type="text"
            placeholder="Action (e.g. Created)"
            className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          />
          <input
            type="text"
            placeholder="User ID"
            className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          />
          <input
            type="date"
            className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print-override">
        {loading ? (
          <div className="p-10 text-center text-gray-500 font-medium">Loading Audit Logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-500 font-medium">No Audit Logs found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Audit ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-indigo-50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                      {log.auditId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-semibold">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">{log.module}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{log.userName || "System"}</div>
                      <div className="text-xs text-gray-500">{log.userRole || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate cursor-pointer group-hover:whitespace-normal group-hover:break-words">
                      {log.details}
                      {log.previousValue && (
                        <div className="mt-2 text-xs bg-red-50 p-2 border border-red-100 rounded text-red-800 hidden group-hover:block">
                          <strong>Before:</strong> {JSON.stringify(log.previousValue).substring(0, 100)}...
                        </div>
                      )}
                      {log.newValue && (
                        <div className="mt-2 text-xs bg-green-50 p-2 border border-green-100 rounded text-green-800 hidden group-hover:block">
                          <strong>After:</strong> {JSON.stringify(log.newValue).substring(0, 100)}...
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-container { padding: 0 !important; margin: 0 !important; }
          .print-override { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px !important; font-size: 10px !important; }
          .hidden { display: block !important; } 
        }
      `}</style>
    </div>
  );
}
