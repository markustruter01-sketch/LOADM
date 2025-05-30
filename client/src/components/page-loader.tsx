import { Suspense } from 'react';

// Loading component for lazy-loaded pages
const PageLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

// Wrapper component for lazy-loaded pages
export const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoading />}>
    {children}
  </Suspense>
);

export default PageLoading;