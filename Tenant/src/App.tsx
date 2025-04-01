import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard/dashboard";
import { Login } from "./pages/auth/login";
import PaymentSuccess from "./pages/payment/PaymentSuccess";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Login} />
        <Route path="/dashboard" Component={Dashboard} />
        <Route path="/payment/success" Component={PaymentSuccess} /> 
        <Route path="/payment/cancel" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
