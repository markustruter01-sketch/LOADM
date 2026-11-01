import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Actions, CalcCard, Formula, NumberField, Placeholder, ResultBox, UnitToggle, parse } from "./shared";

const KM_TO_MI = 0.621371;
const M_TO_FT = 3.28084;
const KG_TO_LBS = 2.20462;
const L_TO_GAL = 0.264172;
const KMH_TO_MPH = 0.621371;

/** Planning profiles (metric: L/h, km/h, kg, L). Values carried over unchanged from the legacy tool. */
const AIRCRAFT_PROFILES = {
  "c-17": { name: "C-17 Globemaster III", baseFuelBurn: 23470, cruiseSpeed: 833, weightFactor: 0.8, baseWeight: 265350, fuelCapacity: 106000, altitudeFactor: 0.85 },
  "c-130": { name: "C-130 Hercules", baseFuelBurn: 5300, cruiseSpeed: 593, weightFactor: 0.6, baseWeight: 70310, fuelCapacity: 34100, altitudeFactor: 0.88 },
  "c-27j": { name: "C-27J Spartan", baseFuelBurn: 3030, cruiseSpeed: 519, weightFactor: 0.5, baseWeight: 20410, fuelCapacity: 13250, altitudeFactor: 0.9 },
  kc30a: { name: "KC-30A MRTT", baseFuelBurn: 32170, cruiseSpeed: 871, weightFactor: 1.0, baseWeight: 172370, fuelCapacity: 136280, altitudeFactor: 0.82 },
} as const;
type AircraftKey = keyof typeof AIRCRAFT_PROFILES;

const WEATHER = {
  standard: { factor: 1.0, label: "Standard conditions" },
  adverse: { factor: 1.15, label: "Adverse weather (+15%)" },
  icing: { factor: 1.25, label: "Icing conditions (+25%)" },
  turbulence: { factor: 1.1, label: "Moderate turbulence (+10%)" },
} as const;
type WeatherKey = keyof typeof WEATHER;

/** Altitude (m) above which the high-altitude efficiency factor applies (FL250). */
const HIGH_ALTITUDE_M = 7620;

interface Result { groundSpeed: number; flightTime: number; burn: number; trip: number; reserve: number; total: number }

export default function FuelCalculator() {
  const [imperial, setImperial] = useState(false);
  const [aircraft, setAircraft] = useState<AircraftKey | "">("");
  const [distance, setDistance] = useState("");
  const [altitude, setAltitude] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [headwind, setHeadwind] = useState("");
  const [weather, setWeather] = useState<WeatherKey>("standard");
  const [reserveTime, setReserveTime] = useState("45");
  const [result, setResult] = useState<Result | null>(null);

  const u = imperial
    ? { dist: "mi", alt: "ft", weight: "lbs", speed: "mph", vol: "gal", rate: "gal/h" }
    : { dist: "km", alt: "m", weight: "kg", speed: "km/h", vol: "L", rate: "L/h" };
  const fromMetricSpeed = (v: number) => (imperial ? v * KMH_TO_MPH : v);
  const fromMetricFuel = (v: number) => (imperial ? v * L_TO_GAL : v);

  const calculate = () => {
    if (!aircraft || !distance || !altitude || !grossWeight) return;
    const p = AIRCRAFT_PROFILES[aircraft];
    const distKm = imperial ? parse(distance) / KM_TO_MI : parse(distance);
    const altM = imperial ? parse(altitude) / M_TO_FT : parse(altitude);
    const weightKg = imperial ? parse(grossWeight) / KG_TO_LBS : parse(grossWeight);
    const headwindKmh = headwind ? (imperial ? parse(headwind) / KMH_TO_MPH : parse(headwind)) : 0;
    const reserve = parse(reserveTime);

    const groundSpeed = p.cruiseSpeed - headwindKmh;
    const flightTime = distKm / groundSpeed;

    let burn: number = p.baseFuelBurn;
    const weightAdjustment = ((weightKg - p.baseWeight) / 1000) * p.weightFactor;
    burn += (burn * weightAdjustment) / 100;
    if (altM > HIGH_ALTITUDE_M) burn *= p.altitudeFactor;
    burn *= WEATHER[weather].factor;

    const trip = burn * flightTime;
    const reserveFuel = burn * (reserve / 60);
    setResult({
      groundSpeed: fromMetricSpeed(groundSpeed),
      flightTime,
      burn: fromMetricFuel(burn),
      trip: fromMetricFuel(trip),
      reserve: fromMetricFuel(reserveFuel),
      total: fromMetricFuel(trip + reserveFuel),
    });
  };

  const reset = () => {
    setAircraft("");
    setDistance("");
    setAltitude("");
    setGrossWeight("");
    setHeadwind("");
    setWeather("standard");
    setReserveTime("45");
    setResult(null);
  };

  const profile = aircraft ? AIRCRAFT_PROFILES[aircraft] : null;
  const capacity = profile ? fromMetricFuel(profile.fuelCapacity) : null;
  const exceeds = capacity !== null && result !== null && result.total > capacity;
  const hhmm = (t: number) => `${Math.floor(t)}:${String(Math.round((t % 1) * 60)).padStart(2, "0")}`;
  const n0 = (v: number) => Math.round(v).toLocaleString();

  return (
    <div className="space-y-6">
      <UnitToggle metric={!imperial} onChange={(m) => { setImperial(!m); reset(); }} imperialLabel="Imperial" metricLabel="Metric" />
      <div className="grid gap-6 lg:grid-cols-2">
        <CalcCard title="Flight parameters" description="Enter the planned sortie.">
          <div className="space-y-1.5">
            <Label htmlFor="fuel-aircraft">Aircraft type</Label>
            <Select value={aircraft} onValueChange={(v) => setAircraft(v as AircraftKey)}>
              <SelectTrigger id="fuel-aircraft">
                <SelectValue placeholder="Select aircraft" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AIRCRAFT_PROFILES) as AircraftKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {AIRCRAFT_PROFILES[k].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="fuel-distance" label={`Distance (${u.dist})`} value={distance} onChange={setDistance} placeholder={u.dist} />
            <NumberField id="fuel-alt" label={`Cruise altitude (${u.alt})`} value={altitude} onChange={setAltitude} placeholder={`${u.alt} above sea level`} />
          </div>
          <NumberField id="fuel-gw" label={`Gross weight (${u.weight})`} value={grossWeight} onChange={setGrossWeight} placeholder="Total aircraft weight" />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField id="fuel-wind" label={`Headwind component (${u.speed})`} value={headwind} onChange={setHeadwind} placeholder="0 for no wind" />
            <NumberField id="fuel-reserve" label="Reserve time (min)" value={reserveTime} onChange={setReserveTime} placeholder="Reserve fuel time" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fuel-weather">Weather conditions</Label>
            <Select value={weather} onValueChange={(v) => setWeather(v as WeatherKey)}>
              <SelectTrigger id="fuel-weather">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WEATHER) as WeatherKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {WEATHER[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Actions onCalculate={calculate} onReset={reset} calculateLabel="Calculate fuel" />
        </CalcCard>

        <CalcCard title="Fuel requirements" description="Calculated burn and requirement.">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ResultBox label="Ground speed" value={`${n0(result.groundSpeed)} ${u.speed}`} />
                <ResultBox label="Flight time" value={hhmm(result.flightTime)} sub="h:mm" />
              </div>
              <ResultBox label="Fuel burn rate" value={`${n0(result.burn)} ${u.rate}`} />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Trip fuel</dt><dd className="font-mono">{n0(result.trip)} {u.vol}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Reserve fuel</dt><dd className="font-mono">{n0(result.reserve)} {u.vol}</dd></div>
                <div className="flex items-center justify-between border-t border-border/60 pt-2 font-semibold">
                  <dt>Total required</dt>
                  <dd className="flex items-center gap-2 font-mono">
                    {n0(result.total)} {u.vol}
                    {exceeds && <Badge variant="destructive">Exceeds capacity</Badge>}
                  </dd>
                </div>
              </dl>
              {profile && capacity !== null && (
                <div className="rounded-md border border-border/60 bg-background/40 p-3 text-sm">
                  <div className="font-medium">Aircraft capacity · {profile.name}</div>
                  <div className="mt-1 flex justify-between text-muted-foreground"><span>Max fuel</span><span className="font-mono">{n0(capacity)} {u.vol}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Remaining margin</span><span className={exceeds ? "font-mono text-red-400" : "font-mono"}>{n0(capacity - result.total)} {u.vol}</span></div>
                </div>
              )}
            </>
          ) : (
            <Placeholder>Enter flight parameters to calculate fuel requirements.</Placeholder>
          )}
        </CalcCard>
      </div>

      <CalcCard title="Formulas">
        <div className="grid gap-3 md:grid-cols-2">
          <Formula title="Ground speed and time" lines={["GS = Cruise speed − Headwind", "Time = Distance ÷ GS"]} />
          <Formula title="Fuel burn rate" lines={["Base × (1 + (ΔGW/1000 × weight factor)/100)", "× altitude factor (above FL250)", "× weather factor"]} example={imperial ? "924 gal/h × 1.05 × 1.15 = 1,116 gal/h" : "3,500 L/h × 1.05 × 1.15 = 4,226 L/h"} />
          <Formula title="Trip and reserve" lines={["Trip = Burn rate × Flight time", "Reserve = Burn rate × Reserve min ÷ 60"]} example={imperial ? "1,116 gal/h × 4.5 h = 5,022 gal" : "4,226 L/h × 4.5 h = 19,017 L"} />
          <Formula title="Total" lines={["Total = Trip + Reserve"]} example={imperial ? "5,022 + 837 gal = 5,859 gal" : "19,017 + 3,170 L = 22,187 L"} />
        </div>
        <p className="text-xs text-muted-foreground">Planning estimate only. Use the aircraft performance manual for operational fuel planning.</p>
      </CalcCard>
    </div>
  );
}
