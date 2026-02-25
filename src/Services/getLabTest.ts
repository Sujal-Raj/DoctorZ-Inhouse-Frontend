// import type { Lab } from "./labApi";
import api from "./mainApi";

export interface LabTestResponse {
  success: boolean;
  labTests: never[];
}

export interface PackageBookingResponse {
  message: string;
  count: number;
  bookings: any[]; // Replace `any` with your actual PackageBooking type
}

export const getUserLabTests = async (userId: string) => {
  return await api.get<LabTestResponse>(`/api/patient/getUserLabTest/${userId}`);
};

export const getPatientPackageBookings = async (patientId: string) => {
  return await api.get<PackageBookingResponse>(
    `/api/lab/package-bookings/${patientId}`
  );
};
