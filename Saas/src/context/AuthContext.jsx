import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BACKENDURL } from './helper/Urls'; // Assuming you have this

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [owner, setOwner] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    setAuthLoading(true);
    const storedOwner = localStorage.getItem('owner');
    if (storedOwner) {
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('ERPUSER_Token')}`,
        };
        const res = await axios.get(`${BACKENDURL}/auth/user`, { headers });
        setOwner(res.data.owner);
        setAuthLoading(false);
      } catch (error) {
        localStorage.removeItem('owner');
        setOwner(null);
        setAuthLoading(false);
        if (location.pathname !== '/') {
          navigate('/');
        }
      }
    } else {
      setOwner(null);
      setAuthLoading(false);
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location, navigate]);

  const login = (ownerData) => {
    setOwner(ownerData);
    localStorage.setItem('owner', JSON.stringify(ownerData));
  };

  const logout = () => {
    setOwner(null);
    localStorage.removeItem('owner');
    navigate('/');
  };

  const value = {
    owner,
    login,
    logout,
    authLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);