import { Link } from "wouter";
import { ArrowRight, ListChecks, Plane } from "lucide-react";
import { PageHeader, Section } from "@/components/common";
import { Card, CardContent } from "@/components/ui/card";
import { TOOLS, type ToolDef, type ToolGroup } from "@/components/tools/registry";
import { usePersona } from "@/lib/persona";

const GROUPS: Array<{ id: ToolGroup; title: string; description: string }> = [
  { id: "calculators", title: "Load calculators", description: "Restraint, balance, vehicle and fuel calculations." },
  { id: "psi", title: "Floor loading (PSI)", description: "Check cargo against aircraft floor limits." },
];

function ToolCard({ tool }: { tool: ToolDef }) {
  return (
    <Link href={`/tools/${tool.id}`} className="group block focus:outline-none">
      <Card className="h-full border-border/60 bg-card/60 transition-colors group-hover:border-primary/50 group-focus-visible:ring-2 group-focus-visible:ring-primary">
        <CardContent className="flex h-full flex-col gap-2 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
              <tool.icon className="h-4 w-4" />
            </span>
            <div className="font-semibold">{tool.title}</div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{tool.description}</p>
          {tool.formula && <code className="mt-auto w-fit rounded bg-background/60 px-2 py-0.5 text-xs text-muted-foreground">{tool.formula}</code>}
        </CardContent>
      </Card>
    </Link>
  );
}

function LinkCard({ href, icon: Icon, title, description }: { href: string; icon: typeof Plane; title: string; description: string }) {
  return (
    <Link href={href} className="group block focus:outline-none">
      <Card className="h-full border-primary/30 bg-primary/5 transition-colors group-hover:border-primary/60">
        <CardContent className="flex items-center gap-3 p-4">
          <Icon className="h-5 w-5 text-primary" />
          <div className="min-w-0">
            <div className="font-semibold">{title}</div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Tools() {
  const { can } = usePersona();
  return (
    <>
      <PageHeader eyebrow="Operate" title="Tools" description="Quick calculators for the cargo floor. All calculations run in your browser; nothing is saved." />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          {can("operate") && <LinkCard href="/load-planning" icon={Plane} title="Load planning" description="Build a pallet load for any airframe and check balance." />}
          <LinkCard href="/checklists" icon={ListChecks} title="Checklists" description="Run aircraft and cargo checklists step by step." />
        </div>
      </Section>

      {GROUPS.map((g) => (
        <Section key={g.id} title={g.title} description={g.description}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOOLS.filter((t) => t.group === g.id).map((t) => (
              <ToolCard key={t.id} tool={t} />
            ))}
          </div>
        </Section>
      ))}

      <p className="text-xs text-muted-foreground">Planning aids for training. Always confirm against the aircraft loading manual and squadron procedures.</p>
    </>
  );
}
