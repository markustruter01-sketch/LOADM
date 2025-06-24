// REDESIGNED LOGIN COMPONENT - Robust authentication system
import { useState } from 'react';
import { useIsolatedAuth } from './auth-context';
import { Eye, EyeOff, Key, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";
import cargoBayImage from "../assets/cargo-bay.png";

export function NewLoginComponent() {
  const { login } = useIsolatedAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    console.log('🔐 NEW LOGIN: Attempting login for', email);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ NEW LOGIN: Login successful');
        setLoginAttempts(0);
      } else {
        setLoginAttempts(prev => prev + 1);
        if (loginAttempts >= 2) {
          setError('Multiple failed attempts. Try resetting your password if you\'re having trouble.');
        } else {
          setError('Invalid email or password. Please check your credentials.');
        }
      }
    } catch (error) {
      console.error('❌ NEW LOGIN: Login error:', error);
      setError('Login failed. Please try again.');
      setLoginAttempts(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 text-white">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4">
              <span className="text-white">LOADM</span>
              <span className="text-orange-400">workflow</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Professional Military Logistics Platform
            </p>
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img
                src={cargoBayImage}
                alt="Military cargo bay"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <p className="text-blue-200 mt-6">
              Streamline load planning, documentation, and training scenarios for military loadmasters.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome Back
                </h2>
                <p className="text-blue-200">
                  Sign in to access your LOADMworkflow account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                      placeholder="jasper.szemes@gmail.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-300" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg text-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !password}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>

                {/* Password Reset Button */}
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="w-full py-2 px-4 border border-white/30 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/20 text-center">
                <p className="text-blue-200 text-sm">
                  Royal Australian Air Force • LOADMworkflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <PasswordResetModal 
          onClose={() => setShowPasswordReset(false)}
          onSuccess={() => {
            setShowPasswordReset(false);
            setError('');
          }}
        />
      )}
    </div>
  );
}

// Enhanced Password Reset Modal Component
function PasswordResetModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setError('');
    setSuccess('');
    
    // Validation
    if (!email || !currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setError(passwordValidation);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/isolated-auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
      
      setSuccess('Password updated successfully! You can now log in with your new password.');
      setTimeout(() => {
        onSuccess();
      }, 2000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password (Default: Password1!)
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Password1!"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPasswords"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="showPasswords" className="text-sm text-gray-600">
                Show passwords
              </label>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
                {success}
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}