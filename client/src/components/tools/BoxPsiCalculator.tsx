import { useState } from "react";
import { Actions, CalcCard, ErrorNote, Formula, NumberField, Placeholder, ResultBox, UnitToggle, parse } from "./shared";

export default function BoxPsiCalculator() {
  const [metric, setMetric] = useState(false);
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const w = metric ? "kg" : "lbs";
  const d = metric ? "cm" : "in";
  const p = metric ? "kgf/cm²" : "PSI";

  const calculate = () => {
    setError(null);
    setResult(null);
    const wt = parse(weight);
    const l = parse(length);
    const wd = parse(width);
    if (isNaN(wt) || isNaN(l) || isNaN(wd)) return setError("Please enter valid numbers for all fields");
    if (l <= 0 || wd <= 0) return setError("Length and width must be greater than zero");
    setResult(wt / (l * wd));
  };

  const reset = () => {
    setWeight("");
    setLength("");
    setWidth("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(m) => { setMetric(m); reset(); }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="Square / rectangle box" description="Floor loading for a box resting on its full base.">
          <Formula title="Formula" lines={["Weight ÷ (Length × Width) = " + p]} example={metric ? "454 kg ÷ (122 cm × 102 cm) = 0.04 kgf/cm²" : "1,000 lbs ÷ (48 in × 40 in) = 0.52 PSI"} />
          <NumberField id="box-weight" label={`Weight (${w})`} value={weight} onChange={setWeight} placeholder="Total box weight" />
          <NumberField id="box-length" label={`Length (${d})`} value={length} onChange={setLength} placeholder="Length of contact surface" />
          <NumberField id="box-width" label={`Width (${d})`} value={width} onChange={setWidth} placeholder="Width of contact surface" />
          <ErrorNote message={error} />
          <Actions onCalculate={calculate} onReset={reset} calculateLabel="Calculate PSI" />
        </CalcCard>
        <CalcCard title="Result">
          {result !== null ? (
            <ResultBox label="Floor loading" value={`${result.toFixed(2)} ${p}`} sub={`Contact area ${(parse(length) * parse(width)).toLocaleString()} ${d}²`} />
          ) : (
            <Placeholder>Enter the box weight and footprint.</Placeholder>
          )}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>PSI measures the pressure a box exerts on the aircraft floor.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><span className="font-medium text-foreground">Maximum PSI limits</span> – each aircraft has floor limits that must not be exceeded.</li>
              <li><span className="font-medium text-foreground">Weight distribution</span> – spreading weight over a larger area reduces PSI.</li>
              <li><span className="font-medium text-foreground">Contact area</span> – only the surface touching the floor counts.</li>
            </ul>
            <p>Check the aircraft loading manual for allowable PSI; different floor areas may have different limits.</p>
          </div>
        </CalcCard>
      </div>
    </div>
  );
}
