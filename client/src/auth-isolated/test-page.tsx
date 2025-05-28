// ISOLATED TEST PAGE - Shows authentication working
import { useIsolatedAuth } from './auth-context';
import { IsolatedLoginForm } from './login-component';
import { IsolatedUserDisplay } from './logout-component';

export function IsolatedTestPage() {
  const { user, isLoading } = useIsolatedAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading authentication...</div>
      </div>
    );
  }

  if (!user) {
    return <IsolatedLoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Authentication Test - SUCCESS!
            </h1>
            <IsolatedUserDisplay />
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-800">✅ Login Working</h2>
              <p className="text-green-700">You are successfully logged in as: {user.email}</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800">User Information</h2>
              <div className="text-blue-700 space-y-1">
                <p>ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                {user.firstName && <p>Name: {user.firstName} {user.lastName}</p>}
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="font-semibold text-yellow-800">Test Logout</h2>
              <p className="text-yellow-700 mb-2">
                Click the logout button above to test the logout functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}