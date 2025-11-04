// REDESIGNED LOGIN COMPONENT - Dark theme with DDG branding
import { useState } from 'react';
import { useIsolatedAuth } from './auth-context';
import { Eye, EyeOff, Key, Lock, Mail, AlertCircle, CheckCircle } from "lucide-react";
import logoImage from "@assets/DDG_Logo_New_1762131149453.png";
import nameImage from "@assets/DDG_NAME_New_1762131149454.png";

export function RedesignedLogin() {
  const { login } = useIsolatedAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    console.log('🔐 REDESIGNED LOGIN: Attempting login for', email);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ REDESIGNED LOGIN: Login successful');
      } else {
        setError('Invalid email or password. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('❌ REDESIGNED LOGIN: Login error:', error);
      
      if (error.message && error.message.includes('license has expired')) {
        setError(error.message);
      } else if (error.message && error.message.includes('license is invalid')) {
        setError(error.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      {/* Login Form Overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-2xl shadow-2xl border border-[#333333] overflow-hidden">
            {/* Header Section with Logos */}
            <div className="px-8 pt-10 pb-6 border-b border-[#333333] bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]">
              <div className="flex flex-col items-center space-y-5">
                {/* DDG Circular Logo */}
                <img 
                  src={logoImage} 
                  alt="DDG Logo" 
                  className="h-24 w-auto drop-shadow-2xl" 
                />
                
                {/* Digital Dynamics Group Text Logo */}
                <img 
                  src={nameImage} 
                  alt="Digital Dynamics Group" 
                  className="h-10 w-auto opacity-90" 
                />
                
                {/* Welcome Text */}
                <div className="text-center space-y-2 pt-2">
                  <h2 className="text-2xl font-bold text-white">
                    Welcome Back
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Sign in to access your LOADMworkflow account
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-8 py-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="name@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-[#2a2a2a] border border-[#444444] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !password}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                  className="w-full py-2.5 px-4 border border-[#444444] text-gray-300 hover:text-white hover:bg-[#2a2a2a] hover:border-orange-500/50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  Reset Password
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-[#2a2a2a] px-8 py-4 border-t border-[#333333]">
              <p className="text-gray-500 text-xs text-center">
                Royal Australian Air Force • LOADMworkflow
              </p>
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

// Password Reset Modal Component with Dark Theme
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md border border-[#333333]">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">Reset Password</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444444] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password (Default: Password1!)
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444444] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                placeholder="Password1!"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444444] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#444444] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500"
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
                className="mr-2 w-4 h-4 accent-orange-500"
              />
              <label htmlFor="showPasswords" className="text-sm text-gray-400">
                Show passwords
              </label>
            </div>
            
            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/50 p-3 rounded-lg">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-400 text-sm bg-green-900/20 border border-green-800/50 p-3 rounded-lg">
                {success}
              </div>
            )}
            
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-[#444444] text-gray-300 hover:bg-[#2a2a2a] hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 rounded-lg transition-all shadow-lg shadow-orange-500/20"
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
