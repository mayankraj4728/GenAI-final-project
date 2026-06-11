import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Analytics"
        description="Trends across your meetings — participation, follow-through, and recurring themes."
      />
      <AnalyticsDashboard />
    </div>
  );
}
