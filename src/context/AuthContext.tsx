import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

interface User {
  id: string;
  name: string;
  email: string;
  aadhar:string;
  mobileNumber:number;
  gender:string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  logout: () => void;
  login: (token: string) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  logout: () => {},
    login: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = Cookies.get("patientToken");
 
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        console.log(decoded)

        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          aadhar:decoded.aadhar,
          mobileNumber:decoded.mobileNumber,
          gender:decoded.gender
        });

        setIsLoggedIn(true);
        // setUser(user)
      } catch (error) {
        console.error("Invalid Token:", error);
        Cookies.remove("patientToken");
      }
    }
  }, []);




  const login = (token: string) => {
  const decoded: any = jwtDecode(token);

  setUser({
    id: decoded.id,
    name: decoded.name,
    email: decoded.email,
    aadhar:decoded.aadhar,
    mobileNumber:decoded.mobileNumber,
    gender:decoded.gender
  });

  setIsLoggedIn(true);
  Cookies.set("patientToken", token, { expires: 7 });
};


  const logout = () => {
    Cookies.remove("patientToken");
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn,login, user, logout}}>
      {children}
    </AuthContext.Provider>
  );
};