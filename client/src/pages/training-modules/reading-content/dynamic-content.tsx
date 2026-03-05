export function getDynamicReadingJSX(
  aircraft: string,
  difficulty: string,
  topics: string[],
  moduleTitle: string
): JSX.Element {
  const key = `${aircraft}-${difficulty}`

  const content: Record<string, JSX.Element> = {

    // ─── ALL AIRCRAFT — BEGINNER ──────────────────────────────────────────────
    "all-beginner": (
      <div>
        <h1>Introduction to Military Load Planning</h1>
        <h2>The Loadmaster Role</h2>
        <p>
          The loadmaster is the aircraft commander's authority on all matters relating to cargo, passengers,
          and the load manifest. No item may be placed aboard a military transport aircraft without the
          loadmaster's approval, and the loadmaster bears legal and professional responsibility for the
          accuracy of all weight and balance documentation. This is a position of significant trust and
          technical complexity — one that combines manual skill, mathematical precision, and sound airmanship
          judgement under time pressure.
        </p>
        <p>
          In the Royal Australian Air Force, loadmasters are trained across multiple airframe types and
          certified to operate in both domestic and deployed environments. A qualified loadmaster must be
          capable of planning and executing loads independently, briefing flight crew on load characteristics,
          and responding appropriately to in-flight emergencies. The role extends from peacetime logistic
          flights to direct combat support in high-threat environments.
        </p>
        <h2>Aircraft Types Overview</h2>
        <p>
          RAAF transport operations span four primary airframes, each with distinct cargo characteristics:
        </p>
        <ul>
          <li><strong>C-17 Globemaster III:</strong> Strategic heavy lifter capable of carrying 77,519 kg
            over intercontinental ranges. The C-17 can transport outsized cargo including armoured vehicles,
            helicopters, and engineering equipment.</li>
          <li><strong>C-130J/H Hercules:</strong> The tactical workhorse of the fleet. The C-130 conducts
            airland, airdrop, and special operations missions from austere airfields around the world.</li>
          <li><strong>KC30-A MRTT:</strong> Primarily an aerial refuelling tanker, the KC30-A also provides
            substantial cargo and passenger capacity on its main deck and in lower-deck containers.</li>
          <li><strong>C-27J Spartan:</strong> The "last tactical mile" aircraft. The C-27J operates into
            short, unprepared strips inaccessible to larger types, delivering critical cargo directly to
            forward units.</li>
        </ul>
        <h2>Basic Terminology and Concepts</h2>
        <p>
          The following terms form the foundation of load planning across all aircraft types. Every loadmaster
          must understand and apply these definitions without reference:
        </p>
        <ul>
          <li><strong>Payload:</strong> The weight of cargo and/or passengers actually carried on a given mission.</li>
          <li><strong>Basic Empty Weight (BEW):</strong> The aircraft weight including all fixed equipment,
            unusable fuel, and operating fluids. BEW is specific to each aircraft tail number.</li>
          <li><strong>Operating Weight (OW):</strong> BEW plus crew, crew equipment, and removable operational
            items. OW is the starting point for all load planning calculations.</li>
          <li><strong>Zero Fuel Weight (ZFW):</strong> OW plus payload. The aircraft's total weight before
            fuel is added. ZFW has a maximum limit imposed by structural constraints.</li>
          <li><strong>Gross Weight (GW):</strong> The total weight of the aircraft including fuel. GW must
            not exceed the Maximum Takeoff Weight (MTOW) for the prevailing conditions.</li>
          <li><strong>Moment:</strong> The product of a weight and its distance from the reference datum.
            Measured in pound-inches (lb-in) or kilogram-metres (kg-m).</li>
          <li><strong>Centre of Gravity (CG):</strong> The effective balance point of the aircraft. Expressed
            as a percentage of Mean Aerodynamic Chord (%MAC) for most military transports.</li>
        </ul>
        <h2>Weight Categories Explained</h2>
        <p>
          Military cargo is categorised by weight class for administrative and planning purposes. The three
          primary classifications are:
        </p>
        <ul>
          <li><strong>Light cargo:</strong> Items under 45 kg that can be manually handled by two personnel
            without mechanical assistance.</li>
          <li><strong>Heavy cargo:</strong> Items between 45 kg and 4,535 kg (one standard military pallet
            capacity). Requires mechanical handling equipment for loading.</li>
          <li><strong>Outsized cargo:</strong> Items that exceed the dimensions of a standard 463L pallet
            (108" × 88") or a single pallet position. Outsized loads require special planning approval
            and may require structural surveys of the receiving airfield.</li>
        </ul>
        <h2>Introduction to Balance and Centre of Gravity</h2>
        <p>
          Every aircraft is designed to fly within a defined CG range. If the CG moves too far forward,
          the aircraft becomes nose-heavy and difficult to rotate on takeoff; in extreme cases the elevator
          authority is insufficient to maintain level flight. If the CG moves too far aft, the aircraft
          becomes pitch-unstable and may be uncontrollable.
        </p>
        <p>
          The loadmaster's task is to ensure that cargo is distributed so the CG falls within the approved
          envelope at all critical phases of flight: takeoff, en route (accounting for fuel burn), and
          landing. On multi-leg missions, the CG must be checked for every leg, as offloading cargo at
          intermediate stops can significantly shift the balance point.
        </p>
        <h2>Cargo Classification Basics</h2>
        <p>
          Beyond weight classification, cargo is categorised by its handling requirements and hazard status:
        </p>
        <ul>
          <li><strong>General cargo:</strong> Standard, non-hazardous freight. Can be stacked and co-loaded
            with most other cargo types.</li>
          <li><strong>Perishable cargo:</strong> Time-sensitive or temperature-sensitive items. Must be
            loaded and offloaded first; may require temperature monitoring.</li>
          <li><strong>Dangerous goods (DG):</strong> Items classified under ICAO Technical Instructions
            as hazardous. Require specific packaging, labelling, segregation, and documentation. Classes
            include explosives, flammable liquids, gases, oxidisers, toxics, and radioactive materials.</li>
          <li><strong>Special cargo:</strong> Items requiring unusual handling, including human remains,
            diplomatic pouches, live animals, and valuables. Each requires specific procedures and
            authorisation.</li>
          <li><strong>Classified cargo:</strong> Items with a national security classification. Require
            cleared personnel, chain of custody documentation, and physical security measures.</li>
        </ul>
        <h2>Safety Fundamentals</h2>
        <p>
          Load safety is never compromised for operational convenience. Before any load is accepted, the
          loadmaster must verify: accurate weight documentation, correct hazard classification and
          packaging, proper restraint capability, and compliance with current airworthiness directives.
          A load that cannot be properly restrained is a load that cannot be carried.
        </p>
        <p>
          Restraint requirements vary by aircraft and mission type but generally demand that cargo be secured
          against forward loads of 3G, aft loads of 1.5G, lateral loads of 1.5G, and vertical loads of 2G.
          These values reflect the forces that can act on cargo during flight manoeuvres, turbulence, and
          emergency landings. Every tie-down device must be rated for the load it carries, and the loadmaster
          must verify ratings against cargo weights during the loading inspection.
        </p>
      </div>
    ),

    // ─── ALL AIRCRAFT — INTERMEDIATE: DANGEROUS GOODS ────────────────────────
    "all-intermediate-dg": (
      <div>
        <h1>Dangerous Goods Handling for Military Air Transport</h1>
        <h2>Regulatory Framework</h2>
        <p>
          Dangerous goods (DG) transport by air is governed by the ICAO Technical Instructions for the Safe
          Transport of Dangerous Goods by Air, supplemented by IATA Dangerous Goods Regulations (DGR) for
          commercial operations. Military transport operations additionally comply with Defence Instructions
          (Air) and applicable Joint Publications. In all cases, the most restrictive applicable regulation
          applies.
        </p>
        <p>
          The loadmaster serves as the primary point of authority for dangerous goods acceptance on the
          aircraft. This responsibility cannot be delegated. Before any dangerous goods are loaded, the
          loadmaster must verify the shipper's declaration, inspect the outer packaging, confirm segregation
          requirements can be met, and brief the aircraft commander on the specific hazards present.
        </p>
        <h2>Hazard Classification System</h2>
        <p>The nine UN hazard classes applicable to air transport are:</p>
        <ul>
          <li><strong>Class 1 — Explosives:</strong> Includes ammunition, pyrotechnics, propellants, and demolition charges.
            Divided into six divisions (1.1–1.6) based on mass explosion hazard and sensitivity. Most military
            operations involve significant Class 1 loads. Division 1.1 material (capable of mass detonation)
            is prohibited on passenger aircraft and requires special authorisation on cargo aircraft.</li>
          <li><strong>Class 2 — Gases:</strong> Compressed, liquefied, or dissolved gases. Includes oxygen
            (life support), fire extinguisher agents, and hydraulic accumulators. Flammable gases (2.1) and
            toxic gases (2.3) require careful segregation from ignition sources and other incompatible classes.</li>
          <li><strong>Class 3 — Flammable Liquids:</strong> Fuel samples, solvents, and cleaning agents.
            Flashpoint below 60°C. Must be segregated from oxidisers and explosives.</li>
          <li><strong>Class 4 — Flammable Solids:</strong> Items that are spontaneously combustible or
            dangerous when wet. Includes some military signalling devices and pyrotechnic components.</li>
          <li><strong>Class 5 — Oxidising Substances and Organic Peroxides:</strong> Substances that release
            oxygen, accelerating combustion in other materials. Must never be co-loaded adjacent to Class 3 liquids.</li>
          <li><strong>Class 6 — Toxic and Infectious Substances:</strong> Includes certain pesticides,
            CBRN-related materials, and medical biological samples. Require strict packaging integrity.</li>
          <li><strong>Class 7 — Radioactive Material:</strong> Items emitting ionising radiation. Three
            categories (I, II, III) based on radiation level at the package surface. Transport index
            determines maximum stackability and segregation distance.</li>
          <li><strong>Class 8 — Corrosives:</strong> Substances causing skin destruction or metal corrosion.
            Battery acid, certain cleaning agents, and some ordnance components fall into this class.</li>
          <li><strong>Class 9 — Miscellaneous:</strong> Items that present an air transport hazard but do
            not fit other classes. Includes dry ice, magnetised material, and some lithium batteries.</li>
        </ul>
        <h2>Packaging Requirements</h2>
        <p>
          All dangerous goods must be packaged to UN Performance standards (UN specification packaging)
          unless excepted quantities are applicable. The package must withstand the stresses of air transport
          including pressure changes, vibration, and handling shocks. The loadmaster inspects each package
          for:
        </p>
        <ul>
          <li>Correct UN package marking (e.g., UN3480 for lithium-ion batteries)</li>
          <li>No signs of leakage, damage, or contamination</li>
          <li>Security of closures and integrity of outer packaging</li>
          <li>Compatibility of package material with the contents</li>
          <li>Correct orientation arrows where applicable</li>
        </ul>
        <h2>Labelling and Marking Standards</h2>
        <p>
          Each dangerous goods package must bear the correct hazard class label (diamond-shaped, minimum
          100mm × 100mm), the UN number in a rectangle, and the proper shipping name. Military packages
          may carry additional national markings, but these do not replace the standard hazard labels.
          The loadmaster must be able to identify all nine hazard class labels by sight and understand
          the hazards each represents.
        </p>
        <h2>Segregation Requirements</h2>
        <p>
          Certain combinations of dangerous goods must be separated to prevent incompatible materials from
          interacting in the event of a spill or container breach. The four segregation levels are:
        </p>
        <ul>
          <li><strong>Away from:</strong> Minimum horizontal distance of 1 metre.</li>
          <li><strong>Separated from:</strong> Must not be loaded in the same compartment.</li>
          <li><strong>Separated by a complete compartment or hold from:</strong> One complete structural
            divider between items.</li>
          <li><strong>Separated longitudinally by an intervening complete compartment or hold from:</strong>
            The most restrictive level, requiring maximum possible physical separation.</li>
        </ul>
        <h2>Documentation Requirements</h2>
        <p>
          Every consignment of dangerous goods must be accompanied by a Shipper's Declaration for
          Dangerous Goods, completed by the consignor and verified by the loadmaster. The declaration
          must identify the UN number, proper shipping name, hazard class, packing group, quantity,
          and any special provisions. The loadmaster retains a copy with the aircraft documentation
          and ensures the crew is briefed on all dangerous goods aboard prior to departure.
        </p>
      </div>
    ),

    // ─── ALL AIRCRAFT — INTERMEDIATE: REGULATIONS ─────────────────────────────
    "all-intermediate-reg": (
      <div>
        <h1>Regulations and Compliance in Military Air Transport</h1>
        <h2>Regulatory Hierarchy</h2>
        <p>
          Military aviation operates within a layered regulatory framework. At the international level,
          ICAO Annex 18 and the associated Technical Instructions govern dangerous goods transport. The
          Chicago Convention establishes standards for international civil aviation that military flights
          must comply with when operating through civilian airspace. Below the international level, national
          regulations — including the Civil Aviation Safety Regulations (CASR) in Australia — establish
          the domestic framework within which defence aviation must operate unless specifically exempted.
        </p>
        <p>
          Defence-specific instructions are found in the Defence Instructions (Air) (DI(Air)) series,
          Joint Publications (JP) relating to airlift, and individual aircraft type publications. The
          loadmaster must be conversant with all applicable publications for their assigned airframe and
          mission profile. When regulations conflict, the more restrictive requirement applies.
        </p>
        <h2>Weight and Balance Certification</h2>
        <p>
          A loadmaster must hold a valid weight and balance certification for each aircraft type they
          operate. This certification is maintained through periodic proficiency checks and requires
          demonstrated competence in manual calculation methods, use of approved software tools, and
          interpretation of the CG envelope. Certification lapses if the holder does not perform a
          minimum number of load planning tasks within a defined currency period.
        </p>
        <p>
          Weight and balance documents (typically AFTO Form 781 or equivalent) must be completed before
          departure, signed by the loadmaster, and reviewed by the aircraft commander. Departing without
          valid W&amp;B documentation is a regulatory violation regardless of operational urgency. In
          genuine emergency situations (humanitarian, CASEVAC), a simplified procedure may be authorised,
          but this must be documented and reported post-flight.
        </p>
        <h2>ICAO Standards and Australian Compliance</h2>
        <p>
          As a signatory to the Chicago Convention, Australia is obliged to comply with ICAO Standards
          and Recommended Practices (SARPs). For military airlift, ICAO Annex 18 (Safe Transport of
          Dangerous Goods by Air) and Doc 9284 (Technical Instructions) are the primary instruments.
          Australia holds a reservation on certain ICAO standards as permitted under Article 38 of the
          Convention, but these reservations are narrow and do not exempt military operations from the
          core safety requirements.
        </p>
        <h2>Hazmat Shipping Papers</h2>
        <p>
          The Shipper's Declaration for Dangerous Goods is the primary hazmat shipping paper in air
          transport. It must be completed in English (or with a certified English translation) by the
          consignor, not the carrier. The loadmaster's responsibility is verification, not completion:
          confirming that the declaration accurately describes the goods presented, that the goods match
          the declaration, and that the packaging, labelling, and segregation meet the requirements
          specified.
        </p>
        <p>
          Military cargo often moves under military dangerous goods manifests, which may differ in format
          from the IATA/ICAO declaration but must contain all the same information. The loadmaster must
          be able to interpret both formats and identify deficiencies that would make a consignment
          unacceptable for carriage.
        </p>
        <h2>Load Planning Approval Process</h2>
        <p>
          Every mission load plan follows an approval chain. The loadmaster prepares the initial plan,
          which is reviewed by the crew commander. For unusual loads (oversized cargo, outsized items,
          declared dangerous goods above threshold quantities), additional approvals from the Wing
          Safety Officer, engineering authority, or Airworthiness Authority may be required. Time
          pressures are not a valid justification for bypassing the approval chain. Load plan
          discrepancies discovered after departure must be reported to the aircraft commander immediately,
          and corrective action taken as practicable.
        </p>
        <h2>Compliance Culture</h2>
        <p>
          Regulatory compliance in aviation is not box-ticking — it is the foundation of a safety culture
          that has made air transport the safest mode of mass transportation in history. Every regulation
          exists because of an incident or accident in which people were harmed. Loadmasters who understand
          the reasoning behind the rules apply them consistently rather than selectively, and are far more
          effective at identifying genuine risk than those who treat compliance as an administrative
          burden.
        </p>
      </div>
    ),

    // ─── ALL AIRCRAFT — INTERMEDIATE: CARGO SECURITY ──────────────────────────
    "all-intermediate-sec": (
      <div>
        <h1>Cargo Security Procedures in Military Air Transport</h1>
        <h2>Security Classification Framework</h2>
        <p>
          Military cargo may carry a protective marking that restricts access to appropriately cleared
          personnel. The Australian Government Security Classification system identifies five levels of
          classification, from OFFICIAL (unclassified but requiring basic protection) through PROTECTED,
          SECRET, TOP SECRET, and compartmented caveats above. Each level imposes specific requirements
          for packaging, handling, documentation, and access control during air transport.
        </p>
        <p>
          The loadmaster must hold the appropriate clearance level to accept and handle classified cargo.
          Where the cargo classification exceeds the loadmaster's clearance, a cleared escort must be
          assigned, and the loadmaster's responsibilities are limited to transport logistics rather than
          physical access to the cargo contents.
        </p>
        <h2>Handling Procedures for Classified Cargo</h2>
        <p>
          Classified cargo must be physically identifiable during loading and in-flight inspection. Outer
          packaging must not disclose the classification or contents to unauthorised personnel. Inner
          containers bear the classification marking visible only when outer packaging is opened by
          cleared personnel. The loadmaster records the receipt of classified cargo on the cargo manifest
          and signs the chain of custody documentation before accepting the consignment.
        </p>
        <p>
          During loading, classified cargo is handled by the minimum number of cleared personnel necessary.
          Photographs of classified cargo or its markings are prohibited. In the cargo hold, classified
          items are positioned where they are not accessible to passengers and, where possible, out of
          direct sight of observers at loading doors.
        </p>
        <h2>Personnel Security Requirements</h2>
        <p>
          All personnel involved in the handling of classified cargo must hold a current security
          clearance at the appropriate level. This includes loadmasters, cargo handlers, and any
          supporting maintenance or operations personnel who physically access the cargo during loading
          or unloading. Clearance status is verified through the unit Security Officer prior to task
          assignment. Visitors and contractors without appropriate clearance must not be present during
          classified cargo handling unless specifically authorised by the commanding officer.
        </p>
        <h2>Documentation for Sensitive Loads</h2>
        <p>
          Sensitive and classified cargo requires additional documentation beyond the standard cargo
          manifest. A Security Receipt is generated for SECRET and above, signed by the releasing
          authority, the loadmaster accepting custody, and the receiving authority at the destination.
          The Security Receipt must travel with the aircraft and be surrendered to the receiving
          authority upon delivery — it is not filed with the general aircraft documentation.
        </p>
        <p>
          Discrepancies in classified cargo (including damage, apparent tampering, or quantity
          shortfall) must be reported immediately to the aircraft commander and the unit Security
          Officer. The loadmaster documents the discrepancy in writing and ensures that no further
          handling occurs until the Security Officer provides direction.
        </p>
        <h2>Chain of Custody Protocols</h2>
        <p>
          Chain of custody for classified and sensitive cargo must be unbroken from origin to
          destination. Every physical transfer — from shipper to loadmaster, loadmaster to receiving
          authority — is documented and signed. Transit stops where the aircraft is unattended require
          the classified cargo to be either removed to a secure facility or kept under armed guard.
          Classified cargo may not remain on an unattended aircraft overnight at a civilian terminal
          without specific approval from the unit Security Officer and the local base commander.
        </p>
        <h2>Physical Security Measures</h2>
        <p>
          Beyond documentation, physical security measures protect classified cargo in transit. High-value
          or high-classification items may be placed in locked containers with tamper-evident seals.
          Container locks are sealed by the releasing authority and inspected intact by the receiving
          authority; any breach of the seal is a reportable security incident. Where cargo requires
          a physical escort within the aircraft, the escort's seating must be positioned to maintain
          visual oversight of the cargo at all times during flight.
        </p>
      </div>
    ),

    // ─── ALL AIRCRAFT — ADVANCED: W&B MASTERY ─────────────────────────────────
    "all-advanced-wb": (
      <div>
        <h1>Weight and Balance Mastery — Advanced Concepts</h1>
        <h2>Complex Centre of Gravity Calculations</h2>
        <p>
          At the advanced level, weight and balance calculations extend beyond single-leg, single-configuration
          missions. The loadmaster must account for the CG shift caused by fuel burn at different consumption
          rates across multiple tanks, the effect of in-flight weight changes (airdrop, fuel transfer, passenger
          movement), and the interaction between multiple restraint systems and the aircraft's structural
          limits at each pallet position simultaneously.
        </p>
        <p>
          For missions with multiple cargo items of significantly different densities, the loadmaster must
          verify that no individual pallet position exceeds its floor load limit while also ensuring the
          total payload moment positions the CG within envelope. This is not always achievable with the
          naive "heaviest cargo forward" rule — it requires iterative position adjustment until all
          constraints are simultaneously satisfied.
        </p>
        <h2>Multi-Segment Flight Planning</h2>
        <p>
          A multi-stop mission creates a separate W&amp;B problem at each leg. As cargo is offloaded at
          each stop, the loadmaster must recalculate the CG for the subsequent departure. This requires
          tracking not just the weight removed but its position — removing a heavy pallet from an aft
          position will shift the CG forward, potentially beyond the forward limit if remaining cargo
          is concentrated at mid-fuselage positions.
        </p>
        <p>
          Planning for multi-segment missions begins at the origin with a full CG calculation for all
          intermediate fuel states and payload configurations. The approved W&amp;B form must accompany
          the aircraft for the entire itinerary, with the loadmaster updating the record at each
          departure. Some software tools automate this process, but the loadmaster must be capable of
          verifying the output manually.
        </p>
        <h2>Fuel Burn and CG Effects</h2>
        <p>
          Fuel is the largest variable weight on any long-range mission and the primary driver of CG
          movement during flight. Because wing tanks and fuselage tanks have different arm values, the
          rate of CG shift depends on which tanks are burning at a given time. The aircraft's fuel
          management system typically controls burn sequence to maintain CG within limits, but the
          loadmaster must understand the system's logic to anticipate CG position at any point in the
          mission and detect anomalies.
        </p>
        <p>
          The critical fuel states to verify are: maximum fuel (heaviest takeoff condition), fuel state at
          planned drop zones or offload points, and minimum planned fuel at destination (lightest landing
          condition). For missions with significant fuel range reserve requirements, the CG at reserve fuel
          state may be more restrictive than the takeoff condition.
        </p>
        <h2>Unusual Cargo Configurations</h2>
        <p>
          Non-standard cargo — oversized vehicles, helicopters in partial disassembly, engineering
          plant, or complex hazardous material consignments — require individual weight and balance
          analysis. The loadmaster cannot rely on standard arm values from the pallet position chart
          when a single load spans multiple positions or is loaded asymmetrically. For such loads, the
          actual CG of the cargo item must be determined from the shipper's documentation or by
          physical measurement, and a custom arm value calculated.
        </p>
        <h2>Weight and Balance Software</h2>
        <p>
          Modern load planning software (including JMAPS, AALPS, and aircraft-specific tools) significantly
          reduces calculation time and error risk. However, these tools are aids, not replacements for
          loadmaster competence. The loadmaster must validate software outputs against manual calculations
          for any unusual configuration, and must be prepared to complete a full manual W&amp;B calculation
          if the software is unavailable or produces a result that does not pass the reasonableness check.
        </p>
        <h2>Quality Assurance Procedures</h2>
        <p>
          W&amp;B quality assurance involves cross-checking the final calculation with a second qualified
          person before departure. The checker reviews the operating weight extract for currency,
          verifies the cargo weights against the manifest, confirms the correct arm values for each
          item's position, and checks the arithmetic independently. Any discrepancy found by the
          checker — even a minor one — must be resolved before the aircraft departs. The loadmaster
          signs the final document accepting personal responsibility for its accuracy.
        </p>
      </div>
    ),

    // ─── ALL AIRCRAFT — ADVANCED: EMERGENCY PROCEDURES ───────────────────────
    "all-advanced-emerg": (
      <div>
        <h1>Emergency Response Procedures — Military Air Transport</h1>
        <h2>Overview</h2>
        <p>
          Emergency management in military air transport requires the loadmaster to act immediately and
          correctly without waiting for further instruction. The loadmaster is often the first person to
          detect a cargo-related emergency, and their response in the initial seconds can determine whether
          the emergency remains manageable or escalates. Competence in emergency procedures is not optional —
          it is a condition of qualification.
        </p>
        <h2>In-Flight Emergency Procedures</h2>
        <p>
          The loadmaster's in-flight emergency role begins with communication. Any abnormality observed in
          the cargo compartment — fire, smoke, cargo movement, structural damage, DG spill — is immediately
          reported to the aircraft commander on the interphone system. The loadmaster provides a clear
          situation report: nature of the emergency, location, severity, and any immediate action already
          taken. The aircraft commander is then able to declare the appropriate emergency and coordinate
          with ATC.
        </p>
        <p>
          The loadmaster does not wait for permission to take immediate protective action when life safety
          is threatened. For cargo fires, the immediate drill is: identify the source, select the correct
          extinguishing agent, apply the agent, report to the aircraft commander, and monitor for
          re-ignition. For cargo movement, the immediate action is to notify the crew (as unexpected weight
          shift affects aircraft control) and assess whether the shifted load can be restrained in its new
          position or whether emergency landing is required.
        </p>
        <h2>Emergency Jettison Procedures</h2>
        <p>
          Cargo jettison is used when the aircraft must immediately reduce weight (engine failure, fuel
          emergency, structural emergency) or when specific cargo presents an unacceptable in-flight hazard.
          The authority to jettison cargo rests with the aircraft commander, but the loadmaster executes
          the jettison on the commander's order.
        </p>
        <p>
          Jettison procedures vary by aircraft type but generally involve: removing all restraint devices
          from the cargo to be jettisoned, positioning cargo at the ramp/door, confirming the drop zone
          is clear, and releasing the load on the commander's order. Dangerous goods are never jettisoned
          unless the alternative is aircraft loss — and even then, the jettison must be coordinated with
          ATC for hazard notification. All jettison events are mandatory safety reports.
        </p>
        <h2>Fire Suppression on the Cargo Deck</h2>
        <p>
          Aircraft cargo fires are among the most dangerous in-flight emergencies. The correct extinguishing
          agent depends on the fire type:
        </p>
        <ul>
          <li><strong>Class A (ordinary combustibles — cardboard, wood, fabric):</strong> Halon 1211 or
            water-mist extinguisher.</li>
          <li><strong>Class B (flammable liquids):</strong> Halon 1211 or CO₂. Never use water.</li>
          <li><strong>Class C (electrical):</strong> CO₂ or Halon 1211. Never use water or foam.</li>
          <li><strong>Class D (metal fires — magnesium, lithium):</strong> Dry sand or approved dry
            powder. Halon and CO₂ are ineffective and may worsen the fire.</li>
        </ul>
        <p>
          The loadmaster must know the location of all fire extinguishers in the cargo compartment and
          inspect them before every flight. Post-fire, the cargo deck is treated as a crime scene — the
          source and cause are preserved for investigation, and no cargo is moved without safety officer
          approval.
        </p>
        <h2>Decompression Response</h2>
        <p>
          Explosive or rapid decompression at altitude is a life-threatening emergency. For the loadmaster,
          the immediate action upon decompression recognition is to don the nearest oxygen mask within
          five seconds. If the loadmaster is in the cargo compartment without immediate access to crew
          oxygen, they must secure themselves (seatbelt or cargo strap) to prevent being thrown by the
          depressurisation and then proceed to the nearest crew oxygen point.
        </p>
        <h2>Ground Emergency Response</h2>
        <p>
          Ground emergencies include engine fires, fuel spills, cargo fires during ground handling, and
          aircraft incidents during taxi or landing. The loadmaster's primary ground emergency role is
          passenger and crew evacuation. On the loadmaster's authority (or the aircraft commander's
          order), all passengers and non-essential crew exit through designated emergency exits. The
          loadmaster directs traffic at the rear ramp or cargo door and ensures all personnel are clear
          before leaving the aircraft themselves.
        </p>
        <h2>Post-Incident Procedures</h2>
        <p>
          Every in-flight or ground emergency involving the cargo compartment generates mandatory reporting
          obligations. The loadmaster completes an Air Safety Occurrence Report (ASOR) within 24 hours,
          describing the events in sequence, the actions taken, and any deficiencies in equipment or
          procedures observed. Personal accounts should be written as soon as possible after the incident
          while details are fresh. Emergency equipment used (extinguishers, oxygen masks) is replaced
          before the aircraft returns to service.
        </p>
      </div>
    ),

    // ─── ALL AIRCRAFT — ADVANCED: ADVANCED LOAD PLANNING ─────────────────────
    "all-advanced-lp": (
      <div>
        <h1>Advanced Load Planning and Strategic Airlift Coordination</h1>
        <h2>Multi-Aircraft Load Optimisation</h2>
        <p>
          When a task requires multiple aircraft sorties, load optimisation becomes a logistical puzzle
          with significant operational consequences. The objective is to assign cargo to sorties in a
          sequence that maximises the total useful delivery while minimising the number of sorties, fuel
          consumed, and ground handling time. This requires the load planner to consider payload-range
          tradeoffs (heavier loads reduce range), destination priorities (which cargo is most urgently
          needed at the receiving location), and aircraft type matching (assigning outsized cargo to
          aircraft capable of carrying it).
        </p>
        <p>
          A systematic approach begins with categorising all cargo by weight, dimensions, priority class,
          and destination. From this, a load manifesting matrix is built, assigning cargo to sorties and
          verifying W&amp;B for each sortie against the aircraft type's envelope. The matrix is then
          reviewed for efficiency — sorties that are significantly underloaded may be combined, and
          priority cargo may be moved to earlier sorties at the cost of overall payload efficiency.
        </p>
        <h2>Strategic Airlift Planning</h2>
        <p>
          Strategic airlift missions span intercontinental distances and often involve coordination with
          foreign military authorities, civilian air traffic control, and allied coalition logistics chains.
          The load planner for a strategic sortie must account for: basing constraints at origin and
          destination (apron weight limits, handling equipment availability), overflight and staging
          permissions, and the specific dangerous goods restrictions of each nation overflown.
        </p>
        <p>
          Some strategic missions involve in-flight refuelling, which eliminates some range-payload
          tradeoffs but introduces a new CG challenge: as fuel is added in flight, the aircraft gross
          weight increases and the CG shifts. The loadmaster must calculate the CG at the pre-refuelling
          (lightest) and post-refuelling (heaviest) conditions to confirm the aircraft remains in
          envelope throughout the refuelling window.
        </p>
        <h2>Joint Operations Coordination</h2>
        <p>
          In joint operations, RAAF airlift assets may be tasked by an Air Mobility Division (AMD) or
          equivalent joint authority, with load planning responsibilities shared between the aircraft
          crew and the joint logistics organisation. The loadmaster must understand the joint tasking
          process, the documentation requirements for interoperability, and the authority chain for
          accepting or declining loads that do not meet safety requirements. When operating under
          USAF Air Mobility Command (AMC) tasking, the loadmaster must comply with AMC load planning
          regulations as well as RAAF requirements.
        </p>
        <h2>Automated Load Planning Systems</h2>
        <p>
          Tools such as the Joint Military Air Mobility Planning System (JMAPS) and the Automated Air
          Load Planning System (AALPS) automate much of the manifest computation and CG calculation
          process. These systems maintain aircraft operating weight databases, permit rapid scenario
          comparison, and generate printable load plans and W&amp;B forms. Despite their capability,
          automated systems have limitations: they rely on accurate input data, they may not account for
          the physical constraints of a specific aircraft's cargo compartment configuration, and
          they generate outputs that must still be verified by a qualified loadmaster.
        </p>
        <h2>Load Plan Approval Processes</h2>
        <p>
          All load plans must be reviewed and approved before the aircraft departs. The standard approval
          chain is: loadmaster prepares the plan → crew commander reviews and accepts → Wing OC or
          equivalent authorises unusual or high-risk loads. For coalition operations, the receiving
          nation's authority may also require sight of the load plan before accepting the aircraft.
          Time pressure is the most common reason for shortcuts in this process — and the most common
          precursor to load-related accidents. A plan that cannot be properly reviewed before departure
          time is a plan that requires the departure time to be delayed.
        </p>
      </div>
    ),

    // ─── C-17 — INTERMEDIATE ─────────────────────────────────────────────────
    "c17-intermediate": (
      <div>
        <h1>C-17 Globemaster III — Advanced Load Planning</h1>
        <h2>Advanced Centre of Gravity Calculations</h2>
        <p>
          C-17 load planning at the intermediate level requires precise CG computation for configurations
          that go beyond the standard 18-pallet arrangement. When rolling stock, oversized loads, or mixed
          pallet/vehicle configurations are employed, the loadmaster cannot rely on pre-computed arm values
          from the standard pallet position chart. Instead, individual item CG positions must be measured
          or taken from the shipper's data, and the load plan built up iteratively from first principles.
        </p>
        <p>
          The C-17's CG limits narrow considerably at heavier gross weights. At maximum payload
          (170,900 lbs), the allowable CG range may be as narrow as 8–10% MAC. This means that minor
          errors in position or weight — even a single pallet placed one bay forward of the planned
          position — can shift the CG outside limits at maximum gross weight. For this reason, any change
          to the load plan after the W&amp;B form has been completed requires an immediate recalculation,
          not a post-departure correction.
        </p>
        <h2>Multi-Pallet Configurations</h2>
        <p>
          The C-17 standard configuration accommodates 18 463L pallets in a 2×9 arrangement. However,
          the aircraft can also be configured for 27 military pallets using single-rail positioning,
          or for a combination of pallets and vehicles where some pallet positions are occupied by
          rolling stock on chains. Each of these configurations has different weight distribution
          characteristics. The loadmaster must account for the arm values of the actual cargo positions
          used — which in a mixed configuration may not align with the standard pallet position arms.
        </p>
        <h2>Rolling Stock Loading</h2>
        <p>
          Loading wheeled and tracked vehicles into the C-17 requires precise adherence to both
          the aircraft floor load limits and the vehicle manoeuvring constraints dictated by the
          cargo ramp geometry. The ramp can accept vehicles up to 12 feet wide and vehicles weighing
          up to 86,000 lbs provided axle loads remain within the ramp's rated limit. Before a vehicle
          enters the aircraft, its actual weight (not the vehicle's rated MGVW) and the weight distribution
          between axles are recorded. Chain attachment points are identified and the number and angle of
          chains calculated to meet the 3G forward restraint requirement.
        </p>
        <p>
          Fuel in vehicle tanks is treated as cargo weight. Military vehicles transporting fuel in tank-
          mounted fuel cells or fuel drums must be properly declared and handled as Class 3 dangerous goods.
          Engine crankcases and hydraulic systems may contain residual flammable fluid, and vehicles
          delivered for air transport must have their fuel systems isolated or vented per the applicable
          technical order before loading.
        </p>
        <h2>Oversize Cargo Planning</h2>
        <p>
          Oversized cargo that cannot fit through the main cargo door in its assembled state must be
          partially disassembled. The loadmaster coordinates with the shipper and the aircraft engineering
          authority to determine the maximum envelope that will enter the aircraft and to identify any
          loads that exceed the door height (12 feet 2 inches) or door width (18 feet). For helicopters
          in partial disassembly, the blade angles, skid or wheel geometry, and stabiliser configurations
          must be confirmed against the cargo compartment dimensions before the aircraft is taxied to
          the loading point.
        </p>
        <h2>Emergency Load Shifts</h2>
        <p>
          A load shift in flight is a serious emergency. The loadmaster must immediately report the shift
          to the aircraft commander, assess whether the cargo remains in the aircraft's CG envelope,
          and determine whether restraint has been compromised. If restraint devices have failed, the
          loadmaster attempts to re-secure the cargo using available equipment — but if the cargo cannot
          be safely re-secured, the aircraft commander must be advised that the load is unrestrained
          so flight crew can take appropriate action (reducing bank angle, maintaining G-loading within
          limits, planning for an emergency landing if the CG shift is unacceptable).
        </p>
        <h2>Fuel Planning Integration</h2>
        <p>
          C-17 fuel planning and load planning are inseparable for maximum-weight missions. The aircraft
          carries up to 181,054 lbs of fuel in eight tanks. For max-payload missions, the available fuel
          is constrained by the MTOW: MTOW minus OW minus payload equals maximum fuel. The loadmaster
          and crew must jointly confirm that the planned fuel load will provide the required range plus
          required reserve while keeping gross weight at or below MTOW. Sacrificing payload to carry
          more fuel — or vice versa — is a decision made by the crew commander based on the mission
          priority, and the loadmaster's job is to provide accurate payload weight data to support
          that decision.
        </p>
      </div>
    ),

    // ─── C-17 — ADVANCED ─────────────────────────────────────────────────────
    "c17-advanced": (
      <div>
        <h1>C-17 Globemaster III — Emergency Procedures</h1>
        <h2>Emergency Landing Preparation</h2>
        <p>
          When the C-17 is committed to an emergency landing, the loadmaster's immediate priorities are
          crew and passenger safety. All cargo must be verified as secured against the loads of an emergency
          landing (typically assumed at 9G vertical for crash-worthy design). This means every tie-down
          device is tension-checked, locking pawls on pallet positions are confirmed engaged, and no
          loose items are in the cargo compartment. Passengers are briefed on brace position and the
          location of emergency exits — specifically the crew door (forward left), the paratroop doors
          (both sides, aft), and the tail ramp exit procedure.
        </p>
        <p>
          The loadmaster prepares the cargo compartment for evacuation by removing restraints from
          the tail ramp (so the ramp can be lowered from outside if required) and pre-positioning
          emergency egress equipment. For water landings (ditching), the life raft deployment sequence
          and exit priorities are briefed to all passengers.
        </p>
        <h2>Cargo Shift Response</h2>
        <p>
          A cargo shift in the C-17 can manifest as a sudden change in aircraft trim, an unexpected
          pitch or roll tendency, or a direct observation of movement in the cargo compartment. The
          loadmaster's immediate response is to:
        </p>
        <ul>
          <li>Report to the aircraft commander on interphone: nature of the shift, estimated weight
            and position affected, whether restraint devices have failed.</li>
          <li>Assess whether the cargo remains in a position consistent with the approved CG envelope.
            If the CG has moved outside limits, advise the crew immediately.</li>
          <li>Attempt to re-secure the load if it is safe to do so without exposing themselves to
            injury from moving cargo or in a high-G manoeuvre environment.</li>
          <li>If re-securing is not possible, clearly advise the crew that the cargo is loose and
            provide the best estimate of its current position and weight.</li>
        </ul>
        <h2>Hazardous Material Spill Response</h2>
        <p>
          If dangerous goods packaging is breached in flight, the loadmaster's response depends on
          the class of material involved. For Class 3 flammable liquid spills: identify the source,
          contain the spill using available absorbent material (spill kit), eliminate ignition sources,
          increase cargo ventilation, and notify the aircraft commander. Do not attempt to collect
          or repackage spilled Class 1, Class 2 (toxic), or Class 7 materials — these require
          specialist response. The aircraft commander may initiate an emergency descent and priority
          landing for significant DG incidents.
        </p>
        <p>
          All loadmasters carry a DG emergency response card that cross-references UN numbers to
          the appropriate emergency response guide. In the absence of this card, the Emergency Response
          Guidebook (ERG) provides action guides for most DG classes. The aircraft commander has
          authority to contact the DG shipper or emergency response specialist by radio for specific
          guidance on novel materials.
        </p>
        <h2>Medical Emergencies in the Cargo Compartment</h2>
        <p>
          The loadmaster is trained to a minimum standard of Emergency First Aid (EFA) and is responsible
          for the first-response medical management of any passenger or crew member who becomes incapacitated
          during flight. The C-17 carries a first aid kit, AED (automated external defibrillator), and
          supplemental oxygen in the cargo compartment. For CASEVAC missions, additional medical equipment
          and medical crew may be embarked.
        </p>
        <p>
          For serious medical emergencies, the aircraft commander will coordinate with ATC for priority
          handling and may divert to the nearest suitable aerodrome with medical facilities. The loadmaster
          maintains first aid and monitors the patient until landing, providing updates to the crew.
          Post-flight, a detailed record of the medical event, treatment provided, and the patient's
          condition on handover to medical authorities is completed and filed with the mission record.
        </p>
        <h2>Emergency Egress Procedures</h2>
        <p>
          The C-17 has six emergency exits: the crew entry door (forward left fuselage), two paratroop
          doors (aft left and right fuselage), the tail cargo ramp, and two overwing escape hatches.
          The loadmaster briefs passengers on exit locations before flight and ensures all exits are
          clear of obstructions. During an evacuation, the loadmaster directs passengers to the nearest
          available exit — the tail ramp is preferred for large numbers, but if the ramp is unavailable
          or inoperable, passengers are directed to the paratroop doors. The loadmaster is the last
          person to exit the aircraft.
        </p>
        <h2>Survival Equipment Location</h2>
        <p>
          The C-17 carries survival equipment for over-water and remote area operations. The loadmaster
          must know the stowage location and deployment procedure for all survival equipment aboard:
          individual life preservers (worn by crew, stowed for passengers), life rafts (forward and aft
          compartments), emergency locator transmitters (ELTs), survival kits, and water rations. Before
          long over-water legs, passengers are briefed on life preserver donning and survival raft
          boarding sequence.
        </p>
      </div>
    ),

    // ─── C-130 — INTERMEDIATE ─────────────────────────────────────────────────
    "c130-intermediate": (
      <div>
        <h1>C-130 Hercules — Tactical Operations</h1>
        <h2>Tactical Airland Operations</h2>
        <p>
          Tactical airland (TAL) operations deliver cargo and personnel to forward airfields under
          conditions that may include enemy threat, limited infrastructure, and compressed turnaround
          times. The C-130's ability to operate from short, unprepared strips makes it uniquely suited
          for this role, but it places heavy demands on the loadmaster's ability to plan rapidly, manage
          unusual loads, and execute under pressure.
        </p>
        <p>
          Pre-mission planning for TAL includes: airfield assessment (strip length, surface condition,
          obstacle clearance), load sequence (cargo delivered to multiple points on the strip may need
          to be positioned in reverse offload order), threat assessment (duration of exposure on the
          ground), and turnaround time estimate. For engine-running offloads (EROs), the loadmaster
          must complete the offload without crew assistance while the aircraft holds position with
          engines running and ramp lowered — a physically demanding and time-critical operation.
        </p>
        <h2>Low-Level Airdrop Procedures</h2>
        <p>
          Airdrop at low altitude (500 feet AGL or below) presents specific risks that are not present
          in high-altitude drops. The reduced time between cargo release and ground impact demands
          precise parachute system selection, correct pilot chute sizing, and exact airspeed control.
          For the loadmaster, low-level airdrop requires: confirming the extraction system is rigged
          for the planned altitude, verifying cargo CG and pitch-moment characteristics (which affect
          cargo attitude immediately after release), and executing the release precisely on the
          aircraft commander's command with no hesitation.
        </p>
        <p>
          At extremely low altitudes (LAPES — see below), the cargo contacts the ground while the
          aircraft is still airborne. Mistimed release or a cargo CG error can cause the load to yaw
          violently on contact, potentially pulling the aircraft toward the ground. The low-level
          airdrop briefing must include abort criteria, and the loadmaster confirms readiness at each
          gate point in the run.
        </p>
        <h2>Container Delivery System (CDS)</h2>
        <p>
          The Container Delivery System delivers supplies in A-22 cargo bags dropped by parachute,
          typically from 500–1,500 feet AGL at 130 KIAS. Each A-22 container holds up to 2,200 lbs.
          The C-130 can carry up to 16 CDS bundles in a standard configuration. The loadmaster rigs
          each bundle with its extraction parachute and connects the static lines. During the drop,
          bundles are extracted sequentially as the aircraft passes over the DZ — the loadmaster
          monitors the extraction sequence and reports any hung loads to the aircraft commander
          immediately.
        </p>
        <h2>Personnel Airdrop Operations</h2>
        <p>
          The C-130 supports static-line and HAHO/HALO personnel airdrop through its two paratroop
          doors (one each side, aft of the wing). For static-line operations, the loadmaster is the
          jump master's assistant, responsible for confirming correct door positions, verifying anchor
          cable installation, and managing the hook-up sequence. The loadmaster observes the drop and
          provides a jump report to the aircraft commander.
        </p>
        <h2>LAPES Operations</h2>
        <p>
          Low Altitude Parachute Extraction System (LAPES) is used to deliver heavy cargo to airfields
          too short or too rough for normal landing. The aircraft descends to 5–10 feet AGL at 130 KIAS
          with the ramp lowered, and extraction parachutes pull the cargo platform out the rear while
          the aircraft climbs away. LAPES loads must be precisely rigged — the extraction chute size,
          number, and attachment point are critical to achieving the correct extraction force and
          platform attitude. The loadmaster inspects the complete rigging and confirms the release
          mechanism before the approach commences.
        </p>
        <h2>Austere Airfield Operations</h2>
        <p>
          Operating from dirt strips, grass fields, and unprepared surfaces requires the loadmaster
          to adjust procedures for the absence of standard ground equipment. Self-loading using the
          winch, combat offload using aircraft momentum, and hand-jamming of pallets are all techniques
          used in austere environments. Before loading from an austere airfield, the loadmaster surveys
          the surface for obstacles, soft spots, and debris that could be ingested by the engines or
          damage the ramp.
        </p>
        <h2>Night Operations Procedures</h2>
        <p>
          Night operations with the C-130 may be conducted under NVG (night vision goggle) or blacked-out
          conditions. The loadmaster conducting night operations uses NVG-compatible lighting in the
          cargo compartment (blue-green filtered), avoids any white light that would degrade crew night
          vision, and confirms cargo tie-down is complete by tactile as well as visual check. Passengers
          are briefed on reduced lighting conditions and instructed not to use personal electronic
          devices or lights that could compromise crew NVG use.
        </p>
      </div>
    ),

    // ─── C-130 — ADVANCED ─────────────────────────────────────────────────────
    "c130-advanced": (
      <div>
        <h1>C-130 Special Operations and Advanced Tactical Employment</h1>
        <h2>Special Operations Insertion and Extraction</h2>
        <p>
          C-130 special operations support includes personnel insertion by static line, HAHO, or HALO
          airdrop, as well as non-standard vehicle infiltration, maritime insertion via rubber raiding
          craft airdrop, and ground assault landing zone (GALZ) operations. The loadmaster on these
          missions is typically a specialised tactical loadmaster (TLM) with additional qualifications
          beyond the standard certification.
        </p>
        <p>
          Insertion missions require precise timing coordination with special forces units, often involving
          in-flight changes to the drop zone, release point, or airdrop mode as intelligence updates
          arrive. The loadmaster must be prepared to reconfigure the cargo compartment during the
          mission if the operational situation changes — converting from a mixed cargo/personnel
          configuration to a pure personnel drop, or vice versa. This requires rapid, accurate
          rigging under time pressure, often with minimal lighting.
        </p>
        <h2>Low-Level Tactical Operations</h2>
        <p>
          Low-level flight at 200–500 feet AGL in mountainous terrain is a demanding environment for
          cargo management. Turbulence at low level can be severe enough to cause pallet movement
          if restraint devices are not at full tension. Before low-level segments, the loadmaster
          conducts a final restraint check, confirms all passengers are seated and belted, stows all
          loose equipment, and advises the crew of cargo status. During the low-level segment, the
          loadmaster remains seated and belted — cargo inspection during extreme manoeuvring is
          not safe and can be fatal.
        </p>
        <h2>Night Vision Operations</h2>
        <p>
          NVG-equipped C-130 operations at low level are among the most technically demanding in
          military aviation. The loadmaster's NVG qualification is separate from pilot NVG qualification
          and requires demonstrated proficiency in cargo handling under NVG conditions. The key
          differences in NVG cargo management are: reduced depth perception (critical when guiding
          vehicles up the ramp), loss of peripheral vision (the NVG tube has a 40° field of view
          versus 180° binocular vision), and limited ability to read standard white markings on
          cargo and equipment.
        </p>
        <p>
          Cargo compartment lighting for NVG operations must be set to a level that does not washout
          the image intensifier while providing sufficient illumination for the loadmaster to confirm
          restraint status and cargo position. The correct lighting setup is aircraft-specific and
          should be verified during the pre-mission cargo compartment check.
        </p>
        <h2>Covert Cargo Handling</h2>
        <p>
          Covert operations impose additional requirements on cargo manifesting and documentation. Cargo
          for classified missions may be described only to the level of classification the loadmaster
          holds; weight and CG data must still be accurate even if the cargo description on the manifest
          is sanitised. The loadmaster confirms weights by direct measurement or from an authoritative
          classified source — "estimated" weights are not acceptable for covert loads where the cargo
          identity cannot be verified against the manifest description.
        </p>
        <h2>Joint Special Operations Support</h2>
        <p>
          When supporting joint special operations, the C-130 loadmaster may operate under a task
          authority that is separate from the standard chain of command. The loadmaster must understand
          which authority they are operating under, who has the authority to change the load plan, and
          which safety requirements are non-negotiable regardless of operational pressure. Joint special
          operations environments can create significant pressure to shortcut safety procedures —
          the loadmaster must resist this pressure and escalate to the aircraft commander if required.
        </p>
      </div>
    ),

    // ─── KC30-A — INTERMEDIATE ────────────────────────────────────────────────
    "kc30a-intermediate": (
      <div>
        <h1>KC30-A MRTT — Cargo Deck Operations</h1>
        <h2>Main Deck Cargo Configuration</h2>
        <p>
          The KC30-A's main deck can be configured in full passenger mode (up to 270 passengers),
          full cargo mode (12 military pallets or 14 LD3 containers), or mixed passenger/cargo mode.
          Configuration changes require coordination with the aircraft maintenance team, as seat tracks
          and fitting points must be prepared for the cargo configuration. The loadmaster manages the
          cargo deck layout, W&amp;B calculation, and loading operations; the cabin crew manage passenger
          services in the passenger section of mixed configurations.
        </p>
        <p>
          For pure cargo operations, the KC30-A's cargo deck is prepared by installing the military
          cargo rail system and locking mechanisms compatible with 463L pallets. The cargo door (forward
          left fuselage) accepts pallets via a cargo loader aligned with the door sill. The power
          drive units (PDUs) in the cargo floor move pallets laterally and longitudinally once inside.
          Because the KC30-A is a widebody aircraft, some C-17-standard pallets and cargo configurations
          are wider than the KC30-A door will accept — the loadmaster must verify maximum cargo cross-section
          before accepting large items.
        </p>
        <h2>Mixed Passenger and Cargo Loads</h2>
        <p>
          Mixed passenger/cargo operations on the KC30-A require strict zoning of the cabin.
          Dangerous goods may not be carried in a zone accessible to passengers without specific
          approval; Class 1 explosives are prohibited if passengers are embarked. The divider between
          the cargo and passenger zones must be a structural barrier (not simply a curtain) to prevent
          cargo movement from affecting passengers in the event of sudden deceleration. W&amp;B for
          mixed configurations must account for the uncertainty in passenger weight distribution —
          passengers do not remain at their assigned seats during flight, and their movement affects
          lateral CG.
        </p>
        <h2>Bulk Cargo Procedures</h2>
        <p>
          The KC30-A's lower cargo hold accommodates LD3 containers for bulk cargo. Each LD3 position
          has a maximum gross weight of 1,588 kg (standard) or 2,000 kg (heavy-duty LD3-45W variant).
          The lower hold is not accessible during flight, so cargo loaded in LD3 containers must be
          complete before departure — no in-flight cargo management is possible in the lower hold.
          The loadmaster verifies all lower hold container locks are engaged before departure and
          confirms the container count against the manifest.
        </p>
        <h2>Dangerous Goods on the KC30-A</h2>
        <p>
          Dangerous goods carriage on the KC30-A follows ICAO Technical Instructions with additional
          restrictions imposed by the aircraft's tanker configuration. In particular, any DG load must
          be evaluated for compatibility with the aircraft's large fuel system. Class 3 flammable liquids
          and Class 2 flammable gases must be positioned as far as practical from fuel system access
          points and fuel vent areas. The loadmaster provides the aircraft commander with a complete DG
          summary (class, quantity, position) before engine start.
        </p>
        <h2>Medical Evacuation Configuration</h2>
        <p>
          The KC30-A can be rapidly reconfigured for aeromedical evacuation (AEROMED). This involves
          installing litter brackets on the seat tracks (replacing passenger seats), connecting the
          aircraft's oxygen system to AEROMED distribution points, and installing the AEROMED power
          supply panel. The loadmaster coordinates the configuration change and ensures that litter
          brackets are correctly installed and load-tested. AEROMED configuration W&amp;B must account
          for patient weight (typically 86 kg per litter) plus medical equipment and attendants.
        </p>
        <h2>VIP Configuration</h2>
        <p>
          For VIP transport missions, the KC30-A's forward cabin may be configured with executive
          seating, a conference area, and enhanced communications equipment. VIP configurations affect
          the aircraft's actual operating weight and CG — the loadmaster must obtain an updated OW
          extract for VIP configurations and not use the standard OW from the W&amp;B form. Security
          protocols for VIP transport include cargo and passenger screening procedures coordinated
          with the VIP's protective security detachment before the aircraft accepts any load.
        </p>
      </div>
    ),

    // ─── C-27J — INTERMEDIATE ─────────────────────────────────────────────────
    "c27j-intermediate": (
      <div>
        <h1>C-27J Spartan — Advanced Tactical Operations</h1>
        <h2>Tactical Employment Principles</h2>
        <p>
          The C-27J Spartan is designed for the "last tactical mile" — delivering cargo and personnel
          directly to forward units at locations accessible by no other fixed-wing aircraft. Its
          combination of turboprop efficiency, military airframe ruggedness, and compatibility with
          standard 463L pallet systems gives it a unique role in the RAAF's airlift constellation.
          The loadmaster on C-27J operations must be capable of operating independently at remote
          locations with minimal ground support, often managing loading and unloading single-handedly
          while the crew remains in the cockpit.
        </p>
        <h2>Short Field Operations</h2>
        <p>
          The C-27J achieves its short-field performance through a high-lift wing, powerful turboprop
          engines, and an aggressive approach profile. At maximum takeoff weight, the aircraft clears
          a 50-foot obstacle within 580 metres of brake release — performance that rivals many
          twin-engine turboprop commuters despite carrying 11,500 kg. However, this performance
          is highly sensitive to headwind component, field elevation, and air temperature. The
          loadmaster must understand that short-field performance tables are calculated for specific
          conditions — operating from a high-altitude airfield in summer may significantly extend
          ground roll requirements even at reduced payloads.
        </p>
        <p>
          Before operating into a short strip, the loadmaster contributes to the field assessment
          by reviewing available intelligence on surface condition, obstacle environment, and turnaround
          space. At the strip, the loadmaster evaluates whether the surface is capable of supporting
          the aircraft's ground loads without the wheels breaking through (critical on soft or wet
          surfaces), and identifies the safest position for loading/unloading relative to the
          aircraft's ground clearances.
        </p>
        <h2>Mountain Airstrip Operations</h2>
        <p>
          High-altitude airstrips present combined challenges of reduced engine performance, increased
          stall speed (requiring higher approach speed), and often severe terrain constraints that
          limit the approach and departure paths. The C-27J's performance margins shrink in these
          environments, and the loadmaster's payload planning must apply the appropriate altitude
          corrections to the permitted payload table.
        </p>
        <p>
          Mountain airstrips often lack fuelling facilities, which means the aircraft may be operating
          close to its minimum fuel reserves on arrival. This places premium importance on departure
          weight planning — the loadmaster must ensure the onload at the mountain airstrip does not
          exceed the performance-limited takeoff weight for the prevailing conditions. Communication
          with the crew during weight calculations at the strip is essential.
        </p>
        <h2>Rapid Deployment Procedures</h2>
        <p>
          The C-27J's rapid turnaround capability is a key operational advantage. Engine-running offloads
          (EROs) and onloads can be completed in less than 15 minutes for a full pallet configuration.
          This requires the loadmaster to have the offload/onload sequence planned before arrival, with
          all pallet locks identified and restraint removal sequence ready to execute immediately after
          the ramp touches down. Manual pallet movement without PDUs (the C-27J uses a simpler gravity
          roller system compared to the C-17) requires physically demanding manual handling of pallets
          down the ramp — the loadmaster must pace the work to avoid injury while meeting the time
          requirement.
        </p>
        <h2>Special Operations Support</h2>
        <p>
          C-27J special operations support roles include inserting and extracting small special forces
          teams, delivering time-critical supplies to clandestine locations, and conducting personnel
          and equipment airdrops at low level. The small cargo compartment (9.1m usable) limits the
          absolute payload compared to the C-130, but the C-27J's ability to operate from strips
          that are genuinely inaccessible to the C-130 provides a capability that cannot be replicated
          by any other fixed-wing type in the RAAF inventory.
        </p>
        <h2>Humanitarian Operations</h2>
        <p>
          The C-27J's short-field and rough-strip capability makes it particularly valuable in
          humanitarian operations following natural disasters, where infrastructure is damaged and
          large airfields may be inoperable. The loadmaster adapts to humanitarian operations by
          managing unusual cargo (medical supplies, shelter equipment, water purification systems)
          that may not come pre-palletised and may require improvised restraint. Humanitarian cargo
          manifests are often incomplete or inaccurate — the loadmaster must weigh cargo directly
          rather than relying on shipper documentation, particularly for NGO-sourced loads.
        </p>
        <h2>Medical Evacuation</h2>
        <p>
          The C-27J can be configured for aeromedical evacuation with up to six litters and two
          medical attendants. The small cabin limits the medical team's ability to work around the
          litters, so patient preparation (IV lines secured, equipment stowed, patient secured to
          litter) must be completed before loading. The loadmaster coordinates with the medical crew
          on loading sequence (most critical patient first or last to load — determined by the medical
          team), oxygen supply connection, and power requirements for medical equipment.
        </p>
      </div>
    ),
  }

  // Specific module title overrides for the "all" aircraft category
  const titleLower = moduleTitle.toLowerCase()
  if (aircraft === "all") {
    if (difficulty === "beginner") return content["all-beginner"]
    if (difficulty === "advanced") {
      if (titleLower.includes("weight") || titleLower.includes("balance")) return content["all-advanced-wb"]
      if (titleLower.includes("emergency")) return content["all-advanced-emerg"]
      return content["all-advanced-lp"]
    }
    if (difficulty === "intermediate") {
      if (titleLower.includes("dangerous") || titleLower.includes("goods") || titleLower.includes("dg")) return content["all-intermediate-dg"]
      if (titleLower.includes("regulation") || titleLower.includes("compliance")) return content["all-intermediate-reg"]
      if (titleLower.includes("security")) return content["all-intermediate-sec"]
      return content["all-intermediate-dg"]
    }
    if (difficulty === "expert") return content["all-advanced-lp"]
  }

  // Aircraft-specific content
  if (aircraft === "c17") {
    if (difficulty === "intermediate") return content["c17-intermediate"]
    if (difficulty === "advanced") return content["c17-advanced"]
  }
  if (aircraft === "c130") {
    if (difficulty === "intermediate") return content["c130-intermediate"]
    if (difficulty === "advanced" || difficulty === "expert") return content["c130-advanced"]
  }
  if (aircraft === "kc30a") {
    if (difficulty === "intermediate" || difficulty === "advanced" || difficulty === "expert") return content["kc30a-intermediate"]
  }
  if (aircraft === "c27j") {
    if (difficulty === "intermediate" || difficulty === "advanced" || difficulty === "expert") return content["c27j-intermediate"]
  }

  // Fallback — generate readable content from topic names
  return (
    <div>
      <h1>{moduleTitle}</h1>
      {topics.map((topic, i) => (
        <div key={i}>
          <h2>{topic}</h2>
          <p>
            This section covers the principles and practical application of {topic.toLowerCase()} as they
            apply to {aircraft === "all" ? "military air transport" : aircraft.toUpperCase()} operations.
            Loadmasters must demonstrate competence in this area during qualification assessment and maintain
            currency through regular operational application and periodic ground training.
          </p>
          <p>
            Detailed procedures are contained in the applicable Aircraft Technical Order and Unit Standard
            Operating Procedures. All actions taken under this subject area must comply with the current
            approved documentation for the airframe and mission type. Any deviation from published
            procedures requires the aircraft commander's authorisation and must be documented in the
            mission record.
          </p>
        </div>
      ))}
    </div>
  )
}
