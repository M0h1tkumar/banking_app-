"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; status: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:4000/api/auth/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        // ignore errors here, page.tsx handles auth redirects
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const displayName = user ? user.email.split('@')[0] : "Guest";
  const displayInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 glass-panel border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold tracking-wide text-gray-200 hidden md:block">
          Good morning, {displayName}
        </h2>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-white transition-colors relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span className="absolute top-0 right-0 w-2 h-2 bg-brand rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand to-brand-dark flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-brand/20 group-hover:shadow-brand/40 transition-shadow">
              {displayInitial}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-200">{displayName}</p>
              <p className="text-xs text-brand">{user?.status === 'ACTIVE' ? 'Premium Account' : 'Standard Account'}</p>
            </div>
          </div>
          
          {user && (
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 transition-colors">
              Log Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
