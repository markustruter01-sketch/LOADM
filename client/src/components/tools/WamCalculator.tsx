import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Actions, CalcCard, Formula, NumberField, ResultBox, UnitToggle, parse } from "./shared";

type Mode = "find-moment" | "find-weight" | "find-arm";

export default function WamCalculator() {
  const [metric, setMetric] = useState(false);
  const [tab, setTab] = useState<Mode>("find-moment");
  const [arm, setArm] = useState("");
  const [weight, setWeight] = useState("");
  const [moment, setMoment] = useState("");
  const [momentResult, setMomentResult] = useState<number | null>(null);
  const [weightResult, setWeightResult] = useState<number | null>(null);
  const [armResult, setArmResult] = useState<number | null>(null);

  const w = metric ? "kg" : "lbs";
  const d = metric ? "cm" : "in";
  const m = metric ? "cm·kg" : "in·lbs";

  const calcMoment = () => {
    const a = parse(arm);
    const wt = parse(weight);
    setMomentResult(!isNaN(a) && !isNaN(wt) ? a * wt : null);
  };
  const calcWeight = () => {
    const mo = parse(moment);
    const a = parse(arm);
    setWeightResult(!isNaN(mo) && !isNaN(a) && a !== 0 ? mo / a : null);
  };
  const calcArm = () => {
    const mo = parse(moment);
    const wt = parse(weight);
    setArmResult(!isNaN(mo) && !isNaN(wt) && wt !== 0 ? mo / wt : null);
  };

  const reset = () => {
    setArm("");
    setWeight("");
    setMoment("");
    setMomentResult(null);
    setWeightResult(null);
    setArmResult(null);
  };

  const fmt = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <UnitToggle metric={metric} onChange={(x) => { setMetric(x); reset(); }} />
      <CalcCard title="Weight-Arm-Moment" description="Choose what to solve for and enter the two known values.">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Mode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="find-moment">Find moment</TabsTrigger>
            <TabsTrigger value="find-weight">Find weight</TabsTrigger>
            <TabsTrigger value="find-arm">Find arm</TabsTrigger>
          </TabsList>

          <TabsContent value="find-moment" className="space-y-4 pt-4">
            <Formula title="Arm × Weight = Moment" lines={[]} example={metric ? "305 cm × 680 kg = 207,400 cm·kg" : "120 in × 1,500 lbs = 180,000 in·lbs"} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="wam-arm1" label={`Arm (${d})`} value={arm} onChange={setArm} placeholder="Enter arm value" step="0.01" />
              <NumberField id="wam-weight1" label={`Weight (${w})`} value={weight} onChange={setWeight} placeholder="Enter weight value" step="0.01" />
            </div>
            <Actions onCalculate={calcMoment} onReset={reset} calculateLabel="Calculate moment" />
            {momentResult !== null && <ResultBox label="Moment" value={`${fmt(momentResult)} ${m}`} />}
          </TabsContent>

          <TabsContent value="find-weight" className="space-y-4 pt-4">
            <Formula title="Moment ÷ Arm = Weight" lines={[]} example={metric ? "207,400 cm·kg ÷ 305 cm = 680 kg" : "180,000 in·lbs ÷ 120 in = 1,500 lbs"} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="wam-moment2" label={`Moment (${m})`} value={moment} onChange={setMoment} placeholder="Enter moment value" step="0.01" />
              <NumberField id="wam-arm2" label={`Arm (${d})`} value={arm} onChange={setArm} placeholder="Enter arm value" step="0.01" />
            </div>
            <Actions onCalculate={calcWeight} onReset={reset} calculateLabel="Calculate weight" />
            {weightResult !== null && <ResultBox label="Weight" value={`${fmt(weightResult)} ${w}`} />}
          </TabsContent>

          <TabsContent value="find-arm" className="space-y-4 pt-4">
            <Formula title="Moment ÷ Weight = Arm" lines={[]} example={metric ? "207,400 cm·kg ÷ 680 kg = 305 cm" : "180,000 in·lbs ÷ 1,500 lbs = 120 in"} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField id="wam-moment3" label={`Moment (${m})`} value={moment} onChange={setMoment} placeholder="Enter moment value" step="0.01" />
              <NumberField id="wam-weight3" label={`Weight (${w})`} value={weight} onChange={setWeight} placeholder="Enter weight value" step="0.01" />
            </div>
            <Actions onCalculate={calcArm} onReset={reset} calculateLabel="Calculate arm" />
            {armResult !== null && <ResultBox label="Arm" value={`${fmt(armResult)} ${d}`} />}
          </TabsContent>
        </Tabs>
      </CalcCard>
      <CalcCard title="About WAM">
        <p className="text-sm text-muted-foreground">
          The arm is the horizontal distance from the reference datum to the item&apos;s centre of gravity. Multiplying by weight gives its moment; summing
          moments and dividing by total weight gives the loaded centre of gravity.
        </p>
      </CalcCard>
    </div>
  );
}
