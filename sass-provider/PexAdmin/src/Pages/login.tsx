import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/services/authService";
import axios from "axios";
import { useState } from "react";
import { toast } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // 👈 Make sure path is correct

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // 👈 Access the login function from context

  const handleLogin = async (e: React.FormEvent) => {
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

    setError(null);

    try {
      const response = await axiosInstance.post("/api/creators/login", {
        email,
        password,
      });

      if (response.data && response.data.token) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        login(token); // 👈 Call the login function to update context state
        navigate("/dashboard");
        toast.success("Login successful!");
      } else {
        setError("Unexpected response format from server.");
        toast.error("Unexpected response format.");
      }
    } catch (err) {
      console.error("Login Error:", err);

      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.message ||
          (err.response ? `Login failed with status: ${err.response.status}` : null) ||
          "Network error or server is unreachable.";

        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError("An unexpected error occurred during login.");
        toast.error("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <form className="mx-auto grid w-[350px] gap-6" onSubmit={handleLogin}>
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-slate-500">
              Enter your Email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              type="submit"
              className={`w-full bg-emerald-500 hover:bg-emerald-600 ${!email || !password ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!email || !password}
            >
              Login
            </Button>
          </div>
        </form>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src="/login.svg"
          alt="Login Image"
          width="500"
          height="500"
          className="object-cover dark:brightness-[0.2] dark:grayscale ml-32 mt-52"
        />
      </div>
    </div>
  );
};

export default Login;
