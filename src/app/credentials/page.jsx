'use client';

import React from "react";
import { useAppSelector } from "@/store/hooks";
import DashboardLayout from "@/components/DashboardLayout";
import CredentialsView from "@/components/CredentialsView";

export default function CredentialsPage() {
  const { user } = useAppSelector((state) => state.user);

  return (
    <DashboardLayout activeTab="credentials">
      <CredentialsView user={user} />
    </DashboardLayout>
  );
}
