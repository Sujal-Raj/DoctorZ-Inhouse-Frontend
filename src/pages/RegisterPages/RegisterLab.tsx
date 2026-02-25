import { useState, useEffect } from "react";
import { registerLab } from "../../Services/labApi";
import { toast, Toaster } from "react-hot-toast";

interface Timings {
  open: string;
  close: string;
}

interface Lab {
  name: string;
  email: string;
  password: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
  timings: Timings;
}

export default function RegisterLab() {
  const [pincodeError, setPincodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem("labFormStep");
    return savedStep ? parseInt(savedStep) : 1;
  });

  const [lab, setLab] = useState<Lab & { certificateNumber?: string }>({
    name: "",
    email: "",
    password: "",
    state: "",
    city: "",
    pincode: "",
    address: "",
    timings: { open: "", close: "" },
    certificateNumber: "",
  });

  const totalSteps = 3;

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("labFormData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setLab(parsedData);
    }
  }, []);

  // Save form data to localStorage
  const saveFormData = () => {
    localStorage.setItem("labFormData", JSON.stringify(lab));
  };

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem("labFormStep", currentStep.toString());
  }, [currentStep]);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
    
    if (name === "open" || name === "close") {
      setLab((prev) => ({
        ...prev,
        timings: { ...prev.timings, [name]: value },
      }));
    } else {
      setLab((prev) => ({ ...prev, [name]: value }));
    }
    saveFormData();
  };

  // Step validation
  const validateStep = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Step 1: Basic Info
    if (currentStep === 1) {
      if (!lab.name.trim()) newErrors.name = "Lab name is required";
      else if (lab.name.trim().length < 3) newErrors.name = "Lab name must be at least 3 characters";
      else if (!/^[A-Za-z0-9\s.,'-]+$/.test(lab.name)) newErrors.name = "Lab name contains invalid characters";

      if (!lab.email.trim()) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lab.email)) newErrors.email = "Enter a valid email address";

      if (!lab.password) newErrors.password = "Password is required";
      else if (lab.password.length < 8) newErrors.password = "Password must be at least 8 characters";
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/.test(lab.password))
        newErrors.password = "Password must include uppercase, lowercase, number and special character";

      if (!lab.certificateNumber?.trim()) newErrors.certificateNumber = "Certificate number is required";
      else if (lab.certificateNumber.trim().length < 5) newErrors.certificateNumber = "Certificate number must be at least 5 characters";
    }

    // Step 2: Location
    if (currentStep === 2) {
      if (!lab.state.trim()) newErrors.state = "State is required";
      if (!lab.city.trim()) newErrors.city = "City is required";
      else if (!/^[A-Za-z\s]+$/.test(lab.city)) newErrors.city = "City must contain only letters";
      if (!lab.address.trim()) newErrors.address = "Address is required";
      else if (lab.address.trim().length < 10) newErrors.address = "Address must be at least 10 characters";
      if (!lab.pincode) {
        newErrors.pincode = "Pincode is required";
        setPincodeError("Pincode is required");
      } else if (!/^[0-9]{6}$/.test(lab.pincode)) {
        newErrors.pincode = "Pincode must be exactly 6 digits";
        setPincodeError("Pincode must be exactly 6 digits");
      }
    }

    // Step 3: Timings
    if (currentStep === 3) {
      if (!lab.timings.open) newErrors.open = "Opening time is required";
      if (!lab.timings.close) newErrors.close = "Closing time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill all required fields correctly", { duration: 3500 });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleRegistration = async () => {
    if (!validateStep()) {
      toast.error("Please fill the required fields correctly", { duration: 3500 });
      return;
    }

    setLoading(true);
    setPincodeError("");

    const cleanedData = {
      ...lab,
      email: lab.email.trim().toLowerCase(),
    };

    try {
      const response = await registerLab(cleanedData);
      if (response.status === 201) {
        toast.success(
          "Registration Successful! Your lab details have been submitted for admin approval.",
          { duration: 3500 }
        );
        // Clear localStorage
        localStorage.removeItem("labFormData");
        localStorage.removeItem("labFormStep");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    } catch (error: any) {
      console.log(error);
      let errorMessage = "Error registering lab";

      if (error?.response?.data?.message) {
        const rawMessage = error.response.data.message;
        if (rawMessage.includes("E11000") && rawMessage.includes("email")) {
          errorMessage = "A lab with this email already exists.";
        } else if (rawMessage.includes("E11000") && rawMessage.includes("certificateNumber")) {
          errorMessage = "This certificate number is already registered.";
        } else {
          errorMessage = rawMessage;
        }
      }

      toast.error(errorMessage, { duration: 3500 });
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const renderStep1 = () => (
    <>
      <Input
        label="Lab Name"
        name="name"
        value={lab.name}
        onChange={handleOnChange}
        error={errors.name}
        required
      />
      <Input
        label="Email"
        type="email"
        name="email"
        value={lab.email}
        onChange={handleOnChange}
        error={errors.email}
        required
      />
      <Input
        label="Password"
        type="password"
        name="password"
        value={lab.password}
        onChange={handleOnChange}
        error={errors.password}
        required
      />
      <Input
        label="Certificate Number"
        name="certificateNumber"
        value={lab.certificateNumber || ""}
        onChange={handleOnChange}
        error={errors.certificateNumber}
        required
      />
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="flex flex-col space-y-1">
        <label htmlFor="state" className="text-sm font-medium text-gray-700">
          State
          <span className="text-red-500"> *</span>
        </label>
        <select
          id="state"
          name="state"
          value={lab.state}
          onChange={handleOnChange}
          className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0c213e] focus:border-transparent transition text-gray-800 bg-white"
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
        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
      </div>
      <Input
        label="City"
        name="city"
        value={lab.city}
        onChange={handleOnChange}
        error={errors.city}
        required
      />
      <Input
        label="Address"
        name="address"
        value={lab.address}
        onChange={handleOnChange}
        error={errors.address}
        required
      />
      <Input
        label="Pincode"
        name="pincode"
        value={lab.pincode}
        onChange={(e) => {
          setPincodeError("");
          setErrors((prev) => ({ ...prev, pincode: "" }));
          handleOnChange(e);
        }}
        placeholder="Enter 6-digit pincode"
        error={errors.pincode}
        required
      />
    </>
  );

  const renderStep3 = () => (
    <>
      <Input
        label="Opening Time"
        name="open"
        value={lab.timings.open}
        onChange={handleOnChange}
        placeholder="e.g. 9:00 AM"
        error={errors.open}
        required
      />
      <Input
        label="Closing Time"
        name="close"
        value={lab.timings.close}
        onChange={handleOnChange}
        placeholder="e.g. 7:00 PM"
        error={errors.close}
        required
      />
    </>
  );

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

      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 flex items-center justify-center px-6 ">
        <section className="w-full max-w-3xl bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-10 animate-fade-in">
          
          {/* Progress Bar */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-[#0c213e] mb-4 tracking-tight">
              🧪 Register Your Laboratory
            </h1>
            <p className="text-gray-600 mb-6">
              Join our trusted network of diagnostic centers. Fill in your lab details below.
            </p>
            <p className="text-center text-red-500 text-sm mb-6">
              ( <span className="text-red-500">*</span> Shows required field )
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
                className="bg-gradient-to-r from-[#0c213e] to-[#0c213e]/80 h-3 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            {/* Step Labels */}
            <div className="flex justify-between mt-3 text-xs text-gray-600">
              <span className={currentStep >= 1 ? "font-semibold text-[#0c213e]" : ""}>
                Basic Info
              </span>
              <span className={currentStep >= 2 ? "font-semibold text-[#0c213e]" : ""}>
                Location
              </span>
              <span className={currentStep >= 3 ? "font-semibold text-[#0c213e]" : ""}>
                Timings
              </span>
            </div>
          </div>

          {/* Step Headers */}
          {currentStep === 1 && (
            <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-6">
              Basic Information
            </h2>
          )}
          {currentStep === 2 && (
            <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-6">
              Location Details
            </h2>
          )}
          {currentStep === 3 && (
            <h2 className="md:col-span-2 text-lg font-semibold text-[#0c213e] border-b border-[#0c213e]/20 pb-2 mb-6">
              Operating Hours
            </h2>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRegistration();
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto px-2"
          >
            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

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
                  className={`ml-auto px-8 py-2.5 text-white text-lg font-semibold rounded-lg shadow-md transition-all duration-300 ${
                    loading
                      ? "bg-[#0c213e]/50 cursor-not-allowed"
                      : "bg-[#0c213e] hover:bg-[#1f2775] hover:scale-[1.02]"
                  }`}
                >
                  {loading ? "Submitting..." : "Register Lab"}
                </button>
              )}
            </div>
          </form>

          <p className="text-center text-gray-600 mt-8">
            Already registered?{" "}
            <a
              href="/lab-login"
              className="cursor-pointer text-blue-600 font-semibold hover:underline"
            >
              Login Here
            </a>
          </p>
        </section>
      </main>
    </>
  );
}

/* Reusable Input Component */
function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        // onBlur={saveFormData}
        placeholder={placeholder || label}
        className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0c213e] focus:border-transparent transition text-gray-800 bg-white"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
