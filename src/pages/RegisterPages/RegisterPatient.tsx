import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet";
import toast, { Toaster } from "react-hot-toast";
import { Upload, ChevronRight, ChevronLeft } from "lucide-react";

import "../../index.css";
import { registerPatient } from "../../Services/patientApi";

type PatientFormInputs = {
  fullName: string;
  gender: string;
  dob: string;
  email: string;
  password: string;
  mobileNumber: string;
  aadhar: string;
  city: string;
  pincode: string;
  abhaId: string;

  emergencyName: string;
  emergencyNumber: string;

  allergies: string;
  diseases: string;
  pastSurgeries: string;
  currentMedications: string;
  medicalReports?: FileList;
};

const RegisterPatient: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setValue,
    getValues,
  } = useForm<PatientFormInputs>();

  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem("registrationStep");
    return savedStep ? parseInt(savedStep) : 1;
  });
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(() => {
    return localStorage.getItem("photoPreview");
  });
  const [loading, setLoading] = useState(false);

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem("patientFormData");
    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      Object.keys(parsedData).forEach((key) => {
        setValue(key as keyof PatientFormInputs, parsedData[key]);
      });
    }
  }, [setValue]);

  // Save form data to localStorage
  const saveFormData = () => {
    const formData = getValues();
    localStorage.setItem("patientFormData", JSON.stringify(formData));
  };

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem("registrationStep", currentStep.toString());
  }, [currentStep]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedImage = e.target.files?.[0];
    setPhotoFile(selectedImage || null);
    if (selectedImage) {
      const previewUrl = URL.createObjectURL(selectedImage);
      setPhotoPreview(previewUrl);
      localStorage.setItem("photoPreview", previewUrl);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof PatientFormInputs)[] = [
      "fullName",
      "gender",
      "dob",
      "email",
      "password",
      "mobileNumber",
      "aadhar",
      "city",
      "pincode",
    ];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      saveFormData(); // Save before moving to next step
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    saveFormData(); // Save before going back
    setCurrentStep(1);
  };

  const onSubmit = async (data: PatientFormInputs) => {
    setLoading(true);
    try {
      const formData = new FormData();

      formData.append("fullName", data.fullName);
      formData.append("gender", data.gender);
      formData.append("dob", data.dob);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("mobileNumber", data.mobileNumber);
      formData.append("aadhar", data.aadhar);
      formData.append("city", data.city);
      formData.append("pincode", data.pincode);
      formData.append("abhaId", data.abhaId);

      formData.append("name", data.emergencyName);
      formData.append("number", data.emergencyNumber);

      formData.append(
        "allergies",
        JSON.stringify(data.allergies?.split(",").map((s) => s.trim()) || [])
      );
      formData.append(
        "diseases",
        JSON.stringify(data.diseases?.split(",").map((s) => s.trim()) || [])
      );
      formData.append(
        "pastSurgeries",
        JSON.stringify(data.pastSurgeries?.split(",").map((s) => s.trim()) || [])
      );
      formData.append(
        "currentMedications",
        JSON.stringify(
          data.currentMedications?.split(",").map((s) => s.trim()) || []
        )
      );

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      selectedFiles.forEach((file) => {
        formData.append("medicalReports", file);
      });

      await registerPatient(formData);

      // Clear localStorage after successful registration
      localStorage.removeItem("patientFormData");
      localStorage.removeItem("registrationStep");
      localStorage.removeItem("photoPreview");

      toast.success("Patient registered successfully!");
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;

        if (status === 409) {
          toast.error("Email already exists. Please use a different email.");
        } else {
          toast.error(message || "Registration failed");
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({
    id,
    label,
    type = "text",
    placeholder,
    registerField,
    require,
  }: any) => (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
        {label}
        {require === "true" ? <span className="text-red-500"> *</span> : ""}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        {...registerField}
        onBlur={saveFormData}
        required={Boolean(require)}
        className={`w-full rounded-lg border border-gray-300 bg-white p-2 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] focus:border-[#0c213e] transition-all ${
          id == "password"
            ? ` border-gray-300 rounded-md p-2 focus:border-red-500 focus:ring-2 focus:ring-red-500 transition duration-200`
            : " "
        }`}
      />
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Patient Registration</title>
      </Helmet>

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

      <main className="min-h-screen bg-white flex items-center justify-center p-3">
        <section className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-gray-300 p-4 md:p-5">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-extrabold text-[#0c213e]">
              🏥 Patient Registration
            </h1>
            <p className="mt-1 text-gray-600 text-sm">
              Fill the details below to register.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-5">
            <div className="flex items-center justify-center gap-3">
              {/* Step 1 */}
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white transition-all ${
                    currentStep >= 1 ? "bg-[#0c213e]" : "bg-gray-300"
                  }`}
                >
                  1
                </div>
                <span
                  className={`ml-1.5 font-semibold text-sm ${
                    currentStep >= 1 ? "text-[#0c213e]" : "text-gray-400"
                  }`}
                >
                  Required
                </span>
              </div>

              {/* Connector */}
              <div
                className={`h-1 w-16 transition-all ${
                  currentStep >= 2 ? "bg-[#0c213e]" : "bg-gray-300"
                }`}
              ></div>

              {/* Step 2 */}
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white transition-all ${
                    currentStep >= 2 ? "bg-[#0c213e]" : "bg-gray-300"
                  }`}
                >
                  2
                </div>
                <span
                  className={`ml-1.5 font-semibold text-sm ${
                    currentStep >= 2 ? "text-[#0c213e]" : "text-gray-400"
                  }`}
                >
                  Optional
                </span>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-800"
          >
            {/* STEP 1: REQUIRED FIELDS */}
            {currentStep === 1 && (
              <>
                <h2 className="md:col-span-2 text-base font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-1.5 mb-1">
                  Required Information{" "}
                  <span className="text-red-500 font-normal text-xs">
                    ( <span className="text-red-500">*</span> All fields are
                    required )
                  </span>
                </h2>

                <InputField
                  id="fullName"
                  label="Full Name"
                  placeholder="Ritika Sharma"
                  registerField={register("fullName", {
                    required: "Full name is required",
                  })}
                  require="true"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-0.5">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("gender", { required: "Gender is required" })}
                    onBlur={saveFormData}
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                  >
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-red-600 text-xs mt-0.5">
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
                  require="true"
                />

                <InputField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="example@gmail.com"
                  registerField={register("email", {
                    required: "Email is required",
                  })}
                  require="true"
                />

                <div className="relative">
                  <InputField
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    registerField={register("password", {
                      required: "Password is required",
                    })}
                    require="true"
                  />
                  <p className="text-red-600 text-xs mt-0.5">
                    Keep your password strong
                  </p>
                </div>

                <div>
                  <InputField
                    id="mobileNumber"
                    label="Mobile Number"
                    placeholder="9876543210"
                    require="true"
                    registerField={register("mobileNumber", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Mobile no must be exactly 10 digits",
                      },
                    })}
                  />
                  {errors.mobileNumber && (
                    <p className="text-red-600 text-xs mt-0.5">
                      {errors.mobileNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <InputField
                    id="aadhar"
                    label="Aadhar"
                    placeholder="123456789012"
                    require="true"
                    registerField={register("aadhar", {
                      required: "Aadhar number is required",
                      pattern: {
                        value: /^[0-9]{12}$/,
                        message: "Aadhar must be exactly 12 digits",
                      },
                    })}
                  />
                  {errors.aadhar && (
                    <p className="text-red-600 text-xs mt-0.5">
                      {errors.aadhar.message}
                    </p>
                  )}
                </div>

                <InputField
                  id="city"
                  label="City"
                  placeholder="Bhilai"
                  registerField={register("city", {
                    required: "City is required",
                  })}
                  require="true"
                />

                <div>
                  <InputField
                    id="pincode"
                    label="Pincode"
                    placeholder="490001"
                    require="true"
                    registerField={register("pincode", {
                      required: "Pincode is required",
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: "Pincode must be exactly 6 digits",
                      },
                    })}
                  />
                  {errors.pincode && (
                    <p className="text-red-600 text-xs mt-0.5">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>

                {/* NEXT BUTTON */}
                <div className="md:col-span-2 text-center mt-3">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center gap-2 px-6 py-2 text-white text-base font-semibold rounded-lg bg-[#0c213e] hover:bg-[#1f2775] shadow-md transition"
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: OPTIONAL FIELDS */}
            {currentStep === 2 && (
              <>
                <h2 className="md:col-span-2 text-base font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-1.5 mb-1">
                  Optional Information{" "}
                  <span className="text-gray-500 font-normal text-xs">
                    ( All fields are optional )
                  </span>
                </h2>

                <div>
                  <InputField
                    id="abhaId"
                    label="ABHA ID"
                    placeholder="ABHA123456"
                    registerField={register("abhaId")}
                  />
                  {errors.abhaId && (
                    <p className="text-red-600 text-xs mt-0.5">
                      {errors.abhaId.message}
                    </p>
                  )}
                </div>

                <div></div>

                {/* EMERGENCY */}
                <h2 className="md:col-span-2 text-base font-semibold text-[#0c213e] pt-2 border-b border-[#0c213e]/20 pb-1.5 mb-1">
                  Emergency Contact
                </h2>

                <InputField
                  id="emergencyName"
                  label="Emergency Name"
                  placeholder="Rahul Sharma"
                  registerField={register("emergencyName")}
                />

                <div>
                  <InputField
                    id="emergencyNumber"
                    label="Emergency Number"
                    placeholder="9876541230"
                    registerField={register("emergencyNumber", {
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Emergency number must be exactly 10 digits",
                      },
                    })}
                  />
                  {errors.emergencyNumber && (
                    <p className="text-red-600 text-xs mt-0.5">
                      {errors.emergencyNumber.message}
                    </p>
                  )}
                </div>

                {/* PROFILE PHOTO */}
                <h2 className="md:col-span-2 text-base font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-1.5 mb-1 pt-2">
                  Profile Photo
                </h2>

                <div className="md:col-span-2 flex items-center gap-4">
                  <label className="w-28 h-28 border-2 border-dashed border-[#0c213e]/40 rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#0c213e]/5 transition">
                    <Upload className="text-[#0c213e]" size={20} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>

                  {photoPreview && (
                    <img
                      src={photoPreview}
                      className="w-28 h-28 object-cover rounded-lg shadow-md border"
                    />
                  )}
                </div>

                {/* MEDICAL */}
                <h2 className="md:col-span-2 text-base font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-1.5 mb-1 pt-2">
                  Medical Records
                </h2>

                <InputField
                  id="allergies"
                  label="Allergies"
                  placeholder="Dust, Peanuts"
                  registerField={register("allergies")}
                />

                <InputField
                  id="diseases"
                  label="Diseases"
                  placeholder="Diabetes, Asthma"
                  registerField={register("diseases")}
                />

                <InputField
                  id="pastSurgeries"
                  label="Past Surgeries"
                  placeholder="Appendix Removal"
                  registerField={register("pastSurgeries")}
                />

                <InputField
                  id="currentMedications"
                  label="Current Medications"
                  placeholder="Vitamin D, Paracetamol"
                  registerField={register("currentMedications")}
                />

                {/* MEDICAL REPORTS */}
                <div className="md:col-span-2">
                  <label className="font-medium text-sm text-gray-700 mb-1 block">
                    Upload Medical Reports
                  </label>

                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/30 hover:bg-blue-50 transition cursor-pointer flex flex-col items-center text-center relative">
                    <Upload className="h-8 w-8 text-blue-600 mb-1" />

                    <p className="text-gray-600 font-medium text-sm">
                      Drag & Drop files here
                    </p>
                    <p className="text-gray-400 text-xs">or click to browse</p>

                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      {...register("medicalReports")}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles(files);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-700">
                      {selectedFiles.map((file, index) => (
                        <li key={index}>📄 {file.name}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* NAVIGATION BUTTONS */}
                <div className="md:col-span-2 flex justify-between items-center mt-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-[#0c213e] text-base font-semibold rounded-lg border-2 border-[#0c213e] hover:bg-[#0c213e]/5 shadow-md transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`cursor-pointer px-6 py-2 text-white text-base font-semibold rounded-lg 
                      bg-[#0c213e] hover:bg-[#1f2775] shadow-md transition 
                      ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Submitting..." : "Register Patient"}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </main>
    </>
  );
};

export default RegisterPatient;