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
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4 from-emerald-50 to-emerald-100 bg-gradient-to-r">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {showForgotPassword ? 'Reset Password' : 'Login'}
          </CardTitle>
          <CardDescription className="text-center">
            {showForgotPassword
              ? 'Enter your email to reset your password'
              : 'Enter your credentials to access your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className={isPhoneValid ? 'border-green-500' : phoneNumber ? 'border-red-500' : ''}
                />
                {!isPhoneValid && phoneNumber && (
                  <p className="text-sm text-red-500">Invalid phone number format</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600" disabled={isLoading || !isPhoneValid || !password}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="link"
            className="w-full text-emerald-500"
            onClick={() => setShowForgotPassword(!showForgotPassword)}
          >
            {showForgotPassword ? 'Back to Login' : 'Forgot Password?'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}