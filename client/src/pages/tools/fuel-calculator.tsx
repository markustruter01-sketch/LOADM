import { useState } from "react";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, AlertTriangle, Plane } from "lucide-react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function FuelCalculatorPage() {
  const [_, navigate] = useLocation();
  const [useImperial, setUseImperial] = useState(false);

  const [aircraftType, setAircraftType] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [cruiseAltitude, setCruiseAltitude] = useState<string>("");
  const [grossWeight, setGrossWeight] = useState<string>("");
  const [headwindComponent, setHeadwindComponent] = useState<string>("");
  const [weatherCondition, setWeatherCondition] = useState<string>("standard");
  const [reserveTime, setReserveTime] = useState<string>("45");

  const [fuelBurnRate, setFuelBurnRate] = useState<number | null>(null);
  const [tripFuel, setTripFuel] = useState<number | null>(null);
  const [reserveFuel, setReserveFuel] = useState<number | null>(null);
  const [totalFuelRequired, setTotalFuelRequired] = useState<number | null>(null);
  const [groundSpeed, setGroundSpeed] = useState<number | null>(null);
  const [flightTime, setFlightTime] = useState<number | null>(null);

  const handleBackClick = () => navigate("/tools");

  const KM_TO_MI = 0.621371;
  const M_TO_FT = 3.28084;
  const KG_TO_LBS = 2.20462;
  const L_TO_GAL = 0.264172;
  const KMH_TO_MPH = 0.621371;

  const distUnit = useImperial ? "mi" : "km";
  const altUnit = useImperial ? "ft" : "m";
  const weightUnit = useImperial ? "lbs" : "kg";
  const speedUnit = useImperial ? "mph" : "km/h";
  const fuelVolUnit = useImperial ? "gal" : "L";
  const fuelRateUnit = useImperial ? "gal/h" : "L/h";

  const aircraftProfiles = {
    "c-17": {
      name: "C-17 Globemaster III",
      baseFuelBurn: 23470,
      cruiseSpeed: 833,
      weightFactor: 0.8,
      baseWeight: 265350,
      fuelCapacity: 106000,
      altitudeFactor: 0.85,
    },
    "c-130": {
      name: "C-130 Hercules",
      baseFuelBurn: 5300,
      cruiseSpeed: 593,
      weightFactor: 0.6,
      baseWeight: 70310,
      fuelCapacity: 34100,
      altitudeFactor: 0.88,
    },
    "c-27j": {
      name: "C-27J Spartan",
      baseFuelBurn: 3030,
      cruiseSpeed: 519,
      weightFactor: 0.5,
      baseWeight: 20410,
      fuelCapacity: 13250,
      altitudeFactor: 0.90,
    },
    kc30a: {
      name: "KC-30A MRTT",
      baseFuelBurn: 32170,
      cruiseSpeed: 871,
      weightFactor: 1.0,
      baseWeight: 172370,
      fuelCapacity: 136280,
      altitudeFactor: 0.82,
    },
  };

  const weatherFactors = {
    standard: 1.0,
    adverse: 1.15,
    icing: 1.25,
    turbulence: 1.1,
  };

  const toMetricDist = (v: number) => (useImperial ? v / KM_TO_MI : v);
  const toMetricAlt = (v: number) => (useImperial ? v / M_TO_FT : v);
  const toMetricWeight = (v: number) => (useImperial ? v / KG_TO_LBS : v);
  const toMetricSpeed = (v: number) => (useImperial ? v / KMH_TO_MPH : v);

  const fromMetricSpeed = (v: number) => (useImperial ? v * KMH_TO_MPH : v);
  const fromMetricFuel = (v: number) => (useImperial ? v * L_TO_GAL : v);

  const calculateFuel = () => {
    if (!aircraftType || !distance || !cruiseAltitude || !grossWeight) return;

    const aircraft =
      aircraftProfiles[aircraftType as keyof typeof aircraftProfiles];
    if (!aircraft) return;

    const distKm = toMetricDist(parseFloat(distance));
    const altM = toMetricAlt(parseFloat(cruiseAltitude));
    const weightKg = toMetricWeight(parseFloat(grossWeight));
    const headwindKmh = headwindComponent
      ? toMetricSpeed(parseFloat(headwindComponent))
      : 0;
    const reserve = parseFloat(reserveTime);

    const calculatedGroundSpeed = aircraft.cruiseSpeed - headwindKmh;
    setGroundSpeed(fromMetricSpeed(calculatedGroundSpeed));

    const calculatedFlightTime = distKm / calculatedGroundSpeed;
    setFlightTime(calculatedFlightTime);

    let adjustedFuelBurn = aircraft.baseFuelBurn;

    const weightDifference = weightKg - aircraft.baseWeight;
    const weightAdjustment = (weightDifference / 1000) * aircraft.weightFactor;
    adjustedFuelBurn += (adjustedFuelBurn * weightAdjustment) / 100;

    if (altM > 7620) {
      adjustedFuelBurn *= aircraft.altitudeFactor;
    }

    const weatherFactor =
      weatherFactors[weatherCondition as keyof typeof weatherFactors];
    adjustedFuelBurn *= weatherFactor;

    setFuelBurnRate(fromMetricFuel(adjustedFuelBurn));

    const calculatedTripFuel = adjustedFuelBurn * calculatedFlightTime;
    setTripFuel(fromMetricFuel(calculatedTripFuel));

    const calculatedReserveFuel = adjustedFuelBurn * (reserve / 60);
    setReserveFuel(fromMetricFuel(calculatedReserveFuel));

    const total = calculatedTripFuel + calculatedReserveFuel;
    setTotalFuelRequired(fromMetricFuel(total));
  };

  const resetFields = () => {
    setAircraftType("");
    setDistance("");
    setCruiseAltitude("");
    setGrossWeight("");
    setHeadwindComponent("");
    setWeatherCondition("standard");
    setReserveTime("45");
    setFuelBurnRate(null);
    setTripFuel(null);
    setReserveFuel(null);
    setTotalFuelRequired(null);
    setGroundSpeed(null);
    setFlightTime(null);
  };

  const handleUnitSwitch = (imperial: boolean) => {
    setUseImperial(imperial);
    resetFields();
  };

  const aircraft = aircraftType
    ? aircraftProfiles[aircraftType as keyof typeof aircraftProfiles]
    : null;
  const capacityConverted = aircraft
    ? fromMetricFuel(aircraft.fuelCapacity)
    : null;
  const exceedsCapacity =
    capacityConverted && totalFuelRequired && totalFuelRequired > capacityConverted;

  return (
    <>
      <Helmet>
        <title>Fuel Calculator - LOADMworkflow</title>
        <meta
          name="description"
          content="Aviation fuel burn calculator for military transport aircraft fuel planning."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>

          <section className="mb-10">
            <div className="flex items-center mb-4">
              <Truck className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Fuel Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate fuel burn rates, trip fuel requirements, and reserve fuel
              for military transport aircraft
            </p>
          </section>

          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg bg-[#1a1a1a] border border-[#333] p-1 gap-1">
              <button
                onClick={() => handleUnitSwitch(false)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !useImperial
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Metric
              </button>
              <button
                onClick={() => handleUnitSwitch(true)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  useImperial
                    ? "bg-orange-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Imperial
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Flight Parameters</CardTitle>
                <CardDescription>
                  Enter mission details for fuel calculation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="aircraft-type">Aircraft Type</Label>
                  <Select value={aircraftType} onValueChange={setAircraftType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c-17">C-17 Globemaster III</SelectItem>
                      <SelectItem value="c-130">C-130 Hercules</SelectItem>
                      <SelectItem value="c-27j">C-27J Spartan</SelectItem>
                      <SelectItem value="kc30a">KC-30A MRTT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="distance">Distance ({distUnit})</Label>
                    <Input
                      id="distance"
                      type="number"
                      placeholder={distUnit}
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cruise-altitude">
                      Cruise Altitude ({altUnit})
                    </Label>
                    <Input
                      id="cruise-altitude"
                      type="number"
                      placeholder={`${altUnit} above sea level`}
                      value={cruiseAltitude}
                      onChange={(e) => setCruiseAltitude(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gross-weight">
                    Gross Weight ({weightUnit})
                  </Label>
                  <Input
                    id="gross-weight"
                    type="number"
                    placeholder="Total aircraft weight"
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="headwind">
                      Headwind Component ({speedUnit})
                    </Label>
                    <Input
                      id="headwind"
                      type="number"
                      placeholder="0 for no wind"
                      value={headwindComponent}
                      onChange={(e) => setHeadwindComponent(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reserve-time">Reserve Time (min)</Label>
                    <Input
                      id="reserve-time"
                      type="number"
                      placeholder="Reserve fuel time"
                      value={reserveTime}
                      onChange={(e) => setReserveTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weather">Weather Conditions</Label>
                  <Select
                    value={weatherCondition}
                    onValueChange={setWeatherCondition}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        Standard Conditions
                      </SelectItem>
                      <SelectItem value="adverse">
                        Adverse Weather (+15%)
                      </SelectItem>
                      <SelectItem value="icing">
                        Icing Conditions (+25%)
                      </SelectItem>
                      <SelectItem value="turbulence">
                        Moderate Turbulence (+10%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button onClick={calculateFuel} className="flex-1">
                    Calculate Fuel
                  </Button>
                  <Button onClick={resetFields} variant="outline">
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuel Requirements</CardTitle>
                <CardDescription>
                  Calculated fuel burn and requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {fuelBurnRate !== null ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">Ground Speed</h4>
                        <p className="text-xl font-bold text-primary">
                          {groundSpeed?.toFixed(0)} {speedUnit}
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">Flight Time</h4>
                        <p className="text-xl font-bold text-primary">
                          {flightTime &&
                            `${Math.floor(flightTime)}:${String(
                              Math.round((flightTime % 1) * 60)
                            ).padStart(2, "0")}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Fuel Burn Rate</h4>
                        <p className="text-2xl font-bold text-primary">
                          {fuelBurnRate.toFixed(0)} {fuelRateUnit}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="font-medium">Trip Fuel:</span>
                          <span className="font-mono text-lg">
                            {tripFuel?.toFixed(0)} {fuelVolUnit}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="font-medium">Reserve Fuel:</span>
                          <span className="font-mono text-lg">
                            {reserveFuel?.toFixed(0)} {fuelVolUnit}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded border-2 border-primary/20">
                          <span className="font-bold">Total Required:</span>
                          <div className="text-right">
                            <span className="font-mono text-xl font-bold">
                              {totalFuelRequired?.toFixed(0)} {fuelVolUnit}
                            </span>
                            {exceedsCapacity && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Exceeds Capacity
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {aircraft && capacityConverted && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Aircraft Capacity</h4>
                        <div className="flex justify-between">
                          <span>Fuel Capacity:</span>
                          <span className="font-mono">
                            {capacityConverted.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}{" "}
                            {fuelVolUnit}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Remaining:</span>
                          <span className="font-mono">
                            {totalFuelRequired
                              ? (capacityConverted - totalFuelRequired).toFixed(
                                  0
                                )
                              : 0}{" "}
                            {fuelVolUnit}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter flight parameters to calculate fuel requirements</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Calculation Formulas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm font-mono">
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-1 font-sans">
                      Fuel Burn Rate:
                    </div>
                    <div>Base_Burn × Weight_Factor × Weather_Factor</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="text-primary/70">e.g.</span>{" "}
                      {useImperial ? "924 gal/h" : "3,500 L/h"} × 1.05 × 1.15
                      ={" "}
                      <span className="text-primary">
                        {useImperial ? "1,116 gal/h" : "4,226 L/h"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-1 font-sans">
                      Trip Fuel:
                    </div>
                    <div>Burn_Rate × Flight_Time</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="text-primary/70">e.g.</span>{" "}
                      {useImperial ? "1,116 gal/h" : "4,226 L/h"} × 4.5 hrs ={" "}
                      <span className="text-primary">
                        {useImperial ? "5,022 gal" : "19,017 L"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-1 font-sans">
                      Reserve Fuel:
                    </div>
                    <div>Burn_Rate × Reserve_Time (hrs)</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="text-primary/70">e.g.</span>{" "}
                      {useImperial ? "1,116 gal/h" : "4,226 L/h"} × 0.75 hrs ={" "}
                      <span className="text-primary">
                        {useImperial ? "837 gal" : "3,170 L"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="font-medium text-primary mb-1 font-sans">
                      Total Fuel Required:
                    </div>
                    <div>Trip_Fuel + Reserve_Fuel</div>
                    <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      <span className="text-primary/70">e.g.</span>{" "}
                      {useImperial ? "5,022 + 837 gal" : "19,017 + 3,170 L"} ={" "}
                      <span className="text-primary">
                        {useImperial ? "5,859 gal" : "22,187 L"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Standard Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Weight Impact:</strong> Higher gross weight increases
                    fuel burn rate
                  </div>
                  <div>
                    <strong>Altitude Efficiency:</strong> Higher altitudes
                    typically improve fuel efficiency
                  </div>
                  <div>
                    <strong>Weather Conditions:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Standard: No adjustment</li>
                      <li>Adverse: +15% fuel burn</li>
                      <li>Icing: +25% fuel burn</li>
                      <li>Turbulence: +10% fuel burn</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
