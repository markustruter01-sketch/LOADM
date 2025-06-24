import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">LOADMworkflow Training Modules</h1>
          <p className="text-gray-400 mb-8">Frontend test - checking if basic React loads</p>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Connection Test</h2>
            <p>If you can see this, the React frontend is working.</p>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default App;