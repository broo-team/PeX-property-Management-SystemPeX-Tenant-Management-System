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

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                // <PrivateRoute>
                  <Dashboard />
                // </PrivateRoute> 
              }
            />
            <Route
              path="/properties"
              element={
                // <PrivateRoute>
                  <Properties />
                  // {/* </PrivateRoute>  */}
              }
            />
             <Route
              path="/notifications"
              element={
                // <PrivateRoute>
                  <Notifications />
                  // {/* </PrivateRoute>  */}
              }
            />
                         <Route
              path="/tenants"
              element={
                // <PrivateRoute>
                  <Tenants />
                  // </PrivateRoute> 
              }
            />
          </Routes>
        </Router>
        <Toaster position="top-right" reverseOrder={false} />
      </div>
    </AuthProvider>
  );
}

export default App;
