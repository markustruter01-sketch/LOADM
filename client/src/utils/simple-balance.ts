/**
 * Simple Balance Calculator - Built from scratch
 * Uses basic physics principles for aircraft balance calculations
 */

export interface CargoPosition {
  id: string;
  label: string;
  weight: number;
  position: number; // 0-based index from front to back
  cargoType: string;
  dgClass: string;
  description: string;
}

export interface BalanceResult {
  balance: number; // -100 (forward heavy) to +100 (aft heavy)
  centerOfGravity: number; // CG percentage
  status: 'safe' | 'caution' | 'warning' | 'critical';
  totalWeight: number;
}

export interface AircraftConfig {
  id: string;
  name: string;
  positions: number;
  maxWeight: number;
  forwardLimit: number;
  aftLimit: number;
}

export const AIRCRAFT_CONFIGS: Record<string, AircraftConfig> = {
  c130: {
    id: 'c130',
    name: 'C-130 Hercules',
    positions: 8,
    maxWeight: 42000,
    forwardLimit: 25,
    aftLimit: 65
  },
  c17: {
    id: 'c17', 
    name: 'C-17 Globemaster',
    positions: 18,
    maxWeight: 170900,
    forwardLimit: 20,
    aftLimit: 40
  },
  c27j: {
    id: 'c27j',
    name: 'C-27J Spartan', 
    positions: 3,
    maxWeight: 25000,
    forwardLimit: 18,
    aftLimit: 38
  },
  kc30a: {
    id: 'kc30a',
    name: 'KC30-A Airbus',
    positions: 26,
    maxWeight: 75000,
    forwardLimit: 25,
    aftLimit: 45
  }
};

/**
 * Calculate aircraft balance using simple physics
 */
export function calculateBalance(cargoPositions: CargoPosition[], aircraftId: string): BalanceResult {
  const config = AIRCRAFT_CONFIGS[aircraftId];
  if (!config) {
    throw new Error(`Unknown aircraft: ${aircraftId}`);
  }

  // If no cargo, return balanced state
  if (!cargoPositions.length || cargoPositions.every(p => p.weight === 0)) {
    return {
      balance: 0,
      centerOfGravity: (config.forwardLimit + config.aftLimit) / 2,
      status: 'safe',
      totalWeight: 0
    };
  }

  let totalWeight = 0;
  let weightedPositionSum = 0;

  // Calculate weighted position sum using longitudinal positions
  cargoPositions.forEach(cargo => {
    if (cargo.weight > 0) {
      totalWeight += cargo.weight;
      
      // Get longitudinal position based on aircraft layout
      let longitudinalPosition = 0;
      
      if (aircraftId === 'c130') {
        // C-130: 2x4 layout - positions in same column have same longitudinal effect
        // P1,P5 = column 0 (most forward) = -1.5
        // P2,P6 = column 1 = -0.5
        // P3,P7 = column 2 = +0.5  
        // P4,P8 = column 3 (most aft) = +1.5
        const column = cargo.position % 4;
        longitudinalPosition = column - 1.5;
      } else if (aircraftId === 'c27j') {
        // C-27J: 3 positions in line
        longitudinalPosition = cargo.position - 1;
      } else if (aircraftId === 'c17') {
        // C-17: 2x9 layout - positions in same column have same longitudinal effect
        // P1,P10 = column 0 (most forward) = -4
        // P2,P11 = column 1 = -3
        // P3,P12 = column 2 = -2
        // P4,P13 = column 3 = -1
        // P5,P14 = column 4 = 0 (center)
        // P6,P15 = column 5 = +1
        // P7,P16 = column 6 = +2
        // P8,P17 = column 7 = +3
        // P9,P18 = column 8 (most aft) = +4
        const column = cargo.position % 9;
        longitudinalPosition = column - 4;
      } else {
        // Default: single row layout
        longitudinalPosition = cargo.position - (config.positions - 1) / 2;
      }
      
      weightedPositionSum += cargo.weight * longitudinalPosition;
    }
  });

  // Calculate balance (-100 to +100)
  let balance = 0;
  if (totalWeight > 0) {
    const avgPosition = weightedPositionSum / totalWeight;
    
    // Scale to -100 to +100 range based on aircraft layout and weight
    let maxPosition = 1.5; // Default for C-130
    if (aircraftId === 'c27j') {
      maxPosition = 1;
    } else if (aircraftId === 'c17') {
      maxPosition = 4; // C-17 has 9 columns, range -4 to +4
    } else if (aircraftId === 'kc30a') {
      maxPosition = (config.positions - 1) / 2;
    }
    
    // Weight scaling factor - balance effect should be proportional to total weight
    // At maximum aircraft capacity (42,000 lbs for C-130), full position effect
    // At light loads (under 1,000 lbs), minimal effect
    const weightFactor = Math.min(1, totalWeight / (config.maxWeight * 0.25)); // Scale up to 25% of max weight
    
    balance = (avgPosition / maxPosition) * 100 * weightFactor;
    balance = Math.max(-100, Math.min(100, balance));
  }

  // Calculate Center of Gravity
  const cgRange = config.aftLimit - config.forwardLimit;
  const centerOfGravity = config.forwardLimit + (cgRange / 2) + (balance * cgRange / 200);

  // Determine status
  let status: BalanceResult['status'] = 'safe';
  if (centerOfGravity < config.forwardLimit || centerOfGravity > config.aftLimit) {
    status = 'critical';
  } else if (Math.abs(balance) > 70) {
    status = 'warning';
  } else if (Math.abs(balance) > 40) {
    status = 'caution';
  }

  return {
    balance,
    centerOfGravity: Math.max(config.forwardLimit, Math.min(config.aftLimit, centerOfGravity)),
    status,
    totalWeight
  };
}