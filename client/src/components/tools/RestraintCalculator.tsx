import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Actions, CalcCard, Formula, NumberField, Placeholder, ResultBox, UnitToggle, parse } from "./shared";

/** Minimum restraint factors (G) per direction. */
const G_REQUIREMENTS = { forward: 3.0, aft: 1.5, lateral: 1.5, vertical: 2.0 } as const;

interface Result {
  effective: number;
  forwardAft: number;
  lateral: number;
  vertical: number;
  gRatio: number | null;
}

export default function RestraintCalculator() {
  const [metric, setMetric] = useState(false);
  const [cargoWeight, setCargoWeight] = useState("");
  const [totalForce, setTotalForce] = useState("");
  const [hAngle, setHAngle] = useState("");
  const [vAngle, setVAngle] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const unit = metric ? "kg" : "lbs";

  const calculate = () => {
    const force = parse(totalForce);
    const h = parse(hAngle);
    const v = parse(vAngle);
    const w = parse(cargoWeight);
    if (isNaN(force) || isNaN(h) || isNaN(v)) return;
    const hRad = (h * Math.PI) / 180;
    const vRad = (v * Math.PI) / 180;
    const effective = force * Math.cos(hRad);
    setResult({
      effective,
      forwardAft: force * Math.cos(hRad),
      lateral: force * Math.sin(hRad),
      vertical: force * Math.sin(vRad),
      gRatio: !isNaN(w) && w > 0 ? effective / w : null,
    });
  };

  const reset = () => {
    setCargoWeight("");
    setTotalForce("");
    setHAngle("");
    setVAngle("");
    setResult(null);
  };

  const weight = parse(cargoWeight);
  const hasWeight = !isNaN(weight) && weight > 0;

  const component = (label: string, value: number, requirement: number) => {
    const g = hasWeight ? value / weight : null;
    const ok = g !== null && g >= requirement;
    return (
      <div key={label} className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 p-3">
        <span className="text-sm font-medium">{label}</span>
        <div className="text-right">
          <div className="font-mono text-sm">
            {value.toFixed(1)} {unit}
          </div>
          {g !== null && value !== 0 && (
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <Badge variant={ok ? "default" : "destructive"} className="text-xs">
                {g.toFixed(2)}G
              </Badge>
              {!ok && <AlertTriangle className="h-3 w-3 text-destructive" aria-label={`Below ${requirement}G requirement`} />}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(m) => { setMetric(m); reset(); }} imperialLabel="lbs" metricLabel="kg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="Restraint parameters" description="Enter the restraint configuration and cargo details.">
          <NumberField id="cargo-weight" label={`Cargo weight (${unit})`} value={cargoWeight} onChange={setCargoWeight} placeholder="Enter cargo weight" />
          <NumberField id="total-force" label={`Total restraint force (${unit})`} value={totalForce} onChange={setTotalForce} placeholder="Enter total force applied" />
          <NumberField id="h-angle" label="Horizontal angle (degrees)" value={hAngle} onChange={setHAngle} placeholder="0–90 from forward" hint="0° = straight forward, 90° = straight lateral" />
          <NumberField id="v-angle" label="Vertical angle (degrees)" value={vAngle} onChange={setVAngle} placeholder="0–90 from horizontal" hint="0° = horizontal, 90° = straight up" />
          <Actions onCalculate={calculate} onReset={reset} calculateLabel="Calculate forces" />
        </CalcCard>

        <CalcCard title="Results" description="Effective forces and G-force analysis.">
          {result ? (
            <>
              <ResultBox label="Effective restraint force" value={`${result.effective.toFixed(1)} ${unit}`} sub={result.gRatio !== null ? `${result.gRatio.toFixed(2)}G restraint capacity` : undefined} />
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Component forces</h3>
                {component("Forward/Aft", result.forwardAft, G_REQUIREMENTS.forward)}
                {component("Lateral", result.lateral, G_REQUIREMENTS.lateral)}
                {component("Vertical", result.vertical, G_REQUIREMENTS.vertical)}
              </div>
            </>
          ) : (
            <Placeholder>Enter restraint parameters to calculate forces.</Placeholder>
          )}
        </CalcCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="Standard G-force requirements">
          {(
            [
              ["Forward restraint", G_REQUIREMENTS.forward],
              ["Aft restraint", G_REQUIREMENTS.aft],
              ["Lateral restraint", G_REQUIREMENTS.lateral],
              ["Vertical restraint", G_REQUIREMENTS.vertical],
            ] as const
          ).map(([l, g]) => (
            <div key={l} className="flex items-center justify-between text-sm">
              <span>{l}</span>
              <Badge variant="outline">{g}G</Badge>
            </div>
          ))}
        </CalcCard>
        <CalcCard title="Formulas">
          <Formula title="Effective force" lines={["Force × cos(horizontal angle)"]} example={metric ? "2,268 kg × cos(30°) = 1,964 kg" : "5,000 lbs × cos(30°) = 4,330 lbs"} />
          <Formula title="Component forces" lines={["Forward/Aft = Force × cos(θh)", "Lateral = Force × sin(θh)", "Vertical = Force × sin(θv)"]} />
          <Formula title="G-force" lines={["G = Component force ÷ Cargo weight"]} example={metric ? "1,964 kg ÷ 4,536 kg = 0.43G" : "4,330 lbs ÷ 10,000 lbs = 0.43G"} />
        </CalcCard>
      </div>
    </div>
  );
}
