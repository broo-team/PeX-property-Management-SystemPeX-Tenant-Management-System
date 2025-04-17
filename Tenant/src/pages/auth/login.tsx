'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import axiosInstance from '@/services/authService';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TenantData {
  id: number;
  tenant_id: string;
  full_name: string;
  phone: string;
  room: string;
  building_id: number;
}

interface BuildingData {
  id: number;
  building_name: string;
  building_image: string;
  building_address: string;
  location: string;
  property_type: string;
  owner_email: string;
  owner_address: string;
  suspended: number;
  created_at: string;
}

interface LoginResponse {
  message: string;
  type: string;
  token: string;
  tenant: TenantData;
  building: BuildingData;
}

export function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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
    setIsLoading(true);
    setError(null);

    if (!isPhoneValid) {
      setError('Please enter a valid phone number starting with 09 or 07.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post<LoginResponse>(
        'http://localhost:5000/tenant/login',
        {
          phone: phoneNumber,
          password: password,
        }
      );

      if (response.data && response.data.token && response.data.tenant && response.data.building) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
        localStorage.setItem('building', JSON.stringify(response.data.building));

        login(response.data);

        toast({
          title: 'Login successful',
          description: 'Welcome back!',
          icon: <CheckCircle2 className="h-4 w-4" />,
        });
        navigate('/dashboard');
      } else {
        setError('Unexpected response format.');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await axiosInstance.post('/api/tenants/forgotPassword', { email: resetEmail });
      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for further instructions.',
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      setShowForgotPassword(false);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while processing your request. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-lg animate-fade-in-up">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight text-white">
            {showForgotPassword ? 'Reset Password' : 'Sign In'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {showForgotPassword
              ? 'Enter your email to reset your password.'
              : 'Sign in to access your dashboard.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900 text-white border-none">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="reset-email" className="text-gray-300">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="bg-gray-700 border-gray-600 focus:ring-emerald-400 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="phoneNumber" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className={`bg-gray-700 border ${isPhoneValid ? 'border-green-500' : 'border-red-500'} text-white`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                disabled={isLoading || !isPhoneValid || !password}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="link"
            className="text-emerald-400 hover:text-emerald-300"
            onClick={() => setShowForgotPassword(!showForgotPassword)}
          >
            {showForgotPassword ? 'Back to Login' : 'Forgot Password?'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
