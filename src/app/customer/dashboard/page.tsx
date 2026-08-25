"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardPlaceholder from "@/components/dashboard/DashboardPlaceholder";

export default function CustomerDashboardPage() {
  return (
    <DashboardShell>
      <DashboardPlaceholder
        title="Customer Dashboard"
        description="Your bookings, addresses and settings will appear here. This area is under construction."
      />
    </DashboardShell>
  );
}
