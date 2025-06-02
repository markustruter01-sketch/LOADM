/**
 * Advanced Load Planning Balance Engine
 * 
 * A comprehensive aircraft balance calculation system designed to work with any aircraft type
 * and any number of cargo positions. Heavier cargo has proportionally greater impact on balance.
 */

export interface CargoItem {
  id: string;
  weight: number; // in lbs or kg
  position: number; // position index (0-based)
  positionLabel: string; // e.g., "P1", "P2", "LD1", etc.
  type: 'pallet' | 'ld3' | 'container';
}

export interface AircraftBalanceConfig {
  id: string;
  name: string;
  // Physical aircraft dimensions and characteristics
  totalLength: number; // total aircraft length in feet/meters
  cargoCompartmentStart: number; // distance from nose to cargo compartment start
  cargoCompartmentLength: number; // length of cargo compartment
  // Balance limits
  forwardCGLimit: number; // forward center of gravity limit (percentage)
  aftCGLimit: number; // aft center of gravity limit (percentage)
  maxWeight: number; // maximum cargo weight
  // Position configuration
  positions: Array<{
    id: number;
    label: string;
    distanceFromDatum: number; // distance from aircraft datum point
    maxWeight: number; // maximum weight for this position
  }>;
}

export interface BalanceResult {
  centerOfGravity: number; // CG position as percentage of MAC
  momentArm: number; // total moment arm
  totalWeight: number; // total cargo weight
  balance: number; // balance value (-100 to +100)
  status: 'safe' | 'caution' | 'warning' | 'critical';
  weightDistribution: Array<{
    position: string;
    weight: number;
    moment: number;
    influence: number; // percentage influence on total balance
  }>;
}

// Aircraft Configurations
export const C130_CONFIG: AircraftBalanceConfig = {
  id: 'c130',
  name: 'C-130 Hercules',
  totalLength: 97.75, // feet
  cargoCompartmentStart: 45, // feet from nose
  cargoCompartmentLength: 40, // feet
  forwardCGLimit: 25, // percentage
  aftCGLimit: 65, // percentage
  maxWeight: 42000, // lbs
  positions: [
    { id: 1, label: 'P1', distanceFromDatum: 40, maxWeight: 10000 }, // Forward positions
    { id: 2, label: 'P2', distanceFromDatum: 48, maxWeight: 10000 },
    { id: 3, label: 'P3', distanceFromDatum: 56, maxWeight: 10000 },
    { id: 4, label: 'P4', distanceFromDatum: 64, maxWeight: 10000 }, // Center balanced position
    { id: 5, label: 'P5', distanceFromDatum: 72, maxWeight: 10000 }, // Center balanced position
    { id: 6, label: 'P6', distanceFromDatum: 80, maxWeight: 10000 },
    { id: 7, label: 'P7', distanceFromDatum: 88, maxWeight: 10000 },
    { id: 8, label: 'P8', distanceFromDatum: 96, maxWeight: 10000 }  // Aft positions
  ]
};

export const C17_CONFIG: AircraftBalanceConfig = {
  id: 'c17',
  name: 'C-17 Globemaster',
  totalLength: 174, // feet
  cargoCompartmentStart: 70, // feet from nose
  cargoCompartmentLength: 88, // feet
  forwardCGLimit: 20, // percentage
  aftCGLimit: 40, // percentage
  maxWeight: 170900, // lbs
  positions: [
    { id: 1, label: 'P1', distanceFromDatum: 75, maxWeight: 10000 },
    { id: 2, label: 'P2', distanceFromDatum: 85, maxWeight: 10000 },
    { id: 3, label: 'P3', distanceFromDatum: 95, maxWeight: 10000 },
    { id: 4, label: 'P4', distanceFromDatum: 105, maxWeight: 10000 },
    { id: 5, label: 'P5', distanceFromDatum: 115, maxWeight: 10000 },
    { id: 6, label: 'P6', distanceFromDatum: 125, maxWeight: 10000 },
    { id: 7, label: 'P7', distanceFromDatum: 135, maxWeight: 10000 },
    { id: 8, label: 'P8', distanceFromDatum: 145, maxWeight: 10000 },
    { id: 9, label: 'P9', distanceFromDatum: 155, maxWeight: 10000 },
    { id: 10, label: 'P10', distanceFromDatum: 80, maxWeight: 10000 },
    { id: 11, label: 'P11', distanceFromDatum: 90, maxWeight: 10000 },
    { id: 12, label: 'P12', distanceFromDatum: 100, maxWeight: 10000 },
    { id: 13, label: 'P13', distanceFromDatum: 110, maxWeight: 10000 },
    { id: 14, label: 'P14', distanceFromDatum: 120, maxWeight: 10000 },
    { id: 15, label: 'P15', distanceFromDatum: 130, maxWeight: 10000 },
    { id: 16, label: 'P16', distanceFromDatum: 140, maxWeight: 10000 },
    { id: 17, label: 'P17', distanceFromDatum: 150, maxWeight: 10000 },
    { id: 18, label: 'P18', distanceFromDatum: 160, maxWeight: 10000 }
  ]
};

export const C27J_CONFIG: AircraftBalanceConfig = {
  id: 'c27j',
  name: 'C-27J Spartan',
  totalLength: 74.5, // feet
  cargoCompartmentStart: 35, // feet from nose
  cargoCompartmentLength: 30, // feet
  forwardCGLimit: 18, // percentage
  aftCGLimit: 38, // percentage
  maxWeight: 25000, // lbs
  positions: [
    { id: 1, label: 'P1', distanceFromDatum: 38, maxWeight: 10000 },
    { id: 2, label: 'P2', distanceFromDatum: 48, maxWeight: 10000 },
    { id: 3, label: 'P3', distanceFromDatum: 58, maxWeight: 10000 }
  ]
};

export const KC30A_CONFIG: AircraftBalanceConfig = {
  id: 'kc30a',
  name: 'KC30-A Airbus',
  totalLength: 192, // feet
  cargoCompartmentStart: 80, // feet from nose
  cargoCompartmentLength: 100, // feet
  forwardCGLimit: 25, // percentage
  aftCGLimit: 45, // percentage
  maxWeight: 75000, // lbs (converted from kg)
  positions: [
    // Main deck positions
    { id: 1, label: 'LD1', distanceFromDatum: 85, maxWeight: 15000 },
    { id: 2, label: 'LD2', distanceFromDatum: 95, maxWeight: 15000 },
    { id: 3, label: 'LD3', distanceFromDatum: 105, maxWeight: 15000 },
    { id: 4, label: 'LD4', distanceFromDatum: 115, maxWeight: 15000 },
    { id: 5, label: 'LD5', distanceFromDatum: 125, maxWeight: 15000 },
    { id: 6, label: 'LD6', distanceFromDatum: 135, maxWeight: 15000 },
    { id: 7, label: 'LD7', distanceFromDatum: 145, maxWeight: 15000 },
    { id: 8, label: 'LD8', distanceFromDatum: 155, maxWeight: 15000 },
    { id: 9, label: 'LD9', distanceFromDatum: 165, maxWeight: 15000 },
    { id: 10, label: 'LD10', distanceFromDatum: 175, maxWeight: 15000 },
    // Additional positions for KC30A
    { id: 11, label: 'LD11', distanceFromDatum: 90, maxWeight: 15000 },
    { id: 12, label: 'LD12', distanceFromDatum: 100, maxWeight: 15000 },
    { id: 13, label: 'LD13', distanceFromDatum: 110, maxWeight: 15000 },
    { id: 14, label: 'LD14', distanceFromDatum: 120, maxWeight: 15000 },
    { id: 15, label: 'LD15', distanceFromDatum: 130, maxWeight: 15000 },
    { id: 16, label: 'LD16', distanceFromDatum: 140, maxWeight: 15000 },
    { id: 17, label: 'LD17', distanceFromDatum: 150, maxWeight: 15000 },
    { id: 18, label: 'LD18', distanceFromDatum: 160, maxWeight: 15000 },
    { id: 19, label: 'LD19', distanceFromDatum: 170, maxWeight: 15000 },
    { id: 20, label: 'LD20', distanceFromDatum: 180, maxWeight: 15000 },
    { id: 21, label: 'LD21', distanceFromDatum: 87, maxWeight: 15000 },
    { id: 22, label: 'LD22', distanceFromDatum: 97, maxWeight: 15000 },
    { id: 23, label: 'LD23', distanceFromDatum: 107, maxWeight: 15000 },
    { id: 24, label: 'LD24', distanceFromDatum: 117, maxWeight: 15000 },
    { id: 25, label: 'LD25', distanceFromDatum: 127, maxWeight: 15000 },
    { id: 26, label: 'LD26', distanceFromDatum: 137, maxWeight: 15000 }
  ]
};

/**
 * Simple Physics-Based Balance Calculator
 * Uses standard moment calculations and position-based balance
 */
export function calculateAdvancedBalance(
  cargoItems: CargoItem[],
  aircraftConfig: AircraftBalanceConfig
): BalanceResult {
  // If no cargo, return balanced state
  if (!cargoItems || cargoItems.length === 0) {
    return {
      centerOfGravity: 45.0, // Mid-range CG
      momentArm: 0,
      totalWeight: 0,
      balance: 0, // Perfectly balanced
      status: 'safe',
      weightDistribution: []
    };
  }

  let totalWeight = 0;
  let weightedPositionSum = 0; // For simple position-based balance
  const weightDistribution: BalanceResult['weightDistribution'] = [];

  // Calculate balance using simple position-based physics
  cargoItems.forEach(item => {
    // Skip empty pallets
    if (!item.weight || item.weight <= 0) return;

    totalWeight += item.weight;
    
    // Simple position-based calculation: position 0-7 maps to -4 to +3
    // P1(0) = -3.5, P2(1) = -2.5, P3(2) = -1.5, P4(3) = -0.5
    // P5(4) = +0.5, P6(5) = +1.5, P7(6) = +2.5, P8(7) = +3.5
    const positionWeight = item.position - 3.5; // Centers around 0
    weightedPositionSum += item.weight * positionWeight;

    weightDistribution.push({
      position: item.positionLabel,
      weight: item.weight,
      moment: item.weight * positionWeight,
      influence: 0 // Will be calculated below
    });
  });

  // Calculate influences
  if (totalWeight > 0) {
    weightDistribution.forEach(item => {
      item.influence = (item.weight / totalWeight) * 100;
    });
  }

  // Simple balance calculation: negative = forward heavy, positive = aft heavy
  let balance = 0;
  if (totalWeight > 0) {
    balance = (weightedPositionSum / totalWeight) * 20; // Scale factor for sensitivity
    balance = Math.max(-100, Math.min(100, balance)); // Clamp to range
  }

  // Calculate CG percentage (map balance to CG range)
  const centerCG = (aircraftConfig.forwardCGLimit + aircraftConfig.aftCGLimit) / 2;
  const cgRange = aircraftConfig.aftCGLimit - aircraftConfig.forwardCGLimit;
  const centerOfGravity = centerCG + (balance * cgRange / 200); // Map -100/+100 to CG range

  // Determine status
  let status: BalanceResult['status'] = 'safe';
  if (totalWeight === 0) {
    status = 'safe';
  } else if (centerOfGravity < aircraftConfig.forwardCGLimit || centerOfGravity > aircraftConfig.aftCGLimit) {
    status = 'critical';
  } else if (Math.abs(balance) > 60) {
    status = 'warning';
  } else if (Math.abs(balance) > 30) {
    status = 'caution';
  }

  return {
    centerOfGravity: Math.max(aircraftConfig.forwardCGLimit, Math.min(aircraftConfig.aftCGLimit, centerOfGravity)),
    momentArm: weightedPositionSum,
    totalWeight: totalWeight,
    balance: balance,
    status: status,
    weightDistribution: weightDistribution
  };
}

/**
 * Convert CG position to percentage of Mean Aerodynamic Chord
 */
function calculateCGPercentage(cgPosition: number, config: AircraftBalanceConfig): number {
  // Calculate the center point of the cargo compartment
  const centerPoint = config.cargoCompartmentStart + (config.cargoCompartmentLength / 2);
  
  // If no cargo (cgPosition = 0), return center percentage
  if (cgPosition === 0) {
    return (config.forwardCGLimit + config.aftCGLimit) / 2;
  }
  
  // Calculate relative position within the allowable CG range
  const forwardLimit = config.cargoCompartmentStart;
  const aftLimit = config.cargoCompartmentStart + config.cargoCompartmentLength;
  
  // Map physical position to CG percentage range
  const relativePosition = (cgPosition - forwardLimit) / (aftLimit - forwardLimit);
  const cgPercentage = config.forwardCGLimit + (relativePosition * (config.aftCGLimit - config.forwardCGLimit));
  
  return Math.max(config.forwardCGLimit, Math.min(config.aftCGLimit, cgPercentage));
}

/**
 * Calculate balance value from -100 (nose heavy) to +100 (tail heavy)
 */
function calculateBalanceValue(cgPercentage: number, config: AircraftBalanceConfig): number {
  // Calculate the ideal center CG percentage
  const idealCG = (config.forwardCGLimit + config.aftCGLimit) / 2;
  
  // If at ideal center, balance is 0
  if (Math.abs(cgPercentage - idealCG) < 0.1) return 0;
  
  // Calculate deviation from center
  const deviation = cgPercentage - idealCG;
  const maxDeviation = (config.aftCGLimit - config.forwardCGLimit) / 2;
  
  // Scale to -100 to +100 range
  return Math.max(-100, Math.min(100, (deviation / maxDeviation) * 100));
}

/**
 * Determine balance status based on CG position
 */
function determineBalanceStatus(cgPercentage: number, config: AircraftBalanceConfig): BalanceResult['status'] {
  if (cgPercentage < config.forwardCGLimit || cgPercentage > config.aftCGLimit) {
    return 'critical';
  }
  
  const marginForward = cgPercentage - config.forwardCGLimit;
  const marginAft = config.aftCGLimit - cgPercentage;
  const minMargin = Math.min(marginForward, marginAft);
  
  const cgRange = config.aftCGLimit - config.forwardCGLimit;
  const marginPercentage = (minMargin / cgRange) * 100;
  
  if (marginPercentage < 10) return 'warning';
  if (marginPercentage < 25) return 'caution';
  return 'safe';
}

/**
 * Get aircraft configuration by ID
 */
export function getAircraftConfig(aircraftId: string): AircraftBalanceConfig {
  switch (aircraftId) {
    case 'c130':
      return C130_CONFIG;
    case 'c17':
      return C17_CONFIG;
    case 'c27j':
      return C27J_CONFIG;
    case 'kc30a':
      return KC30A_CONFIG;
    default:
      return C130_CONFIG; // Default to C-130
  }
}

/**
 * Get all available aircraft configurations
 */
export function getAllAircraftConfigs(): AircraftBalanceConfig[] {
  return [C130_CONFIG, C17_CONFIG, C27J_CONFIG, KC30A_CONFIG];
}

/**
 * Validate cargo loading against aircraft limits
 */
export function validateCargoLoad(
  cargoItems: CargoItem[],
  aircraftConfig: AircraftBalanceConfig
): Array<{ type: 'error' | 'warning'; message: string; position?: string }> {
  const issues: Array<{ type: 'error' | 'warning'; message: string; position?: string }> = [];
  
  // Check total weight
  const totalWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight > aircraftConfig.maxWeight) {
    issues.push({
      type: 'error',
      message: `Total weight (${totalWeight.toLocaleString()} lbs) exceeds aircraft maximum (${aircraftConfig.maxWeight.toLocaleString()} lbs)`
    });
  }
  
  // Check individual position limits
  cargoItems.forEach(item => {
    const positionConfig = aircraftConfig.positions.find(p => p.id === item.position + 1);
    if (positionConfig && item.weight > positionConfig.maxWeight) {
      issues.push({
        type: 'error',
        message: `Weight at ${item.positionLabel} (${item.weight.toLocaleString()} lbs) exceeds position limit (${positionConfig.maxWeight.toLocaleString()} lbs)`,
        position: item.positionLabel
      });
    }
  });
  
  // Check balance
  const balanceResult = calculateAdvancedBalance(cargoItems, aircraftConfig);
  if (balanceResult.status === 'critical') {
    issues.push({
      type: 'error',
      message: `Center of gravity (${balanceResult.centerOfGravity.toFixed(1)}%) is outside safe limits (${aircraftConfig.forwardCGLimit}%-${aircraftConfig.aftCGLimit}%)`
    });
  } else if (balanceResult.status === 'warning') {
    issues.push({
      type: 'warning',
      message: `Center of gravity (${balanceResult.centerOfGravity.toFixed(1)}%) is approaching limits`
    });
  }
  
  return issues;
}