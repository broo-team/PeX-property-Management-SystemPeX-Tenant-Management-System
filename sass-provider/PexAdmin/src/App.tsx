// src/App.js
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./Pages/dashboard";
import Login from "./Pages/login";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./guard/PrivateRoute";
import Properties from "./Pages/Properties";
import Notifications from "./Pages/Notifications";
import Tenants from "./Pages/Tenant";
import DealsPage from "./Pages/DealsPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Route */}
            <Route path="/" element={<Login />} />

            {/* Private Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <PrivateRoute>
                  <Properties />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/tenants"
              element={
                <PrivateRoute>
                  <Tenants />
                </PrivateRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <PrivateRoute>
                  <DealsPage />
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" reverseOrder={false} />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
