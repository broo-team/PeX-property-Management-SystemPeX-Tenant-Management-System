import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [owner, setOwner] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const storedOwner = localStorage.getItem('owner');
        const token = localStorage.getItem('ERPUSER_Token');

        if (storedOwner && token) {
            try {
                setOwner(JSON.parse(storedOwner));
            } catch (error) {
                console.error('Error parsing stored owner:', error);
                localStorage.removeItem('owner');
                localStorage.removeItem('ERPUSER_Token');
            }
        }
        setAuthLoading(false);
    }, []);

    const login = (ownerData, token) => {
        setOwner(ownerData);
        localStorage.setItem('owner', JSON.stringify(ownerData));
        localStorage.setItem('ERPUSER_Token', token);
        console.log('Login successful, owner set:', ownerData);
    };

    const logout = () => {
        setOwner(null);
        localStorage.removeItem('owner');
        localStorage.removeItem('ERPUSER_Token');
        navigate('/');
        console.log('Logout successful');
    };

    const value = {
        owner,
        login,
        logout,
        authLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);