"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Refreshes the current route every few seconds so a meeting that is still
 * being transcribed/analysed updates itself once processing completes.
 */
export function ProcessingAutoRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
