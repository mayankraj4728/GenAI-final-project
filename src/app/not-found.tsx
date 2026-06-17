import Link from "next/link";
import { AudioLines } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground">
        <AudioLines className="size-6" />
      </div>
      <p className="mt-6 font-heading text-3xl font-semibold tracking-tight">
        Page not found
      </p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn&apos;t find what you were looking for. It may have been moved
        or never existed.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
