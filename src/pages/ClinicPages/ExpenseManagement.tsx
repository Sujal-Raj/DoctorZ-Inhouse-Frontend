import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../Services/mainApi";
import { Helmet } from "react-helmet";
import toast, { Toaster } from "react-hot-toast";
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
  // CalendarDaysIcon,
  // TagIcon,
  // UserIcon,
  // DocumentTextIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  clinicId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  expenseDate: string;
  description?: string;
  receipt?: string;
  addedBy?: string;
}

type ExpenseFormData = Omit<Expense, "_id" | "clinicId">;

interface OutletContext {
  clinicId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const paymentIcon = (method: string) => {
  switch (method) {
    case "Cash":
      return <BanknotesIcon className="w-4 h-4" />;
    case "UPI":
      return <DevicePhoneMobileIcon className="w-4 h-4" />;
    case "Card":
      return <CreditCardIcon className="w-4 h-4" />;
    case "Bank Transfer":
      return <BuildingLibraryIcon className="w-4 h-4" />;
    default:
      return <BanknotesIcon className="w-4 h-4" />;
  }
};

const paymentColor = (method: string) => {
  const map: Record<string, string> = {
    Cash: "bg-emerald-100 text-emerald-700 border-emerald-200",
    UPI: "bg-blue-100 text-blue-700 border-blue-200",
    Card: "bg-purple-100 text-purple-700 border-purple-200",
    "Bank Transfer": "bg-amber-100 text-amber-700 border-amber-200",
  };
  return map[method] ?? "bg-gray-100 text-gray-700 border-gray-200";
};

// ─── FormField (top-level to prevent focus loss on re-render) ─────────────────

interface FormFieldProps {
  label: string;
  name: keyof ExpenseFormData;
  type?: string;
  options?: string[];
  textarea?: boolean;
  formData: ExpenseFormData;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
}

function FormField({
  label,
  name,
  type = "text",
  options,
  textarea = false,
  formData,
  onChange,
}: FormFieldProps) {
  const baseClass =
    "w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white";

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      {options ? (
        <select
          name={name}
          value={String(formData[name])}
          onChange={onChange}
          className={baseClass}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : textarea ? (
        <textarea
          name={name}
          value={String(formData[name])}
          onChange={onChange}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={String(formData[name])}
          onChange={onChange}
          className={baseClass}
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExpenseManagement() {
  const { clinicId } = useOutletContext<OutletContext>();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterPayment, setFilterPayment] = useState("All");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchExpenses = async () => {
    if (!clinicId) return;
    try {
      const res = await api.get<any>(`/api/expense/clinic/${clinicId}`);
      const data = res.data;
      const list: Expense[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.expenses)
        ? data.expenses
        : Array.isArray(data?.data)
        ? data.data
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
  }, [clinicId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditExpense(null);
    setFormData({
      ...emptyForm,
      expenseDate: new Date().toISOString().split("T")[0],
    });
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.expenseDate) {
      toast.error("Title, amount, and date are required");
      return;
    }
    try {
      setSaving(true);
      if (editExpense) {
        await api.put(`/api/expense/update/${editExpense._id}`, formData);
        toast.success("Expense updated successfully");
      } else {
        await api.post(`/api/expense/add`, { ...formData, clinicId });
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

  // ── Derived Data ───────────────────────────────────────────────────────────

  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "All" || e.category === filterCategory;
    const matchPayment =
      filterPayment === "All" || e.paymentMethod === filterPayment;
    return matchSearch && matchCategory && matchPayment;
  });

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);
  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.expenseDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const thisMonthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Toaster position="top-right" />
      <Helmet>
        <title>Expense Management</title>
      </Helmet>

      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Header ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-linear-to-r from-[#0c213e] to-[#1a3a5f] px-6 sm:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CurrencyRupeeIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Expense Management
                    </h1>
                    <p className="text-gray-300 text-sm mt-0.5">
                      Track and manage clinic expenses
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 bg-white text-[#0c213e] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Expense
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y sm:divide-y-0 divide-gray-100 border-t border-gray-100">
              <div className="flex flex-col items-center py-4 px-2">
                <span className="text-2xl font-bold text-[#0c213e]">
                  {expenses.length}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  Total Records
                </span>
              </div>
              <div className="flex flex-col items-center py-4 px-2">
                <span className="text-2xl font-bold text-red-600">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  Total Spent
                </span>
              </div>
              <div className="flex flex-col items-center py-4 px-2 col-span-2 sm:col-span-1">
                <span className="text-2xl font-bold text-amber-600">
                  ₹{thisMonthTotal.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-gray-500 mt-0.5">
                  This Month
                </span>
              </div>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative flex items-center">
                  <FunnelIcon className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
                >
                  <option value="All">All Payments</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            {(filterCategory !== "All" || filterPayment !== "All" || search) && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <ChartBarIcon className="w-4 h-4" />
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {filtered.length}
                </span>{" "}
                records · Total:{" "}
                <span className="font-semibold text-red-600">
                  ₹{filteredTotal.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {/* ── Table / Cards ── */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <CurrencyRupeeIcon className="w-12 h-12" />
              <p className="text-lg font-semibold">No expenses found</p>
              <p className="text-sm">
                Try adjusting your filters or add a new expense
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {[
                          "Title",
                          "Category",
                          "Amount",
                          "Payment",
                          "Date",
                          "Added By",
                          "Description",
                          "Actions",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-4 font-semibold text-gray-600 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((expense) => (
                        <tr
                          key={expense._id}
                          className="hover:bg-gray-50 transition-colors duration-150 group"
                        >
                          <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                            {expense.title}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColor(expense.category)}`}
                            >
                              {expense.category}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-bold text-red-600 whitespace-nowrap">
                            ₹{expense.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-xs font-semibold border ${paymentColor(expense.paymentMethod)}`}
                            >
                              {paymentIcon(expense.paymentMethod)}
                              {expense.paymentMethod}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {new Date(expense.expenseDate).toLocaleDateString(
                              "en-IN"
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {expense.addedBy || "-"}
                          </td>
                          <td className="px-5 py-4 text-gray-500 max-w-45 truncate">
                            {expense.description || "-"}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(expense)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors duration-150"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(expense)}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors duration-150"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {filtered.map((expense) => (
                  <div
                    key={expense._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">
                          {expense.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${categoryColor(expense.category)}`}
                          >
                            {expense.category}
                          </span>
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold border ${paymentColor(expense.paymentMethod)}`}
                          >
                            {paymentIcon(expense.paymentMethod)}
                            {expense.paymentMethod}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(expense)}
                          className="p-2 rounded-xl bg-red-50 text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-0.5">Amount</p>
                        <p className="font-bold text-red-600">
                          ₹{expense.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-0.5">Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(expense.expenseDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>
                      {expense.addedBy && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-0.5">
                            Added By
                          </p>
                          <p className="font-semibold text-gray-800">
                            {expense.addedBy}
                          </p>
                        </div>
                      )}
                      {expense.description && (
                        <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                          <p className="text-gray-400 text-xs mb-0.5">
                            Description
                          </p>
                          <p className="font-semibold text-gray-800 text-xs">
                            {expense.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 py-8 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#0c213e] to-[#1a3a5f] px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {editExpense ? (
                    <PencilIcon className="w-5 h-5 text-white" />
                  ) : (
                    <PlusIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editExpense ? "Edit Expense" : "Add New Expense"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <FormField
                    label="Title *"
                    name="title"
                    formData={formData}
                    onChange={handleChange}
                  />
                </div>
                <FormField
                  label="Category *"
                  name="category"
                  options={CATEGORIES}
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Payment Method *"
                  name="paymentMethod"
                  options={PAYMENT_METHODS}
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Amount (₹) *"
                  name="amount"
                  type="number"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Expense Date *"
                  name="expenseDate"
                  type="date"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Added By"
                  name="addedBy"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Receipt (URL)"
                  name="receipt"
                  formData={formData}
                  onChange={handleChange}
                />
                <div className="sm:col-span-2">
                  <FormField
                    label="Description"
                    name="description"
                    textarea
                    formData={formData}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#0c213e] text-white rounded-xl font-semibold hover:bg-[#1a3a5f] transition-all duration-200 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4" />
                {saving
                  ? "Saving..."
                  : editExpense
                  ? "Update Expense"
                  : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Expense?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {deleteTarget.title}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </>
  );
}