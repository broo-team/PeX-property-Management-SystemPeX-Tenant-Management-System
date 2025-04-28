// src/guard/PrivateRoute.tsx (or .js)
import { Navigate, useLocation } from "react-router-dom"; // Import useLocation
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
  children: JSX.Element;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  // Get isAuthenticated and isLoading from the context
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Get the current location

  // If the auth status is still being determined, show a loading state
  // This prevents showing the protected content or redirecting prematurely
  if (isLoading) {
    // You can replace this div with a spinner or proper loading component
    return <div>Loading authentication...</div>;
  }

  // If authenticated, render the children (the protected component)
  if (isAuthenticated) {
    return children;
  }

  // If not authenticated (and loading is false), redirect to the login page.
  // We pass the current location in the state so the login page
  // can redirect the user back here after they log in successfully.
  return <Navigate to="/" state={{ from: location }} replace />;
};