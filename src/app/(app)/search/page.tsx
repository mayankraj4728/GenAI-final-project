import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { SearchWorkspace } from "@/components/search-workspace";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Search the archive"
        description="Ask questions in plain language — answers are drawn from every transcript."
      />
      <SearchWorkspace />
    </div>
  );
}
