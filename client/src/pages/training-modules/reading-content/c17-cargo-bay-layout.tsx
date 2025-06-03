import React from "react";

export default function C17CargoBayLayout() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-2xl font-bold mb-4">C-17 Globemaster III Cargo Bay Layout</h1>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Overview</h2>
      <p>
        The C-17 Globemaster III provides strategic airlift capability for the RAAF and allied nations. 
        Understanding its cargo compartment layout is essential for loadmasters to properly plan and 
        execute load operations.
      </p>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Cargo Compartment Dimensions</h2>
      <p>The C-17 cargo compartment offers the following dimensions:</p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Length:</strong> 88 feet (26.82 meters)</li>
        <li><strong>Width:</strong> 18 feet (5.49 meters)</li>
        <li><strong>Height:</strong> 12 feet 4 inches (3.76 meters)</li>
        <li><strong>Volume:</strong> 20,900 cubic feet (592 cubic meters)</li>
        <li><strong>Usable floor area:</strong> 1,740 square feet (162 square meters)</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Cargo Loading System</h2>
      <p>The C-17 employs the 463L cargo handling system, which includes:</p>
      <ol className="list-decimal pl-6 mb-4">
        <li><strong>Dual Rail System:</strong> Two parallel rows of roller conveyors running along the cargo floor.</li>
        <li><strong>Logistics Rail System:</strong> Tracks embedded in the floor for securing cargo via tie-down rings.</li>
        <li><strong>Locking Mechanisms:</strong> Spring-loaded detents positioned at 40-inch intervals to secure pallets.</li>
        <li><strong>Pallet Positions:</strong> 18 standard positions for 463L pallets arranged in a 2 x 9 grid.</li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Pallet Position Identification</h2>
      <p>
        Each pallet position is identified using a letter-number combination:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Letters:</strong> Designate the row (A for left side, B for right side when facing forward)</li>
        <li><strong>Numbers:</strong> Designate the position from front to back (1-9)</li>
      </ul>
      <p>For example:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Position A1: Forward-most left position</li>
        <li>Position B5: Middle right position</li>
        <li>Position A9: Aft-most left position</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Cargo Floor Weight Limitations</h2>
      <p>Weight limitations differ across various sections of the cargo floor:</p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Roller Conveyor:</strong> 13,000 pounds per linear foot (19,340 kg/m)</li>
        <li><strong>Center Section:</strong> 3,500 pounds per square foot (17,090 kg/m²)</li>
        <li><strong>Ramp:</strong> 4,500 pounds per linear foot (6,700 kg/m) when in flight</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Special Loading Areas</h2>
      <p>The C-17 cargo compartment includes several specialized areas:</p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Ramp Section:</strong> Located at the rear of the aircraft, it can be lowered for loading/unloading. 
          The ramp is 20 feet (6.1 meters) long and can support major equipment during flight.
        </li>
        <li>
          <strong>Troop Compartment:</strong> Located on the left side wall, it can seat up to 54 passengers 
          when configured for mixed cargo/passenger operations.
        </li>
        <li>
          <strong>Airdrop Zone:</strong> The central section of the cargo compartment is reinforced for 
          heavy equipment airdrop operations.
        </li>
        <li>
          <strong>Forward Section:</strong> The area immediately aft of the flight deck has additional 
          restraint provisions for specialized equipment.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Loading Considerations</h2>
      <p>When planning loads for the C-17, consider:</p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Center of Balance:</strong> Load must be distributed to maintain aircraft center of gravity 
          within prescribed limits.
        </li>
        <li>
          <strong>Restraint Requirements:</strong>
          <ul className="list-disc pl-6 mt-2">
            <li>Forward: 3G (three times the cargo weight)</li>
            <li>Aft: 1.5G</li>
            <li>Lateral: 1.5G</li>
            <li>Vertical: 2G</li>
          </ul>
        </li>
        <li>
          <strong>Access Requirements:</strong> 24-inch minimum clearance between cargo and ceiling for emergency access.
        </li>
        <li>
          <strong>Hazardous Materials Segregation:</strong> Specific separation distances must be maintained 
          between incompatible hazardous materials.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Summary</h2>
      <p>
        The C-17 cargo bay's versatile configuration allows for transportation of virtually all air-transportable 
        equipment, including:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Tanks, armored vehicles, and mobile artillery</li>
        <li>Helicopters and aircraft components</li>
        <li>Containerized cargo and palletized supplies</li>
        <li>Airdrop platforms and personnel</li>
      </ul>
      <p>
        Proper understanding of the cargo compartment layout ensures safe and efficient load planning, 
        maximizing the C-17's strategic airlift capabilities.
      </p>
    </div>
  );
}