'use client';

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUserSession, logoutUser, setLocalCredits } from "@/store/slices/userSlice";
import { useCreditsQuery } from "@/hooks/useQueries";
import Sidebar from "./Sidebar";
import { User } from "lucide-react";

export default function DashboardLayout({ children, activeTab, hideSidebar = false }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.user);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Initialize session
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const u = localStorage.getItem("flowscrape_user");
        if (u) {
          const parsedUser = JSON.parse(u);
          dispatch(setUserSession(parsedUser));
        } else {
          // If no local session is present, bounce to authentication
          router.push("/loginregister");
        }
      } catch (e) {
        console.error("Local session validation failed:", e);
        router.push("/loginregister");
      } finally {
        setAuthLoaded(true);
      }
    }
  }, [dispatch, router]);

  const username = user?.username || "";

  // React Query query to fetch credits in real-time
  const { data: credits = 0 } = useCreditsQuery(username);

  // Sync state credit balance
  useEffect(() => {
    if (user && credits !== user.credits) {
      dispatch(setLocalCredits(credits));
    }
  }, [credits, user, dispatch]);

  const handleTabChange = (tabId) => {
    if (tabId === "home") {
      router.push("/");
    } else if (tabId === "workflows") {
      router.push("/workflow");
    } else {
      router.push(`/${tabId}`);
    }
  };

  const handleSignOut = () => {
    dispatch(logoutUser());
    router.push("/loginregister");
  };

  if (!authLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-zinc-500 font-mono text-xs select-none">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-6 h-6 border-2 border-zinc-750 border-t-zinc-300 rounded-full animate-spin" />
          <span>STARTING SECURE RUNTIME DAEMON...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-zinc-100 overflow-hidden font-sans">
      
      {/* Sidebar navigation */}
      {!hideSidebar && (
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          credits={credits}
        />
      )}

      {/* Main page center core */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-black">
        
        {/* Top Header info icons */}
        <div className="h-14 border-b border-zinc-800/60 flex items-center justify-end px-8 gap-4 bg-zinc-950/40 backdrop-blur-md shrink-0 select-none">
          {/* User badge with email and Sign Out action */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-zinc-400">
              {user.username}
            </span>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-lg shadow-black/20">
              <User className="w-3.5 h-3.5" />
            </div>
            <button
              id="logout-button"
              onClick={handleSignOut}
              className="text-[10px] text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 font-mono px-2 py-1 rounded ml-1 transition-colors duration-200 cursor-pointer"
            >
              SIGN OUT
            </button>
          </div>
        </div>

        {/* Page Content area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </div>

      </div>

    </div>
  );
}
