import api from "./mainApi";

export interface Timings {
  open: string;
  close: string;
}

export interface Lab {
  name: string;
  email: string;
  password: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
  timings: Timings;
}

export interface LabLoginResponse {
  token: string;
  lab: {
    _id: string;
    labId: string;
    name: string;
    email: string;
  };
  message: string;
}


// ✅ Make sure this function is defined BEFORE you export it
export const registerLab = async (lab: Lab) => {
  try {
    const response = await api.post("/api/lab/register", lab, {
      headers: { "Content-Type": "application/json" },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// ✅ Login lab API
export const loginLab = async (labId: string, password: string) => {
  try {
    const response = await api.post<LabLoginResponse>(
      "/api/lab/login",
      { labId, password },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response;
  } catch (error) {
    throw error;
  }
};
