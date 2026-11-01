import { AIRCRAFT_LABELS, AIRCRAFT_TYPES, type AircraftType, type ChecklistCategory } from "@shared/constants";

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  startup: "Start-up",
  shutdown: "Shutdown",
  "pre-flight": "Pre-flight",
  "post-flight": "Post-flight",
  emergency: "Emergency",
};

/** Checklist `aircraftType` is free text ("General" or an aircraft code). */
export function aircraftName(a: string): string {
  return (AIRCRAFT_TYPES as readonly string[]).includes(a) ? AIRCRAFT_LABELS[a as AircraftType] : a;
}
