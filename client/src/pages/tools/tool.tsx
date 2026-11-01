import { Link, useParams } from "wouter";
import { EmptyState, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { findTool } from "@/components/tools/registry";

export default function ToolPage() {
  const { tool } = useParams<{ tool: string }>();
  const def = findTool(tool);
  if (!def) {
    return (
      <EmptyState
        title="Tool not found"
        description="That calculator doesn't exist. Pick one from the tools list."
        action={
          <Button asChild>
            <Link href="/tools">All tools</Link>
          </Button>
        }
      />
    );
  }
  const Calc = def.component;
  return (
    <>
      <PageHeader backHref="/tools" eyebrow="Tools" title={def.title} description={def.description} />
      <Calc />
    </>
  );
}
