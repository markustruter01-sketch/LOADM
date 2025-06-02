/**
 * Simple Balance Calculator - Built from scratch
 * Uses basic physics principles for aircraft balance calculations
 */

export interface CargoPosition {
  id: string;
  label: string;
  weight: number;
  position: number; // 0-based index from front to back
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

  // Calculate weighted position sum
  cargoPositions.forEach(cargo => {
    if (cargo.weight > 0) {
      totalWeight += cargo.weight;
      // Convert position to balance scale: front positions negative, rear positive
      const normalizedPosition = cargo.position - (config.positions - 1) / 2;
      weightedPositionSum += cargo.weight * normalizedPosition;
    }
  });

  // Calculate balance (-100 to +100)
  let balance = 0;
  if (totalWeight > 0) {
    const avgPosition = weightedPositionSum / totalWeight;
    // Scale to -100 to +100 range
    balance = (avgPosition / ((config.positions - 1) / 2)) * 100;
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