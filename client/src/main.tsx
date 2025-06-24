import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TrainingModules from "./pages/training-modules/index";

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
      <TrainingModules />
    </QueryClientProvider>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
