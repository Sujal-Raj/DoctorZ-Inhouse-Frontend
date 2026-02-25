import axios from "axios";

const BASE_URL = "http://localhost:3000/api/booking";

export const bookAppointment = (data: unknown) => {
  return axios.post(`${BASE_URL}/book`, data);
};
