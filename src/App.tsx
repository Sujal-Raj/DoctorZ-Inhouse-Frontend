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
      </Routes>
    </>
  )
}

export default App
