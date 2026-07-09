import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BanknotesIcon,
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

type ExpenseCategory =
  | "Salary"
  | "Electricity"
  | "Medicine Purchase"
  | "Equipment"
  | "Maintenance"
  | "Rent"
  | "Internet"
  | "Miscellaneous";

type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank Transfer";

interface Expense {
  _id: string;
  labId?: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  description?: string;
  receipt?: string;
  addedBy?: string;
}

type ExpenseFormData = Omit<Expense, "_id" | "labId">;

interface OutletContext {
  labId: string;
}

const CATEGORIES: ExpenseCategory[] = [
  "Salary",
  "Electricity",
  "Medicine Purchase",
  "Equipment",
  "Maintenance",
  "Rent",
  "Internet",
  "Miscellaneous",
];

const PAYMENT_METHODS: PaymentMethod[] = ["Cash", "UPI", "Card", "Bank Transfer"];

const emptyForm: ExpenseFormData = {
  title: "",
  category: "Miscellaneous",
  amount: 0,
  paymentMethod: "Cash",
  expenseDate: new Date().toISOString().split("T")[0],
  description: "",
  receipt: "",
  addedBy: "",
};

const categoryColor = (category: string) => {
  const map: Record<string, string> = {
    Salary: "bg-violet-100 text-violet-700",
    Electricity: "bg-yellow-100 text-yellow-700",
    "Medicine Purchase": "bg-blue-100 text-blue-700",
    Equipment: "bg-purple-100 text-purple-700",
    Maintenance: "bg-orange-100 text-orange-700",
    Rent: "bg-rose-100 text-rose-700",
    Internet: "bg-cyan-100 text-cyan-700",
    Miscellaneous: "bg-gray-100 text-gray-700",
  };
  return map[category] ?? "bg-gray-100 text-gray-700";
};

const methodIcon = (method: PaymentMethod) => {
  switch (method) {
    case "Cash":
      return <BanknotesIcon className="w-4 h-4 text-emerald-500" />;
    case "Card":
      return <CreditCardIcon className="w-4 h-4 text-blue-500" />;
    case "UPI":
      return <DevicePhoneMobileIcon className="w-4 h-4 text-purple-500" />;
    case "Bank Transfer":
      return <BuildingLibraryIcon className="w-4 h-4 text-indigo-500" />;
    default:
      return <CurrencyRupeeIcon className="w-4 h-4 text-gray-500" />;
  }
};

export default function LabExpenses() {
  const { labId } = useOutletContext<OutletContext>();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMethod, setFilterMethod] = useState("All");

  const fetchExpenses = async () => {
    if (!labId) return;
    try {
      const res = await api.get<any>(
        `/api/expense/lab/${labId}`
      );
      const data = res.data.data;
      const list: Expense[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.expenses)
        ? data.expenses
        : [];
      setExpenses(list);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [labId]);

  const openAdd = () => {
    setEditExpense(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      expenseDate: expense.expenseDate
        ? new Date(expense.expenseDate).toISOString().split("T")[0]
        : "",
      description: expense.description || "",
      receipt: expense.receipt || "",
      addedBy: expense.addedBy || "",
    });
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error("Title, Category and Amount are required");
      return;
    }
    try {
      setSaving(true);
      if (editExpense) {
        await api.put(`/api/expense/update/${editExpense._id}`, formData);
        toast.success("Expense updated successfully");
      } else {
        await api.post(`/api/expense/add`, { ...formData, labId });
        toast.success("Expense added successfully");
      }
      setShowModal(false);
      fetchExpenses();
    } catch {
      toast.error(editExpense ? "Failed to update expense" : "Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/expense/delete/${deleteTarget._id}`);
      toast.success("Expense deleted");
      setDeleteTarget(null);
      fetchExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const filtered = expenses.filter((exp) => {
    const matchSearch = exp.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "All" || exp.category === filterCategory;
    const matchMethod =
      filterMethod === "All" || exp.paymentMethod === filterMethod;
    return matchSearch && matchCategory && matchMethod;
  });

  const totals = {
    total: filtered.reduce((sum, exp) => sum + exp.amount, 0),
    cash: filtered.filter((e) => e.paymentMethod === "Cash").reduce((sum, e) => sum + e.amount, 0),
    upi: filtered.filter((e) => e.paymentMethod === "UPI").reduce((sum, e) => sum + e.amount, 0),
    other: filtered
      .filter((e) => e.paymentMethod !== "Cash" && e.paymentMethod !== "UPI")
      .reduce((sum, e) => sum + e.amount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      
      <Helmet>
        <title>Expense Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0c213e] to-[#1a3a5f] px-6 sm:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Expense Management
                    </h1>
                    <p className="text-blue-100 text-sm mt-1">
                      Track your lab agency expenditures and salaries
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAdd}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#0c213e] rounded-xl font-semibold shadow-sm hover:bg-blue-50 active:scale-95 transition-all duration-200 text-sm"
                >
                  <PlusIcon className="w-5 h-5" />
                  Record Expense
                </button>
              </div>
            </div>

            {/* Total Expense Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 bg-white">
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">₹{totals.total}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Paid via Cash</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">₹{totals.cash}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Paid via UPI</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-2">₹{totals.upi}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Other Methods</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-2">₹{totals.other}</p>
              </div>
            </div>
          </div>

          {/* Table & Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-stretch">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expense titles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-gray-400" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="rounded-xl border border-gray-200 p-2.5 text-sm bg-white focus:border-[#0c213e]"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="rounded-xl border border-gray-200 p-2.5 text-sm bg-white focus:border-[#0c213e]"
                >
                  <option value="All">All Methods</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Expense Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500">
                        No expenses recorded.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((exp) => (
                      <tr key={exp._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 text-base">{exp.title}</p>
                            {exp.description && <p className="text-xs text-gray-500 mt-1">{exp.description}</p>}
                            {exp.addedBy && <p className="text-[10px] text-gray-400 mt-0.5">Recorded by: {exp.addedBy}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${categoryColor(exp.category)}`}>
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(exp.expenseDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-gray-700">
                            {methodIcon(exp.paymentMethod)}
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 text-base">
                          ₹{exp.amount}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEdit(exp)}
                            className="p-2 text-gray-500 hover:text-[#0c213e] hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(exp)}
                            className="p-2 text-gray-500 hover:text-rose-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editExpense ? "Edit Expense" : "Record Expense"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Expense Title*
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="e.g. Electricity Bill, Staff Salary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category*
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Amount* (₹)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount || ""}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Payment Method*
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    name="expenseDate"
                    value={formData.expenseDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Added By (Your Name/Role)
                </label>
                <input
                  type="text"
                  name="addedBy"
                  value={formData.addedBy || ""}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="e.g. Lab Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 outline-none"
                  placeholder="Provide any additional details..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#0c213e] rounded-xl hover:bg-[#1a3a5f] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {editExpense ? "Save Changes" : "Record Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <TrashIcon className="w-8 h-8" />
              <h3 className="text-lg font-bold">Delete Expense</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.title}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
