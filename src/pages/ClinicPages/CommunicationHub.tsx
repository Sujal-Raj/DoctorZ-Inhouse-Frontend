import React, { useEffect, useState } from "react";
import { MessageSquare, RefreshCcw, Search, CheckCircle, XCircle } from "lucide-react";
import api from "../../Services/mainApi";
import { useParams } from "react-router-dom";

interface NotificationLog {
  _id: string;
  type: string;
  recipientPhone: string;
  message: string;
  status: string;
  sentAt: string;
}

const CommunicationHub: React.FC = () => {
  const { clinicId } = useParams();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/clinic/notifications/${clinicId}`);
      if (res.data?.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clinicId) fetchLogs();
  }, [clinicId]);

  const filteredLogs = logs.filter(log => 
    log.recipientPhone.includes(searchQuery) || log.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communication Hub</h1>
            <p className="text-gray-500 text-sm">Monitor simulated SMS and WhatsApp alerts dispatched to patients.</p>
          </div>
        </div>
        <button onClick={fetchLogs} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
          <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search phone number or message..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Recipient</th>
                <th className="px-6 py-4 font-semibold w-1/2">Message</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading communications...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No logs found.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        log.type === 'Appointment' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'Invoice' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">+91 {log.recipientPhone}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-xs" title={log.message}>
                      {log.message}
                    </td>
                    <td className="px-6 py-4">
                      {log.status === "Sent" ? (
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle className="w-4 h-4" /> Sent
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-600">
                          <XCircle className="w-4 h-4" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {new Date(log.sentAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommunicationHub;
