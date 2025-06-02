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
  forwardCGLimit: 15, // percentage
  aftCGLimit: 35, // percentage
  maxWeight: 42000, // lbs
  positions: [
    { id: 1, label: 'P1', distanceFromDatum: 48, maxWeight: 10000 },
    { id: 2, label: 'P2', distanceFromDatum: 56, maxWeight: 10000 },
    { id: 3, label: 'P3', distanceFromDatum: 64, maxWeight: 10000 },
    { id: 4, label: 'P4', distanceFromDatum: 72, maxWeight: 10000 },
    { id: 5, label: 'P5', distanceFromDatum: 80, maxWeight: 10000 },
    { id: 6, label: 'P6', distanceFromDatum: 88, maxWeight: 10000 },
    { id: 7, label: 'P7', distanceFromDatum: 96, maxWeight: 10000 },
    { id: 8, label: 'P8', distanceFromDatum: 104, maxWeight: 10000 }
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
 * Advanced Balance Calculation Engine
 * 
 * This function calculates aircraft balance considering:
 * 1. Weight distribution across all cargo positions
 * 2. Weighted influence (heavier cargo has more impact)
 * 3. Physical position relative to aircraft datum
 * 4. Aircraft-specific limits and characteristics
 */
export function calculateAdvancedBalance(
  cargoItems: CargoItem[],
  aircraftConfig: AircraftBalanceConfig
): BalanceResult {
  // Initialize calculation variables
  let totalWeight = 0;
  let totalMoment = 0;
  const weightDistribution: BalanceResult['weightDistribution'] = [];

  // Step 1: Calculate basic moments and weights
  cargoItems.forEach(item => {
    if (item.weight <= 0) return;

    // Find position configuration
    const positionConfig = aircraftConfig.positions.find(p => p.id === item.position + 1);
    if (!positionConfig) return;

    // Calculate moment (weight × distance from datum)
    const moment = item.weight * positionConfig.distanceFromDatum;
    
    totalWeight += item.weight;
    totalMoment += moment;

    weightDistribution.push({
      position: item.positionLabel,
      weight: item.weight,
      moment: moment,
      influence: 0 // Will be calculated after all items are processed
    });
  });

  // Step 2: Calculate weighted influence (heavier items have proportionally more impact)
  if (totalWeight > 0) {
    weightDistribution.forEach(item => {
      // Calculate base influence (weight percentage)
      const baseInfluence = (item.weight / totalWeight) * 100;
      
      // Apply weight amplification factor for heavier items
      // Items over 50% of max position weight get amplified influence
      const positionConfig = aircraftConfig.positions.find(p => p.label === item.position);
      const maxPositionWeight = positionConfig?.maxWeight || 10000;
      const weightRatio = item.weight / maxPositionWeight;
      
      // Amplification factor: 1.0 for light items, up to 2.0 for very heavy items
      const amplificationFactor = 1 + Math.min(weightRatio, 1) * 1;
      
      item.influence = baseInfluence * amplificationFactor;
    });

    // Normalize influences to sum to 100%
    const totalInfluence = weightDistribution.reduce((sum, item) => sum + item.influence, 0);
    if (totalInfluence > 0) {
      weightDistribution.forEach(item => {
        item.influence = (item.influence / totalInfluence) * 100;
      });
    }
  }

  // Step 3: Calculate Center of Gravity
  let centerOfGravity = 0;
  if (totalWeight > 0) {
    centerOfGravity = totalMoment / totalWeight;
  }

  // Step 4: Convert to percentage of Mean Aerodynamic Chord (MAC)
  const cgPercentage = calculateCGPercentage(centerOfGravity, aircraftConfig);

  // Step 5: Calculate balance value (-100 to +100)
  const balance = calculateBalanceValue(cgPercentage, aircraftConfig);

  // Step 6: Determine status
  const status = determineBalanceStatus(cgPercentage, aircraftConfig);

  return {
    centerOfGravity: cgPercentage,
    momentArm: totalMoment,
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
  // For C-130, convert physical position to percentage
  // Aircraft datum is typically at the nose, CG limits are % of MAC
  const macStart = config.cargoCompartmentStart;
  const macLength = config.cargoCompartmentLength;
  
  // Calculate relative position within cargo compartment
  const relativePosition = (cgPosition - macStart) / macLength;
  
  // Convert to percentage (0-100)
  return Math.max(0, Math.min(100, relativePosition * 100));
}

/**
 * Calculate balance value from -100 (nose heavy) to +100 (tail heavy)
 */
function calculateBalanceValue(cgPercentage: number, config: AircraftBalanceConfig): number {
  // Ideal CG is typically around 25% for most aircraft
  const idealCG = (config.forwardCGLimit + config.aftCGLimit) / 2;
  
  // Calculate deviation from ideal
  const deviation = cgPercentage - idealCG;
  
  // Scale to -100 to +100 range
  const maxDeviation = Math.max(idealCG - config.forwardCGLimit, config.aftCGLimit - idealCG);
  
  if (maxDeviation === 0) return 0;
  
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