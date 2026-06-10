'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setUserSession } from "@/store/slices/userSlice";
import AuthScreen from "@/components/AuthScreen";

export default function LoginRegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleAuthSuccess = (authenticatedUser) => {
    dispatch(setUserSession(authenticatedUser));
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
      <AuthScreen onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}
