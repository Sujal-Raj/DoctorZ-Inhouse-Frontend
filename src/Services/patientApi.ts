// // src/api/patient.ts
// import api from "./mainApi";

// export interface PatientFormPayload {
//   fullName: string;
//   gender: string;
//   dob: string;
//   email: string;
//   password: string;
//   mobileNumber: string;
//   Aadhar: string;
//   abhaId: string;
//   address: {
//     city: string;
//     pincode: string;
//   };
//   emergencyContact: {
//     name: string;
//     number: string;
//   };
// }

// export interface RegisterPatientResponse {
//   message: string;
//   patientId?: string;
// }

// export const registerPatient = async (
//   formData: PatientFormPayload
// ): Promise<RegisterPatientResponse> => {
//   try {
//     const response = await api.post<RegisterPatientResponse>(
//       "/api/patient/register",
//       formData
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Register Patient Error:", error);
//     throw error;
//   }
// };

// export interface LoginResponse {
//   token: string;
//   user: {
//     _id: string; // ✅ Corrected from id to _id
//     email: string;
//   };
// }

// export interface PatientLoginPayload {
//   email: string;
//   password: string;
// }

// export const loginPatient = async (
//   credentials: PatientLoginPayload
// ): Promise<LoginResponse> => {
//   const res = await api.post<LoginResponse>("/api/patient/login", credentials);
//   return res.data;
// };



// src/api/patientApi.ts
import api from "./mainApi";

// ✅ Response types
export interface RegisterPatientResponse {
  message: string;
  patientId?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    _id: string;
    email: string;
    fullName?: string;
  };
}

// ✅ Patient Register (FormData)
export const registerPatient = async (
  formData: FormData
): Promise<RegisterPatientResponse> => {
  try {
    const res = await api.post<RegisterPatientResponse>(
      "/api/patient/register",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("RegisterPatient Error:", error);
    throw error;
  }
};

// ✅ Patient Login
export interface PatientLoginPayload {
  email: string;
  password: string;
}

export const loginPatient = async (
  credentials: PatientLoginPayload
): Promise<LoginResponse> => {
  try {
    const res = await api.post<LoginResponse>(
      "/api/patient/login",
      credentials
    );
    return res.data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};
