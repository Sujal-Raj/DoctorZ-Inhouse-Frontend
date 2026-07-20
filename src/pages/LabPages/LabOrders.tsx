import  { useState, useEffect } from "react";
import api from "../../Services/mainApi";
import { toast } from "react-toastify";
import { DocumentTextIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

interface LabOrder {
  _id: string;
  testName: string;
  category: string;
  status: string;
  userId: any;
  referredByDoctorId: any;
  bookingDate: string;
  paymentStatus: string;
  reportUrl?: string;
  testResults?: any;
}

export default function LabOrders() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // For the modal
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [resultInput, setResultInput] = useState<{ parameter: string; result: string; unit: string; referenceRange: string; flag: string }[]>([
    { parameter: "", result: "", unit: "", referenceRange: "", flag: "Normal" }
  ]);
  const [comments, setComments] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/lab/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch lab orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string, payload: any = {}) => {
    try {
      setUpdating(id);
      const res = await api.put(`/api/lab/orders/${id}/status`, { status: newStatus, ...payload }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders();
        setSelectedOrder(null);
      }
    } catch (err: any) {
      toast.error("Failed to update order status");
    } finally {
      setUpdating(null);
    }
  };

  const addResultRow = () => {
    setResultInput([...resultInput, { parameter: "", result: "", unit: "", referenceRange: "", flag: "Normal" }]);
  };

  const handleResultChange = (index: number, field: string, value: string) => {
    const newResults = [...resultInput];
    (newResults[index] as any)[field] = value;
    setResultInput(newResults);
  };

  const handleApproveReport = () => {
    if (!selectedOrder) return;
    updateStatus(selectedOrder._id, "Approved", { testResults: resultInput, comments });
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Lab Orders Workflow</h1>
          <p className="text-slate-500 mt-1">Manage test lifecycle and automated reporting</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="p-4">Patient</th>
                <th className="p-4">Test/Package</th>
                <th className="p-4">Referred By</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{order.userId?.fullName}</p>
                    <p className="text-xs text-slate-500">Phone: {order.userId?.MobileNo}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-blue-700">{order.testName}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{order.category}</span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {order.referredByDoctorId ? `Dr. ${order.referredByDoctorId.fullName}` : "Self-Walk-in"}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                      order.status === "Created" ? "bg-slate-100 text-slate-700" :
                      order.status === "Sample Collected" ? "bg-amber-100 text-amber-700" :
                      order.status === "Processing" ? "bg-blue-100 text-blue-700" :
                      order.status === "Approved" ? "bg-purple-100 text-purple-700" :
                      order.status === "Delivered" ? "bg-emerald-100 text-emerald-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {order.status === "Created" && (
                      <button onClick={() => updateStatus(order._id, "Sample Collected")} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Collect Sample</button>
                    )}
                    {order.status === "Sample Collected" && (
                      <button onClick={() => updateStatus(order._id, "Processing")} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700">Start Processing</button>
                    )}
                    {order.status === "Processing" && (
                      <button onClick={() => setSelectedOrder(order)} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 flex items-center gap-1">
                        <DocumentTextIcon className="w-4 h-4" /> Generate Report
                      </button>
                    )}
                    {(order.status === "Approved" || order.status === "Delivered") && order.reportUrl && (
                      <a href={order.reportUrl} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-800 text-white rounded text-sm font-medium hover:bg-slate-900 flex items-center gap-1">
                        View PDF
                      </a>
                    )}
                    {order.status === "Approved" && (
                      <button onClick={() => updateStatus(order._id, "Delivered")} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" /> Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Generation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Enter Test Results</h2>
                <p className="text-sm text-slate-500">Patient: {selectedOrder.userId?.fullName} | Test: {selectedOrder.testName}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-red-500 transition-colors">Close</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {resultInput.map((res, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl items-center">
                    <div className="col-span-3">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Parameter</label>
                      <input type="text" value={res.parameter} onChange={e => handleResultChange(idx, "parameter", e.target.value)} className="w-full px-3 py-2 border rounded bg-white" placeholder="e.g. Hemoglobin" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Result</label>
                      <input type="text" value={res.result} onChange={e => handleResultChange(idx, "result", e.target.value)} className="w-full px-3 py-2 border rounded bg-white" placeholder="e.g. 14.5" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Unit</label>
                      <input type="text" value={res.unit} onChange={e => handleResultChange(idx, "unit", e.target.value)} className="w-full px-3 py-2 border rounded bg-white" placeholder="e.g. g/dL" />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Ref Range</label>
                      <input type="text" value={res.referenceRange} onChange={e => handleResultChange(idx, "referenceRange", e.target.value)} className="w-full px-3 py-2 border rounded bg-white" placeholder="e.g. 13.0 - 17.0" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 mb-1 block">Flag</label>
                      <select value={res.flag} onChange={e => handleResultChange(idx, "flag", e.target.value)} className="w-full px-3 py-2 border rounded bg-white">
                        <option>Normal</option>
                        <option>High</option>
                        <option>Low</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addResultRow} className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">
                + Add Parameter
              </button>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor/Lab Comments</label>
                <textarea 
                  value={comments} 
                  onChange={e => setComments(e.target.value)} 
                  className="w-full px-4 py-3 border rounded-xl bg-slate-50 h-24"
                  placeholder="Additional notes for the report..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100">Cancel</button>
              <button onClick={handleApproveReport} disabled={!!updating} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 disabled:opacity-50">
                {updating ? "Generating PDF..." : "Approve & Generate PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
