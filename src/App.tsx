import './App.css'
import { Route, Routes } from 'react-router-dom'
// import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";

// import Navbar from './components/Navbar'
import RegisterPatient from './pages/RegisterPages/RegisterPatient'
import RegisterDoctor from './pages/RegisterPages/RegisterDoctor'
import RegisterClinic from './pages/RegisterPages/RegisterClinic'
import Layout from './Layout';
import DoctorDashboard from './pages/DoctorPages/DoctorDashboard';
import DoctorAppointments from './pages/DoctorPages/DoctorAppointments';
import DoctorDashboardHome from './pages/DoctorPages/DoctorHomeDashboard';
import PrescriptionForm from './pages/DoctorPages/PrescriptionForm';
import DoctorProfile from './pages/DoctorPages/DoctorProfile';
import DoctorNotifications from './pages/DoctorPages/DoctorNotifications';
import AddMedicine from './pages/DoctorPages/AddMedicine';
import AllPatient from './pages/DoctorPages/AllPatient';
import OfflinePatientDetails from './pages/DoctorPages/OfflinePatientDetails';
import TimeSlots from './pages/TimeSlots';
import EditDoctorProfile from './pages/EditDoctorProfile';
import PatientEMR from './pages/PatientEMR';
import LabDashboard from './pages/LabPages/LabDashboard';
import Patients from './pages/LabPages/LabPatients';
import LabProfile from './pages/LabPages/LabProfile';
import LabTests from "./pages/LabPages/LabTests";
import LabInventory from './pages/LabPages/LabInventory';
import LabExpenses from './pages/LabPages/LabExpenses';
import LabRevenue from './pages/LabPages/LabRevenue';
import { ClinicDashboard } from './pages/ClinicPages/ClinicDashboard';
import ClinicHomeDashboard from './pages/ClinicPages/ClinicHomeDashboard';
import ClinicProfile from './pages/ClinicPages/ClinicProfile';
import AddDoctor from './pages/ClinicPages/AddDoctor';
import ClinicDoctors from './pages/ClinicPages/ClinicDoctors';
import AllClinicPatients from './pages/ClinicPages/AllClinicPatients';
import ReceptionistDashboard from './pages/ReceptionistPages/ReceptionistDashboard';
import RegisterLab from './pages/RegisterPages/RegisterLab';
import HomeLandingPage from './components/LandingPage';
import InventoryManagement from './pages/ClinicPages/InventoryManagement';
import ExpenseManagement from './pages/ClinicPages/ExpenseManagement';
import DoctorEarnings from './pages/DoctorPages/DoctorEarnings';
import ClinicRevenue from './pages/ClinicPages/ClinicRevenue';
import SuperAdminLogin from './pages/SuperAdminPages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminPages/SuperAdminDashboard';
import UserManagement from './pages/ClinicPages/UserManagement';
import DepartmentManagement from './pages/ClinicPages/DepartmentManagement';
import HRManagement from './pages/ClinicPages/HRManagement';
import WardManagement from './pages/ClinicPages/WardManagement';
import IPDAdmissions from './pages/ClinicPages/IPDAdmissions';
import PatientCharting from './pages/ClinicPages/PatientCharting';
import BillingLedger from './pages/ClinicPages/BillingLedger';
import InvoiceCreator from './pages/ClinicPages/InvoiceCreator';
import AssetManagement from './pages/ClinicPages/AssetManagement';
import SupplierManagement from './pages/ClinicPages/SupplierManagement';
import CommunicationHub from './pages/ClinicPages/CommunicationHub';
import AuditLogsDashboard from './pages/ClinicPages/AuditLogsDashboard';
import ReferralManagement from './pages/ClinicPages/ReferralManagement';
import LabOrders from './pages/LabPages/LabOrders';
import ReferralAnalytics from './pages/ClinicPages/ReferralAnalytics';
import VerifyReport from './pages/PublicPages/VerifyReport';

function App() {

  return (
    <>
     {" "}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
          <Route element={<Layout />}/>

      <Route path='/' element={<HomeLandingPage/>}/>
      <Route path="/verify/report/:id" element={<VerifyReport />} />
                  <Route path="/patient-register" element={<RegisterPatient />} />
            <Route path="/doctor-register" element={<RegisterDoctor />} />
            <Route path="/clinic-register" element={<RegisterClinic />} />
            <Route path="/lab-register" element={<RegisterLab />} />
            <Route path="/super-admin-login" element={<SuperAdminLogin />} />
            <Route path="/super-admin-dashboard" element={<SuperAdminDashboard />} />

            {/* Doctor Dashboard */}
          <Route path="/doctordashboard/:drId" element={<DoctorDashboard />}>
            <Route index element={<DoctorAppointments />} />
            <Route
              path="doctor-home-dashboard"
              element={<DoctorDashboardHome />}
            />
            <Route path="appointments" element={<DoctorAppointments />} />
            {/* <Route
              path="appointments/addPrescription/:bookingId/:patientAadhar"
              element={<PrescriptionForm />}
            /> */}
            <Route
  path="appointments/addPrescription/:bookingId/:patientAadhar?"
  element={<PrescriptionForm />}
/>
            <Route path="time-slots" element={<TimeSlots />} />
            <Route path="patients" element={<AllPatient />} />
            <Route path="offline-patient/:userId" element={<OfflinePatientDetails />} />
            <Route path="patientEMR/:aadhar" element={<PatientEMR />} />
            <Route
              path="editDoctorIdPassword"
              element={<EditDoctorProfile />}
            />
            <Route path="doctorProfile" element={<DoctorProfile />} />
            <Route path="notifications" element={<DoctorNotifications />} />
            <Route path="add-medicine" element={<AddMedicine />} />
            <Route path="earnings" element={<DoctorEarnings />} />
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
            <Route path="orders" element={<LabOrders />} />
            <Route path="profile" element={<LabProfile />} />
            <Route path="inventory" element={<LabInventory />} />
            <Route path="expenses" element={<LabExpenses />} />
            <Route path="revenue" element={<LabRevenue />} />
            <Route path="referrals" element={<ReferralManagement />} />
            <Route path="audit-logs" element={<AuditLogsDashboard />} />
          </Route>

          <Route
            path="/clinicDashboard/:clinicId"
            element={<ClinicDashboard />}
          >
            <Route index element={<ClinicHomeDashboard />} />
            <Route
              path="clinic-home-dashboard"
              element={<ClinicHomeDashboard />}
            />

            <Route path="clinic-profile" element={<ClinicProfile />} />
            <Route path="referrals" element={<ReferralManagement />} />
            <Route path="referral-analytics" element={<ReferralAnalytics />} />
            <Route path="audit-logs" element={<AuditLogsDashboard />} />
            <Route path="add-doctor" element={<AddDoctor />} />
            <Route path="all-clinic-doctors" element={<ClinicDoctors />} />
            <Route path="all-clinic-patients" element={<AllClinicPatients />} />
            <Route path="inventory-management" element={<InventoryManagement />} />
            <Route path="expense-management" element={<ExpenseManagement />} />
            <Route path="clinic-revenue" element={<ClinicRevenue />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="department-management" element={<DepartmentManagement />} />
            <Route path="hr-management" element={<HRManagement />} />
            <Route path="ward-management" element={<WardManagement />} />
            <Route path="ipd-admissions" element={<IPDAdmissions />} />
            <Route path="patient-charting/:admissionId" element={<PatientCharting />} />
            <Route path="billing-ledger" element={<BillingLedger />} />
            <Route path="invoice-creator" element={<InvoiceCreator />} />
            <Route path="asset-management" element={<AssetManagement />} />
            <Route path="supplier-management" element={<SupplierManagement />} />
            <Route path="communication-hub" element={<CommunicationHub />} />
          </Route>

          <Route
          path="/receptionistDashboard/:id"
          element={<ReceptionistDashboard />}
        />
      </Routes>
    </>
  )
}

export default App
