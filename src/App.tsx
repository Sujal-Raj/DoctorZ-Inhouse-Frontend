import './App.css'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";

import Navbar from './components/Navbar'
import RegisterPatient from './pages/RegisterPages/RegisterPatient'
import RegisterDoctor from './pages/RegisterPages/RegisterDoctor'
import RegisterClinic from './pages/RegisterPages/RegisterClinic'
import Layout from './Layout';
import DoctorLogin from './pages/LoginPages/DoctorLogin';
import LoginClinic from './pages/LoginPages/LoginClinic';
import LoginPatient from './pages/LoginPages/LoginPatient';
import LoginLab from './pages/LoginPages/LoginLab';
import DoctorDashboard from './pages/DoctorPages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorPages/DoctorAppointments';
import DoctorDashboardHome from './pages/DoctorPages/DoctorHomeDashboard';
import PrescriptionForm from './pages/DoctorPages/PrescriptionForm';
import DoctorProfile from './pages/DoctorPages/DoctorProfile';
import DoctorNotifications from './pages/DoctorPages/DoctorNotifications';
import AddMedicine from './pages/DoctorPages/AddMedicine';
import AllPatient from './pages/DoctorPages/AllPatient';
import TimeSlots from './pages/TimeSlots';
import EditDoctorProfile from './pages/EditDoctorProfile';
import PatientEMR from './pages/PatientEMR';
import LabDashboard from './pages/LabPages/LabDashboard';
import Patients from './pages/LabPages/LabPatients';
import LabProfile from './pages/LabPages/LabProfile';
import LabTests from "./pages/LabPages/LabTests";


function App() {

  return (
    <>
     <Toaster position="top-right" reverseOrder={false} />{" "}
      <ToastContainer
       position="top-right"
        
      />
      <Routes>
          <Route element={<Layout />}/>

      <Route path='/' element={<Navbar/>}/>
                  <Route path="/patient-register" element={<RegisterPatient />} />
            <Route path="/doctor-register" element={<RegisterDoctor />} />
            <Route path="/clinic-register" element={<RegisterClinic />} />
            <Route path="/doctor-login" element={<DoctorLogin />} />
            <Route path="/clinic-login" element={<LoginClinic />} />
            <Route path="/patient-login" element={<LoginPatient />} />
            <Route path="/lab-login" element={<LoginLab />} />

            {/* Doctor Dashboard */}
          <Route path="/doctordashboard/:drId" element={<DoctorDashboard />}>
            <Route index element={<DoctorAppointments />} />
            <Route
              path="doctor-home-dashboard"
              element={<DoctorDashboardHome />}
            />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route
              path="appointments/addPrescription/:bookingId/:patientAadhar"
              element={<PrescriptionForm />}
            />
            <Route path="time-slots" element={<TimeSlots />} />
            <Route path="patients" element={<AllPatient />} />
            <Route path="patientEMR/:aadhar" element={<PatientEMR />} />
            <Route
              path="editDoctorIdPassword"
              element={<EditDoctorProfile />}
            />
            <Route path="doctorProfile" element={<DoctorProfile />} />
            <Route path="notifications" element={<DoctorNotifications />} />
            <Route path="add-medicine" element={<AddMedicine />} />
    </Route>

            <Route path="/lab-dashboard" element={<LabDashboard />}>
            {" "}
            <Route
              index
              element={
                <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
              }
            />
            <Route path="patients" element={<Patients />} />
            <Route path="tests" element={<LabTests />} />
            <Route path="profile" element={<LabProfile />} />
          </Route>
          {/* </Route> */}
      </Routes>
    </>
  )
}

export default App
