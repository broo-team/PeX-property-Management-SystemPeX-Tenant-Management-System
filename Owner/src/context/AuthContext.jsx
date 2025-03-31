import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [accountType, setAccountType] = useState(null); // "owner" or "user"
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // Prevent multiple clicks
  const navigate = useNavigate();

  useEffect(() => {
    const storedOwner = localStorage.getItem("owner");
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("ERPUSER_Token");

    if (storedOwner && storedToken) {
      try {
        setAccount(JSON.parse(storedOwner));
        setAccountType("owner");
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("owner");
        localStorage.removeItem("ERPUSER_Token");
      }
    } else if (storedUser && storedToken) {
      try {
        setAccount(JSON.parse(storedUser));
        setAccountType("user");
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("ERPUSER_Token");
      }
    }
    setAuthLoading(false);
  }, []);

  const login = (accountData, authToken, type) => {
    setAccount(accountData);
    setToken(authToken);
    setAccountType(type);
    if (type === "owner") {
      localStorage.setItem("owner", JSON.stringify(accountData));
      localStorage.removeItem("user");
    } else {
      localStorage.setItem("user", JSON.stringify(accountData));
      localStorage.removeItem("owner");
    }
    localStorage.setItem("ERPUSER_Token", authToken);
    console.log("Login successful, account set:", accountData, type);
  };

  const logout = () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    setIsLoggingOut(true);

    requestAnimationFrame(() => {
      setAccount(null);
      setToken(null);
      setAccountType(null);
      localStorage.removeItem("owner");
      localStorage.removeItem("user");
      localStorage.removeItem("ERPUSER_Token");

      setTimeout(() => {
        setIsLoggingOut(false);
        navigate("/");
      }, 50);
    });
  };

  const role = accountType === "user" ? account?.role : accountType;

  return (
    <AuthContext.Provider
      value={{ account, accountType, role, token, authLoading, login, logout, isLoggingOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
