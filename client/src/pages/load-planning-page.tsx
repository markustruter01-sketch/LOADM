import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Scale, Package, AlertTriangle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  calculateBalance, 
  AIRCRAFT_CONFIGS, 
  type CargoPosition, 
  type BalanceResult,
  type AircraftConfig
} from "@/utils/simple-balance";

export default function LoadPlanningPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/load-planning/:aircraftId");
  
  const aircraftId = params?.aircraftId || 'c130';
  const config = AIRCRAFT_CONFIGS[aircraftId];
  
  if (!config) {
    navigate("/load-planning");
    return null;
  }

  // Initialize cargo positions for the aircraft
  const [cargoPositions, setCargoPositions] = useState<CargoPosition[]>(() => 
    Array.from({ length: config.positions }, (_, i) => ({
      id: `P${i + 1}`,
      label: `P${i + 1}`,
      weight: 0,
      position: i
    }))
  );

  const [balanceResult, setBalanceResult] = useState<BalanceResult>({
    balance: 0,
    centerOfGravity: (config.forwardLimit + config.aftLimit) / 2,
    status: 'safe',
    totalWeight: 0
  });

  // Recalculate balance whenever cargo changes
  useEffect(() => {
    const result = calculateBalance(cargoPositions, aircraftId);
    setBalanceResult(result);
  }, [cargoPositions, aircraftId]);

  const updateCargoWeight = (positionId: string, weight: number) => {
    setCargoPositions(prev => 
      prev.map(pos => 
        pos.id === positionId 
          ? { ...pos, weight: Math.max(0, weight) }
          : pos
      )
    );
  };

  const resetAllCargo = () => {
    setCargoPositions(prev => 
      prev.map(pos => ({ ...pos, weight: 0 }))
    );
  };

  const getStatusColor = (status: BalanceResult['status']) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'caution': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBalanceBarPosition = () => {
    // Convert balance (-100 to +100) to percentage (0 to 100)
    return ((balanceResult.balance + 100) / 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{config.name} Load Planning | LOADMworkflow</title>
        <meta name="description" content={`Load planning for ${config.name}`} />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/load-planning")}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-orange-400"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{config.name} Load Planning</h1>
            <p className="text-gray-300">Max Payload: {config.maxWeight.toLocaleString()} lbs | Max Positions: {config.positions}</p>
          </div>
        </div>

        {/* Load Summary */}
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-400" />
              Load Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-400">Current Load</Label>
                <p className="text-2xl font-bold text-white">{balanceResult.totalWeight.toLocaleString()} lbs</p>
              </div>
              <div>
                <Label className="text-gray-400">Maximum Payload</Label>
                <p className="text-2xl font-bold text-gray-300">{config.maxWeight.toLocaleString()} lbs</p>
              </div>
              <div>
                <Label className="text-gray-400">Positions Filled</Label>
                <p className="text-2xl font-bold text-blue-400">
                  {cargoPositions.filter(p => p.weight > 0).length} of {config.positions}
                </p>
              </div>
              <div>
                <Label className="text-gray-400">Center of Gravity</Label>
                <p className="text-2xl font-bold text-green-400">{balanceResult.centerOfGravity.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Display */}
        <Card className="bg-card mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Scale className="h-5 w-5 text-orange-400" />
              Balance Scale
              <Badge className={getStatusColor(balanceResult.status)}>
                {balanceResult.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Balance Status Alert */}
              {balanceResult.status !== 'safe' && (
                <Alert className="border-orange-500 bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-200">
                    Aircraft balance is {balanceResult.status}. 
                    {balanceResult.status === 'critical' && ' Immediate attention required!'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Balance Bar */}
              <div className="relative">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Heavy Forward</span>
                  <span>Center</span>
                  <span>Heavy Aft</span>
                </div>
                <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-green-500 to-red-500 opacity-30"></div>
                  
                  {/* Center line */}
                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/50 transform -trangray-x-0.5"></div>
                  
                  {/* Balance indicator */}
                  <div 
                    className="absolute top-1 bottom-1 w-2 bg-white rounded-sm transition-all duration-300"
                    style={{ left: `calc(${getBalanceBarPosition()}% - 4px)` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-100</span>
                  <span>0</span>
                  <span>+100</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-lg font-bold text-white">
                    Balance: {balanceResult.balance.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cargo Positions */}
        <Card className="bg-card mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Cargo Bay Layout</CardTitle>
            <Button 
              variant="outline" 
              onClick={resetAllCargo}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Reset All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Aircraft Direction Indicator */}
              <div className="flex items-center justify-center gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-400"></div>
                  <span>NOSE (Forward)</span>
                </div>
                <div className="flex-1 border-t border-dashed border-gray-600"></div>
                <span>TAIL (Aft)</span>
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400"></div>
              </div>

              {/* C-130 Cargo Bay Layout (2 rows x 4 columns) */}
              {aircraftId === 'c130' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="space-y-3">
                    {/* Upper Row (P1-P4) */}
                    <div className="grid grid-cols-4 gap-3">
                      {cargoPositions.slice(0, 4).map((position) => (
                        <div key={position.id} className="space-y-2">
                          <div className={`relative border-2 rounded-lg p-4 transition-all duration-300 ${
                            position.weight > 0 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-600 bg-gray-700/30'
                          }`}>
                            <Label className="text-gray-300 font-bold text-center block mb-2">
                              {position.label}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={10000}
                              value={position.weight || ''}
                              onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-600 text-white text-center text-sm"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-400 text-center mt-1">lbs</div>
                            {/* Weight visualization bar */}
                            {position.weight > 0 && (
                              <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Lower Row (P5-P8) */}
                    <div className="grid grid-cols-4 gap-3">
                      {cargoPositions.slice(4, 8).map((position) => (
                        <div key={position.id} className="space-y-2">
                          <div className={`relative border-2 rounded-lg p-4 transition-all duration-300 ${
                            position.weight > 0 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-600 bg-gray-700/30'
                          }`}>
                            <Label className="text-gray-300 font-bold text-center block mb-2">
                              {position.label}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={10000}
                              value={position.weight || ''}
                              onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-600 text-white text-center text-sm"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-400 text-center mt-1">lbs</div>
                            {/* Weight visualization bar */}
                            {position.weight > 0 && (
                              <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-4">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* C-17 Cargo Bay Layout (2 rows x 9 columns) */}
              {aircraftId === 'c17' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className="space-y-3">
                    {/* Upper Row (P1-P9) */}
                    <div className="grid grid-cols-9 gap-2">
                      {cargoPositions.slice(0, 9).map((position) => (
                        <div key={position.id} className="space-y-2">
                          <div className={`relative border-2 rounded-lg p-2 transition-all duration-300 ${
                            position.weight > 0 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-600 bg-gray-700/30'
                          }`}>
                            <Label className="text-gray-300 font-bold text-center block mb-1 text-xs">
                              {position.label}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={15000}
                              value={position.weight || ''}
                              onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-600 text-white text-center text-xs h-8"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-400 text-center">lbs</div>
                            {position.weight > 0 && (
                              <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Lower Row (P10-P18) */}
                    <div className="grid grid-cols-9 gap-2">
                      {cargoPositions.slice(9, 18).map((position) => (
                        <div key={position.id} className="space-y-2">
                          <div className={`relative border-2 rounded-lg p-2 transition-all duration-300 ${
                            position.weight > 0 
                              ? 'border-orange-500 bg-orange-500/20' 
                              : 'border-gray-600 bg-gray-700/30'
                          }`}>
                            <Label className="text-gray-300 font-bold text-center block mb-1 text-xs">
                              {position.label}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={15000}
                              value={position.weight || ''}
                              onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-600 text-white text-center text-xs h-8"
                              placeholder="0"
                            />
                            <div className="text-xs text-gray-400 text-center">lbs</div>
                            {position.weight > 0 && (
                              <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Cargo Bay Labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-4">
                    <span>Forward Cargo Bay</span>
                    <span>Aft Cargo Bay</span>
                  </div>
                </div>
              )}

              {/* Other Aircraft Layouts (C-27J, KC-30A) */}
              {aircraftId !== 'c130' && aircraftId !== 'c17' && (
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-600">
                  <div className={`grid gap-3 ${
                    aircraftId === 'c27j' ? 'grid-cols-3' : 'grid-cols-6'
                  }`}>
                    {cargoPositions.map((position) => (
                      <div key={position.id} className="space-y-2">
                        <div className={`relative border-2 rounded-lg p-3 transition-all duration-300 ${
                          position.weight > 0 
                            ? 'border-orange-500 bg-orange-500/20' 
                            : 'border-gray-600 bg-gray-700/30'
                        }`}>
                          <Label className="text-gray-300 font-bold text-center block mb-2 text-sm">
                            {position.label}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={15000}
                            value={position.weight || ''}
                            onChange={(e) => updateCargoWeight(position.id, parseInt(e.target.value) || 0)}
                            className="bg-gray-800 border-gray-600 text-white text-center text-xs"
                            placeholder="0"
                          />
                          <div className="text-xs text-gray-400 text-center mt-1">lbs</div>
                          {position.weight > 0 && (
                            <div className="absolute inset-1 border border-orange-400 rounded-md opacity-30 pointer-events-none"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate("/home")}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}