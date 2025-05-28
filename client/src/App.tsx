import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IsolatedAuthProvider, useIsolatedAuth } from './auth-isolated/auth-context';
import { IsolatedLoginForm } from './auth-isolated/login-component';
import { IsolatedUserDisplay } from './auth-isolated/logout-component';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
});

function AuthenticatedDashboard() {
  const { user } = useIsolatedAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">LOADMworkflow</h1>
            <IsolatedUserDisplay />
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <strong>✅ Authentication Working!</strong>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to LOADMworkflow, {user?.email}!
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800">Available Features</h3>
                  <div className="text-blue-700 mt-2">
                    <p>• Quiz Creation (Authentication Fixed!)</p>
                    <p>• Load Planning</p>
                    <p>• Instructor Portal</p>
                    <p>• Licensing Management</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800">Test Quiz Creation</h3>
                  <p className="text-yellow-700">
                    Try accessing /api/quizzes endpoint - authentication should now work!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useIsolatedAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <IsolatedLoginForm />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedDashboard />
    </QueryClientProvider>
  );
}

function App() {
  return (
    <IsolatedAuthProvider>
      <AppContent />
    </IsolatedAuthProvider>
  );
}

export default App;