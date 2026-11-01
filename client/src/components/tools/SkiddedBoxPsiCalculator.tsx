import { useState } from "react";
import { Actions, CalcCard, ErrorNote, Formula, NumberField, Placeholder, ResultBox, UnitToggle, parse } from "./shared";

export default function SkiddedBoxPsiCalculator() {
  const [metric, setMetric] = useState(false);
  const [grossWeight, setGrossWeight] = useState("");
  const [skidLength, setSkidLength] = useState("");
  const [skidWidth, setSkidWidth] = useState("");
  const [skidCount, setSkidCount] = useState("");
  const [result, setResult] = useState<{ psi: number; area: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const w = metric ? "kg" : "lbs";
  const d = metric ? "cm" : "in";
  const p = metric ? "kgf/cm²" : "PSI";
  const a = metric ? "cm²" : "in²";

  const calculate = () => {
    setError(null);
    setResult(null);
    const gw = parse(grossWeight);
    const l = parse(skidLength);
    const wd = parse(skidWidth);
    const n = parseInt(skidCount, 10);
    if (isNaN(gw) || isNaN(l) || isNaN(wd) || isNaN(n)) return setError("Please enter valid numbers for all fields");
    if (gw <= 0 || l <= 0 || wd <= 0 || n <= 0) return setError("All values must be greater than zero");
    const area = l * wd * n;
    setResult({ psi: gw / area, area });
  };

  const reset = () => {
    setGrossWeight("");
    setSkidLength("");
    setSkidWidth("");
    setSkidCount("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(m) => { setMetric(m); reset(); }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="Skidded box PSI" description="Only the skids touch the floor, so only skid area counts.">
          <Formula title="Formula" lines={[`GW ÷ (L × W × number of skids) = ${p}`]} example={metric ? "907 kg ÷ (122 cm × 10 cm × 2) = 0.37 kgf/cm²" : "2,000 lbs ÷ (48 in × 4 in × 2) = 5.21 PSI"} />
          <NumberField id="skid-gw" label={`Gross weight (${w})`} value={grossWeight} onChange={setGrossWeight} placeholder="Total weight including skids" />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="skid-l" label={`Skid length (${d})`} value={skidLength} onChange={setSkidLength} placeholder="Length of one skid" />
            <NumberField id="skid-w" label={`Skid width (${d})`} value={skidWidth} onChange={setSkidWidth} placeholder="Width of one skid" />
          </div>
          <NumberField id="skid-n" label="Number of skids" value={skidCount} onChange={setSkidCount} placeholder="e.g. 2" step="1" />
          <ErrorNote message={error} />
          <Actions onCalculate={calculate} onReset={reset} calculateLabel="Calculate PSI" />
        </CalcCard>
        <CalcCard title="Result">
          {result ? (
            <>
              <ResultBox label="Floor loading" value={`${result.psi.toFixed(2)} ${p}`} />
              <ResultBox label="Total skid contact area" value={`${result.area.toFixed(2)} ${a}`} />
            </>
          ) : (
            <Placeholder>Enter the gross weight and skid dimensions.</Placeholder>
          )}
          <p className="text-sm text-muted-foreground">
            Skids concentrate load into narrow strips. If the result exceeds the floor limit, add shoring under the skids to increase the contact area.
          </p>
        </CalcCard>
      </div>
    </div>
  );
}
