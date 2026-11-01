import type { Capability } from "@shared/constants";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, GraduationCap, ClipboardCheck, FileQuestion, BookOpen, ListChecks, Plane, Wrench,
  FileText, Phone, MessageSquare, UserCircle, Users, Gauge, ShieldAlert, Award, Activity, Database, Layers, History,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Capability required; undefined = everyone with a persona. */
  requires?: Capability;
  /** Mark active for any path under href. */
  prefix?: boolean;
}

export interface NavSection {
  title: string;
  requires?: Capability;
  items: NavItem[];
}

/**
 * The single navigation definition. Sections and items are filtered by the
 * persona's capabilities, so each role sees exactly what it can use.
 */
export const NAV: NavSection[] = [
  {
    title: "Train",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Training modules", href: "/training", icon: GraduationCap, prefix: true },
      { label: "Quizzes", href: "/quizzes", icon: FileQuestion, prefix: true },
      { label: "Scenarios", href: "/scenarios", icon: ClipboardCheck, prefix: true },
      { label: "Checklists", href: "/checklists", icon: ListChecks, prefix: true },
      { label: "My profile", href: "/profile", icon: UserCircle },
    ],
  },
  {
    title: "Operate",
    requires: "operate",
    items: [
      { label: "Load planning", href: "/load-planning", icon: Plane, prefix: true, requires: "operate" },
      { label: "Missions", href: "/missions", icon: Layers, prefix: true, requires: "operate" },
      { label: "Documents", href: "/documents", icon: FileText, prefix: true, requires: "operate" },
      { label: "Tools", href: "/tools", icon: Wrench, prefix: true },
      { label: "Directory", href: "/directory", icon: Phone },
      { label: "Crew chat", href: "/chat", icon: MessageSquare },
    ],
  },
  {
    title: "Instruct",
    requires: "instruct",
    items: [
      { label: "Instructor dashboard", href: "/instructor", icon: BookOpen, requires: "instruct" },
      { label: "Review queue", href: "/instructor/reviews", icon: ClipboardCheck, prefix: true, requires: "instruct" },
      { label: "Students", href: "/instructor/students", icon: Users, prefix: true, requires: "instruct" },
      { label: "Question bank", href: "/instructor/question-bank", icon: Database, requires: "instruct" },
      { label: "Manage quizzes", href: "/instructor/quizzes", icon: FileQuestion, prefix: true, requires: "instruct" },
      { label: "Manage scenarios", href: "/instructor/scenarios", icon: ClipboardCheck, prefix: true, requires: "instruct" },
      { label: "Manage modules", href: "/instructor/modules", icon: GraduationCap, prefix: true, requires: "instruct" },
      { label: "Manage checklists", href: "/instructor/checklists", icon: ListChecks, prefix: true, requires: "instruct" },
      { label: "Safety records", href: "/instructor/safety", icon: ShieldAlert, prefix: true, requires: "instruct" },
    ],
  },
  {
    title: "Command",
    requires: "command",
    items: [
      { label: "Readiness", href: "/command", icon: Gauge, requires: "command" },
      { label: "Performance", href: "/command/performance", icon: Activity, requires: "command" },
      { label: "Currency & forecast", href: "/command/currency", icon: Award, requires: "command" },
      { label: "Safety", href: "/command/safety", icon: ShieldAlert, requires: "command" },
      { label: "Flight operations", href: "/command/flight-ops", icon: Plane, requires: "command" },
      { label: "Personnel", href: "/command/personnel", icon: Users, prefix: true, requires: "command" },
      { label: "Activity log", href: "/command/activity", icon: History, requires: "command" },
    ],
  },
];

export function visibleNav(can: (c: Capability) => boolean): NavSection[] {
  return NAV.filter((s) => !s.requires || can(s.requires))
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.requires || can(i.requires)) }))
    .filter((s) => s.items.length > 0);
}
