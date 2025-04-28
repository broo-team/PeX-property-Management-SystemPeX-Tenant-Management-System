// src/App.js
import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dashboard from "./Pages/dashboard";
import Login from "./Pages/login";
import { Toaster } from 'react-hot-toast'; // Assuming react-hot-toast
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./guard/PrivateRoute"; // Correct import
import Properties from "./Pages/Properties";
import Notifications from "./Pages/Notifications";
import Tenants from "./Pages/Tenant";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Router>
          <Routes>
            {/* Public Route for Login */}
            <Route path="/" element={<Login />} />

            {/* Protected Routes - Wrap elements with PrivateRoute */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute> {/* Ensure PrivateRoute wraps the component */}
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <PrivateRoute> {/* Ensure PrivateRoute wraps the component */}
                  <Properties />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute> {/* Ensure PrivateRoute wraps the component */}
                  <Notifications />
                </PrivateRoute>
              }
            />
            <Route
              path="/tenants"
              element={
                <PrivateRoute> {/* Ensure PrivateRoute wraps the component */}
                  <Tenants />
                </PrivateRoute>
              }
            />
            {/* Add other routes here */}
          </Routes>
        </Router>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </AuthProvider>
  );
}

export default App;