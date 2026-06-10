'use client';

import React from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import HomeDashboard from "@/components/HomeDashboard";

export default function HomePage() {
  const router = useRouter();

  const handleTabChange = (tabId) => {
    if (tabId === "home") {
      router.push("/");
    } else if (tabId === "workflows") {
      router.push("/workflow");
    } else {
      router.push(`/${tabId}`);
    }
  };

  return (
    <DashboardLayout activeTab="home">
      <HomeDashboard onTabChange={handleTabChange} />
    </DashboardLayout>
  );
}
