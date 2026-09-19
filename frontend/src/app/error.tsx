"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="glass-panel p-8 rounded-2xl max-w-lg w-full border border-red-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-gray-400 mb-8 text-sm">
          We encountered an unexpected error while rendering this page. Our engineers have been notified.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-brand text-black font-bold py-3 px-6 rounded-xl hover:bg-white transition-colors shadow-lg shadow-brand/20"
          >
            Try Again
          </button>
          
          <Link 
            href="/"
            className="bg-white/5 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
          >
            Return Home
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
           <div className="mt-8 text-left bg-black/40 p-4 rounded-xl overflow-auto text-xs text-red-400 border border-red-500/20 max-h-40">
             <p className="font-mono break-all">{error.message}</p>
           </div>
        )}
      </div>
    </div>
  );
}
