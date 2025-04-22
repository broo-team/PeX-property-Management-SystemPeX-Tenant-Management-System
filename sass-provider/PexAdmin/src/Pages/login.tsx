import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/services/authService";
import axios from "axios"; // Using axios directly for testing
import { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const navigate = useNavigate();

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const phoneRegex = /^(09|07)\d{8}$/;
    return phoneRegex.test(phoneNumber);
  };

  useEffect(() => {
    if (phoneNumber) {
      setIsPhoneValid(validatePhoneNumber(phoneNumber));
    }
  }, [phoneNumber]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Button clicked");
    console.log("Phone number:", phoneNumber, "Password:", password);

    if (!isPhoneValid) {
      setError("Please enter a valid phone number starting with 09 or 07.");
      toast.error("Invalid phone number format.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      toast.error("Password is required.");
      return;
    }

    try {
      // Using axios directly for testing
      const response = await axiosInstance.post("/api/auth/login", {
        phoneNumber,
        password,
      });

      console.log("API Response:", response); // Log response for debugging

      if (response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        navigate("/dashboard");
        toast.success("Login successful!");
      
      } else {
        // Handle case where accessToken is missing or response structure is unexpected
        setError("Unexpected response format.");
        toast.error("Unexpected response format.");
      }
    } catch (err) {
      console.error("Error:", err); // Log the error to debug

      if (axios.isAxiosError(err)) {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
          toast.error(err.response.data.message);
        } else {
          setError("An unexpected error occurred. Please try again.");
          toast.error("An unexpected error occurred. Please try again.");
        }
      } else {
        setError("A network or system error occurred.");
        toast.error("A network or system error occurred.");
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
              Enter your Phone Number below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="text"
                placeholder="0912345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className={isPhoneValid ? "border-green-500" : "border-red-500"}
              />
              {!isPhoneValid && phoneNumber && (
                <p className="text-red-500">Invalid phone number format</p>
              )}
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
            {error && <p className="text-red-500">{error}</p>}
            <Button
              type="submit"
              className={`w-full bg-emerald-500 hover:bg-emerald-600 ${!isPhoneValid || !password ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!isPhoneValid || !password}
            >        
              Login
            </Button>
          </div>
        </form>
      </div>
      <div className="hidden bg-muted lg:block">
        <img
          src="/login.svg"
          alt="Image"
          width="500"
          height="500"
          className="object-cover dark:brightness-[0.2] dark:grayscale ml-32 mt-52"
        />
      </div>
    </div>
  );
};

export default Login;
