

import React from "react";
import { MapPin} from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { AuthContext } from "../../Context/AuthContext";
import api from "../../Services/mainApi";
// import Cookies from "js-cookie";
// import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

export interface Doctor {
  
  _id: string;
  fullName: string;
  specialization: string;
  qualification?: string;
  location?: string;
  city?: string;
  photo?: string;
  gender?: string;
}

interface Props {
  doctor: Doctor;
    doctorStatus: "added" | "pending" | "none";

  // onConsult?: (doctor: Doctor) => void;
  // onFavouriteToggle?: (doctorId: string, isFavourite: boolean) => void;
   onRequestSent: (doctorId: string) => void; // <- NEW
}



// interface DecodedToken {
//   id: string;
// }




const ClinicDoctorCard: React.FC<Props> = ({ doctor , doctorStatus , onRequestSent  }) => {

  
  const navigate = useNavigate();
 
  // Get patient ID
  // const token = Cookies.get("patientToken");
  // const patientId = token ? (jwtDecode<DecodedToken>(token)?.id ?? null) : null;

const handleAddDoctor = async (doctor :Doctor)=>{
  try{
      await api.post("/api/clinic/send-doctor-request",{
        
          doctorId :doctor._id,
          clinicId :localStorage.getItem("clinicId"),
        
      });
      

//     const data = res.data as { message: string };

// alert(data.message);

Swal.fire({
  title: "Request Sent!",
  text: "Your request has been sent successfully.",
  icon: "success",
  confirmButtonText: "Ok",
});


  onRequestSent(doctor._id);
      
  }
  catch(error){
    console.log(error);
  }
}
  

  const handleCardClick = () => {
    navigate(`/view-doctor-profile/${doctor._id}`);
  };

  const getLocationText = () => {
    if (doctor.location && doctor.city) return `${doctor.location}, ${doctor.city}`;
    if (doctor.location) return doctor.location;
    if (doctor.city) return doctor.city;
    return "—";
  };

  return (
    <article
  onClick={handleCardClick}
  className="group bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer p-4 flex flex-col items-center text-center"
>
  {/* IMAGE */}
  {doctor.photo ? (
    <img
      src={`http://localhost:3000/uploads/${doctor.photo}`}
      alt={doctor.fullName}
      className="w-32 h-32 rounded-lg object-cover border mb-4"
    />
  ) : (
    <div className="w-32 h-32 rounded-lg bg-[#0c213e] text-white flex items-center justify-center text-3xl font-bold mb-4">
      {doctor.fullName.charAt(0)}
    </div>
  )}

  {/* NAME */}
  <h2 className="text-lg font-bold text-gray-900">
    Dr. {doctor.fullName}
  </h2>

  {/* SPECIALIZATION */}
  <p className="text-[#0c213e] font-medium mt-1">
    {doctor.specialization}
  </p>

  {/* LOCATION */}
  <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mt-2">
    <MapPin className="w-4 h-4" />
    <span>{getLocationText()}</span>
  </div>

  {/* BUTTONS */}
  {/* <div className="mt-4 w-full flex flex-col gap-2">
    
    <button
      
      className="flex items-center justify-center gap-2 px-4 py-2 bg-[#28328C] hover:bg-[#1f286f] text-white rounded-lg w-full"  
       onClick={(e) => {
    e.stopPropagation();
    handleAddDoctor(doctor);

     }}
    >
     
     Add Doctor
    </button>
  </div> */}

  <div className="mt-4 w-full flex flex-col gap-2">
  
  {doctorStatus === "added" && (
    <button
      disabled
      className="px-4 py-2 bg-green-600 text-white rounded-lg w-full cursor-not-allowed"
    >
      Already Added
    </button>
  )}

  {doctorStatus === "pending" && (
    <button
      disabled
      className="px-4 py-2 bg-yellow-500 text-white rounded-lg w-full cursor-not-allowed"
    >
      Request Sent
    </button>
  )}

  {doctorStatus === "none" && (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleAddDoctor(doctor);
      }}
      className="px-4 py-2 bg-[#0c213e] text-white rounded-lg w-full"
    >
      Add Doctor
    </button>
  )}

</div>

</article>

  );
};

export default ClinicDoctorCard;


