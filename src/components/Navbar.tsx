import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  MapPin,
  Loader2,
  Stethoscope,
  LocateFixed,
  Check,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  interface LocationData {
    city?: string;
    countryName?: string;
  }

  const [userLocation, setUserLocation] = useState<string>("Detecting location...");
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string>("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState<boolean>(false);
  const [manualLocation, setManualLocation] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  const cities = ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"];

  const popularCities = [
    "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
    "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore",
    "Thane", "Bhopal", "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad",
  ];

  useEffect(() => {
    const fetchLocation = async (): Promise<void> => {
      try {
        setIsLocating(true);
        if (!navigator.geolocation) {
          setUserLocation("Location not supported");
          setIsLocating(false);
          return;
        }
        const cached = localStorage.getItem("userLocation");
        if (cached) {
          setUserLocation(cached);
          setIsLocating(false);
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 300000 })
        );
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data: LocationData = await res.json();
        const locationText = `${data.city || "Unknown"}, ${data.countryName || ""}`;
        setUserLocation(locationText);
        localStorage.setItem("userLocation", locationText);
      } catch {
        setUserLocation("Location not found");
      } finally {
        setIsLocating(false);
      }
    };
    fetchLocation();
  }, []);

  const handleManualLocationSelect = (city: string) => {
    setUserLocation(city);
    localStorage.setItem("userLocation", city);
    setLocationDropdownOpen(false);
    setManualLocation("");
    setShowSuggestions(false);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError("");
    setShowSuggestions(false);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 300000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await res.json();
      const locationText = `${data.city || "Unknown"}, ${data.countryName || ""}`;
      setUserLocation(locationText);
      localStorage.setItem("userLocation", locationText);
      setLocationDropdownOpen(false);
      setManualLocation("");
    } catch {
      setLocationError("Failed to fetch location");
    } finally {
      setIsLocating(false);
    }
  };

  const handleInputChange = (value: string) => {
    setManualLocation(value);
    if (value.trim().length > 0) {
      const filtered = popularCities.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredCities([]);
    }
  };

  const handleSuggestionClick = (city: string) => {
    setManualLocation(city);
    setShowSuggestions(false);
    handleManualLocationSelect(city);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* LOGO */}
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-[#0c213e] hover:text-[#1f2673]"
        >
          <div className="w-8 h-8 bg-[#0c213e] rounded-full flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          DoctorZ
        </Link>

        {/* LOCATION DROPDOWN */}
        <DropdownMenu.Root open={locationDropdownOpen} onOpenChange={setLocationDropdownOpen}>
          <DropdownMenu.Trigger asChild>
            <div className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 cursor-pointer rounded-lg border border-gray-200">
              {isLocating ? (
                <Loader2 className="w-4 h-4 text-[#0c213e] animate-spin" />
              ) : (
                <MapPin size={16} className="text-[#0c213e]" />
              )}
              <span className="text-sm font-semibold text-gray-800">
                {isLocating ? "Detecting..." : userLocation}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Content
            className="bg-white rounded-xl shadow-2xl border border-gray-100 w-76 z-60"
            align="start"
            sideOffset={5}
          >
            <div className="p-4 space-y-4 max-h-100 overflow-y-auto">
              {/* Current Location Button */}
              <DropdownMenu.Item asChild>
                <button
                  onClick={handleUseCurrentLocation}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-left transition-colors"
                >
                  <LocateFixed size={20} className="text-[#0c213e]" />
                  <span className="flex-1 font-medium">Current Location</span>
                  {isLocating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                </button>
              </DropdownMenu.Item>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs font-medium text-gray-500 px-2">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Manual Input */}
              <div className="relative">
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your location"
                    value={manualLocation}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => {
                      if (manualLocation.trim().length > 0 && filteredCities.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (manualLocation.trim()) handleManualLocationSelect(manualLocation.trim());
                    }}
                    disabled={!manualLocation.trim()}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      manualLocation.trim()
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Check size={20} />
                  </button>
                </div>

                {/* Suggestions */}
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-70 max-h-48 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <button
                        key={city}
                        onClick={(e) => { e.stopPropagation(); handleSuggestionClick(city); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-600 transition-colors flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-sm font-medium">{city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Cities */}
              <div>
                <div className="text-sm font-semibold mb-3 text-gray-700">Popular Cities</div>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city) => (
                    <button
                      key={city}
                      onClick={(e) => { e.stopPropagation(); handleManualLocationSelect(city); }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600 cursor-pointer"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error */}
              {locationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <MapPin size={16} />
                  {locationError}
                </div>
              )}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>
    </nav>
  );
}