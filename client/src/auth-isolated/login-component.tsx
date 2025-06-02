// ISOLATED LOGIN COMPONENT - Works independently
import { useState } from 'react';
import { useIsolatedAuth } from './auth-context';
import { FileCheck, ClipboardList, Package2, UserCircle, Wrench, GraduationCap, Key } from "lucide-react";
import cargoBayImage from "../assets/cargo-bay.png";

export function IsolatedLoginForm() {
  const { login, isLoading } = useIsolatedAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError('');
    
    console.log('✅ ISOLATED COMPONENT: Login form submitted');
    
    try {
      const success = await login(email, password);
      
      if (success) {
        console.log('✅ ISOLATED COMPONENT: Login successful');
        // Let the auth context handle the redirect
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('✅ ISOLATED COMPONENT: Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Blurred Background - Homepage Content */}
      <div className="absolute inset-0 filter blur-sm pointer-events-none">
        <div className="min-h-screen bg-background">
          {/* Header Section */}
          <div className="bg-muted shadow-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-foreground">LOADMworkflow</h1>
              <div className="text-sm text-muted-foreground">Service Branch: Air Force</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Welcome Section */}
            <section className="mb-10 text-center">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Welcome to <span className="text-foreground">LOADM</span><span className="text-primary">workflow</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Professional documentation and scenario tools for loadmasters
              </p>

              {/* Featured Section Banner */}
              <div className="relative rounded-xl overflow-hidden shadow-xl mb-10 h-64">
                <img
                  src={cargoBayImage}
                  alt="Military cargo loadmaster in aircraft bay"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-foreground mb-2 text-left">
                      Streamline Your Loadmaster Experience
                    </h3>
                    <p className="text-muted-foreground max-w-xl text-left">
                      Access Load Planning, Documentation, Training Scenarios and Assessments.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                { icon: FileCheck, title: "Documents", desc: "Access cargo manifests and documentation" },
                { icon: ClipboardList, title: "Scenarios", desc: "Practice with realistic training scenarios" },
                { icon: Package2, title: "Load Planning", desc: "Plan aircraft cargo loads efficiently" },
                { icon: UserCircle, title: "Profile", desc: "Manage your personal information" },
                { icon: Wrench, title: "Tools", desc: "Loadmaster calculation tools" },
                { icon: GraduationCap, title: "Training", desc: "Complete training modules" }
              ].map((item, index) => (
                <div key={index} className="bg-card rounded-lg p-6 border border-border">
                  <item.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-card/95 backdrop-blur-md shadow-2xl border border-border rounded-xl p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Access your LOADMworkflow dashboard
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="markustruter01@gmail.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 border border-destructive/20 p-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-border text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Key className="h-4 w-4" />
                Reset Password
              </button>
            </div>

          </form>
        </div>
      </div>
      
      {/* Password Reset Modal */}
      {showPasswordReset && (
        <PasswordResetModal 
          onClose={() => setShowPasswordReset(false)}
          onSuccess={() => {
            setShowPasswordReset(false);
            setError('');
            // Optionally clear the form or show success message
          }}
        />
      )}
    </div>
  );
}

// Password Reset Modal Component
function PasswordResetModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*]/.test(password)) return 'Password must contain at least one special character (!@#$%^&*)';
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-foreground">Reset Password</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          

          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="your.email@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Password1!"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Confirm new password"
                required
              />
            </div>
            
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-600 text-sm bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 p-3 rounded">
                {success}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
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