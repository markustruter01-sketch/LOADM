import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Actions, CalcCard, ErrorNote, Formula, NumberField, Placeholder, ResultBox, UnitToggle, parse } from "./shared";

type DrumType = "with-rim" | "without-rim";

export default function DrumPsiCalculator() {
  const [metric, setMetric] = useState(false);
  const [weight, setWeight] = useState("");
  const [outer, setOuter] = useState("");
  const [inner, setInner] = useState("");
  const [drumType, setDrumType] = useState<DrumType>("with-rim");
  const [result, setResult] = useState<{ psi: number; area: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const w = metric ? "kg" : "lbs";
  const d = metric ? "cm" : "in";
  const p = metric ? "kgf/cm²" : "PSI";
  const a = metric ? "cm²" : "in²";

  const calculate = () => {
    setError(null);
    setResult(null);
    const wt = parse(weight);
    const od = parse(outer);
    const id = parse(inner);
    if (isNaN(wt) || isNaN(od)) return setError("Please enter valid numbers for all required fields");
    if (od <= 0) return setError("Outer diameter must be greater than zero");
    let area: number;
    if (drumType === "with-rim") {
      if (isNaN(id) || id <= 0) return setError("Inner diameter must be a valid positive number for drums with rim");
      if (id >= od) return setError("Inner diameter must be smaller than outer diameter");
      area = Math.PI * (Math.pow(od / 2, 2) - Math.pow(id / 2, 2));
    } else {
      area = Math.PI * Math.pow(od / 2, 2);
    }
    setResult({ psi: wt / area, area });
  };

  const reset = () => {
    setWeight("");
    setOuter("");
    setInner("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(m) => { setMetric(m); reset(); }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="Drum PSI" description="Rimmed drums bear on the rim ring only; rimless drums bear on the full base.">
          <RadioGroup value={drumType} onValueChange={(v) => { setDrumType(v as DrumType); setResult(null); setError(null); }} className="grid grid-cols-2 gap-2">
            {(
              [
                ["with-rim", "With rim"],
                ["without-rim", "Without rim"],
              ] as const
            ).map(([v, l]) => (
              <Label key={v} htmlFor={`drum-${v}`} className="flex cursor-pointer items-center gap-2 rounded-md border border-border/60 p-3 font-normal">
                <RadioGroupItem id={`drum-${v}`} value={v} /> {l}
              </Label>
            ))}
          </RadioGroup>
          <Formula
            title="Formula"
            lines={drumType === "with-rim" ? ["Area = π × (R² − r²)", `Weight ÷ Area = ${p}`] : ["Area = π × R²", `Weight ÷ Area = ${p}`]}
          />
          <NumberField id="drum-weight" label={`Weight (${w})`} value={weight} onChange={setWeight} placeholder="Total drum weight" />
          <NumberField id="drum-od" label={`Outer diameter (${d})`} value={outer} onChange={setOuter} placeholder={drumType === "with-rim" ? "Outer diameter of the rim" : "Diameter of the base"} />
          {drumType === "with-rim" && (
            <NumberField id="drum-id" label={`Inner diameter (${d})`} value={inner} onChange={setInner} placeholder="Inner diameter of the rim" />
          )}
          <ErrorNote message={error} />
          <Actions onCalculate={calculate} onReset={reset} calculateLabel="Calculate PSI" />
        </CalcCard>
        <CalcCard title="Result">
          {result ? (
            <>
              <ResultBox label="Floor loading" value={`${result.psi.toFixed(2)} ${p}`} />
              <ResultBox label="Contact area" value={`${result.area.toFixed(2)} ${a}`} />
            </>
          ) : (
            <Placeholder>Enter the drum weight and diameters.</Placeholder>
          )}
          <p className="text-sm text-muted-foreground">
            A rimmed drum concentrates its weight on a narrow ring, so its PSI is far higher than the same drum without a rim. Shoring may be needed to stay within
            floor limits.
          </p>
        </CalcCard>
      </div>
    </div>
  );
}
