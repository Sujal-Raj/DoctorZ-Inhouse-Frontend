
import { Link } from "react-router-dom";
import {
  X,
  User,
  FilePlus2,
  CalendarDays,

 
  ChevronRight,
  FileText,
} from "lucide-react";
interface SidebarProps {
  open: boolean;
  onClose: () => void;
  patientId?: string | number;
}

const RightSidebar: React.FC<SidebarProps>  = ({ open, onClose, patientId }) => {
  
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity 
          ${open ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl border-l transition-transform duration-300 
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 ">
          <span className="text-gray-700 font-semibold text-[15px]">
           Menu
          </span>
          <button onClick={onClose}>
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Menu List */}
        <div className="flex flex-col py-2">

          {/* ITEM TEMPLATE */}
          <Link  onClick={onClose}
            to={`/user-dashboard/${patientId}`}
            className="flex items-center justify-between px-5 py-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <User size={20} />
              <span className="text-gray-800">My Profile</span>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </Link>

          <Link  onClick={onClose}
            to={`/user-dashboard/${patientId}/add-emr`}
            className="flex items-center justify-between px-5 py-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <FilePlus2 size={20}  />
              <span className="text-gray-800">Add EMR</span>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </Link>

          <Link  onClick={onClose}
            to={`/user-dashboard/${patientId}/appointments`}
            className="flex items-center justify-between px-5 py-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <CalendarDays size={20} />
              <span className="text-gray-800">Appointments</span>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </Link>

          <Link  onClick={onClose}
            to={`/user-dashboard/${patientId}/prescription`}
            className="flex items-center justify-between px-5 py-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <FileText size={20}  />
              <span className="text-gray-800">My Prescriptions</span>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </Link>

          <Link  onClick={onClose}
            to={`/user-dashboard/${patientId}/lab-test/${patientId}`}
            className="flex items-center justify-between px-5 py-4 border-b hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-4">
              <FileText size={20}  />
              <span className="text-gray-800">Lab Test</span>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </Link>



         
        </div>
      </div>
    </>
  );
};

export default RightSidebar;
