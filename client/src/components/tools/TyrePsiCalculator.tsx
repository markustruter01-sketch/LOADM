import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Actions, CalcCard, ErrorNote, Formula, NumberField, ResultBox, UnitToggle, parse } from "./shared";

type Mode = "single-tire" | "multiple-tires";

export default function TyrePsiCalculator() {
  const [metric, setMetric] = useState(false);
  const [tab, setTab] = useState<Mode>("single-tire");
  const [weight, setWeight] = useState("");
  const [contactWidth, setContactWidth] = useState("");
  const [contactLength, setContactLength] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [tyreCount, setTyreCount] = useState("");
  const [tyreWidth, setTyreWidth] = useState("");
  const [tyreLength, setTyreLength] = useState("");
  const [singlePsi, setSinglePsi] = useState<number | null>(null);
  const [multiPsi, setMultiPsi] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const w = metric ? "kg" : "lbs";
  const d = metric ? "cm" : "in";
  const p = metric ? "kgf/cm²" : "PSI";

  const calcSingle = () => {
    setError(null);
    setSinglePsi(null);
    const wt = parse(weight);
    const wd = parse(contactWidth);
    const l = parse(contactLength);
    if (isNaN(wt) || isNaN(wd) || isNaN(l)) return setError("Please enter valid numbers for all fields");
    if (wt <= 0 || wd <= 0 || l <= 0) return setError("All values must be greater than zero");
    setSinglePsi(wt / (wd * l));
  };

  const calcMulti = () => {
    setError(null);
    setMultiPsi(null);
    const tw = parse(totalWeight);
    const n = parseInt(tyreCount, 10);
    const wd = parse(tyreWidth);
    const l = parse(tyreLength);
    if (isNaN(tw) || isNaN(n) || isNaN(wd) || isNaN(l)) return setError("Please enter valid numbers for all fields");
    if (tw <= 0 || n <= 0 || wd <= 0 || l <= 0) return setError("All values must be greater than zero");
    setMultiPsi(tw / n / (wd * l));
  };

  const resetTab = () => {
    if (tab === "single-tire") {
      setWeight("");
      setContactWidth("");
      setContactLength("");
      setSinglePsi(null);
    } else {
      setTotalWeight("");
      setTyreCount("");
      setTyreWidth("");
      setTyreLength("");
      setMultiPsi(null);
    }
    setError(null);
  };

  const resetAll = () => {
    setWeight("");
    setContactWidth("");
    setContactLength("");
    setTotalWeight("");
    setTyreCount("");
    setTyreWidth("");
    setTyreLength("");
    setSinglePsi(null);
    setMultiPsi(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(m) => { setMetric(m); resetAll(); }} />
      <CalcCard title="Pneumatic tyre PSI" description="Measure the tyre footprint (contact patch) on the floor, not the tyre size.">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as Mode); setError(null); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single-tire">Single tyre</TabsTrigger>
            <TabsTrigger value="multiple-tires">Multiple tyres</TabsTrigger>
          </TabsList>
          <TabsContent value="single-tire" className="space-y-4 pt-4">
            <Formula title="Formula" lines={[`Weight on tyre ÷ (Width × Length) = ${p}`]} example={metric ? "1,134 kg ÷ (20 cm × 25 cm) = 2.27 kgf/cm²" : "2,500 lbs ÷ (8 in × 10 in) = 31.25 PSI"} />
            <NumberField id="tyre-w" label={`Weight on tyre (${w})`} value={weight} onChange={setWeight} placeholder="Weight carried by this tyre" />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="tyre-cw" label={`Contact width (${d})`} value={contactWidth} onChange={setContactWidth} placeholder="Footprint width" />
              <NumberField id="tyre-cl" label={`Contact length (${d})`} value={contactLength} onChange={setContactLength} placeholder="Footprint length" />
            </div>
            <ErrorNote message={error} />
            <Actions onCalculate={calcSingle} onReset={resetTab} calculateLabel="Calculate PSI" />
            {singlePsi !== null && <ResultBox label="Tyre floor loading" value={`${singlePsi.toFixed(2)} ${p}`} />}
          </TabsContent>
          <TabsContent value="multiple-tires" className="space-y-4 pt-4">
            <Formula title="Formula" lines={["Weight per tyre = Total weight ÷ Number of tyres", `Weight per tyre ÷ (Width × Length) = ${p}`]} example={metric ? "4,536 kg ÷ 4 = 1,134 kg per tyre" : "10,000 lbs ÷ 4 = 2,500 lbs per tyre"} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="tyres-tw" label={`Total weight (${w})`} value={totalWeight} onChange={setTotalWeight} placeholder="Vehicle gross weight" />
              <NumberField id="tyres-n" label="Number of tyres" value={tyreCount} onChange={setTyreCount} placeholder="e.g. 4" step="1" />
              <NumberField id="tyres-w" label={`Single tyre contact width (${d})`} value={tyreWidth} onChange={setTyreWidth} placeholder="Footprint width" />
              <NumberField id="tyres-l" label={`Single tyre contact length (${d})`} value={tyreLength} onChange={setTyreLength} placeholder="Footprint length" />
            </div>
            <ErrorNote message={error} />
            <Actions onCalculate={calcMulti} onReset={resetTab} calculateLabel="Calculate PSI" />
            {multiPsi !== null && <ResultBox label="Per-tyre floor loading" value={`${multiPsi.toFixed(2)} ${p}`} sub="Assumes weight is shared evenly across all tyres." />}
          </TabsContent>
        </Tabs>
      </CalcCard>
      <CalcCard title="Notes">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Weight is rarely shared evenly; use axle weights for the heaviest tyre when available.</li>
          <li>Tyre PSI on the floor is close to, but not the same as, inflation pressure.</li>
          <li>Compare the result with the aircraft floor limit for the area where the wheels will rest.</li>
        </ul>
      </CalcCard>
    </div>
  );
}
