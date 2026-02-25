// // clinicApi.ts
// import api from "./mainApi";

// export interface LoginResponse {
//   message: string;
//   clinic: {
//     id: string;
//     staffId: string;
//     staffName: string;
//     staffEmail: string;
//     clinicName: string;
//   };
//   jwtToken: string;
// }

// export interface RegisterClinicData {
//   clinicName: string;
//   clinicType: string;
//   specialities: string[];
//   address: string;
//   state: string;
//   district: string;
//   pincode: string;
//   contact: string;
//   email: string;
//   operatingHours: string;
//   licenseNo: string;
//   ownerAadhar: string;
//   ownerPan: string;
//   staffName: string;
//   staffEmail: string;
//   staffPassword: string;
//   staffId: string;
//   registrationCert?: File;
// }

// export const registerClinic = async (data: RegisterClinicData): Promise<any> => {
//   const formData = new FormData();
//   Object.entries(data).forEach(([key, value]) => {
//     if (key === "specialities") {
//       formData.append(key, JSON.stringify(value));
//     } else if (value) {
//       formData.append(key, value as string | Blob);
//     }
//   });

//   const response = await api.post("/api/clinic/register", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });

//   return response.data;
// };

// export const loginClinic = (staffId: string, staffPassword: string) => {
//   return api.post<LoginResponse>("/api/clinic/clinicLogin", { staffId, staffPassword });
// };


import api from "./mainApi";

// ✅ Define flexible login response
export interface LoginResponse {
  message?: string;
  clinic?: {
    id: string;
    staffId: string;
    staffName: string;
    staffEmail: string;
    clinicName: string;
  };
  jwtToken?: string;
  token?: string; // Some backends use 'token'
  data?: any; // Some use 'data' for clinic info
}

// ✅ Register Clinic
export interface RegisterClinicData {
  clinicName: string;
  clinicType: string;
  specialities: string[];
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
  staffId: string;
  registrationCert?: File;
}

// export const registerClinic = async (data: RegisterClinicData): Promise<any> => {
//   const formData = new FormData();
//   Object.entries(data).forEach(([key, value]) => {
//     if (key === "specialities") {
//       formData.append(key, JSON.stringify(value));
//     } else if (value) {
//       formData.append(key, value as string | Blob);
//     }
//   });

//   const response = await api.post("/api/clinic/register", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });

//   return response.data;
// };

export const registerClinic = async (data: any) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value)); // ✅ stringify ONLY arrays
    } else if (value !== undefined && value !== null) {
      formData.append(key, value as any);
    }
  });

  return await api.post("/api/clinic/register", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


// ✅ Login Clinic — safer version
export const loginClinic = async (staffId: string, staffPassword: string) => {
  try {
    const response = await api.post<LoginResponse>(
      "/api/clinic/clinicLogin",
      { staffId, staffPassword }
    );

    console.log("✅ Backend Login Response:", response.data); // Helps you debug

    return response;
  } catch (error: any) {
    console.error("❌ LoginClinic API Error:", error.response?.data || error);
    throw error;
  }
};
