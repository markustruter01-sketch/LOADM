export default function C17WeightBalance() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1 className="text-2xl font-bold mb-4">C-17 Globemaster III — Weight and Balance Fundamentals</h1>

      <h2 className="text-xl font-semibold mt-6 mb-3">Introduction</h2>
      <p>
        Weight and balance is one of the most critical responsibilities of a C-17 loadmaster. An improperly
        balanced aircraft can become uncontrollable in flight, even when total weight is within limits. Every
        load plan must be calculated and verified before the aircraft departs, and the loadmaster is
        personally accountable for the accuracy of that data.
      </p>
      <p>
        This module introduces the core concepts of weight and balance as they apply to C-17 Globemaster III
        operations, including how the centre of gravity (CG) is calculated, how to read the CG envelope,
        and the documentation required for every mission.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Key Definitions</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>
          <strong>Operating Weight (OW):</strong> The weight of the aircraft including crew, crew equipment,
          and all fixed items, but excluding fuel and payload.
        </li>
        <li>
          <strong>Zero Fuel Weight (ZFW):</strong> OW plus payload. This is the weight of the aircraft
          before fuel is added.
        </li>
        <li>
          <strong>Gross Weight (GW):</strong> Total aircraft weight including fuel, cargo, passengers, and crew.
        </li>
        <li>
          <strong>Maximum Gross Weight:</strong> 585,000 lbs (265,350 kg) for takeoff.
        </li>
        <li>
          <strong>Maximum Payload:</strong> 170,900 lbs (77,519 kg).
        </li>
        <li>
          <strong>Centre of Gravity (CG):</strong> The point at which the total weight of the aircraft
          acts. Expressed as a percentage of Mean Aerodynamic Chord (%MAC).
        </li>
        <li>
          <strong>Datum:</strong> A fixed reference point (typically the nose) from which all moment arm
          distances are measured.
        </li>
        <li>
          <strong>Moment:</strong> Weight × Arm. The product of an item's weight and its distance from
          the datum. Moment determines how much influence each item has on the CG.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-3">The Centre of Gravity Envelope</h2>
      <p>
        The CG envelope defines the forward and aft limits within which the CG must remain throughout all
        phases of flight. Operating outside these limits can cause the aircraft to become uncontrollable
        or structurally overstressed.
      </p>
      <p>For the C-17, CG limits are expressed in %MAC:</p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Forward limit:</strong> Approximately 12% MAC (varies with gross weight)</li>
        <li><strong>Aft limit:</strong> Approximately 40% MAC (varies with gross weight)</li>
      </ul>
      <p>
        The limits change with gross weight, so loadmasters must use the approved CG chart for the actual
        gross weight at each phase of flight: take-off, cruise, and landing. The chart accounts for fuel
        burn, which shifts the CG as fuel is consumed during flight.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Calculating the CG</h2>
      <p>The basic process for calculating CG is:</p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>Determine the weight of each item</strong> — cargo, passengers, fuel, crew, and the
          aircraft's basic operating weight.
        </li>
        <li>
          <strong>Determine the arm of each item</strong> — its distance from the datum, measured in
          inches. Arm values for pallet positions are pre-printed on the load planning forms.
        </li>
        <li>
          <strong>Calculate each item's moment</strong> — Weight × Arm = Moment. Moments are typically
          expressed in thousands of inch-pounds (in-lb × 1000) to keep the numbers manageable.
        </li>
        <li>
          <strong>Sum all weights</strong> and <strong>sum all moments</strong> separately.
        </li>
        <li>
          <strong>Divide total moments by total weight</strong> to get the CG position in inches from
          the datum.
        </li>
        <li>
          <strong>Convert to %MAC</strong> using the approved conversion table.
        </li>
      </ol>

      <h2 className="text-xl font-semibold mt-6 mb-3">Pallet Position Arms — C-17</h2>
      <p>
        Each of the 18 pallet positions has a pre-assigned arm value. The forward positions have shorter
        arms (smaller numbers), while aft positions have longer arms (larger numbers). Loading heavier
        cargo forward shifts the CG forward; loading heavy cargo aft shifts it aft.
      </p>
      <p>Approximate arm values for selected positions (inches from datum):</p>
      <ul className="list-disc pl-6 mb-4">
        <li>Positions A1/B1 (forward): ~480 in</li>
        <li>Positions A5/B5 (mid): ~640 in</li>
        <li>Positions A9/B9 (aft): ~800 in</li>
        <li>Ramp positions: ~850–900 in</li>
      </ul>
      <p>
        These values allow the loadmaster to quickly estimate how a proposed load will affect CG before
        completing the full calculation.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Fuel and CG</h2>
      <p>
        Fuel is the largest variable in any C-17 mission. The C-17 carries up to 181,054 lbs (82,130 kg)
        of fuel in six wing tanks and two centre wing box tanks. As fuel burns during flight, both gross
        weight and CG change simultaneously.
      </p>
      <p>Critical fuel-related W&amp;B considerations:</p>
      <ul className="list-disc pl-6 mb-4">
        <li>
          Fuel tank arms differ — centre tanks and wing inner tanks have different arm values, so the
          burn sequence affects CG position.
        </li>
        <li>
          The aircraft's Fuel Management System automatically manages burn sequence to keep CG within
          limits, but the loadmaster must still verify the initial loaded condition.
        </li>
        <li>
          For missions with fuel offload (e.g., buddy-buddy refuelling), the loadmaster must check the
          CG at the fuel-offloaded condition as well.
        </li>
        <li>
          Always calculate W&amp;B at the most critical expected fuel state — typically at maximum fuel
          (heaviest takeoff) and at minimum planned fuel (lightest landing).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-3">Troop Seating and Passenger Loads</h2>
      <p>
        When the C-17 is configured for troops or passengers, each seat has a pre-assigned arm value.
        A standard planning weight of 200 lbs (91 kg) per person including personal gear is used for
        initial planning. Actual weights must be used when available.
      </p>
      <p>
        The troop seats are located along the left fuselage wall (rows A1–A27) and the right fuselage
        wall (rows B1–B27), as well as a centre row in certain configurations. The loadmaster must
        include all passenger weights and seat arm values in the W&amp;B calculation.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-3">Documentation Requirements</h2>
      <p>Every C-17 mission requires the following W&amp;B documentation:</p>
      <ol className="list-decimal pl-6 mb-4">
        <li>
          <strong>DD Form 365-4 (Weight and Balance Clearance Form F — Transport):</strong> The primary
          W&amp;B document completed by the loadmaster. Must be signed and retained with the aircraft
          forms.
        </li>
        <li>
          <strong>Load Plan (AFTO Form 781):</strong> Graphical representation of cargo placement,
          pallet positions, vehicle loading, and passenger seating.
        </li>
        <li>
          <strong>Dangerous Goods Declaration:</strong> Required any time hazardous materials are
          aboard, identifying quantity, class, and location.
        </li>
        <li>
          <strong>Shipper's Declaration for Dangerous Goods:</strong> Provided by the cargo shipper and
          verified by the loadmaster.
        </li>
        <li>
          <strong>Troop/Passenger Manifest:</strong> Complete list of all personnel aboard, including
          weight for W&amp;B purposes.
        </li>
      </ol>

      <h2 className="text-xl font-semibold mt-6 mb-3">Common W&amp;B Errors to Avoid</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Using estimated rather than actual cargo weights without authorisation</li>
        <li>Forgetting to include crew baggage and equipment in the calculation</li>
        <li>Failing to recheck CG after last-minute cargo changes</li>
        <li>Using an incorrect operating weight from an outdated aircraft forms extract</li>
        <li>Not accounting for the shift in CG when the cargo ramp is lowered</li>
        <li>Neglecting to verify CG at multiple fuel states for long-duration missions</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-3">Summary</h2>
      <p>
        Weight and balance is not a formality — it is a fundamental safety requirement. The loadmaster
        must approach every load with precision, verifying that the CG remains within limits at all
        critical phases of flight. A thorough understanding of the CG envelope, moment calculation, and
        the effects of fuel burn are essential skills that every C-17 loadmaster must master before
        conducting independent load operations.
      </p>
    </div>
  )
}
