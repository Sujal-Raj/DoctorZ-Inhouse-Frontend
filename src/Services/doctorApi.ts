

import api from "./mainApi"; // your axios instance

export const registerDoctor = async (formData: FormData) => {
  try {
    const response = await api.post("/api/doctor/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Register Doctor Error:", error);
    throw error;
  }
};

interface LoginResponse {
  message: string;
  token: string;
  doctor: {
    _id: string;
    doctorId: string;
    fullName: string;
    email: string;
  };
}

export const loginDoctor = async (
  doctorId: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>("/api/doctor/login", {
      doctorId,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};


export const updateDoctor = async (drId: string, doctorId: string, password: string) => {
  try {
    const response = await api.put(`/api/doctor/update/${drId}`, {
      doctorId,
      password,
    });
    return response.data; 
  } catch (error) {
     console.error("Update Doctor Error:",error);
    throw error;
  }
};