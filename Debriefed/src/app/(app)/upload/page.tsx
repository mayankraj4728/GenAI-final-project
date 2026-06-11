import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { UploadWorkspace } from "@/components/upload-workspace";

export const metadata: Metadata = {
  title: "Upload a meeting",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="New meeting"
        description="Upload a recording or capture live — we'll do the rest in under 2 minutes."
      />
      <UploadWorkspace />
    </div>
  );
}
