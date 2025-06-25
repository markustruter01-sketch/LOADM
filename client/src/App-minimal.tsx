import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-orange-500">LOADMworkflow</h1>
            <h2 className="text-2xl font-semibold mb-6">Military Logistics Training Platform</h2>
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-medium mb-4">Training Modules Available</h3>
              <div className="grid gap-4">
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-orange-400">C-17 Globemaster III Fundamentals</h4>
                  <p className="text-gray-300 text-sm">Introduction to C-17 cargo loading fundamentals</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-orange-400">C-130 Hercules Operations</h4>
                  <p className="text-gray-300 text-sm">Complete C-130 loadmaster training</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <h4 className="font-semibold text-orange-400">KC30A Tanker Procedures</h4>
                  <p className="text-gray-300 text-sm">KC30A specific cargo and fuel operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default MinimalApp;