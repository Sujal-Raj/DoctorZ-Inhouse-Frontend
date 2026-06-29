import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function LoginNavbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#0c213e] text-[#0c213e] font-medium hover:bg-[#0c213e] hover:text-white transition-all duration-300"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
      </div>
    </nav>
  );
}