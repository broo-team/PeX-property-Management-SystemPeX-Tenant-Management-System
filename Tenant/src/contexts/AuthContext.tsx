// contexts/AuthContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';

interface TenantData {
  id: number;
  tenant_id: string;
  full_name: string;
  phone: string;
  room: string;
  building_id: number;
  stallCode:number;
}

interface BuildingData {
  id: number;
  building_name: string;
  building_image: string;
  building_address: string;
  location: string;
  property_type: string;
  owner_email: string;
  owner_address: string;
  suspended: number;
  created_at: string;
}

interface LoginResponse {
  message: string;
  type: string;
  token: string;
  tenant: TenantData;
  building: BuildingData;
  stallCode:TenantData;
}

interface AuthContextType {
  user: LoginResponse | null;
  login: (userData: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) as LoginResponse : null;
  });

  const login = (userData: LoginResponse) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem("token");
    localStorage.removeItem("tenant");
    localStorage.removeItem("building");
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};