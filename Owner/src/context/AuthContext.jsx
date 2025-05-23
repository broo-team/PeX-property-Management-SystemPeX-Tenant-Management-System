import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [accountType, setAccountType] = useState(null); // "owner" or "user"
  const [token, setToken] = useState(null);
  const [buildingId, setBuildingId] = useState(null);
  const [buildingName, setBuildingName] = useState(null); // ✅ New state for building name
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

      const id = type === "owner" ? parsedAccount.id : parsedAccount.building_id;
      const name = type === "owner" ? parsedAccount.building_name : parsedAccount.building_name;

      setBuildingId(id);
      setBuildingName(name); // ✅ Set building name
    }

    setAuthLoading(false);
  }, []);

  const login = (accountData, authToken, type) => {
    setAccount(accountData);
    setToken(authToken);
    setAccountType(type);

    const id = type === "owner" ? accountData.id : accountData.building_id;
    const name = type === "owner" ? accountData.building_name : accountData.building_name;

    setBuildingId(id);
    setBuildingName(name); // ✅ Set building name

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
    console.log("Building Name set:", name); // ✅ Log building name
  };

  const logout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    requestAnimationFrame(() => {
      setAccount(null);
      setToken(null);
      setAccountType(null);
      setBuildingId(null);
      setBuildingName(null); // ✅ Clear building name

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
        buildingName, // ✅ Provide building name
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
