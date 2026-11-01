import React from "react";

export default function C130CargoConfigurations() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-2xl font-bold mb-4">C-130 Hercules Cargo Configurations and Procedures</h1>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Overview</h2>
      <p>
        The C-130 Hercules is one of the most versatile tactical airlift platforms in military aviation history. 
        With over 60 years of service and continuous improvements across multiple variants, the C-130 can be 
        configured for numerous mission profiles. This flexibility requires loadmasters to have a thorough 
        understanding of its cargo handling systems and capabilities.
      </p>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Cargo Compartment Specifications</h2>
      <p>The C-130 cargo compartment has the following key dimensions:</p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Length:</strong> 40 feet (12.19 meters)</li>
        <li><strong>Width:</strong> 10 feet, 3 inches (3.12 meters)</li>
        <li><strong>Height:</strong> 9 feet, 1 inch (2.77 meters)</li>
        <li><strong>Usable Volume:</strong> Approximately 4,500 cubic feet (127.4 cubic meters)</li>
        <li><strong>Cargo Floor Area:</strong> Approximately 420 square feet (39 square meters)</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Standard Pallet Configuration</h2>
      <p>
        The C-130 can accommodate 463L pallets in the following standard configuration:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Total Capacity:</strong> 8 standard 463L pallets</li>
        <li><strong>Configuration:</strong> 2 rows of 4 pallets (2x4 arrangement)</li>
        <li><strong>Individual Pallet Size:</strong> 108" × 88" (274 cm × 224 cm)</li>
        <li><strong>Maximum Pallet Height:</strong> 96" (244 cm) from the cargo floor</li>
        <li><strong>Maximum Weight Per Pallet Position:</strong> 10,000 lbs (4,536 kg)</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Restraint System</h2>
      <p>
        The C-130 employs a comprehensive cargo restraint system to secure loads during flight:
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Dual Rail Locks:</strong> Positioned along the cargo floor to secure pallets at 
          specific intervals.
        </li>
        <li>
          <strong>Tie-down Rings:</strong> Located throughout the cargo floor and sidewalls with the 
          following capacities:
          <ul className="list-disc pl-6 mt-2">
            <li>Floor rings: 25,000 lbs (11,340 kg) capacity</li>
            <li>Sidewall rings: 10,000 lbs (4,536 kg) capacity</li>
          </ul>
        </li>
        <li>
          <strong>Restraint Requirements:</strong> Cargo must be secured to withstand the following forces:
          <ul className="list-disc pl-6 mt-2">
            <li>Forward: 3G (three times the cargo weight)</li>
            <li>Aft: 1.5G</li>
            <li>Lateral: 1.5G</li>
            <li>Vertical: 2G</li>
          </ul>
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Unique Capabilities</h2>
      <p>
        The C-130 features several unique capabilities that distinguish it from other transport aircraft:
      </p>
      
      <h3 className="text-lg font-semibold mt-4 mb-2">1. Combat Offload</h3>
      <p>
        Combat Offload is a specialized technique that allows for rapid cargo unloading without ground 
        handling equipment. It is executed in the following manner:
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li>Aircraft comes to a stop on the runway or taxiway</li>
        <li>Cargo ramp is lowered and locks removed from pallets</li>
        <li>Aircraft begins to taxi forward slowly</li>
        <li>Brakes are applied momentarily, causing momentum to slide pallets out the rear of the aircraft</li>
      </ol>
      <p>
        This technique is used in austere environments where material handling equipment is unavailable 
        or when rapid offload is required for tactical reasons.
      </p>
      
      <h3 className="text-lg font-semibold mt-4 mb-2">2. Airdrop Operations</h3>
      <p>
        The C-130 is designed to perform various airdrop missions including:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Container Delivery System (CDS):</strong> Delivery of supplies in A-22 containers 
          (up to 2,200 lbs each) via parachute.
        </li>
        <li>
          <strong>Heavy Equipment Drop:</strong> Airdrop of platforms carrying vehicles or other equipment 
          weighing up to 42,000 lbs.
        </li>
        <li>
          <strong>Personnel Airdrop:</strong> Deployment of up to 64 paratroopers via the side paratroop doors.
        </li>
        <li>
          <strong>Low Altitude Parachute Extraction System (LAPES):</strong> Extraction of heavy 
          equipment at very low altitude using parachute drag.
        </li>
      </ul>
      
      <h3 className="text-lg font-semibold mt-4 mb-2">3. Tactical Ground Operations</h3>
      <p>
        The C-130 can operate from austere fields with minimal infrastructure:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Capable of operating from unpaved, dirt, or semi-prepared runways</li>
        <li>Can conduct engine-running offloads (EROs) in tactical situations</li>
        <li>Minimum runway length as short as 3,000 feet with reduced loads</li>
        <li>Self-contained cargo handling via winch system (capacity of 4,536 kg)</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Configuration Variations</h2>
      <p>
        The C-130 can be reconfigured for multiple mission types:
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Full Cargo:</strong> 8 standard pallets or up to 42,000 lbs of rolling stock.
        </li>
        <li>
          <strong>Passenger Transport:</strong> Up to 92 ground troops using sidewall seats.
        </li>
        <li>
          <strong>Medical Evacuation:</strong> Up to 74 litter patients plus medical attendants.
        </li>
        <li>
          <strong>Mixed Configuration:</strong> Combination of pallets and passengers, typically 
          using 4 pallets and 40-50 passengers.
        </li>
        <li>
          <strong>Specialized Configurations:</strong> Includes AC-130 gunship, EC-130 electronic 
          warfare, and MC-130 special operations variants.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Loading Procedure Fundamentals</h2>
      <p>
        Efficient C-130 loading operations follow these key procedures:
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Pre-loading Assessment:</strong> Validate all cargo weights, dimensions, and hazardous 
          materials documentation.
        </li>
        <li>
          <strong>Load Planning:</strong> Develop a balanced load plan that maintains aircraft center of 
          gravity within limits.
        </li>
        <li>
          <strong>Equipment Setup:</strong> Position and verify operation of the cargo handling system 
          and ramp extension.
        </li>
        <li>
          <strong>Loading Execution:</strong> Load cargo according to the load plan sequence, typically 
          from front to rear.
        </li>
        <li>
          <strong>Restraint Application:</strong> Secure cargo using the appropriate combination of 
          locks, straps, and chains to meet restraint requirements.
        </li>
        <li>
          <strong>Load Verification:</strong> Perform final checks of all restraints and ensure the 
          load matches the planned weight and balance.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Weight and Balance Considerations</h2>
      <p>
        Critical weight and balance factors for C-130 operations include:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Maximum Payload:</strong> Approximately 42,000 lbs depending on mission profile and range.
        </li>
        <li>
          <strong>Center of Gravity Limitations:</strong> Must maintain CG within prescribed forward and 
          aft limits for each phase of flight.
        </li>
        <li>
          <strong>Floor Loading Limitations:</strong> Maximum of 50 pounds per square inch (PSI) on the cargo floor.
        </li>
        <li>
          <strong>Ramp Limitations:</strong> 4,000 lbs maximum during flight; 10,000 lbs for ground operations.
        </li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Summary</h2>
      <p>
        The C-130 Hercules remains the backbone of tactical airlift operations due to its unmatched 
        versatility and rugged design. Mastering its cargo handling systems and operating procedures 
        allows loadmasters to exploit the full capabilities of this exceptional aircraft across a wide 
        range of mission profiles, from combat resupply to humanitarian relief. The ability to rapidly 
        reconfigure the cargo compartment and operate from austere locations makes the C-130 an invaluable 
        asset in both military and humanitarian operations worldwide.
      </p>
    </div>
  );
}