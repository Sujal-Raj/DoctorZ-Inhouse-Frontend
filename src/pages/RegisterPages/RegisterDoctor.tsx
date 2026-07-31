import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Helmet } from "react-helmet";
import { useNavigate, useOutletContext } from "react-router-dom";

import { registerDoctor } from "../../Services/doctorApi";
import { FileText, Upload, ChevronRight, ChevronLeft } from "lucide-react";

// ✅ Toastify
import { toast } from "react-hot-toast";

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
  district: string;
  pincode: string;
  hprId?: string;
  availableOnline: boolean;
};

const specializationsList = [
  "General Medicine",
  "Pediatrics",
  "Dermatology",
  "Cardiology",
  "Orthopedics",
  "Gynecology/Obstetrics",
  "Ophthalmology",
  "ENT (Otolaryngology)",
  "Psychiatry",
  "Neurology",
  "General Surgery",
  "Dental / Dentistry"
];

const languagesList = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Urdu",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Odia",
  "Punjabi",
  "Assamese",
  "Maithili",
  "Santali",
  "Kashmiri",
  "Nepali",
  "Konkani",
  "Sindhi",
  "Dogri",
  "Manipuri",
  "Bodo",
  "Sanskrit"
];

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

  // Qualifications tag state
  const [qualInput, setQualInput] = useState("");
  const [qualificationTags, setQualificationTags] = useState<string[]>([]);

  // Specialization state
  const [selSpecialization, setSelSpecialization] = useState("");
  const [otherSpecializationText, setOtherSpecializationText] = useState("");
  const [showOtherSpecialization, setShowOtherSpecialization] = useState(false);

  // Languages tags state
  const [languageTags, setLanguageTags] = useState<string[]>([]);

  // Achievements section state
  const [achievements, setAchievements] = useState<{ title: string; file: File | null; preview: string | null }[]>([]);
  const [newAchievementTitle, setNewAchievementTitle] = useState("");
  const [newAchievementFile, setNewAchievementFile] = useState<File | null>(null);
  const [newAchievementPreview, setNewAchievementPreview] = useState<string | null>(null);

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

      // Initialize qualifications tags
      if (parsedData.qualification) {
        setQualificationTags(
          parsedData.qualification
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
      }

      // Initialize languages tags
      if (parsedData.languages) {
        setLanguageTags(
          parsedData.languages
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean)
        );
      }

      // Initialize specialization dropdown
      if (parsedData.specialization) {
        if (specializationsList.includes(parsedData.specialization)) {
          setSelSpecialization(parsedData.specialization);
          setShowOtherSpecialization(false);
        } else {
          setSelSpecialization("Others");
          setOtherSpecializationText(parsedData.specialization);
          setShowOtherSpecialization(true);
        }
      }
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
    "hprId",
  ];
  
  const step3Fields: (keyof DoctorFormInputs)[] = [
    "aadhar",
    "pan",
    "address",
    "city",
    "district",
    "pincode",
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
        formData.append(key, (value !== undefined && value !== null) ? (value as string) : "");
      }
    });
    if (clinicId) formData.append("clinicId", clinicId);
    if (degreeFile) formData.append("degreeCert", degreeFile);
    if (photoFile) formData.append("photo", photoFile);
    if (signatureFile) formData.append("signature", signatureFile);

    // Achievements integration
    const achievementTitles = achievements.map((a) => a.title);
    formData.append("achievementTitles", JSON.stringify(achievementTitles));
    achievements.forEach((ach) => {
      if (ach.file) {
        formData.append("achievementFiles", ach.file);
      }
    });

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
      setAchievements([]);
      setNewAchievementTitle("");
      setNewAchievementFile(null);
      setNewAchievementPreview(null);
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
        className={`w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] focus:border-[#0c213e] transition-all ${
          type === "date" ? "clickable-date-input" : ""
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  }

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <>
      <style>{`
        .clickable-date-input {
          position: relative;
        }
        .clickable-date-input::-webkit-calendar-picker-indicator {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>

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
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      e.target.value = val;
                      setValue("mobileNo", val, { shouldValidate: true });
                    }
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

                {/* Qualifications dynamic tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Qualifications <span className="text-red-500"> *</span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. MBBS, MD (Press Enter or Add)"
                      value={qualInput}
                      onChange={(e) => setQualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          const val = qualInput.trim().replace(/,/g, "");
                          if (val && !qualificationTags.includes(val)) {
                            const newTags = [...qualificationTags, val];
                            setQualificationTags(newTags);
                            setValue("qualification", newTags.join(", "), { shouldValidate: true });
                            saveFormData();
                          }
                          setQualInput("");
                        }
                      }}
                      className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = qualInput.trim();
                        if (val && !qualificationTags.includes(val)) {
                          const newTags = [...qualificationTags, val];
                          setQualificationTags(newTags);
                          setValue("qualification", newTags.join(", "), { shouldValidate: true });
                          saveFormData();
                        }
                        setQualInput("");
                      }}
                      className="bg-[#0c213e] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#1a3a5f] transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                    {qualificationTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-[#0c213e]/10 text-[#0c213e] px-2.5 py-1 rounded-full text-xs font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = qualificationTags.filter((_, i) => i !== idx);
                            setQualificationTags(newTags);
                            setValue("qualification", newTags.join(", "), { shouldValidate: true });
                            saveFormData();
                          }}
                          className="hover:text-red-500 font-bold ml-1 text-sm focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input type="hidden" {...register("qualification", { required: "Qualification is required" })} />
                  {errors.qualification && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.qualification.message}
                    </p>
                  )}
                </div>

                {/* Specialization dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Specialization <span className="text-red-500"> *</span>
                  </label>
                  <select
                    value={selSpecialization}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelSpecialization(val);
                      if (val === "Others") {
                        setShowOtherSpecialization(true);
                        setValue("specialization", otherSpecializationText, { shouldValidate: true });
                      } else {
                        setShowOtherSpecialization(false);
                        setValue("specialization", val, { shouldValidate: true });
                      }
                      saveFormData();
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                  >
                    <option value="">Select Specialization</option>
                    {specializationsList.map((spec, i) => (
                      <option key={i} value={spec}>
                        {spec}
                      </option>
                    ))}
                    <option value="Others">Others (Specify)</option>
                  </select>
                  {showOtherSpecialization && (
                    <input
                      type="text"
                      placeholder="Specify Specialization"
                      value={otherSpecializationText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOtherSpecializationText(val);
                        setValue("specialization", val, { shouldValidate: true });
                        saveFormData();
                      }}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                    />
                  )}
                  <input type="hidden" {...register("specialization", { required: "Specialization is required" })} />
                  {errors.specialization && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.specialization.message}
                    </p>
                  )}
                </div>

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

                {/* Languages Know dropdown with tags */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Languages Known <span className="text-red-500"> *</span>
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !languageTags.includes(val)) {
                        const newTags = [...languageTags, val];
                        setLanguageTags(newTags);
                        setValue("languages", newTags.join(", "), { shouldValidate: true });
                        saveFormData();
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                  >
                    <option value="">Select Language</option>
                    {languagesList.map((lang, i) => (
                      <option key={i} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-1.5 mt-2 min-h-[30px]">
                    {languageTags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-[#0c213e]/10 text-[#0c213e] px-2.5 py-1 rounded-full text-xs font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => {
                            const newTags = languageTags.filter((_, i) => i !== idx);
                            setLanguageTags(newTags);
                            setValue("languages", newTags.join(", "), { shouldValidate: true });
                            saveFormData();
                          }}
                          className="hover:text-red-500 font-bold ml-1 text-sm focus:outline-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input type="hidden" {...register("languages", { required: "Languages are required" })} />
                  {errors.languages && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.languages.message}
                    </p>
                  )}
                </div>

                {/* HPR ID Optional Field */}
                <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                  <label htmlFor="hprId" className="block text-sm font-semibold text-gray-700 mb-1">
                    HPR ID (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Healthcare Professionals Registry ID (e.g. 12-3456-7890-1234 or username@hpr)
                  </p>
                  <input
                    id="hprId"
                    type="text"
                    placeholder="12-3456-7890-1234"
                    {...register("hprId")}
                    onBlur={saveFormData}
                    className="w-full md:w-1/2 rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e] focus:border-[#0c213e] transition-all"
                  />
                  {errors.hprId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.hprId.message}
                    </p>
                  )}
                </div>

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
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                      e.target.value = val;
                      setValue("aadhar", val, { shouldValidate: true });
                    }
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
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value.toUpperCase().slice(0, 10);
                      e.target.value = val;
                      setValue("pan", val, { shouldValidate: true });
                    }
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

                <InputField
                  id="district"
                  label="District"
                  placeholder="Durg"
                  registerField={register("district", {
                    required: "District is required",
                  })}
                  error={errors.district?.message}
                  required
                />

                <InputField
                  id="pincode"
                  label="Pin Code"
                  placeholder="490006"
                  registerField={register("pincode", {
                    required: "Pin Code is required",
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "Pin Code must be exactly 6 digits",
                    },
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      e.target.value = val;
                      setValue("pincode", val, { shouldValidate: true });
                    }
                  })}
                  error={errors.pincode?.message}
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
                              fileInput.setPreview
                            )
                          }
                        />
                      </label>

                      {fileInput.file && (
                        <div className="border border-[#0c213e]/30 rounded-lg p-2 bg-gray-50 shadow-sm flex items-center justify-center w-28 h-28">
                          {fileInput.preview ? (
                            fileInput.file.type === "application/pdf" || fileInput.file.name.toLowerCase().endsWith(".pdf") ? (
                              <div className="flex flex-col items-center justify-center text-red-500 text-xs text-center w-full h-full">
                                <FileText size={32} className="text-red-500 mb-1" />
                                <span className="font-semibold text-gray-700 truncate max-w-full px-1 text-[10px]">{fileInput.file.name}</span>
                                <a href={fileInput.preview} target="_blank" rel="noreferrer" className="text-blue-600 underline mt-1 font-medium hover:text-blue-800 text-[10px]">
                                  View PDF
                                </a>
                              </div>
                            ) : (
                              <img
                                src={fileInput.preview}
                                alt="Preview"
                                className="object-cover w-full h-full rounded-md"
                              />
                            )
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

                {/* Achievements & Other Certificates Section */}
                <div className="md:col-span-2 mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-[#0c213e] mb-4">
                    🏆 Achievements & Additional Certificates (Optional)
                  </h3>
                  
                  {/* Form to add a new achievement */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Achievement Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Best Pediatrician Award 2025"
                          value={newAchievementTitle}
                          onChange={(e) => setNewAchievementTitle(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-gray-800 shadow-sm focus:ring-2 focus:ring-[#0c213e]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Upload Certificate (Image or PDF)
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center flex-1 h-11 border border-dashed border-[#0c213e]/40 rounded-lg cursor-pointer hover:bg-[#0c213e]/5 transition px-3 bg-white">
                            <Upload className="text-[#0c213e] mr-2" size={16} />
                            <span className="text-gray-600 text-xs truncate">
                              {newAchievementFile ? newAchievementFile.name : "Select File"}
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setNewAchievementFile(file);
                                  setNewAchievementPreview(URL.createObjectURL(file));
                                }
                              }}
                            />
                          </label>
                          
                          {newAchievementFile && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewAchievementFile(null);
                                setNewAchievementPreview(null);
                              }}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold px-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      disabled={!newAchievementTitle.trim()}
                      onClick={() => {
                        if (newAchievementTitle.trim()) {
                          setAchievements([
                            ...achievements,
                            {
                              title: newAchievementTitle.trim(),
                              file: newAchievementFile,
                              preview: newAchievementPreview,
                            },
                          ]);
                          setNewAchievementTitle("");
                          setNewAchievementFile(null);
                          setNewAchievementPreview(null);
                        }
                      }}
                      className="mt-3 px-4 py-2 bg-[#0c213e] text-white text-xs font-semibold rounded-lg hover:bg-[#1a3a5f] disabled:opacity-50 transition"
                    >
                      + Add Achievement
                    </button>
                  </div>
                  
                  {/* List of achievements added */}
                  {achievements.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Added Achievements ({achievements.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {achievements.map((ach, idx) => {
                          const isPDF = ach.file?.type === "application/pdf" || ach.file?.name.toLowerCase().endsWith(".pdf");
                          return (
                            <div key={idx} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                              <div className="flex items-center gap-3 truncate">
                                <div className="w-10 h-10 bg-[#0c213e]/5 rounded flex items-center justify-center text-[#0c213e] flex-shrink-0">
                                  {isPDF ? <FileText size={20} className="text-red-500" /> : <FileText size={20} />}
                                </div>
                                <div className="truncate">
                                  <p className="text-sm font-semibold text-gray-800 truncate">{ach.title}</p>
                                  {ach.file && (
                                    <p className="text-[10px] text-gray-500 truncate">{ach.file.name}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {ach.preview && (
                                  <a
                                    href={ach.preview}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
                                  >
                                    View
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAchievements(achievements.filter((_, i) => i !== idx));
                                  }}
                                  className="text-red-500 hover:text-red-700 text-xs font-bold px-2"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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