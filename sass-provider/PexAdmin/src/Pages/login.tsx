// src/Pages/login.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/services/authService";
import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { useAuth } from "@/context/AuthContext"; // <-- Import the useAuth hook

const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation(); // Use useLocation to get state (if user was redirected from a protected route)
  const { login } = useAuth(); // <-- Get the login function from the AuthContext

  // Determine where to redirect after login (either the page they tried to access or dashboard)
  const from = location.state?.from?.pathname || "/dashboard";


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address.");
      toast.error("Email is required.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      toast.error("Password is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email format.");
      toast.error("Invalid email format.");
      return;
    }

    setError(null); // Clear previous errors

    try {
      const response = await axiosInstance.post("/api/creators/login", {
        email,
        password,
      });

      if (response.data && response.data.token) {
        // localStorage.setItem("token", response.data.token); // <-- REMOVE this line

        login(response.data.token); // <-- Call the login function from AuthContext

        toast.success("Login successful!");

        // Navigate to the intended page or default dashboard
        navigate(from, { replace: true }); // <-- Navigate to 'from' location
      } else {
        setError("Unexpected response format from server.");
        toast.error("Unexpected response format.");
      }
    } catch (err) {
      console.error("Login Error:", err);

      if (axios.isAxiosError(err)) {
        const serverMessage = err.response?.data?.message;
        if (serverMessage) {
          setError(serverMessage);
          toast.error(serverMessage);
        } else if (err.response) {
          setError(`Login failed with status: ${err.response.status}`);
          toast.error(`Login failed with status: ${err.response.status}`);
        } else {
          setError("Network error or server is unreachable.");
          toast.error("Network error or server is unreachable.");
        }
      } else {
        setError("An unexpected error occurred during login.");
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex">
        {/* Left Illustration */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-600 to-indigo-600 items-center justify-center p-10">
          <img
            src="/login-illustration.svg"
            alt="Login illustration"
            className="w-80 h-80 object-contain"
          />
        </div>

        {/* Right Form */}
        <div className="w-full md:w-1/2 p-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">Welcome Back!</h2>
          <p className="text-gray-500 text-center mb-8">Login to your account</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-gray-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-2 border rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-2 border rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-md transition duration-300 ${!email || !password ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={!email || !password}
            >
              Login
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Don’t have an account?
            {/* Change a tag to Link component if using react-router-dom */}
            <a href="/register" className="text-purple-600 hover:underline ml-1">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;