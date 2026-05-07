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
  CubeIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  ShoppingBagIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TagIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface InventoryItem {
  _id: string;
  clinicId: string;
  itemName: string;
  category: "Medicine" | "Equipment" | "Consumable";
  quantity: number;
  unit: string;
  price: number;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  minimumStock: number;
  status: "Available" | "Low Stock" | "Out of Stock";
}

type FormData = Omit<InventoryItem, "_id" | "clinicId">;

const emptyForm: FormData = {
  itemName: "",
  category: "Medicine",
  quantity: 0,
  unit: "",
  price: 0,
  expiryDate: "",
  batchNumber: "",
  supplier: "",
  minimumStock: 10,
  status: "Available",
};

interface OutletContext {
  clinicId: string;
}

const categoryIcon = (category: string) => {
  switch (category) {
    case "Medicine":
      return <BeakerIcon className="w-4 h-4" />;
    case "Equipment":
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
    case "Consumable":
      return <ShoppingBagIcon className="w-4 h-4" />;
    default:
      return <CubeIcon className="w-4 h-4" />;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case "Available":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Low Stock":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Out of Stock":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const categoryColor = (category: string) => {
  switch (category) {
    case "Medicine":
      return "bg-blue-100 text-blue-700";
    case "Equipment":
      return "bg-purple-100 text-purple-700";
    case "Consumable":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

interface FormFieldProps {
  label: string;
  name: keyof FormData;
  type?: string;
  options?: string[];
  formData: FormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

function FormField({ label, name, type = "text", options, formData, onChange }: FormFieldProps) {
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
          className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={String(formData[name])}
          onChange={onChange}
          className="w-full rounded-xl border-2 border-gray-200 p-3 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
        />
      )}
    </div>
  );
}

export default function InventoryManagement() {
  const { clinicId } = useOutletContext<OutletContext>();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const fetchItems = async () => {
    if (!clinicId) return;
    try {
      const res = await api.get<any>(
        `/api/inventory/clinic/${clinicId}`
      );
      const data = res.data.data;
      // Handle both array responses and wrapped responses like { items: [...] } or { inventory: [...] }
      const list: InventoryItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.inventory)
        ? data.inventory
        : [];
      setItems(list);
    } catch {
      toast.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [clinicId]);

  const openAdd = () => {
    setEditItem(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      expiryDate: item.expiryDate
        ? new Date(item.expiryDate).toISOString().split("T")[0]
        : "",
      batchNumber: item.batchNumber || "",
      supplier: item.supplier || "",
      minimumStock: item.minimumStock,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "price" || name === "minimumStock"
          ? Number(value)
          : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.itemName || !formData.unit) {
      toast.error("Item name and unit are required");
      return;
    }
    try {
      setSaving(true);
      if (editItem) {
        await api.put(`/api/inventory/update/${editItem._id}`, formData);
        toast.success("Item updated successfully");
      } else {
        await api.post(`/api/inventory/add`, { ...formData, clinicId });
        toast.success("Item added successfully");
      }
      setShowModal(false);
      fetchItems();
    } catch {
      toast.error(editItem ? "Failed to update item" : "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/inventory/delete/${deleteTarget._id}`);
      toast.success("Item deleted");
      setDeleteTarget(null);
      fetchItems();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const filtered = items.filter((item) => {
    const matchSearch = item.itemName
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory =
      filterCategory === "All" || item.category === filterCategory;
    const matchStatus =
      filterStatus === "All" || item.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const stats = {
    total: items.length,
    available: items.filter((i) => i.status === "Available").length,
    lowStock: items.filter((i) => i.status === "Low Stock").length,
    outOfStock: items.filter((i) => i.status === "Out of Stock").length,
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#0c213e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Helmet>
        <title>Inventory Management</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#0c213e] to-[#1a3a5f] px-6 sm:px-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <ArchiveBoxIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      Inventory Management
                    </h1>
                    <p className="text-gray-300 text-sm mt-0.5">
                      Track and manage clinic supplies
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 bg-white text-[#0c213e] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Item
                </button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100 border-t border-gray-100">
              {[
                { label: "Total Items", value: stats.total, color: "text-[#0c213e]" },
                { label: "Available", value: stats.available, color: "text-emerald-600" },
                { label: "Low Stock", value: stats.lowStock, color: "text-amber-600" },
                { label: "Out of Stock", value: stats.outOfStock, color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-4 px-2">
                  <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                />
              </div>
              <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-gray-400 absolute left-3" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="pl-9 pr-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
                  >
                    {["All", "Medicine", "Equipment", "Consumable"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-sm focus:border-[#0c213e] focus:ring-2 focus:ring-blue-100 transition-all duration-200 bg-white"
                >
                  {["All", "Available", "Low Stock", "Out of Stock"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Table / Cards */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <ArchiveBoxIcon className="w-12 h-12" />
              <p className="text-lg font-semibold">No items found</p>
              <p className="text-sm">Try adjusting your filters or add a new item</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {["Item Name", "Category", "Qty / Unit", "Price", "Supplier", "Expiry", "Min Stock", "Status", "Actions"].map(
                          (h) => (
                            <th
                              key={h}
                              className="text-left px-5 py-4 font-semibold text-gray-600 whitespace-nowrap"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((item) => (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50 transition-colors duration-150 group"
                        >
                          <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                            {item.itemName}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColor(item.category)}`}
                            >
                              {categoryIcon(item.category)}
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-700">
                            <span className="font-semibold">{item.quantity}</span>{" "}
                            <span className="text-gray-400 text-xs">{item.unit}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-700 font-medium">
                            ₹{item.price.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {item.supplier || "-"}
                          </td>
                          <td className="px-5 py-4 text-gray-600 whitespace-nowrap">
                            {item.expiryDate
                              ? new Date(item.expiryDate).toLocaleDateString("en-IN")
                              : "-"}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {item.minimumStock}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColor(item.status)}`}
                            >
                              {item.status === "Low Stock" && (
                                <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                              )}
                              {item.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(item)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors duration-150"
                                title="Edit"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(item)}
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
                {filtered.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{item.itemName}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold ${categoryColor(item.category)}`}>
                            {categoryIcon(item.category)}
                            {item.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${statusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-2 rounded-xl bg-blue-50 text-blue-600"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-2 rounded-xl bg-red-50 text-red-500"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-0.5">Quantity</p>
                        <p className="font-semibold text-gray-800">
                          {item.quantity} <span className="text-gray-500 font-normal text-xs">{item.unit}</span>
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-0.5">Price</p>
                        <p className="font-semibold text-gray-800">₹{item.price.toLocaleString()}</p>
                      </div>
                      {item.supplier && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-0.5">Supplier</p>
                          <p className="font-semibold text-gray-800">{item.supplier}</p>
                        </div>
                      )}
                      {item.expiryDate && (
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-gray-400 text-xs mb-0.5">Expiry</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(item.expiryDate).toLocaleDateString("en-IN")}
                          </p>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-0.5">Min Stock</p>
                        <p className="font-semibold text-gray-800">{item.minimumStock}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 py-8 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0c213e] to-[#1a3a5f] px-6 py-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {editItem ? (
                    <PencilIcon className="w-5 h-5 text-white" />
                  ) : (
                    <PlusIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editItem ? "Edit Item" : "Add New Item"}
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
                  <FormField label="Item Name *" name="itemName" formData={formData} onChange={handleChange} />
                </div>
                <FormField
                  label="Category *"
                  name="category"
                  options={["Medicine", "Equipment", "Consumable"]}
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Status"
                  name="status"
                  options={["Available", "Low Stock", "Out of Stock"]}
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField label="Quantity *" name="quantity" type="number" formData={formData} onChange={handleChange} />
                <FormField label="Unit *" name="unit" formData={formData} onChange={handleChange} />
                <FormField label="Price (₹) *" name="price" type="number" formData={formData} onChange={handleChange} />
                <FormField label="Minimum Stock" name="minimumStock" type="number" formData={formData} onChange={handleChange} />
                <FormField label="Batch Number" name="batchNumber" formData={formData} onChange={handleChange} />
                <FormField label="Supplier" name="supplier" formData={formData} onChange={handleChange} />
                <FormField label="Expiry Date" name="expiryDate" type="date" formData={formData} onChange={handleChange} />
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
                {saving ? "Saving..." : editItem ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <TrashIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Item?
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {deleteTarget.itemName}
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