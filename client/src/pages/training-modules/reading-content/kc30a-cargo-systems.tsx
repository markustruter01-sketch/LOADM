import React from "react";

export default function KC30ACargoBaySystems() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-2xl font-bold mb-4">KC30-A Multi-Role Tanker Transport Cargo Systems</h1>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Overview</h2>
      <p>
        The KC30-A MRTT (Airbus A330 MRTT) is a multi-role platform that combines air-to-air refueling 
        capability with significant cargo and passenger transport capacity. Its cargo systems differ 
        substantially from those of dedicated military transports like the C-17 and C-130.
      </p>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Cargo Compartment Configuration</h2>
      <p>
        The KC30-A features a cargo system derived from its civilian A330 counterpart, with 
        modifications to meet military requirements:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>Lower deck cargo compartment with LD3 container capacity</li>
        <li>Optional main deck cargo configuration with 8-position pallet system</li>
        <li>Combination passenger/cargo capability</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">LD3 Container System</h2>
      <p>
        The primary cargo system of the KC30-A uses LD3 containers in the lower deck:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>LD3 Container Dimensions:</strong> 153 x 156 x 163 cm (60.4 x 61.5 x 64 inches)</li>
        <li><strong>Container Capacity:</strong> Up to 14 LD3 containers</li>
        <li><strong>Weight Capacity:</strong> Each LD3 position can hold up to 1,588 kg (3,500 lbs)</li>
        <li><strong>Volume:</strong> Each LD3 provides approximately 4.5 cubic meters (159 cubic feet) of volume</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Container Types and Specifications</h2>
      <p>
        Several LD3 container variants can be used with the KC30-A:
      </p>
      <table className="border-collapse border border-gray-800 my-4 w-full">
        <thead>
          <tr className="bg-gray-800">
            <th className="border border-gray-700 px-4 py-2">Container Type</th>
            <th className="border border-gray-700 px-4 py-2">Tare Weight</th>
            <th className="border border-gray-700 px-4 py-2">Max Gross</th>
            <th className="border border-gray-700 px-4 py-2">Net Capacity</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-700 px-4 py-2">LD3 Standard</td>
            <td className="border border-gray-700 px-4 py-2">76 kg</td>
            <td className="border border-gray-700 px-4 py-2">1,588 kg</td>
            <td className="border border-gray-700 px-4 py-2">1,512 kg</td>
          </tr>
          <tr>
            <td className="border border-gray-700 px-4 py-2">LD3-45 (45" height)</td>
            <td className="border border-gray-700 px-4 py-2">88 kg</td>
            <td className="border border-gray-700 px-4 py-2">1,588 kg</td>
            <td className="border border-gray-700 px-4 py-2">1,500 kg</td>
          </tr>
          <tr>
            <td className="border border-gray-700 px-4 py-2">LD3-45W (heavy duty)</td>
            <td className="border border-gray-700 px-4 py-2">90 kg</td>
            <td className="border border-gray-700 px-4 py-2">2,000 kg</td>
            <td className="border border-gray-700 px-4 py-2">1,910 kg</td>
          </tr>
        </tbody>
      </table>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Alternative Pallet Configuration</h2>
      <p>
        The KC30-A can be configured with a simplified 8-position pallet system as an alternative to the LD3 container system:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Pallet Dimensions:</strong> 224 x 318 cm (88 x 125 inches)</li>
        <li><strong>Weight Capacity:</strong> Up to 6,800 kg (15,000 lbs) per pallet position</li>
        <li><strong>Configuration:</strong> Single row of 8 pallets in main cargo deck</li>
        <li><strong>Base Weight:</strong> Each pallet has a tare weight of 136 kg (300 lbs)</li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Cargo Loading Systems</h2>
      <p>
        The KC30-A employs several systems to facilitate cargo loading and management:
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Lower Deck Loader:</strong> Specifically designed to handle LD3 containers, 
          operated at standard height for lower deck loading.
        </li>
        <li>
          <strong>Power Drive Units (PDUs):</strong> Motorized rollers that allow containers 
          to be moved within the cargo hold without manual effort.
        </li>
        <li>
          <strong>Locking Mechanisms:</strong> Automatic locks that secure containers in place 
          during flight operations.
        </li>
        <li>
          <strong>Load Control System:</strong> Electronic monitoring of container positions 
          and locking status.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Weight and Balance Considerations</h2>
      <p>
        Several key factors affect weight and balance in the KC30-A:
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Fuel Load Interaction:</strong> Unlike dedicated cargo aircraft, the KC30-A's 
          primary mission is air-to-air refueling, meaning cargo loads must be balanced with variable 
          fuel loads throughout the mission.
        </li>
        <li>
          <strong>Unit of Measurement:</strong> The KC30-A uses kilograms as its standard weight unit, 
          unlike some other military aircraft that use pounds.
        </li>
        <li>
          <strong>Center of Gravity Range:</strong> The aircraft has specific CG limits that must be 
          maintained throughout the flight, affected by both cargo and fuel distribution.
        </li>
        <li>
          <strong>Fuel Transfer Capabilities:</strong> The aircraft can transfer fuel between tanks 
          to adjust CG during flight as fuel is offloaded to receiver aircraft.
        </li>
      </ul>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Operational Considerations</h2>
      <p>
        When planning cargo operations with the KC30-A, consider:
      </p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Dual-Role Missions:</strong> Balance requirements for both air-to-air refueling and 
          cargo transport missions.
        </li>
        <li>
          <strong>Container Selection:</strong> Choose appropriate container types based on cargo 
          density and total weight.
        </li>
        <li>
          <strong>Loading Sequence:</strong> Load according to the planned sequence to minimize 
          shifting of containers during loading operations.
        </li>
        <li>
          <strong>Weight Distribution:</strong> Distribute weight evenly to maintain aircraft balance, 
          especially considering variable fuel loads.
        </li>
        <li>
          <strong>Configuration Changes:</strong> Consider the time required to transition between 
          passenger, cargo, and mixed configurations.
        </li>
      </ol>
      
      <h2 className="text-xl font-semibold mt-6 mb-3">Summary</h2>
      <p>
        The KC30-A provides significant cargo capability alongside its primary air-to-air refueling role. 
        The lower deck LD3 container system offers efficient cargo handling for a wide range of mission 
        requirements, while the alternative pallet configuration provides flexibility for different 
        cargo types. Understanding these systems is essential for loadmasters to effectively utilize 
        the aircraft's cargo capabilities while maintaining its primary tanker mission capacity.
      </p>
    </div>
  );
}