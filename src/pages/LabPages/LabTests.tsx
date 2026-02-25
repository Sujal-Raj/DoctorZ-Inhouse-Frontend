import React, { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { Search, Plus, Box, Edit3, Trash2, X, TestTube, Package, Filter, ChevronDown } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

/* -------------------- Types -------------------- */
interface LabDashboardContext {
  labId: string | null;
}

interface Test {
  _id?: string;
  testName: string;
  price: number;
  precaution?: string;
  description?: string;
  category?: string;
  customCategory?: string;
}

interface PackageType {
  _id?: string;
  packageName: string;
  description?: string;
  totalPrice: number;
  tests: (string | Test)[];
}

/* -------------------- API -------------------- */
const API_BASE = "https://doctorz-main.onrender.com/api/lab";
// const API_BASE = "http://localhost:3000/api/lab";
const API = {
  getTestsByLab: (labId: string) => `${API_BASE}/getAllTestByLabId/${labId}`,
  addTest: () => `${API_BASE}/addTest`,
  updateTest: (testId: string) => `${API_BASE}/updateLabTest/${testId}`,
  deleteTest: (testId: string) => `${API_BASE}/deleteLabTest/${testId}`,

  addPackage: () => `${API_BASE}/addPackage`,
  getPackagesByLab: (labId: string) => `${API_BASE}/getAllPackagesByLabId/${labId}`,
  updatePackage: (packageId: string) => `${API_BASE}/updatePackage/${packageId}`,
  deletePackage: (packageId: string) => `${API_BASE}/deletePackage/${packageId}`,
};

/* -------------------- Constants -------------------- */
const categories = [
  "Liver",
  "Kidney",
  "Diabetes",
  "Fever",
  "Vitamin",
  "Pregnancy",
  "Heart",
  "Other",
];

/* -------------------- Component -------------------- */
const LabManagementPro: React.FC = () => {
  const { labId } = useOutletContext<LabDashboardContext>();

  const [tests, setTests] = useState<Test[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"tests" | "packages">("tests");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [deleteType, setDeleteType] = useState<"test" | "package" | null>(null);
const [deleteId, setDeleteId] = useState<string | null>(null);
const [deleteLoading, setDeleteLoading] = useState(false);


  const [testForm, setTestForm] = useState<Partial<Test>>({
    testName: "",
    price: 0,
    description: "",
    precaution: "",
    category: "",
    customCategory: "",
  });

  const [packageForm, setPackageForm] = useState<Partial<PackageType>>({
    packageName: "",
    description: "",
    totalPrice: 0,
    tests: [],
  });

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    if (!labId) return;
    loadAll();
  }, [labId]);

  const loadAll = async () => {
    if (!labId) return;
    setLoading(true);
    try {
      const [tRes, pRes] = await Promise.all([
        axios.get<{ tests: Test[] }>(API.getTestsByLab(labId)),
        axios.get<{ packages: PackageType[] }>(API.getPackagesByLab(labId)),
      ]);
      setTests(tRes.data.tests || []);
      setPackages(pRes.data.packages || []);
    } catch (err) {
      console.error("Load error:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Helpers -------------------- */
  const resetTestForm = () =>
    setTestForm({
      testName: "",
      price: 0,
      description: "",
      precaution: "",
      category: "",
      customCategory: "",
    });

  const resetPackageForm = () =>
    setPackageForm({
      packageName: "",
      description: "",
      totalPrice: 0,
      tests: [],
    });

  const getTestName = (t: any) => {
    if (!t) return "";
    return typeof t === "string"
      ? tests.find((x) => x._id === t)?.testName ?? "Test"
      : t.testName ?? "Test";
  };

  /* -------------------- Filtered lists -------------------- */
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchQuery =
        query.trim() === "" ||
        t.testName.toLowerCase().includes(query.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(query.toLowerCase());

      const matchCategory =
        categoryFilter === "" || t.category === categoryFilter;

      return matchQuery && matchCategory;
    });
  }, [tests, query, categoryFilter]);

  const filteredPackages = useMemo(() => {
    return packages.filter((p) => {
      const matchQuery =
        query.trim() === "" ||
        p.packageName.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase());
      return matchQuery;
    });
  }, [packages, query]);

  /* -------------------- Test CRUD -------------------- */
  const openAddTest = () => {
    setActiveTab("tests");
    setIsEditMode(false);
    setEditingId(null);
    resetTestForm();
    setModalOpen(true);
  };

  const openEditTest = (t: Test) => {
    setActiveTab("tests");
    setIsEditMode(true);
    setEditingId(t._id || null);
    setTestForm({ ...t });
    setModalOpen(true);
  };

  const submitTest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!labId) return toast.error("Lab ID missing");
    if (!testForm.testName || testForm.price === undefined)
      return toast.error("Test name & price required");

    try {
      if (isEditMode && editingId) {
        const payload = {
          testName: testForm.testName,
          price: Number(testForm.price),
          description: testForm.description || "",
          precaution: testForm.precaution || "",
          category:
            testForm.category === "Other"
              ? testForm.customCategory || "Other"
              : testForm.category,
        };

        const res = await axios.put<{ updatedTest: Test }>(
          API.updateTest(editingId),
          payload
        );
        setTests((prev) =>
          prev.map((x) => (x._id === editingId ? res.data.updatedTest : x))
        );
        toast.success("Test updated");
      } else {
        const payload = [
          {
            ...testForm,
            price: Number(testForm.price),
            category:
              testForm.category === "Other"
                ? testForm.customCategory || "Other"
                : testForm.category,
            labId,
          },
        ];

        const res = await axios.post<{ tests: Test[] }>(API.addTest(), payload);
        setTests((prev) => [...res.data.tests, ...prev]);
        toast.success("Test added");
      }

      setModalOpen(false);
      loadAll();
    } catch (err) {
      console.error("Test submit error:", err);
      toast.error("Failed to save test");
    }
  };

      const openDeleteModal = (type: "test" | "package", id?: string) => {
  if (!id) return;
  setDeleteType(type);
  setDeleteId(id);
  setDeleteModalOpen(true);
};

  // const removeTest = async (testId?: string) => {
  //   if (!testId) return;
  //   // const ok = confirm(
  //   //   "Are you sure? This will also remove it from all packages."
  //   // );
  //   // if (!ok) return;

  //   try {
  //     await axios.delete(API.deleteTest(testId));
  //     setTests((prev) => prev.filter((x) => x._id !== testId));

  //     setPackages((prev) =>
  //       prev.map((p) => ({
  //         ...p,
  //         tests: p.tests.filter((t: any) =>
  //           typeof t === "string" ? t !== testId : t._id !== testId
  //         ),
  //       }))
  //     );

  //     toast.success("Test deleted");
  //   } catch (err) {
  //     console.error("Delete test error:", err);
  //     toast.error("Failed to delete test");
  //   }
  // };

  const confirmDelete = async () => {
  if (!deleteId || !deleteType) return;

  setDeleteLoading(true);

  try {
    if (deleteType === "test") {
      await axios.delete(API.deleteTest(deleteId));

      setTests((prev) => prev.filter((x) => x._id !== deleteId));

      setPackages((prev) =>
        prev.map((p) => ({
          ...p,
          tests: p.tests.filter((t: any) =>
            typeof t === "string" ? t !== deleteId : t._id !== deleteId
          ),
        }))
      );

      toast.success("Test deleted");
    } else {
      await axios.delete(API.deletePackage(deleteId));
      setPackages((prev) => prev.filter((p) => p._id !== deleteId));
      toast.success("Package deleted");
    }

    setDeleteModalOpen(false);
  } catch (err) {
    toast.error("Failed to delete");
  } finally {
    setDeleteLoading(false);
  }
};


  /* -------------------- Package CRUD -------------------- */
  const openAddPackage = () => {
    setActiveTab("packages");
    setIsEditMode(false);
    setEditingId(null);
    resetPackageForm();
    setModalOpen(true);
  };

  const openEditPackage = (p: PackageType) => {
    setActiveTab("packages");
    setIsEditMode(true);
    setEditingId(p._id || null);

    const testIds = p.tests
      .map((t) => (typeof t === "string" ? t : t._id))
      .filter((id): id is string => id !== undefined);

    setPackageForm({
      packageName: p.packageName,
      description: p.description,
      totalPrice: p.totalPrice,
      tests: testIds,
    });

    setModalOpen(true);
  };

  const togglePackageTest = (testId: string) => {
    setPackageForm((s) => {
      const curr = (s.tests as string[]) || [];
      return {
        ...s,
        tests: curr.includes(testId)
          ? curr.filter((id) => id !== testId)
          : [...curr, testId],
      };
    });
  };

  const submitPackage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!labId) return toast.error("Lab ID missing");
    if (!packageForm.packageName || packageForm.totalPrice === undefined)
      return toast.error("Package name & price required");
    if (!packageForm.tests || packageForm.tests.length === 0)
      return toast.error("Select at least one test");

    try {
      const payload = {
        packageName: packageForm.packageName,
        description: packageForm.description || "",
        totalPrice: Number(packageForm.totalPrice),
        testIds: packageForm.tests,
        labId,
      };

      if (isEditMode && editingId) {
        await axios.put(API.updatePackage(editingId), payload);
        toast.success("Package updated");
      } else {
        await axios.post(API.addPackage(), payload);
        toast.success("Package created");
      }

      setModalOpen(false);
      loadAll();
    } catch (err) {
      console.error("Package submit error:", err);
      toast.error("Failed to save package");
    }
  };

  // const removePackage = async (packageId?: string) => {
  //   if (!packageId) return;
  //   const ok = confirm("Delete this package?");
  //   if (!ok) return;

  //   try {
  //     await axios.delete(API.deletePackage(packageId));
  //     setPackages((prev) => prev.filter((p) => p._id !== packageId));
  //     toast.success("Package deleted");
  //   } catch (err) {
  //     console.error("Delete package error:", err);
  //     toast.error("Failed to delete package");
  //   }
  // };

  /* -------------------- JSX (kept from original UI) -------------------- */
  return (
    <div className="space-y-6">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3400,
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0c213e] rounded-xl flex items-center justify-center">
                <TestTube className="w-5 h-5 text-white" />
              </div>
              Test & Package Management
            </h1>
            <p className="text-sm text-gray-500 mt-1 ml-[52px]">
              Manage your lab tests and create custom packages
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAddTest}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0c213e] hover:bg-[#1a3a5e] text-white rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Test</span>
            </button>
            <button
              onClick={openAddPackage}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-sm"
            >
              <Box className="w-4 h-4" />
              <span>Create Package</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tests</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {tests.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <TestTube className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Packages
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {packages.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-500">Categories</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {categories.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-500">Active View</p>
            <p className="text-lg font-bold text-gray-900 mt-1 capitalize">
              {activeTab}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${
                  activeTab === "tests" ? "tests" : "packages"
                }...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none transition-all"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {showFilters && activeTab === "tests" && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600">
                  Category:
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter("")}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("tests")}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === "tests"
              ? "bg-white shadow-sm border border-gray-100 text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Tests ({filteredTests.length})
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === "packages"
              ? "bg-white shadow-sm border border-gray-100 text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Packages ({filteredPackages.length})
        </button>
      </div>

      {/* Content Grid */}
      {activeTab === "tests" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-100">
              <p className="text-gray-500">Loading tests...</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TestTube className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No tests found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or add a new test
              </p>
            </div>
          ) : (
            filteredTests.map((t) => (
              <div
                key={t._id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <TestTube className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditTest(t)}
                      className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      // onClick={() => removeTest(t._id)}
                      onClick={() => openDeleteModal("test", t._id)}

                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">
                  {t.testName}
                </h3>
                <p className="text-2xl font-bold text-[#0c213e] mb-2">
                  ₹{t.price}
                </p>

                {t.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {t.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs font-medium text-gray-500">
                    Category
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                    {t.category || "Uncategorized"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-100">
              <p className="text-gray-500">Loading packages...</p>
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No packages found</p>
              <p className="text-sm text-gray-400 mt-1">
                Create your first package to get started
              </p>
            </div>
          ) : (
            filteredPackages.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditPackage(p)}
                      className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      // onClick={() => removePackage(p._id)}
                      onClick={() => openDeleteModal("package", p._id)}

                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">
                  {p.packageName}
                </h3>
                <p className="text-2xl font-bold text-amber-600 mb-2">
                  ₹{p.totalPrice}
                </p>

                {p.description && (
                  <p className="text-sm text-gray-600 mb-3">{p.description}</p>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Includes {p.tests.length} tests:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.tests.slice(0, 4).map((t: any, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs"
                      >
                        {getTestName(t)}
                      </span>
                    ))}
                    {p.tests.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                        +{p.tests.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-height-[90vh] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h4 className="text-xl font-bold text-gray-900">
                {activeTab === "tests"
                  ? isEditMode
                    ? "Edit Test"
                    : "Add New Test"
                  : isEditMode
                  ? "Edit Package"
                  : "Create New Package"}
              </h4>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {activeTab === "tests" ? (
                <form onSubmit={submitTest} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Test Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={testForm.testName || ""}
                      onChange={(e) =>
                        setTestForm({ ...testForm, testName: e.target.value })
                      }
                      placeholder="e.g., Complete Blood Count"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={
                          testForm.price === undefined ? "" : testForm.price
                        }
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            price: Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Category
                      </label>
                      <select
                        value={testForm.category || ""}
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            category: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {testForm.category === "Other" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Custom Category
                      </label>
                      <input
                        value={testForm.customCategory || ""}
                        onChange={(e) =>
                          setTestForm({
                            ...testForm,
                            customCategory: e.target.value,
                          })
                        }
                        placeholder="Enter custom category"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={testForm.description || ""}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description of the test"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Precautions
                    </label>
                    <input
                      value={testForm.precaution || ""}
                      onChange={(e) =>
                        setTestForm({
                          ...testForm,
                          precaution: e.target.value,
                        })
                      }
                      placeholder="e.g., Fasting required"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-[#0c213e] hover:bg-[#1a3a5e] text-white transition-colors font-medium"
                    >
                      {isEditMode ? "Update Test" : "Add Test"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitPackage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Package Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={packageForm.packageName || ""}
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          packageName: e.target.value,
                        })
                      }
                      placeholder="e.g., Health Checkup Premium"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={packageForm.description || ""}
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Short description of the package"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Total Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={
                        packageForm.totalPrice === undefined
                          ? ""
                          : packageForm.totalPrice
                      }
                      onChange={(e) =>
                        setPackageForm({
                          ...packageForm,
                          totalPrice: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-[#0c213e] focus:ring-2 focus:ring-[#0c213e]/20 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Select Tests <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto space-y-2">
                      {tests.map((t) => {
                        const checked = packageForm.tests?.includes(t._id!);
                        return (
                          <label
                            key={t._id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              checked
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePackageTest(t._id!)}
                              className="w-4 h-4 text-[#0c213e] border-gray-300 rounded focus:ring-[#0c213e]"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {t.testName}
                              </div>
                              <div className="text-xs text-gray-500">
                                ₹{t.price}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      {packageForm.tests?.length || 0} test(s) selected
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors font-medium"
                    >
                      {isEditMode ? "Update Package" : "Create Package"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {deleteModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Confirm Deletion
        </h3>
      </div>

      <p className="text-sm text-gray-600 mb-6">
        {deleteType === "test"
          ? "Are you sure? This test will also be removed from all packages."
          : "Are you sure you want to delete this package?"}
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => setDeleteModalOpen(false)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium"
          disabled={deleteLoading}
        >
          Cancel
        </button>

        <button
          onClick={confirmDelete}
          disabled={deleteLoading}
          className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
        >
          {deleteLoading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default LabManagementPro;
