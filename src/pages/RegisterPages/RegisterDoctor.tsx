import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet";
import { useNavigate, useOutletContext } from "react-router-dom";

import { registerDoctor } from "../../Services/doctorApi";
import { FileText, Upload, ChevronRight, ChevronLeft } from "lucide-react";

// ✅ Toastify
import { toast, Toaster } from "react-hot-toast";

type DoctorFormInputs = {
  fullName: string;
  email: string;
  gender: string;
  dob: string;
  regNumber: string;
  mobileNo: string;
  qualification: string;
  experience: string;
  fees: string;
  languages: string;
  aadhar: string;
  pan: string;
  specialization: string;
  password: string;
  address: string;
  state: string;
  city: string;
  availableOnline: boolean;
};

interface ClinicContext {
  clinicId?: string;
}

const RegisterDoctor: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
    setValue,
    getValues,
  } = useForm<DoctorFormInputs>();

  const context = useOutletContext<ClinicContext | null>();
  const clinicId = context?.clinicId || null;

  const [degreeFile, setDegreeFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const [degreePreview, setDegreePreview] = useState<string | null>(() => {
    return localStorage.getItem("doctorDegreePreview");
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(() => {
    return localStorage.getItem("doctorPhotoPreview");
  });
  const [sigPreview, setSigPreview] = useState<string | null>(() => {
    return localStorage.getItem("doctorSigPreview");
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem("doctorRegistrationStep");
    return savedStep ? parseInt(savedStep) : 1;
  });
  const totalSteps = 4;
  
  const navigate = useNavigate();

  // Load form data from localStorage on mount
  React.useEffect(() => {
    const savedFormData = localStorage.getItem("doctorFormData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      Object.keys(parsedData).forEach((key) => {
        setValue(key as keyof DoctorFormInputs, parsedData[key]);
      });
    }
  }, [setValue]);

  // Save form data to localStorage
  const saveFormData = () => {
    const formData = getValues();
    localStorage.setItem("doctorFormData", JSON.stringify(formData));
  };

  // Save current step to localStorage
  React.useEffect(() => {
    localStorage.setItem("doctorRegistrationStep", currentStep.toString());
  }, [currentStep]);

  // Define fields for each step
  const step1Fields: (keyof DoctorFormInputs)[] = [
    "fullName",
    "gender",
    "dob",
    "email",
    "mobileNo",
    "regNumber",
  ];
  
  const step2Fields: (keyof DoctorFormInputs)[] = [
    "qualification",
    "specialization",
    "experience",
    "fees",
    "languages",
  ];
  
  const step3Fields: (keyof DoctorFormInputs)[] = [
    "aadhar",
    "pan",
    "address",
    "city",
    "state",
    "password",
  ];

  const handleNext = async () => {
    let fieldsToValidate: (keyof DoctorFormInputs)[] = [];
    
    if (currentStep === 1) fieldsToValidate = step1Fields;
    else if (currentStep === 2) fieldsToValidate = step2Fields;
    else if (currentStep === 3) fieldsToValidate = step3Fields;

    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      saveFormData(); // Save before moving to next step
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill in all required fields correctly", {
        duration: 2500,
      });
    }
  };

  const handlePrevious = () => {
    saveFormData(); // Save before going back
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: DoctorFormInputs) => {
    // Validate file uploads on last step
    if (!degreeFile || !photoFile || !signatureFile) {
      toast.error("Please upload all required documents", {
        duration: 2500,
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "availableOnline") {
        formData.append(key, String(value));
      } else {
        formData.append(key, value as string);
      }
    });
    if (clinicId) formData.append("clinicId", clinicId);
    if (degreeFile) formData.append("degreeCert", degreeFile);
    if (photoFile) formData.append("photo", photoFile);
    if (signatureFile) formData.append("signature", signatureFile);

    try {
      await registerDoctor(formData);

      // Clear localStorage after successful registration
      localStorage.removeItem("doctorFormData");
      localStorage.removeItem("doctorRegistrationStep");
      localStorage.removeItem("doctorDegreePreview");
      localStorage.removeItem("doctorPhotoPreview");
      localStorage.removeItem("doctorSigPreview");

      toast.success("Your details have been submitted for verification!", {
        duration: 3500,
      });

      reset();
      setDegreeFile(null);
      setPhotoFile(null);
      setSignatureFile(null);
      setDegreePreview(null);
      setPhotoPreview(null);
      setSigPreview(null);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Registration failed. Try again!",
        { duration: 3500 }
      );
    } finally {
      setLoading(false);
      navigate("/doctor-login");
    }
  };

  const InputField = ({
    id,
    label,
    type = "text",
    placeholder,
    registerField,
    error,
    required,
  }: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    registerField: any;
    error?: string;
    required?: boolean;
  }) => (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...registerField}
        onBlur={saveFormData}
        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] focus:border-[#0c213e] transition-all"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    storageKey: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    localStorage.setItem(storageKey, previewUrl);
  }

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <>
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

      <Helmet>
        <title>Doctor Registration | Clinic Portal</title>
        <meta
          name="description"
          content="Register qualified doctors with verified credentials and complete profile details for your clinic."
        />
      </Helmet>

      <main className="min-h-screen bg-white flex items-center justify-center p-4 overflow-y-auto">
        <section className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-gray-300 p-6 md:p-8 my-10 md:my-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-[#0c213e]">
              🩺 Doctor Registration
            </h1>
            <p className="mt-2 text-gray-600 text-sm md:text-base">
              Fill in the details below to register a doctor under your clinic.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-semibold text-[#0c213e]">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            {/* bg-[#0c213e] */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            {/* Step Labels */}
            <div className="flex justify-between mt-3 text-xs text-gray-600">
              <span className={currentStep >= 1 ? "font-semibold text-[#0c213e]" : ""}>
                Basic Info
              </span>
              <span className={currentStep >= 2 ? "font-semibold text-[#0c213e]" : ""}>
                Professional
              </span>
              <span className={currentStep >= 3 ? "font-semibold text-[#0c213e]" : ""}>
                Personal
              </span>
              <span className={currentStep >= 4 ? "font-semibold text-[#0c213e]" : ""}>
                Documents
              </span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="text-gray-800"
            encType="multipart/form-data"
          >
            {/* Step 1: Doctor Basic Information */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2">
                  Doctor Information{" "}
                  <span className="text-red-500 font-normal text-sm">
                    ( <span className="text-red-500">*</span> Shows required field )
                  </span>
                </h2>

                {/* Full Name with Dr. prefix */}
                <div>
                  <label
                    className="block text-sm font-semibold text-gray-700 mb-1"
                    htmlFor="fullName"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">Dr.</span>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      {...register("fullName", {
                        required: "Full name is required",
                      })}
                      onBlur={saveFormData}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] focus:border-[#0c213e] transition-all"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("gender", { required: "Gender is required" })}
                    onBlur={saveFormData}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <InputField
                  id="dob"
                  label="Date of Birth"
                  type="date"
                  registerField={register("dob", {
                    required: "Date of birth is required",
                  })}
                  error={errors.dob?.message}
                  required
                />
                <InputField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="doctor@example.com"
                  registerField={register("email", {
                    required: "Email is required",
                  })}
                  error={errors.email?.message}
                  required
                />

                <InputField
                  id="mobileNo"
                  label="Mobile Number"
                  placeholder="9876543210"
                  registerField={register("mobileNo", {
                    required: "Mobile number is required",
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Mobile number must be 10 digits",
                    },
                  })}
                  error={errors.mobileNo?.message}
                  required
                />

                <InputField
                  id="regNumber"
                  label="Medical Registration Number"
                  placeholder="MED123456"
                  registerField={register("regNumber", {
                    required: "Registration number is required",
                  })}
                  error={errors.regNumber?.message}
                  required
                />
              </div>
            )}

            {/* Step 2: Professional Details */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2">
                  Professional Details
                </h2>

                <InputField
                  id="qualification"
                  label="Qualification"
                  placeholder="MBBS, MD"
                  registerField={register("qualification", {
                    required: "Qualification is required",
                  })}
                  error={errors.qualification?.message}
                  required
                />
                <InputField
                  id="specialization"
                  label="Specialization"
                  placeholder="Dermatology"
                  registerField={register("specialization", {
                    required: "Specialization is required",
                  })}
                  error={errors.specialization?.message}
                  required
                />
                <InputField
                  id="experience"
                  label="Experience (Years)"
                  placeholder="5"
                  type="number"
                  registerField={register("experience", {
                    required: "Experience is required",
                  })}
                  error={errors.experience?.message}
                  required
                />
                <InputField
                  id="fees"
                  label="Consultation Fees"
                  placeholder="500"
                  type="number"
                  registerField={register("fees", {
                    required: "Consultation fees is required",
                  })}
                  error={errors.fees?.message}
                  required
                />
                <InputField
                  id="languages"
                  label="Languages Known"
                  placeholder="English, Hindi"
                  registerField={register("languages", {
                    required: "Languages is required",
                  })}
                  error={errors.languages?.message}
                  required
                />

                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    id="availableOnline"
                    {...register("availableOnline")}
                    onChange={saveFormData}
                    className="w-4 h-4 text-[#0c213e] border-gray-300 rounded focus:ring-[#0c213e]"
                  />
                  <label
                    htmlFor="availableOnline"
                    className="text-sm font-medium text-gray-700"
                  >
                    Available for Online Consultation
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Personal Details */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2">
                  Personal Details
                </h2>

                <InputField
                  id="aadhar"
                  label="Aadhar Number"
                  placeholder="123456789012"
                  type="text"
                  registerField={register("aadhar", {
                    required: "Aadhar number is required",
                    pattern: {
                      value: /^[0-9]{12}$/,
                      message: "Aadhar must be exactly 12 digits",
                    },
                  })}
                  error={errors.aadhar?.message}
                  required
                />

                <InputField
                  id="pan"
                  label="PAN Number"
                  placeholder="ABCDE1234F"
                  registerField={register("pan", {
                    required: "PAN number is required",
                    pattern: {
                      value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                      message: "Enter valid PAN (ABCDE1234F)",
                    },
                  })}
                  error={errors.pan?.message}
                  required
                />

                <InputField
                  id="address"
                  label="Address"
                  placeholder="123 Main Street"
                  registerField={register("address", {
                    required: "Address is required",
                  })}
                  error={errors.address?.message}
                  required
                />
                <InputField
                  id="city"
                  label="City"
                  placeholder="Bhilai"
                  registerField={register("city", {
                    required: "City is required",
                  })}
                  error={errors.city?.message}
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("state", { required: "State is required" })}
                    onBlur={saveFormData}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                  >
                    <option value="">Select State</option>
                    <option>Andhra Pradesh</option>
                    <option>Arunachal Pradesh</option>
                    <option>Assam</option>
                    <option>Bihar</option>
                    <option>Chhattisgarh</option>
                    <option>Goa</option>
                    <option>Gujarat</option>
                    <option>Haryana</option>
                    <option>Himachal Pradesh</option>
                    <option>Jharkhand</option>
                    <option>Karnataka</option>
                    <option>Kerala</option>
                    <option>Madhya Pradesh</option>
                    <option>Maharashtra</option>
                    <option>Manipur</option>
                    <option>Meghalaya</option>
                    <option>Mizoram</option>
                    <option>Nagaland</option>
                    <option>Odisha</option>
                    <option>Punjab</option>
                    <option>Rajasthan</option>
                    <option>Sikkim</option>
                    <option>Tamil Nadu</option>
                    <option>Telangana</option>
                    <option>Tripura</option>
                    <option>Uttar Pradesh</option>
                    <option>Uttarakhand</option>
                    <option>West Bengal</option>
                    <option>Andaman and Nicobar Islands</option>
                    <option>Chandigarh</option>
                    <option>Dadra and Nagar Haveli and Daman and Diu</option>
                    <option>Delhi</option>
                    <option>Jammu and Kashmir</option>
                    <option>Ladakh</option>
                    <option>Lakshadweep</option>
                    <option>Puducherry</option>
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                <InputField
                  id="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  registerField={register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  error={errors.password?.message}
                  required
                />
              </div>
            )}

            {/* Step 4: Upload Documents */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2">
                  Upload Documents
                </h2>

                {[
                  {
                    label: "Degree Certificate",
                    file: degreeFile,
                    setFile: setDegreeFile,
                    preview: degreePreview,
                    setPreview: setDegreePreview,
                    accept: "image/*,application/pdf",
                    storageKey: "doctorDegreePreview",
                  },
                  {
                    label: "Recent Photo",
                    file: photoFile,
                    setFile: setPhotoFile,
                    preview: photoPreview,
                    setPreview: setPhotoPreview,
                    accept: "image/*",
                    storageKey: "doctorPhotoPreview",
                  },
                  {
                    label: "Signature",
                    file: signatureFile,
                    setFile: setSignatureFile,
                    preview: sigPreview,
                    setPreview: setSigPreview,
                    accept: "image/*",
                    storageKey: "doctorSigPreview",
                  },
                ].map((fileInput, idx) => (
                  <div key={idx} className="md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {fileInput.label} <span className="text-red-500">*</span>
                    </label>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center w-full h-28 border-2 border-dashed border-[#0c213e]/40 rounded-lg cursor-pointer hover:bg-[#0c213e]/5 transition">
                        <Upload className="text-[#0c213e] mr-2" size={20} />
                        <span className="text-gray-600 text-sm">
                          {fileInput.file ? "Change File" : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept={fileInput.accept}
                          className="hidden"
                          onChange={(e) =>
                            handleFileChange(
                              e,
                              fileInput.setFile,
                              fileInput.setPreview,
                              fileInput.storageKey
                            )
                          }
                        />
                      </label>

                      {fileInput.file && (
                        <div className="border border-[#0c213e]/30 rounded-lg p-2 bg-gray-50 shadow-sm flex items-center justify-center w-28 h-28">
                          {fileInput.preview ? (
                            <img
                              src={fileInput.preview}
                              alt="Preview"
                              className="object-cover w-full h-full rounded-md"
                            />
                          ) : (
                            <div className="flex flex-col items-center text-gray-600 text-xs text-center">
                              <FileText size={20} />
                              <p className="mt-1 truncate max-w-full">
                                {fileInput.file.name}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                  currentStep === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0c213e] text-white rounded-lg font-semibold hover:bg-[#1f2775] hover:scale-[1.02] transition-all duration-300"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-2.5 text-white text-base font-semibold rounded-lg shadow-md transition-all duration-300 ${
                    loading
                      ? "bg-[#3a49c9] cursor-not-allowed"
                      : "bg-[#0c213e] hover:bg-[#1f2775] hover:scale-[1.02]"
                  }`}
                >
                  {loading ? "Submitting..." : "Register Doctor"}
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default RegisterDoctor;