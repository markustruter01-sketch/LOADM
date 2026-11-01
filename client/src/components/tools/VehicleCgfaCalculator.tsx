import { useState } from "react";
import { Actions, CalcCard, ErrorNote, Formula, NumberField, Placeholder, ResultBox, UnitToggle, parse } from "./shared";

export default function VehicleCgfaCalculator() {
  const [metric, setMetric] = useState(false);
  const [rearAxleWeight, setRearAxleWeight] = useState("");
  const [wheelbase, setWheelbase] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const w = metric ? "kg" : "lbs";
  const d = metric ? "cm" : "in";

  const calculate = () => {
    setError(null);
    const raw = parse(rearAxleWeight);
    const wb = parse(wheelbase);
    const gw = parse(grossWeight);
    setResult(null);
    if (isNaN(raw) || isNaN(wb) || isNaN(gw)) return setError("Please enter valid numbers for all fields");
    if (gw === 0) return setError("Gross Weight cannot be zero");
    if (raw > gw) return setError("Rear Axle Weight cannot be greater than Gross Weight");
    setResult((raw * wb) / gw);
  };

  const reset = () => {
    setRearAxleWeight("");
    setWheelbase("");
    setGrossWeight("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(m) => { setMetric(m); reset(); }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="CGFA calculator" description={`Centre of gravity forward of the aft axle, in ${d}.`}>
          <Formula title="Formula" lines={["RAW × WB ÷ GW = CGFA"]} example={metric ? "4,536 kg × 380 cm ÷ 9,072 kg = 190 cm" : "10,000 lbs × 150 in ÷ 20,000 lbs = 75 in"} />
          <NumberField id="cgfa-raw" label={`Rear axle weight (${w})`} value={rearAxleWeight} onChange={setRearAxleWeight} placeholder="RAW" hint="Weight on the rear (aft) axle(s)" />
          <NumberField id="cgfa-wb" label={`Wheelbase (${d})`} value={wheelbase} onChange={setWheelbase} placeholder="WB" hint="Distance between front and rear axle centrelines" />
          <NumberField id="cgfa-gw" label={`Gross weight (${w})`} value={grossWeight} onChange={setGrossWeight} placeholder="GW" hint="Total vehicle weight" />
          <ErrorNote message={error} />
          <Actions onCalculate={calculate} onReset={reset} calculateLabel="Calculate CGFA" />
        </CalcCard>
        <CalcCard title="Result">
          {result !== null ? (
            <ResultBox label="CGFA" value={`${result.toFixed(2)} ${d}`} sub={`Centre of gravity is ${result.toFixed(2)} ${d} forward of the aft axle.`} />
          ) : (
            <Placeholder>Enter axle weight, wheelbase and gross weight.</Placeholder>
          )}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>CGFA locates the vehicle&apos;s centre of gravity relative to the aft axle so it can be converted to a fuselage station for weight and balance.</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><span className="font-medium text-foreground">RAW</span> – rear axle weight</li>
              <li><span className="font-medium text-foreground">WB</span> – wheelbase</li>
              <li><span className="font-medium text-foreground">GW</span> – gross weight</li>
            </ul>
            <p>Weigh axles on calibrated scales; for multiple rear axles use the combined rear weight and the distance to the centre of the rear axle group.</p>
          </div>
        </CalcCard>
      </div>
    </div>
  );
}
