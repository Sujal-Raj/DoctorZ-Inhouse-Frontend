

// // import api from "./mainApi";

// // export interface EmrResponse {
// //   _id: string;
// //   patientId?: string;
// //   doctorId?: string;
// //   emr?: { _id?: string };
// //   [key: string]: unknown;
// // }

// // export const createEMR = async (formData: FormData): Promise<EmrResponse> => {
// //   const res = await api.post<EmrResponse>("/api/emr/createEmr", formData, {
// //     headers: { "Content-Type": "multipart/form-data" },
// //   });
// //   return res.data;
// // };

// import api from "./mainApi";

// // ✅ Define exact shape of EMR returned from backend
// export interface EMR {
//   _id: string;
//   aadhar: string;
//   doctorId?: string;
//   allergies: string[];
//   diseases: string[];
//   pastSurgeries: string[];
//   currentMedications: string[];
//   reports: string[];
//   createdAt?: string;
//   updatedAt?: string;
// }

// // ✅ Full response from backend (controller sends { message, emr })
// export interface EMRResponse {
//   data(arg0: string, data: unknown): unknown;
//   message: string;
//   emr: EMR;
// }

// // ✅ API call to create EMR
// export const createEMR = async (formData: FormData): Promise<EMRResponse> => {
//   const res = await api.post<EMRResponse>("/api/emr/createEmr", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
//   return res.data;
// };

// import api from "./mainApi";

// export interface EMR {
//   _id: string;
//   aadhar: string;
//   doctorId?: string;
//   allergies: string[];
//   diseases: string[];
//   pastSurgeries: string[];
//   currentMedications: string[];
//   reports?: string[];
//   createdAt?: string;
//   updatedAt?: string;
// }

// export interface EMRResponse {
//   message: string;
//   emr: EMR;
// }

// // ✅ Create EMR API (now accepts JSON)
// export const createEMR = async (emrData: {
//   doctorId?: string;
//   patientId: string;
//   aadhar: number;
//   allergies: string[];
//   diseases: string[];
//   pastSurgeries: string[];
//   currentMedications: string[];
// }): Promise<EMRResponse> => {
//   try {
//     const res = await api.post<EMRResponse>("/api/emr/createEmr", emrData, {
//       headers: { "Content-Type": "application/json" },
//     });
//     return res.data;
//   } catch (error: unknown) {
//     console.error("❌ Error creating EMR:", error);
//     throw error;
//   }
// };



import api from "./mainApi";

export interface EMR {
  _id: string;
  aadhar: string;
  doctorId?: string;
  allergies: string[];
  diseases: string[];
  pastSurgeries: string[];
  currentMedications: string[];
  reports?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EMRResponse {
  message: string;
  emr: EMR;
}

// ✅ Create EMR API (ACCEPTS FORMDATA NOW)
export const createEMR = async (formData: FormData): Promise<EMRResponse> => {
  try {
    const res = await api.post<EMRResponse>("/api/emr/createEmr", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error: unknown) {
    console.error("❌ Error creating EMR:", error);
    throw error;
  }
};
