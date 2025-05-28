// ISOLATED LOGIN COMPONENT - Works independently
import { useState } from 'react';
import { useIsolatedAuth } from './auth-context';
import { FileCheck, ClipboardList, Package2, UserCircle, Wrench, GraduationCap } from "lucide-react";
import cargoBayImage from "../assets/cargo-bay.png";

export function IsolatedLoginForm() {
  const { login, isLoading } = useIsolatedAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
          {/* Header Section */}
          <div className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-slate-900">LOADMworkflow</h1>
              <div className="text-sm text-slate-600">Service Branch: Air Force</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Welcome Section */}
            <section className="mb-10 text-center">
              <h2 className="text-3xl font-bold mb-4 text-white">
                Welcome to <span className="text-white">LOADM</span><span className="text-blue-400">workflow</span>
              </h2>
              <p className="text-slate-300 mb-6">
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
                    <h3 className="text-2xl font-bold text-white mb-2 text-left">
                      Streamline Your Loadmaster Experience
                    </h3>
                    <p className="text-slate-200 max-w-xl text-left">
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
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                  <item.icon className="w-12 h-12 text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-300 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Login Form Overlay */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md shadow-2xl border border-white/20 rounded-xl p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Access your LOADMworkflow dashboard
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white/90"
                  placeholder="markustruter01@gmail.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white/90"
                  placeholder="Your password"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50/90 p-3 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-xs text-slate-500 text-center bg-slate-100/80 p-3 rounded">
              <p className="font-medium">Demo Credentials:</p>
              <p>Email: markustruter01@gmail.com</p>
              <p>Password: Skating69!</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}