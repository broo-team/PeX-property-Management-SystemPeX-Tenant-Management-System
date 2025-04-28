// src/context/AuthContext.tsx (or .js)
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { jwtDecode, JwtPayload } from "jwt-decode"; // Ensure jwt-decode is installed

// Extend JwtPayload to include custom claims like 'role'
interface CustomJwtPayload extends JwtPayload {
  role?: string; // Assuming your token payload has a 'role' field
  // Add any other custom fields from your JWT payload here
}

interface AuthContextType {
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Added loading state
  login: (token: string) => void; // Added login function
  logout: () => void; // Added logout function
}

// Corrected default value for the context
const AuthContext = createContext<AuthContextType>({
  role: null,
  isAuthenticated: false,
  isLoading: true, // Default to true, indicating check is pending
  login: () => {}, // Placeholder function
  logout: () => {}, // Placeholder function
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // State to track initial loading

  // Function to process the token and update state
  const processToken = useCallback((token: string | null) => {
    console.log("Processing token:", token ? "Token present" : "No token"); // Log start

    if (!token) {
      setToken(null);
      setRole(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token"); // Ensure token is removed
      console.log(
        "ProcessToken: Cleared state. isAuthenticated: false, isLoading:",
        isLoading
      ); // Log cleared state
      return;
    }

    try {
      const decoded: CustomJwtPayload = jwtDecode(token);
      console.log("Decoded token:", decoded); // Log decoded token

      // Check if the token is expired
      const currentTime = Date.now() / 1000; // in seconds
      if (decoded.exp && decoded.exp < currentTime) {
        console.warn("Token expired.");
        processToken(null); // Treat as unauthenticated
        console.log("ProcessToken: Token expired. Calling processToken(null)"); // Log expired action
        return;
      }

      // Token is valid
      setToken(token);
      setRole(decoded.role || null); // Use decoded role
      setIsAuthenticated(true);
      localStorage.setItem("token", token); // Ensure token is in storage
      console.log(
        "ProcessToken: Token valid. isAuthenticated: true, isLoading:",
        isLoading
      ); // Log valid action
    } catch (error) {
      console.error("Failed to decode or process token:", error);
      processToken(null); // Treat as unauthenticated if decoding fails
      console.log("ProcessToken: Decoding failed. Calling processToken(null)"); // Log error action
    }
  }, [isLoading]); // Effect depends on isLoading for logging consistency

  // Check for token in localStorage on app mount
  useEffect(() => {
    console.log("AuthContext useEffect: Checking localStorage for token..."); // Log useEffect start
    const storedToken = localStorage.getItem("token");
    processToken(storedToken);
    setIsLoading(false); // <-- This sets isLoading to false AFTER the initial check
    console.log(
      "AuthContext useEffect: Finished check. Setting isLoading to false."
    ); // Log useEffect finish
  }, [processToken]); // Effect depends on processToken

  // Login function to call after successful authentication (e.g., from login page)
  const login = useCallback((newToken: string) => {
    console.log("AuthContext login function called."); // Log login call
    processToken(newToken); // Process the new token
  }, [processToken]);

  // Logout function to clear authentication state
  const logout = useCallback(() => {
    console.log("AuthContext logout function called."); // Log logout call
    processToken(null); // Clear token and state
  }, [processToken]);

  return (
    // Provide all values from the context type
    <AuthContext.Provider value={{ role, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to easily consume the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};