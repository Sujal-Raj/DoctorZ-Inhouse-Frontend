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
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface InventoryItem {
  _id: string;
  labId?: string;
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

type FormData = Omit<InventoryItem, "_id" | "labId">;

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
  labId: string;
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

export default function LabInventory() {
  const { labId } = useOutletContext<OutletContext>();

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
    if (!labId) return;
    try {
      const res = await api.get<any>(
        `/api/inventory/lab/${labId}`
      );
      const data = res.data.data;
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
  }, [labId]);

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
        await api.post(`/api/inventory/add`, { ...formData, labId });
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
                    <p className="text-blue-100 text-sm mt-1">
                      Manage lab stock items, equipment, and consumables
                    </p>
                  </div>
                </div>
                <button
                  onClick={openAdd}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-[#0c213e] rounded-xl font-semibold shadow-sm hover:bg-blue-50 active:scale-95 transition-all duration-200 text-sm"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Stock Item
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 bg-white">
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">{stats.available}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Low Stock</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">{stats.lowStock}</p>
              </div>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-2">{stats.outOfStock}</p>
              </div>
            </div>
          </div>

          {/* Filters & Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Filters Bar */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-stretch">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search item name..."
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
                    <option value="Medicine">Medicine</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Consumable">Consumable</option>
                  </select>
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-xl border border-gray-200 p-2.5 text-sm bg-white focus:border-[#0c213e]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Stock Level</th>
                    <th className="px-6 py-4">Price / Unit</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-500">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 text-base">{item.itemName}</p>
                            <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                              {item.batchNumber && <p>Batch: {item.batchNumber}</p>}
                              {item.supplier && <p>Supplier: {item.supplier}</p>}
                              {item.expiryDate && (
                                <p>
                                  Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${categoryColor(item.category)}`}>
                            {categoryIcon(item.category)}
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">{item.quantity}</span>{" "}
                          <span className="text-gray-500 text-xs">{item.unit}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">Min stock: {item.minimumStock}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">₹{item.price}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-2 text-gray-500 hover:text-[#0c213e] hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editItem ? "Edit Stock Item" : "Add New Stock Item"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <FormField
                label="Item Name*"
                name="itemName"
                formData={formData}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Category*"
                  name="category"
                  options={["Medicine", "Equipment", "Consumable"]}
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Unit* (e.g. Box, Vial, Tablet)"
                  name="unit"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Quantity*"
                  name="quantity"
                  type="number"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Price per Unit* (₹)"
                  name="price"
                  type="number"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Min Stock Threshold"
                  name="minimumStock"
                  type="number"
                  formData={formData}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField
                  label="Expiry Date"
                  name="expiryDate"
                  type="date"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Batch Number"
                  name="batchNumber"
                  formData={formData}
                  onChange={handleChange}
                />
                <FormField
                  label="Supplier Name"
                  name="supplier"
                  formData={formData}
                  onChange={handleChange}
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
                {editItem ? "Save Changes" : "Add Item"}
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
              <ExclamationTriangleIcon className="w-8 h-8" />
              <h3 className="text-lg font-bold">Delete Item</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.itemName}</span>?
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
