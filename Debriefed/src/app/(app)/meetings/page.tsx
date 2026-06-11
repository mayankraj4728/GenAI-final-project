import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { MEETINGS } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MeetingsArchive } from "@/components/meetings-archive";

export const metadata: Metadata = {
  title: "Meetings",
};

export default function MeetingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        title="Meetings"
        description="Your searchable archive of every processed conversation."
      >
        <Button asChild>
          <Link href="/upload">
            <Plus className="size-4" />
            New meeting
          </Link>
        </Button>
      </PageHeader>

      <MeetingsArchive meetings={MEETINGS} />
    </div>
  );
}
