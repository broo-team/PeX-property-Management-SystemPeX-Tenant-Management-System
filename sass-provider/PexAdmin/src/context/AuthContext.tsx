import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";  // Named import

interface AuthContextType {
  role: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ role: null, isAuthenticated: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded: any = jwtDecode(token);  // Use jwtDecode to decode the token
      setRole(decoded.role);
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ role, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
