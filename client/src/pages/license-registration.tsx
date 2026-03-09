import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, User, Mail, Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function LicenseRegistration() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'license' | 'account'>('license');
  const [licenseData, setLicenseData] = useState({
    email: '',
    username: '',
    licenseKey: ''
  });
  const [accountData, setAccountData] = useState({
    password: '',
    confirmPassword: '',
    squadron: ''
  });
  const [verifiedLicense, setVerifiedLicense] = useState<any>(null);
  const { toast } = useToast();

  // Verify license mutation
  const verifyLicenseMutation = useMutation({
    mutationFn: async (data: typeof licenseData) => {
      const response = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'License verification failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setVerifiedLicense(data);
      setStep('account');
      toast({
        title: "License verified successfully!",
        description: "Please create your account to complete registration."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "License verification failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Register account mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/register', {
        method: 'POST',
        body: JSON.stringify({
          ...licenseData,
          ...accountData
        })
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Account created successfully!",
        description: "You can now log in with your credentials."
      });
      setLocation('/login');
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleLicenseVerification = (e: React.FormEvent) => {
    e.preventDefault();
    verifyLicenseMutation.mutate(licenseData);
  };

  const handleAccountCreation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accountData.password !== accountData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please ensure both passwords match.",
        variant: "destructive"
      });
      return;
    }

    if (accountData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    registerMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Dark header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/superadmin-dashboard")}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Super Admin
            </Button>
            <div className="h-5 w-px bg-slate-700" />
            <div className="p-2 bg-blue-600 rounded-lg">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">License Registration</h1>
              <p className="text-slate-400 text-xs">Register a new user with a valid license key</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 pt-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">License Registration</h1>
          <p className="text-slate-400 mt-2">
            {step === 'license' ? 'Enter your license details to get started' : 'Create your account to complete setup'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${step === 'license' ? 'text-blue-600' : 'text-green-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'license' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {step === 'account' ? <CheckCircle className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium">License</span>
          </div>
          <div className={`h-px w-8 ${step === 'account' ? 'bg-green-500' : 'bg-slate-600'}`} />
          <div className={`flex items-center space-x-2 ${step === 'account' ? 'text-blue-400' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'account' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-300'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Account</span>
          </div>
        </div>

        {step === 'license' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Verify License
              </CardTitle>
              <CardDescription>
                Enter the license details provided by your administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLicenseVerification} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={licenseData.email}
                    onChange={(e) => setLicenseData({ ...licenseData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={licenseData.username}
                    onChange={(e) => setLicenseData({ ...licenseData, username: e.target.value })}
                    placeholder="Enter your username"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="licenseKey">License Key</Label>
                  <Input
                    id="licenseKey"
                    value={licenseData.licenseKey}
                    onChange={(e) => setLicenseData({ ...licenseData, licenseKey: e.target.value.toUpperCase() })}
                    placeholder="Enter your license key"
                    required
                    className="mt-1 font-mono"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={verifyLicenseMutation.isPending}
                >
                  {verifyLicenseMutation.isPending ? "Verifying..." : "Verify License"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Create Account
              </CardTitle>
              <CardDescription>
                Set up your account to access the training platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verifiedLicense && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    License verified for <strong>{verifiedLicense.username}</strong>
                    <br />
                    <span className="text-sm">Expires: {new Date(verifiedLicense.expiryDate).toLocaleDateString()}</span>
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleAccountCreation} className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={accountData.password}
                    onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                    placeholder="Create a password"
                    required
                    minLength={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={accountData.confirmPassword}
                    onChange={(e) => setAccountData({ ...accountData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    required
                    minLength={6}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="squadron">Squadron</Label>
                  <select
                    id="squadron"
                    value={accountData.squadron}
                    onChange={(e) => setAccountData({ ...accountData, squadron: e.target.value })}
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select your squadron</option>
                    <option value="33SQN">33 Squadron</option>
                    <option value="35SQN">35 Squadron</option>
                    <option value="36SQN">36 Squadron</option>
                    <option value="37SQN">37 Squadron</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('license')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <button
              onClick={() => setLocation('/login')}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}