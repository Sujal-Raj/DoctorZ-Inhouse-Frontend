import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Upload, FileText } from "lucide-react";
import { registerClinic } from "../../Services/mainClinicApi";
import { toast, Toaster } from "react-hot-toast";

type ClinicFormInputs = {
  clinicName: string;
  clinicType: string;
  specialities: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  contact: string;
  email: string;
  operatingHours: string;
  licenseNo: string;
  ownerAadhar: string;
  ownerPan: string;
  staffName: string;
  staffEmail: string;
  staffPassword: string;
};

const RegisterClinic: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    trigger,
  } = useForm<ClinicFormInputs>();

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem("clinicFormStep");
    return savedStep ? parseInt(savedStep) : 1;
  });
  
  const totalSteps = 4;

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("clinicFormData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      Object.keys(parsedData).forEach((key) => {
        setValue(key as keyof ClinicFormInputs, parsedData[key]);
      });
    }

    const savedCert = localStorage.getItem("clinicCertFile");
    if (savedCert) {
      try {
        const parsedCert = JSON.parse(savedCert);
        setCertFile(parsedCert);
      } catch {
        // Ignore invalid cert data
      }
    }
  }, [setValue]);

  // Save form data to localStorage on blur
  const saveFormData = () => {
    const formData = getValues();
    localStorage.setItem("clinicFormData", JSON.stringify(formData));
  };

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem("clinicFormStep", currentStep.toString());
    setTimeout(() => {
      formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }, [currentStep]);

  // Define fields for each step (required fields only)
  const step1Fields: (keyof ClinicFormInputs)[] = [
    "clinicName", "clinicType"
  ];
  
  const step2Fields: (keyof ClinicFormInputs)[] = [
    "address", "state", "district", "pincode", "contact"
  ];
  
  const step3Fields: (keyof ClinicFormInputs)[] = [
    "email", "operatingHours", "licenseNo", "ownerAadhar", "ownerPan"
  ];
  
  const step4Fields: (keyof ClinicFormInputs)[] = [
    "staffName", "staffEmail", "staffPassword"
  ];

  const generateStaffID = (length = 8) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertFile(file);
      localStorage.setItem("clinicCertFile", JSON.stringify(file));
      if (file.type.startsWith("image/")) {
        setCertPreview(URL.createObjectURL(file));
      } else {
        setCertPreview(null);
      }
    }
  };

  const clearFormData = () => {
    localStorage.removeItem("clinicFormData");
    localStorage.removeItem("clinicFormStep");
    localStorage.removeItem("clinicCertFile");
    reset();
    setCertFile(null);
    setCertPreview(null);
    setCurrentStep(1);
  };

  const onSubmit = async (data: ClinicFormInputs) => {
    setLoading(true);
    const staffId = generateStaffID();

    const specialitiesArray = data.specialities
      ? data.specialities
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : [];

    try {
      await registerClinic({
        ...data,
        specialities: specialitiesArray,
        staffId,
        registrationCert: certFile || undefined,
      });

      toast.success("Clinic submitted for verification!");
      clearFormData();
    } catch (err: any) {
      console.error("❌ Error submitting form:", err);
      toast.error(
        err?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof ClinicFormInputs)[] = [];
    
    if (currentStep === 1) fieldsToValidate = step1Fields;
    else if (currentStep === 2) fieldsToValidate = step2Fields;
    else if (currentStep === 3) fieldsToValidate = step3Fields;

    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      saveFormData();
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const handlePrevious = () => {
    saveFormData();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const InputField = ({
    id,
    label,
    type = "text",
    placeholder,
    registerField,
    error,
    require,
  }: {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    registerField: any;
    error?: string;
    require?: any;
  }) => (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 mb-1"
      >
        {label}
        {require === "true" ? <span className="text-red-500"> *</span> : ""}
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

  const renderStep1 = () => (
    <>
      <InputField
        id="clinicName"
        label="Clinic Name"
        placeholder="ABC Health Clinic"
        registerField={register("clinicName", {
          required: "Clinic name is required",
          minLength: {
            value: 3,
            message: "Clinic name must be at least 3 characters",
          },
          pattern: {
            value: /^[A-Za-z0-9\s.,'-]+$/,
            message: "Clinic name contains invalid characters",
          },
        })}
        error={errors.clinicName?.message}
        require={"true"}
      />

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Clinic Type
          <span className="text-red-500"> *</span>
        </label>
        <select
          {...register("clinicType", {
            required: "Clinic type is required",
          })}
          onBlur={saveFormData}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] transition-all"
        >
          <option value="">Select Clinic Type</option>
          <option value="Private">Private</option>
          <option value="Government">Government</option>
        </select>
        {errors.clinicType && (
          <p className="text-red-500 text-xs mt-1">
            {errors.clinicType.message}
          </p>
        )}
      </div>

      <InputField
        id="specialities"
        label="Specialities"
        placeholder="Cardiology, Pediatrics"
        registerField={register("specialities")}
        require={"true"}
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <InputField
        id="address"
        label="Address"
        placeholder="123 Street, City"
        registerField={register("address", {
          required: "Address is required",
          minLength: {
            value: 10,
            message: "Address must be at least 10 characters",
          },
        })}
        error={errors.address?.message}
        require={"true"}
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
          <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
        )}
      </div>

      <InputField
        id="district"
        label="District"
        placeholder="Mumbai"
        registerField={register("district", {
          required: "District is required",
          pattern: {
            value: /^[A-Za-z\s]+$/,
            message: "District must contain only letters",
          },
        })}
        error={errors.district?.message}
        require={"true"}
      />

      <InputField
        id="pincode"
        label="Pincode"
        placeholder="400001"
        type="number"
        registerField={register("pincode", {
          required: "Pincode is required",
          pattern: {
            value: /^[0-9]{6}$/,
            message: "Pincode must be exactly 6 digits",
          },
        })}
        error={errors.pincode?.message}
        require={"true"}
      />

      <InputField
        id="contact"
        label="Contact Number"
        placeholder="9876543210"
        registerField={register("contact", {
          required: "Contact number is required",
          pattern: {
            value: /^[0-9]{10}$/,
            message: "Contact number must be exactly 10 digits",
          },
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = e.target.value
              .replace(/\D/g, "")
              .slice(0, 10);
          },
        })}
        error={errors.contact?.message}
        require={"true"}
      />
    </>
  );

  const renderStep3 = () => (
    <>
      <InputField
        id="email"
        label="Email"
        type="email"
        placeholder="clinic@example.com"
        registerField={register("email", {
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Enter a valid email address",
          },
        })}
        error={errors.email?.message}
        require={"true"}
      />

      <InputField
        id="operatingHours"
        label="Operating Hours"
        placeholder="9 AM - 6 PM"
        registerField={register("operatingHours", {
          required: "Operating hours are required",
        })}
        error={errors.operatingHours?.message}
        require={"true"}
      />

      <InputField
        id="licenseNo"
        label="License No"
        placeholder="CLN12345"
        registerField={register("licenseNo", {
          required: "License number is required",
          minLength: {
            value: 5,
            message: "License number must be at least 5 characters",
          },
        })}
        error={errors.licenseNo?.message}
        require={"true"}
      />

      <InputField
        id="ownerAadhar"
        label="Owner Aadhar"
        placeholder="123456789012"
        type="text"
        registerField={register("ownerAadhar", {
          required: "Aadhar number is required",
          pattern: {
            value: /^[0-9]{12}$/,
            message: "Aadhar must be exactly 12 digits",
          },
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = e.target.value
              .replace(/\D/g, "")
              .slice(0, 12);
          },
        })}
        error={errors.ownerAadhar?.message}
        require={"true"}
      />

      <InputField
        id="ownerPan"
        label="Owner PAN"
        placeholder="ABCDE1234F"
        registerField={register("ownerPan", {
          required: "PAN number is required",
          pattern: {
            value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
            message: "Enter valid PAN (ABCDE1234F)",
          },
        })}
        error={errors.ownerPan?.message}
        require={"true"}
      />
    </>
  );

  const renderStep4 = () => (
    <>
      <InputField
        id="staffName"
        label="Staff Name"
        placeholder="John Doe"
        registerField={register("staffName", {
          required: "Staff name is required",
          pattern: {
            value: /^[A-Za-z\s]+$/,
            message: "Staff name must contain only letters",
          },
        })}
        error={errors.staffName?.message}
        require={"true"}
      />

      <InputField
        id="staffEmail"
        label="Staff Email"
        type="email"
        placeholder="staff@clinic.com"
        registerField={register("staffEmail", {
          required: "Staff email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Enter a valid email address",
          },
        })}
        error={errors.staffEmail?.message}
        require={"true"}
      />

      <div className="relative">
        <label
          htmlFor="staffPassword"
          className="block text-sm font-semibold text-gray-700 mb-1"
        >
          Staff Password
        </label>
        <input
          id="staffPassword"
          type={showPassword ? "text" : "password"}
          placeholder="********"
          {...register("staffPassword", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/,
              message:
                "Password must include uppercase, lowercase, number and special character",
            },
          })}
          onBlur={saveFormData}
          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 pr-10 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] transition-all"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-500 hover:text-[#0c213e] mt-1"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        {errors.staffPassword && (
          <p className="text-red-500 text-xs mt-1">
            {errors.staffPassword.message}
          </p>
        )}
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Registration Certificate
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label className="flex items-center justify-center w-full sm:w-1/2 h-28 border-2 border-dashed border-[#0c213e]/40 rounded-lg cursor-pointer hover:bg-[#0c213e]/5 transition">
            <Upload className="text-[#0c213e] mr-2" size={20} />
            <span className="text-gray-600 text-sm">
              {certFile ? "Change File" : "Upload Certificate"}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {certFile && (
            <div className="border border-[#0c213e]/30 rounded-lg p-2 bg-gray-50 shadow-sm flex items-center justify-center w-28 h-28">
              {certPreview ? (
                <img
                  src={certPreview}
                  alt="Preview"
                  className="object-cover w-full h-full rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-600 text-xs text-center">
                  <FileText size={20} />
                  <p className="mt-1 truncate">{certFile.name}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

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
        <title>Clinic Registration | Health Connect Portal</title>
        <meta
          name="description"
          content="Register your clinic with Health Connect Portal to manage patients, appointments, and staff efficiently."
        />
      </Helmet>

      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <section className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-300 p-6 md:p-8 my-10 md:my-10">
          
          {/* Progress Bar */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-[#0c213e] mb-4">
              🏥 Register Your Clinic
            </h1>
            <p className="text-gray-600 text-sm md:text-base mb-6">
              Submit your details for verification and onboarding.
            </p>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm font-semibold text-[#0c213e]">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
              // bg-gradient-to-r from-[#0c213e] to-[#0c213e]/80
                className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Step Labels */}
            <div className="flex justify-between mt-3 text-xs text-gray-600">
              <span className={currentStep >= 1 ? "font-semibold text-[#0c213e]" : ""}>
                Clinic Info
              </span>
              <span className={currentStep >= 2 ? "font-semibold text-[#0c213e]" : ""}>
                Location
              </span>
              <span className={currentStep >= 3 ? "font-semibold text-[#0c213e]" : ""}>
                Owner
              </span>
              <span className={currentStep >= 4 ? "font-semibold text-[#0c213e]" : ""}>
                Staff & Cert
              </span>
            </div>
          </div>

          <form
            ref={formRef}
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 max-h-[60vh] overflow-y-auto"
            encType="multipart/form-data"
          >
            {/* Step Headers */}
            {currentStep === 1 && (
              <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-4">
                Clinic Information
                <span className="text-red-500 font-normal text-sm block mt-1">
                  ( <span className="text-red-500">*</span> Shows required field )
                </span>
              </h2>
            )}
            {currentStep === 2 && (
              <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-4">
                Location Details
              </h2>
            )}
            {currentStep === 3 && (
              <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-4">
                Owner Details
              </h2>
            )}
            {currentStep === 4 && (
              <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-4">
                Staff & Certificate
              </h2>
            )}

            {/* Step Content - Grid works perfectly now */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div className="md:col-span-2 flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Previous
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto flex items-center gap-2 px-8 py-2.5 bg-[#0c213e] text-white text-base font-semibold rounded-lg shadow-md hover:bg-[#0c213e]/90 transition-all"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className={`ml-auto px-8 py-2.5 text-white text-base font-semibold rounded-lg shadow-md transition-all duration-300 ${
                    loading
                      ? "bg-[#0c213e]/50 cursor-not-allowed"
                      : "bg-[#0c213e] hover:bg-[#0c213e]/90 hover:scale-[1.02]"
                  }`}
                >
                  {loading ? "Submitting..." : "Register Clinic"}
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default RegisterClinic;
