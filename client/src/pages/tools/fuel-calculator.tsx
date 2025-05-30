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
  
  // Input states
  const [aircraftType, setAircraftType] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [cruiseAltitude, setCruiseAltitude] = useState<string>("");
  const [grossWeight, setGrossWeight] = useState<string>("");
  const [headwindComponent, setHeadwindComponent] = useState<string>("");
  const [weatherCondition, setWeatherCondition] = useState<string>("standard");
  const [reserveTime, setReserveTime] = useState<string>("45");
  
  // Result states
  const [fuelBurnRate, setFuelBurnRate] = useState<number | null>(null);
  const [tripFuel, setTripFuel] = useState<number | null>(null);
  const [reserveFuel, setReserveFuel] = useState<number | null>(null);
  const [totalFuelRequired, setTotalFuelRequired] = useState<number | null>(null);
  const [groundSpeed, setGroundSpeed] = useState<number | null>(null);
  const [flightTime, setFlightTime] = useState<number | null>(null);

  const handleBackClick = () => {
    navigate("/tools");
  };

  // Aircraft fuel burn profiles (gallons per hour at standard conditions)
  const aircraftProfiles = {
    "c-17": {
      name: "C-17 Globemaster III",
      baseFuelBurn: 6200, // GPH at cruise
      cruiseSpeed: 450, // knots
      weightFactor: 0.8, // fuel burn increase per 1000 lbs over base weight
      baseWeight: 585000, // lbs
      fuelCapacity: 28000, // gallons
      altitudeFactor: 0.85 // fuel efficiency at higher altitudes
    },
    "c-130": {
      name: "C-130 Hercules",
      baseFuelBurn: 1400, // GPH at cruise
      cruiseSpeed: 320, // knots
      weightFactor: 0.6,
      baseWeight: 155000, // lbs
      fuelCapacity: 9000, // gallons
      altitudeFactor: 0.88
    },
    "c-27j": {
      name: "C-27J Spartan",
      baseFuelBurn: 800, // GPH at cruise
      cruiseSpeed: 280, // knots
      weightFactor: 0.5,
      baseWeight: 45000, // lbs
      fuelCapacity: 3500, // gallons
      altitudeFactor: 0.90
    },
    "kc30a": {
      name: "KC-30A MRTT",
      baseFuelBurn: 8500, // GPH at cruise
      cruiseSpeed: 470, // knots
      weightFactor: 1.0,
      baseWeight: 380000, // lbs
      fuelCapacity: 36000, // gallons
      altitudeFactor: 0.82
    }
  };

  // Weather condition factors
  const weatherFactors = {
    "standard": 1.0,
    "adverse": 1.15,
    "icing": 1.25,
    "turbulence": 1.10
  };

  // Calculate fuel requirements
  const calculateFuel = () => {
    if (!aircraftType || !distance || !cruiseAltitude || !grossWeight) return;

    const aircraft = aircraftProfiles[aircraftType as keyof typeof aircraftProfiles];
    if (!aircraft) return;

    const dist = parseFloat(distance);
    const altitude = parseFloat(cruiseAltitude);
    const weight = parseFloat(grossWeight);
    const headwind = parseFloat(headwindComponent) || 0;
    const reserve = parseFloat(reserveTime);

    // Calculate ground speed
    const trueAirspeed = aircraft.cruiseSpeed;
    const calculatedGroundSpeed = trueAirspeed - headwind;
    setGroundSpeed(calculatedGroundSpeed);

    // Calculate flight time (hours)
    const calculatedFlightTime = dist / calculatedGroundSpeed;
    setFlightTime(calculatedFlightTime);

    // Calculate fuel burn rate adjustments
    let adjustedFuelBurn = aircraft.baseFuelBurn;

    // Weight adjustment
    const weightDifference = weight - aircraft.baseWeight;
    const weightAdjustment = (weightDifference / 1000) * aircraft.weightFactor;
    adjustedFuelBurn += (adjustedFuelBurn * weightAdjustment / 100);

    // Altitude efficiency factor
    if (altitude > 25000) {
      adjustedFuelBurn *= aircraft.altitudeFactor;
    }

    // Weather condition factor
    const weatherFactor = weatherFactors[weatherCondition as keyof typeof weatherFactors];
    adjustedFuelBurn *= weatherFactor;

    setFuelBurnRate(adjustedFuelBurn);

    // Calculate trip fuel
    const calculatedTripFuel = adjustedFuelBurn * calculatedFlightTime;
    setTripFuel(calculatedTripFuel);

    // Calculate reserve fuel (based on reserve time in minutes)
    const calculatedReserveFuel = adjustedFuelBurn * (reserve / 60);
    setReserveFuel(calculatedReserveFuel);

    // Calculate total fuel required
    const total = calculatedTripFuel + calculatedReserveFuel;
    setTotalFuelRequired(total);
  };

  // Reset all fields
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

  // Check if fuel requirements exceed capacity
  const aircraft = aircraftType ? aircraftProfiles[aircraftType as keyof typeof aircraftProfiles] : null;
  const exceedsCapacity = aircraft && totalFuelRequired && totalFuelRequired > aircraft.fuelCapacity;

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
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-6"
            onClick={handleBackClick}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools
          </Button>
          
          {/* Header Section */}
          <section className="mb-10">
            <div className="flex items-center mb-4">
              <Truck className="h-6 w-6 mr-3 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">
                Fuel Calculator
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Calculate fuel burn rates, trip fuel requirements, and reserve fuel for military transport aircraft
            </p>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
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
                    <Label htmlFor="distance">Distance (nm)</Label>
                    <Input
                      id="distance"
                      type="number"
                      placeholder="Nautical miles"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cruise-altitude">Cruise Altitude (ft)</Label>
                    <Input
                      id="cruise-altitude"
                      type="number"
                      placeholder="Flight level"
                      value={cruiseAltitude}
                      onChange={(e) => setCruiseAltitude(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gross-weight">Gross Weight (lbs)</Label>
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
                    <Label htmlFor="headwind">Headwind Component (kts)</Label>
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
                  <Select value={weatherCondition} onValueChange={setWeatherCondition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Conditions</SelectItem>
                      <SelectItem value="adverse">Adverse Weather (+15%)</SelectItem>
                      <SelectItem value="icing">Icing Conditions (+25%)</SelectItem>
                      <SelectItem value="turbulence">Moderate Turbulence (+10%)</SelectItem>
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

            {/* Results Section */}
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
                    {/* Flight Performance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">Ground Speed</h4>
                        <p className="text-xl font-bold text-primary">
                          {groundSpeed?.toFixed(0)} kts
                        </p>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-1">Flight Time</h4>
                        <p className="text-xl font-bold text-primary">
                          {flightTime && `${Math.floor(flightTime)}:${String(Math.round((flightTime % 1) * 60)).padStart(2, '0')}`}
                        </p>
                      </div>
                    </div>

                    {/* Fuel Calculations */}
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Fuel Burn Rate</h4>
                        <p className="text-2xl font-bold text-primary">
                          {fuelBurnRate.toFixed(0)} GPH
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="font-medium">Trip Fuel:</span>
                          <span className="font-mono text-lg">{tripFuel?.toFixed(0)} gal</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="font-medium">Reserve Fuel:</span>
                          <span className="font-mono text-lg">{reserveFuel?.toFixed(0)} gal</span>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded border-2 border-primary/20">
                          <span className="font-bold">Total Required:</span>
                          <div className="text-right">
                            <span className="font-mono text-xl font-bold">{totalFuelRequired?.toFixed(0)} gal</span>
                            {exceedsCapacity && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                <Badge variant="destructive" className="text-xs">
                                  Exceeds Capacity
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aircraft Capacity Info */}
                    {aircraft && (
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Aircraft Capacity</h4>
                        <div className="flex justify-between">
                          <span>Fuel Capacity:</span>
                          <span className="font-mono">{aircraft.fuelCapacity.toLocaleString()} gal</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Remaining:</span>
                          <span className="font-mono">
                            {totalFuelRequired ? (aircraft.fuelCapacity - totalFuelRequired).toFixed(0) : 0} gal
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

          {/* Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* Calculation Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Calculation Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p>
                    <strong>Fuel Burn Rate:</strong> Calculated based on aircraft type, weight, altitude, and weather conditions.
                  </p>
                  <p>
                    <strong>Trip Fuel:</strong> Required fuel for the planned route based on distance and ground speed.
                  </p>
                  <p>
                    <strong>Reserve Fuel:</strong> Additional fuel for contingencies, typically 45 minutes at cruise power.
                  </p>
                  <p>
                    <strong>Weather Factors:</strong> Applied to account for increased fuel consumption in adverse conditions.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Standard Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Standard Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Weight Impact:</strong> Higher gross weight increases fuel burn rate
                  </div>
                  <div>
                    <strong>Altitude Efficiency:</strong> Higher altitudes typically improve fuel efficiency
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