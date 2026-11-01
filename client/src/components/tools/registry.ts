import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { Anchor, Box, Calculator, Circle, Cylinder, Fuel, Package, Truck } from "lucide-react";
import RestraintCalculator from "./RestraintCalculator";
import FuelCalculator from "./FuelCalculator";
import WamCalculator from "./WamCalculator";
import VehicleCgfaCalculator from "./VehicleCgfaCalculator";
import BoxPsiCalculator from "./BoxPsiCalculator";
import DrumPsiCalculator from "./DrumPsiCalculator";
import SkiddedBoxPsiCalculator from "./SkiddedBoxPsiCalculator";
import TyrePsiCalculator from "./TyrePsiCalculator";

export type ToolGroup = "calculators" | "psi";

export interface ToolDef {
  id: string;
  title: string;
  description: string;
  formula?: string;
  icon: LucideIcon;
  group: ToolGroup;
  component: ComponentType;
}

/** Every calculator, in display order. `/tools/:id` resolves against this list. */
export const TOOLS: ToolDef[] = [
  { id: "restraint", title: "Restraint calculator", description: "Effective restraint force, components and G checks.", formula: "F × cos θ", icon: Anchor, group: "calculators", component: RestraintCalculator },
  { id: "wam", title: "WAM calculator", description: "Weight–arm–moment: solve for any one of the three.", formula: "Arm × Weight = Moment", icon: Calculator, group: "calculators", component: WamCalculator },
  { id: "vehicle-cgfa", title: "Vehicle CGFA", description: "Centre of gravity forward of the aft axle.", formula: "RAW × WB ÷ GW", icon: Truck, group: "calculators", component: VehicleCgfaCalculator },
  { id: "fuel", title: "Fuel calculator", description: "Burn rate, trip and reserve fuel estimates per airframe.", icon: Fuel, group: "calculators", component: FuelCalculator },
  { id: "box-psi", title: "Box PSI", description: "Square and rectangular box floor loading.", formula: "W ÷ (L × W)", icon: Box, group: "psi", component: BoxPsiCalculator },
  { id: "drum-psi", title: "Drum PSI", description: "Drums with a rim (ring contact) or without (full base).", formula: "W ÷ π(R² − r²)", icon: Cylinder, group: "psi", component: DrumPsiCalculator },
  { id: "skidded-box-psi", title: "Skidded box PSI", description: "Skid-mounted cargo floor loading.", formula: "GW ÷ (L × W × n)", icon: Package, group: "psi", component: SkiddedBoxPsiCalculator },
  { id: "tyre-psi", title: "Tyre PSI", description: "Pneumatic tyre floor loading, single or shared.", formula: "W ÷ (W × L)", icon: Circle, group: "psi", component: TyrePsiCalculator },
];

/** Legacy URLs that still resolve. */
const ALIASES: Record<string, string> = {
  "restraint-calculator": "restraint",
  "fuel-calculator": "fuel",
  "wam-calculator": "wam",
  "tire-psi": "tyre-psi",
  cgfa: "vehicle-cgfa",
};

export function findTool(id: string | undefined): ToolDef | undefined {
  if (!id) return undefined;
  const key = ALIASES[id] ?? id;
  return TOOLS.find((t) => t.id === key);
}
