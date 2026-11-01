import { Link } from "wouter";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16">
      <EmptyState
        icon={<Compass className="h-8 w-8" />}
        title="Page not found"
        description="That link doesn't go anywhere in this build."
        action={
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
