// SIGN-IN SCREEN - Dark theme with DDG branding. The visitor picks a demo role.
import { useState } from 'react';
import { useIsolatedAuth } from './auth-context';
import { AlertCircle, CheckCircle } from "lucide-react";
import { ROLES, ROLE_LABELS, type Role } from "@shared/constants";
import logoImage from "@assets/ddg-logo.png";
import nameImage from "@assets/ddg-name.png";

export function RedesignedLogin() {
  const { login } = useIsolatedAuth();
  const [pending, setPending] = useState<Role | null>(null);
  const [error, setError] = useState('');

  const choose = async (role: Role) => {
    if (pending) return;
    setPending(role);
    setError('');
    const success = await login(role);
    if (!success) setError('Could not open that role. Please try again.');
    setPending(null);
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
                    Welcome
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Choose a role to explore LOADMworkflow
                  </p>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="px-8 py-8">
              <div className="space-y-3">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => choose(role)}
                    disabled={pending !== null}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {pending === role ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {ROLE_LABELS[role]}
                  </button>
                ))}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
              </div>
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

    </div>
  );
}
