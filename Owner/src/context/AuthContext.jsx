import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [accountType, setAccountType] = useState(null); // "owner" or "user"
  const [token, setToken] = useState(null);
  const [buildingId, setBuildingId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedOwner = localStorage.getItem("owner");
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("ERPUSER_Token");

    let parsedAccount = null;
    let type = null;

    if (storedOwner && storedToken) {
      try {
        parsedAccount = JSON.parse(storedOwner);
        type = "owner";
      } catch (error) {
        console.error("Failed to parse stored owner:", error);
        localStorage.removeItem("owner");
        localStorage.removeItem("ERPUSER_Token");
      }
    } else if (storedUser && storedToken) {
      try {
        parsedAccount = JSON.parse(storedUser);
        type = "user";
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("ERPUSER_Token");
      }
    }

    if (parsedAccount && type) {
      setAccount(parsedAccount);
      setAccountType(type);
      setToken(storedToken);

      // ✅ Use correct building ID logic
      const id =
        type === "owner" ? parsedAccount.id : parsedAccount.building_id;
      setBuildingId(id);
    }

    setAuthLoading(false);
  }, []);

  const login = (accountData, authToken, type) => {
    setAccount(accountData);
    setToken(authToken);
    setAccountType(type);

    // ✅ Use correct building ID logic
    const id = type === "owner" ? accountData.id : accountData.building_id;
    setBuildingId(id);

    if (type === "owner") {
      localStorage.setItem("owner", JSON.stringify(accountData));
      localStorage.removeItem("user");
    } else {
      localStorage.setItem("user", JSON.stringify(accountData));
      localStorage.removeItem("owner");
    }
    localStorage.setItem("ERPUSER_Token", authToken);

    console.log("Login successful, account set:", accountData, type);
    console.log("Building ID set:", id);
  };

  const logout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    requestAnimationFrame(() => {
      setAccount(null);
      setToken(null);
      setAccountType(null);
      setBuildingId(null);

      localStorage.removeItem("owner");
      localStorage.removeItem("user");
      localStorage.removeItem("ERPUSER_Token");

      setTimeout(() => {
        setIsLoggingOut(false);
        navigate("/");
      }, 50);
    });
  };

  const role = accountType === "owner" ? "owner" : account?.role;

  return (
    <AuthContext.Provider
      value={{
        account,
        accountType,
        role,
        token,
        buildingId,
        authLoading,
        login,
        logout,
        isLoggingOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
