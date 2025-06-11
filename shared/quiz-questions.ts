export type QuestionCategory = 
  | 'dangerous-goods' 
  | 'loadmaster-fundamentals' 
  | 'emergency-procedures'
  | 'weight-balance'
  | 'cargo-securing'
  | 'aircraft-systems'
  | 'regulations'
  | 'equipment-handling';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer
  category: QuestionCategory;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Comprehensive library of loadmaster questions
export const loadmasterQuestions: QuizQuestion[] = [
  // Dangerous Goods questions
  {
    id: "dg-1",
    question: "What is the proper procedure for documenting Class 1 (Explosive) materials?",
    options: [
      "Use a standard airway bill",
      "Complete a dangerous goods declaration with UN classification",
      "No documentation is required for military aircraft",
      "Only verbal notification to the aircraft commander is needed"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "medium"
  },
  {
    id: "dg-2",
    question: "Which of the following is NOT permitted on passenger aircraft?",
    options: [
      "Class 9 miscellaneous dangerous goods",
      "Class 6.1 toxic substances (Packing Group III)",
      "Class 1.4S explosives",
      "Class 7 high-activity radioactive materials"
    ],
    correctAnswer: 3,
    category: "dangerous-goods",
    difficulty: "medium"
  },
  {
    id: "dg-3",
    question: "What action should be taken if a package labeled as dangerous goods is found damaged during loading?",
    options: [
      "Cover the damage with strong tape and continue loading",
      "Remove it immediately and inform the dangerous goods officer",
      "Check if the contents are leaking, if not, continue loading",
      "Repack it in a stronger container"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "easy"
  },
  {
    id: "dg-4",
    question: "When transporting both dangerous goods and standard cargo, what is the minimum separation distance required?",
    options: [
      "No separation required",
      "At least one pallet position",
      "Depends on the compatibility groups",
      "At least 3 meters"
    ],
    correctAnswer: 2,
    category: "dangerous-goods",
    difficulty: "medium"
  },
  {
    id: "dg-5",
    question: "According to IATA regulations, which dangerous goods class requires 'Cargo Aircraft Only' labeling?",
    options: [
      "Class 2.1 Flammable gases in all quantities",
      "Class 3 Flammable liquids in all quantities",
      "Class 6.2 Infectious substances (Category A)",
      "Class 9 Miscellaneous dangerous goods"
    ],
    correctAnswer: 2,
    category: "dangerous-goods",
    difficulty: "hard"
  },
  {
    id: "dg-6",
    question: "What does the 'Limited Quantity' mark indicate for dangerous goods?",
    options: [
      "The package can only be handled by specially trained personnel",
      "The quantity within the package is within designated limits that reduce hazard",
      "The package must be segregated from other cargo",
      "The goods can only be transported on cargo aircraft"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "medium"
  },
  {
    id: "dg-7",
    question: "Which form is required for the air transport of dangerous goods?",
    options: [
      "Air Transport Form 23B",
      "Dangerous Goods Declaration (DGD)",
      "Hazardous Materials Shipping Paper",
      "Material Safety Data Sheet (MSDS)"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "easy"
  },
  {
    id: "dg-8",
    question: "What does the orange diamond placard with '1.1' indicate?",
    options: [
      "Mass explosion hazard",
      "Fire hazard with minor blast",
      "Minor fire hazard",
      "Toxic gas release"
    ],
    correctAnswer: 0,
    category: "dangerous-goods",
    difficulty: "medium"
  },
  {
    id: "dg-9",
    question: "Which class of dangerous goods requires the 'POISON' label?",
    options: [
      "Class 4.1 Flammable solids",
      "Class 6.1 Toxic substances",
      "Class 8 Corrosive substances",
      "Class 9 Miscellaneous"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "easy"
  },
  {
    id: "dg-10",
    question: "What is the maximum net quantity per package for most Class 3 flammable liquids on passenger aircraft?",
    options: [
      "1 liter",
      "5 liters",
      "10 liters",
      "Not permitted"
    ],
    correctAnswer: 0,
    category: "dangerous-goods",
    difficulty: "hard"
  },
  {
    id: "dg-11",
    question: "When must a NOTOC (Notice to Captain) be provided?",
    options: [
      "Only for passenger flights",
      "For all flights carrying dangerous goods",
      "Only for international flights",
      "Only for cargo aircraft"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "medium"
  },
  {
    id: "dg-12",
    question: "What action should be taken if dangerous goods are discovered as undeclared cargo?",
    options: [
      "Complete loading and report after flight",
      "Immediately stop loading and notify authorities",
      "Continue if quantity is small",
      "Move to cargo-only aircraft"
    ],
    correctAnswer: 1,
    category: "dangerous-goods",
    difficulty: "easy"
  },
  
  // Loadmaster Fundamentals questions
  {
    id: "lf-1",
    question: "What is the primary responsibility of a loadmaster?",
    options: [
      "Aircraft navigation",
      "Cargo loading, restraint, and weight distribution",
      "Aircraft maintenance",
      "Flight planning"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "easy"
  },
  {
    id: "lf-2",
    question: "What is the purpose of a load plan?",
    options: [
      "To document maintenance requirements",
      "To calculate fuel consumption",
      "To determine the sequence of loading/unloading and placement of cargo",
      "To assign personnel to flights"
    ],
    correctAnswer: 2,
    category: "loadmaster-fundamentals",
    difficulty: "easy"
  },
  {
    id: "lf-3",
    question: "When calculating floor loading on an aircraft, what unit is typically used?",
    options: [
      "Pounds per cubic foot",
      "Pounds per square inch (PSI)",
      "Kilograms per meter",
      "Newtons per square meter"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "medium"
  },
  {
    id: "lf-4",
    question: "What is the purpose of computing the center of gravity (CG) of an aircraft?",
    options: [
      "To determine the maximum altitude",
      "To ensure proper balance and safe flight characteristics",
      "To calculate fuel consumption",
      "To determine the cruising speed"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "medium"
  },
  {
    id: "lf-5",
    question: "Which of the following is a standard restraint device used for cargo?",
    options: [
      "Tension locks",
      "Cargo netting",
      "CGU-1/B tie-down straps",
      "All of the above"
    ],
    correctAnswer: 3,
    category: "loadmaster-fundamentals",
    difficulty: "easy"
  },
  {
    id: "lf-6",
    question: "What is the standard tie-down requirement for cargo under normal flight conditions?",
    options: [
      "1.5G forward, 1.5G aft, 1.5G lateral, 2G vertical",
      "3G forward, 1.5G aft, 1.5G lateral, 2G vertical",
      "1G in all directions",
      "5G forward, 3G aft, 3G lateral, 4G vertical"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "medium"
  },
  {
    id: "lf-7",
    question: "What document contains specific limitations and procedures for loading an aircraft?",
    options: [
      "Aircraft flight manual",
      "Aircraft loading manual",
      "Standard operating procedures",
      "Technical orders"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "easy"
  },
  {
    id: "lf-8",
    question: "What is the primary concern when loading oversized cargo?",
    options: [
      "Weight distribution",
      "Clearance from aircraft structure and other cargo",
      "Security classification",
      "Insurance requirements"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "medium"
  },
  {
    id: "lf-9",
    question: "When should a pre-load inspection be conducted?",
    options: [
      "Only for international flights",
      "Before every loading operation",
      "Only for hazardous cargo",
      "Weekly"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "easy"
  },
  {
    id: "lf-10",
    question: "What is the purpose of blocking and bracing cargo?",
    options: [
      "To meet insurance requirements",
      "To prevent cargo movement during flight",
      "To maximize space utilization",
      "To facilitate unloading"
    ],
    correctAnswer: 1,
    category: "loadmaster-fundamentals",
    difficulty: "easy"
  },
  {
    id: "lf-11",
    question: "What information must be included on a load manifest?",
    options: [
      "Cargo weight, dimensions, and placement",
      "Crew names only",
      "Fuel quantity only",
      "Flight schedule"
    ],
    correctAnswer: 0,
    category: "loadmaster-fundamentals",
    difficulty: "medium"
  },
  {
    id: "lf-12",
    question: "What is the maximum allowable floor loading for most military transport aircraft?",
    options: [
      "50 PSI",
      "100 PSI",
      "150 PSI",
      "Varies by aircraft type"
    ],
    correctAnswer: 3,
    category: "loadmaster-fundamentals",
    difficulty: "hard"
  },
  
  // Emergency Procedures questions
  {
    id: "ep-1",
    question: "In case of a fire detected in the cargo compartment during flight, what is the first action a loadmaster should take?",
    options: [
      "Attempt to extinguish the fire immediately",
      "Notify the flight crew immediately",
      "Begin jettisoning cargo",
      "Prepare for emergency landing"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "medium"
  },
  {
    id: "ep-2",
    question: "What is the correct procedure for handling a hazardous material spill on an aircraft?",
    options: [
      "Cover with absorbent material and continue operations",
      "Evacuate the area, notify the flight crew, and follow specific spill procedures",
      "Dilute with water",
      "Attempt to repack the material"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "medium"
  },
  {
    id: "ep-3",
    question: "During an emergency landing, what is the loadmaster's primary responsibility?",
    options: [
      "Securing loose cargo",
      "Assisting the pilot",
      "Preparing passengers for impact and managing evacuation",
      "Operating emergency equipment"
    ],
    correctAnswer: 2,
    category: "emergency-procedures",
    difficulty: "hard"
  },
  {
    id: "ep-4",
    question: "What action should be taken if cargo shifts significantly during flight?",
    options: [
      "Wait until landing to address the issue",
      "Notify the flight crew immediately and assess if rebalancing is possible",
      "Ignore it if the aircraft is still flying normally",
      "Jettison the cargo if possible"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "medium"
  },
  {
    id: "ep-5",
    question: "In which emergency situation would a loadmaster consider jettisoning cargo?",
    options: [
      "Engine failure",
      "When instructed by the aircraft commander after determination that cargo jettison is necessary for safety",
      "Low fuel situation",
      "Bad weather conditions"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "hard"
  },
  {
    id: "ep-6",
    question: "What is the proper evacuation procedure for passengers in the cargo compartment during an emergency landing?",
    options: [
      "Exit through the nearest emergency exit after the aircraft has come to a complete stop",
      "Remain seated until rescue personnel arrive",
      "Exit through the forward door only",
      "Jump from the aircraft as soon as it slows down"
    ],
    correctAnswer: 0,
    category: "emergency-procedures",
    difficulty: "medium"
  },
  {
    id: "ep-7",
    question: "What should a loadmaster do if smoke is detected in the cargo compartment?",
    options: [
      "Open cargo doors to ventilate",
      "Use water to suppress potential fire",
      "Don protective equipment and investigate the source",
      "Immediately notify flight crew and don oxygen mask"
    ],
    correctAnswer: 3,
    category: "emergency-procedures",
    difficulty: "medium"
  },
  {
    id: "ep-8",
    question: "During rapid decompression, what is the first priority for a loadmaster?",
    options: [
      "Secure loose cargo",
      "Don oxygen mask and ensure own safety first",
      "Check on passengers",
      "Report to flight crew"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "easy"
  },
  {
    id: "ep-9",
    question: "What emergency equipment should be readily accessible during flight?",
    options: [
      "Fire extinguishers, oxygen masks, first aid kit",
      "Tools and spare parts",
      "Emergency rations",
      "Communication equipment only"
    ],
    correctAnswer: 0,
    category: "emergency-procedures",
    difficulty: "easy"
  },
  {
    id: "ep-10",
    question: "When should emergency procedures be briefed to passengers?",
    options: [
      "Only if an emergency occurs",
      "Before takeoff on every flight",
      "Only on international flights",
      "Weekly briefings are sufficient"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "easy"
  },
  {
    id: "ep-11",
    question: "What information must be relayed to flight crew during a cargo fire emergency?",
    options: [
      "Location, size, and type of fire",
      "Only the location",
      "Estimated time to extinguish",
      "Names of personnel involved"
    ],
    correctAnswer: 0,
    category: "emergency-procedures",
    difficulty: "medium"
  },
  {
    id: "ep-12",
    question: "In case of hydraulic failure affecting cargo systems, what should be the loadmaster's response?",
    options: [
      "Continue normal operations",
      "Manually secure all cargo and restraints",
      "Land at nearest airport immediately",
      "Jettison all cargo"
    ],
    correctAnswer: 1,
    category: "emergency-procedures",
    difficulty: "hard"
  },
  
  // Weight and Balance questions
  {
    id: "wb-1",
    question: "What effect does moving cargo forward in an aircraft have on the center of gravity?",
    options: [
      "Moves the CG forward",
      "Moves the CG aft",
      "Has no effect on CG",
      "Raises the CG vertically"
    ],
    correctAnswer: 0,
    category: "weight-balance",
    difficulty: "easy"
  },
  {
    id: "wb-2",
    question: "What is the term for the point about which an aircraft would balance?",
    options: [
      "Fulcrum point",
      "Center of gravity (CG)",
      "Balance arm",
      "Weight station"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "easy"
  },
  {
    id: "wb-3",
    question: "When calculating the moment of an item, what formula is used?",
    options: [
      "Moment = Weight ÷ Arm",
      "Moment = Weight × Arm",
      "Moment = Weight + Arm",
      "Moment = CG × Weight"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "medium"
  },
  {
    id: "wb-4",
    question: "What does MAC stand for in aircraft weight and balance calculations?",
    options: [
      "Maximum Allowed Cargo",
      "Minimum Aerodynamic Control",
      "Mean Aerodynamic Chord",
      "Maximum Aerodynamic Capacity"
    ],
    correctAnswer: 2,
    category: "weight-balance",
    difficulty: "medium"
  },
  {
    id: "wb-5",
    question: "How is the CG usually expressed in aircraft loading calculations?",
    options: [
      "As a percentage of the Mean Aerodynamic Chord (MAC)",
      "In pounds or kilograms",
      "As a ratio of length to width",
      "In cubic feet"
    ],
    correctAnswer: 0,
    category: "weight-balance",
    difficulty: "hard"
  },
  {
    id: "wb-6",
    question: "What happens if an aircraft is loaded with the CG too far forward?",
    options: [
      "The aircraft will tend to climb",
      "The aircraft will be difficult to control in pitch",
      "The aircraft will be more fuel efficient",
      "The aircraft will have improved stability"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "medium"
  },
  {
    id: "wb-7",
    question: "What is the purpose of the aircraft's basic weight and balance report?",
    options: [
      "To determine fuel capacity",
      "To establish the empty weight CG and moment",
      "To calculate maximum payload",
      "To determine maintenance schedules"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "easy"
  },
  {
    id: "wb-8",
    question: "When calculating weight and balance, what must be considered for liquid cargo?",
    options: [
      "Only the weight when full",
      "Potential weight shift due to liquid movement",
      "Container weight only",
      "Temperature effects only"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "hard"
  },
  {
    id: "wb-9",
    question: "What is the maximum allowable CG range typically expressed as?",
    options: [
      "Forward and aft limits in percentage of MAC",
      "Total weight limits",
      "Fuel quantity limits",
      "Altitude restrictions"
    ],
    correctAnswer: 0,
    category: "weight-balance",
    difficulty: "medium"
  },
  {
    id: "wb-10",
    question: "Why is it critical to stay within CG limits during all phases of flight?",
    options: [
      "To save fuel",
      "To maintain aircraft controllability and stability",
      "To reduce maintenance costs",
      "To increase cargo capacity"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "easy"
  },
  {
    id: "wb-11",
    question: "What effect does fuel burn have on aircraft CG during flight?",
    options: [
      "No effect on CG",
      "CG moves based on fuel tank locations",
      "CG always moves forward",
      "CG always moves aft"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "medium"
  },
  {
    id: "wb-12",
    question: "What document contains the aircraft's certified weight and balance data?",
    options: [
      "Flight manual",
      "Aircraft weight and balance report",
      "Maintenance log",
      "Load planning manual"
    ],
    correctAnswer: 1,
    category: "weight-balance",
    difficulty: "easy"
  },
  
  // Cargo Securing questions
  {
    id: "cs-1",
    question: "What is the minimum number of tie-downs required for a 10,000 lb vehicle?",
    options: [
      "4 tie-downs",
      "6 tie-downs",
      "8 tie-downs",
      "Depends on the G-forces being restrained"
    ],
    correctAnswer: 3,
    category: "cargo-securing",
    difficulty: "medium"
  },
  {
    id: "cs-2",
    question: "What angle is most effective for restraining cargo with tie-down straps?",
    options: [
      "90 degrees (perpendicular) to the aircraft floor",
      "45 degrees to the aircraft floor",
      "30 degrees to the aircraft floor",
      "0 degrees (parallel) to the aircraft floor"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "medium"
  },
  {
    id: "cs-3",
    question: "What is the working load limit (WLL) of a standard CGU-1/B cargo strap?",
    options: [
      "5,000 lbs",
      "10,000 lbs",
      "15,000 lbs",
      "25,000 lbs"
    ],
    correctAnswer: 0,
    category: "cargo-securing",
    difficulty: "easy"
  },
  {
    id: "cs-4",
    question: "When securing a wheeled vehicle, which of these is a requirement?",
    options: [
      "Remove all fluids from the vehicle",
      "Secure the steering mechanism",
      "Deflate the tires completely",
      "Remove the battery"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "easy"
  },
  {
    id: "cs-5",
    question: "What is the purpose of dunnage in aircraft cargo loading?",
    options: [
      "To provide additional weight for balance",
      "To protect the aircraft floor and distribute load",
      "To separate incompatible dangerous goods",
      "To mark the cargo as military freight"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "medium"
  },
  {
    id: "cs-6",
    question: "For shoring requirements, what is the formula to calculate the PSI (Pressure) that a cargo item exerts on the aircraft floor?",
    options: [
      "Weight ÷ Contact area",
      "Weight × Contact area",
      "Contact area ÷ Weight",
      "PSI = Maximum allowable weight ÷ Cargo weight"
    ],
    correctAnswer: 0,
    category: "cargo-securing",
    difficulty: "medium"
  },
  {
    id: "cs-7",
    question: "What type of material should NOT be used as dunnage?",
    options: [
      "Plywood sheets",
      "Aluminum honeycomb panels",
      "Steel plates",
      "Cardboard or paper products"
    ],
    correctAnswer: 3,
    category: "cargo-securing",
    difficulty: "easy"
  },
  {
    id: "cs-8",
    question: "When using cargo nets for restraint, what is the minimum breaking strength requirement?",
    options: [
      "Equal to cargo weight",
      "2 times the cargo weight",
      "3 times the required restraint force",
      "5 times the cargo weight"
    ],
    correctAnswer: 2,
    category: "cargo-securing",
    difficulty: "hard"
  },
  {
    id: "cs-9",
    question: "What is the proper procedure for tensioning tie-down straps?",
    options: [
      "Tighten until the strap stretches visibly",
      "Apply tension gradually and evenly to specification",
      "Tighten as much as physically possible",
      "Use only hand-tight tension"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "medium"
  },
  {
    id: "cs-10",
    question: "Which restraint method is most appropriate for loose cargo items?",
    options: [
      "Individual tie-down straps for each item",
      "Cargo nets or barrier nets",
      "Shoring beams only",
      "No restraint needed if items are small"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "easy"
  },
  {
    id: "cs-11",
    question: "What safety factor is typically applied to cargo restraint calculations?",
    options: [
      "1.5",
      "2.0",
      "2.5",
      "3.0"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "medium"
  },
  {
    id: "cs-12",
    question: "When should cargo restraint equipment be inspected?",
    options: [
      "Only when damaged",
      "Before each use and periodically per regulations",
      "Monthly only",
      "Once per year"
    ],
    correctAnswer: 1,
    category: "cargo-securing",
    difficulty: "easy"
  },
  
  // Aircraft Systems questions
  {
    id: "as-1",
    question: "What is the purpose of the aircraft's cargo winch system?",
    options: [
      "To secure cargo in place",
      "To assist in loading heavy cargo",
      "To measure the weight of cargo",
      "To balance the aircraft"
    ],
    correctAnswer: 1,
    category: "aircraft-systems",
    difficulty: "easy"
  },
  {
    id: "as-2",
    question: "On a C-17 aircraft, what is the maximum capacity of the cargo winch?",
    options: [
      "5,000 lbs",
      "10,000 lbs",
      "15,000 lbs",
      "20,000 lbs"
    ],
    correctAnswer: 1,
    category: "aircraft-systems",
    difficulty: "medium"
  },
  {
    id: "as-3",
    question: "What aircraft system allows for rapid decompression of the cargo compartment for aerial delivery?",
    options: [
      "Pressure relief valves",
      "Cargo door mechanism",
      "Aerial delivery system",
      "Emergency pressure equalization system"
    ],
    correctAnswer: 2,
    category: "aircraft-systems",
    difficulty: "medium"
  },
  {
    id: "as-4",
    question: "What is the purpose of the cargo compartment environmental control system?",
    options: [
      "To maintain oxygen levels for live cargo",
      "To control temperature and humidity for sensitive cargo",
      "To provide lighting for cargo operations",
      "All of the above"
    ],
    correctAnswer: 3,
    category: "aircraft-systems",
    difficulty: "medium"
  },
  {
    id: "as-5",
    question: "In a KC-30A aircraft, what type of cargo loading system is used?",
    options: [
      "Roller conveyor system",
      "LD3 container system",
      "Pallet loading system",
      "Both B and C"
    ],
    correctAnswer: 3,
    category: "aircraft-systems",
    difficulty: "hard"
  },
  {
    id: "as-6",
    question: "What is the function of cargo floor locks in military transport aircraft?",
    options: [
      "To prevent cargo from shifting during flight",
      "To secure pallets and containers to the aircraft floor",
      "To lock the cargo doors",
      "To secure passenger seating"
    ],
    correctAnswer: 1,
    category: "aircraft-systems",
    difficulty: "easy"
  },
  {
    id: "as-7",
    question: "How does the aircraft's hydraulic system support cargo operations?",
    options: [
      "Powers cargo door operation and winch systems",
      "Provides cabin pressure control",
      "Controls aircraft navigation",
      "Manages fuel transfer"
    ],
    correctAnswer: 0,
    category: "aircraft-systems",
    difficulty: "medium"
  },
  {
    id: "as-8",
    question: "What backup system is available if hydraulic power fails during cargo operations?",
    options: [
      "Electric backup pumps",
      "Manual operation procedures",
      "Pneumatic backup system",
      "All of the above"
    ],
    correctAnswer: 3,
    category: "aircraft-systems",
    difficulty: "hard"
  },
  {
    id: "as-9",
    question: "What is the primary purpose of aircraft cargo lighting systems?",
    options: [
      "Emergency evacuation guidance",
      "Safe cargo loading and inspection operations",
      "Passenger comfort",
      "Navigation assistance"
    ],
    correctAnswer: 1,
    category: "aircraft-systems",
    difficulty: "easy"
  },
  {
    id: "as-10",
    question: "In C-130 aircraft, what powers the cargo handling equipment?",
    options: [
      "Aircraft engine bleed air",
      "Aircraft electrical system",
      "Hydraulic system",
      "Both B and C"
    ],
    correctAnswer: 3,
    category: "aircraft-systems",
    difficulty: "medium"
  },
  {
    id: "as-11",
    question: "What safety feature prevents accidental cargo door operation during flight?",
    options: [
      "Door lock mechanisms and flight interlocks",
      "Manual safety pins only",
      "Crew awareness only",
      "Passenger warning systems"
    ],
    correctAnswer: 0,
    category: "aircraft-systems",
    difficulty: "medium"
  },
  {
    id: "as-12",
    question: "What system monitors the position and security of cargo during flight?",
    options: [
      "Cargo monitoring and warning system",
      "GPS tracking system",
      "Radar system",
      "Communication system"
    ],
    correctAnswer: 0,
    category: "aircraft-systems",
    difficulty: "easy"
  },
  
  // Regulations questions
  {
    id: "reg-1",
    question: "Which document contains the official regulations for air transport of dangerous goods?",
    options: [
      "IATA Dangerous Goods Regulations (DGR)",
      "Code of Federal Regulations (CFR)",
      "International Civil Aviation Organization Technical Instructions (ICAO TI)",
      "Both A and C"
    ],
    correctAnswer: 3,
    category: "regulations",
    difficulty: "medium"
  },
  {
    id: "reg-2",
    question: "What does DAFMAN stand for in the context of military air transport?",
    options: [
      "Defense Air Force Manual",
      "Department of Air Force Manual",
      "Defense Aircraft Fleet Management and Navigation",
      "Direct Air Flight Management Authorization Notice"
    ],
    correctAnswer: 1,
    category: "regulations",
    difficulty: "easy"
  },
  {
    id: "reg-3",
    question: "Under which regulation would you find the requirements for training and certification of loadmasters?",
    options: [
      "AFI 11-2 Mission Design Series (MDS)–Volume 3",
      "DAFMAN 24-604",
      "ATP 3-35",
      "TO 1C-17A-9"
    ],
    correctAnswer: 0,
    category: "regulations",
    difficulty: "medium"
  },
  {
    id: "reg-4",
    question: "What is the maximum allowable flying duty period for loadmasters on a basic crew for a C-130 mission according to regulations?",
    options: [
      "12 hours",
      "14 hours",
      "16 hours",
      "18 hours"
    ],
    correctAnswer: 1,
    category: "regulations",
    difficulty: "hard"
  },
  {
    id: "reg-5",
    question: "According to regulations, how often must loadmasters complete recurrent dangerous goods training?",
    options: [
      "Every 6 months",
      "Annually",
      "Every 24 months",
      "Every 36 months"
    ],
    correctAnswer: 2,
    category: "regulations",
    difficulty: "medium"
  },
  {
    id: "reg-6",
    question: "What is the minimum rest period required between duty periods for loadmasters?",
    options: [
      "8 hours",
      "10 hours",
      "12 hours",
      "Depends on mission length"
    ],
    correctAnswer: 3,
    category: "regulations",
    difficulty: "medium"
  },
  {
    id: "reg-7",
    question: "According to IATA regulations, what is required for personnel handling dangerous goods?",
    options: [
      "High school diploma only",
      "Specialized dangerous goods training and certification",
      "Military rank of E-5 or above",
      "Commercial pilot license"
    ],
    correctAnswer: 1,
    category: "regulations",
    difficulty: "easy"
  },
  {
    id: "reg-8",
    question: "What regulation governs the maximum weight limits for military air transport?",
    options: [
      "Aircraft-specific technical orders",
      "International weight standards",
      "IATA cargo regulations",
      "Local airfield restrictions"
    ],
    correctAnswer: 0,
    category: "regulations",
    difficulty: "medium"
  },
  {
    id: "reg-9",
    question: "How often must cargo restraint equipment be inspected according to regulations?",
    options: [
      "Before each use",
      "Weekly",
      "Monthly",
      "As specified in technical orders"
    ],
    correctAnswer: 3,
    category: "regulations",
    difficulty: "hard"
  },
  {
    id: "reg-10",
    question: "What document authorizes the movement of classified cargo?",
    options: [
      "Standard cargo manifest",
      "Special handling authorization",
      "Security classification guide",
      "Classified cargo movement authorization"
    ],
    correctAnswer: 1,
    category: "regulations",
    difficulty: "medium"
  },
  {
    id: "reg-11",
    question: "According to regulations, what is the maximum number of dangerous goods packages allowed on a passenger aircraft?",
    options: [
      "No limit",
      "50 packages",
      "As specified in airline operations manual",
      "Depends on the class of dangerous goods"
    ],
    correctAnswer: 3,
    category: "regulations",
    difficulty: "hard"
  },
  {
    id: "reg-12",
    question: "What regulation covers the transportation of live animals by air?",
    options: [
      "IATA Live Animals Regulations (LAR)",
      "USDA Animal Transport Guidelines",
      "Local veterinary regulations",
      "International Animal Transport Code"
    ],
    correctAnswer: 0,
    category: "regulations",
    difficulty: "easy"
  },
  
  // Equipment Handling questions
  {
    id: "eh-1",
    question: "What is the correct procedure for operating a K-loader?",
    options: [
      "Raise the platform to the aircraft level, then drive under the aircraft",
      "Drive under the aircraft, then raise the platform",
      "Raise the platform halfway, drive under the aircraft, then adjust to final height",
      "Request aircraft to lower to K-loader height"
    ],
    correctAnswer: 1,
    category: "equipment-handling",
    difficulty: "medium"
  },
  {
    id: "eh-2",
    question: "What safety feature must be checked before operating a forklift in aircraft cargo loading?",
    options: [
      "Seat belt functionality",
      "Horn operation",
      "Overhead guard integrity",
      "All of the above"
    ],
    correctAnswer: 3,
    category: "equipment-handling",
    difficulty: "easy"
  },
  {
    id: "eh-3",
    question: "When using a tug to move cargo pallets, what is the maximum safe speed in the aircraft vicinity?",
    options: [
      "5 mph",
      "10 mph",
      "15 mph",
      "25 mph"
    ],
    correctAnswer: 0,
    category: "equipment-handling",
    difficulty: "easy"
  },
  {
    id: "eh-4",
    question: "What is the proper procedure for inspecting cargo straps before use?",
    options: [
      "Visual inspection for fraying or damage",
      "Testing by pulling with maximum force",
      "Checking the manufacturing date only",
      "No inspection needed if used within the last month"
    ],
    correctAnswer: 0,
    category: "equipment-handling",
    difficulty: "easy"
  },
  {
    id: "eh-5",
    question: "How should a 463L pallet be properly handled?",
    options: [
      "By the pallet itself with bare hands",
      "Using a forklift under the pallet stringers",
      "Using only the side rail attach points",
      "Using a crane attached to the center of the pallet"
    ],
    correctAnswer: 1,
    category: "equipment-handling",
    difficulty: "medium"
  },
  {
    id: "eh-6",
    question: "What is the correct method for operating aircraft cargo doors?",
    options: [
      "Pull emergency handle and manually open",
      "Use hydraulic system with control panel",
      "Follow aircraft-specific procedures in the technical manual",
      "Request maintenance personnel to operate"
    ],
    correctAnswer: 2,
    category: "equipment-handling",
    difficulty: "medium"
  },
  {
    id: "eh-7",
    question: "What personal protective equipment is required when handling cargo?",
    options: [
      "Safety glasses only",
      "Hard hat and safety vest",
      "Steel-toed boots, safety glasses, and gloves",
      "Full body protection suit"
    ],
    correctAnswer: 2,
    category: "equipment-handling",
    difficulty: "easy"
  },
  {
    id: "eh-8",
    question: "When should Material Handling Equipment (MHE) be grounded?",
    options: [
      "Only during thunderstorms",
      "Before refueling operations",
      "When working around aircraft and fuel systems",
      "Never required for cargo operations"
    ],
    correctAnswer: 2,
    category: "equipment-handling",
    difficulty: "medium"
  },
  {
    id: "eh-9",
    question: "What is the maximum weight capacity of a standard 463L cargo pallet?",
    options: [
      "5,000 lbs",
      "10,000 lbs",
      "15,000 lbs",
      "20,000 lbs"
    ],
    correctAnswer: 1,
    category: "equipment-handling",
    difficulty: "medium"
  },
  {
    id: "eh-10",
    question: "What tool is used to measure the weight distribution on a cargo pallet?",
    options: [
      "Load scale",
      "Cargo balance scale",
      "Pallet weighing system",
      "Electronic weight distribution analyzer"
    ],
    correctAnswer: 0,
    category: "equipment-handling",
    difficulty: "easy"
  },
  {
    id: "eh-11",
    question: "How should cargo handling equipment be positioned relative to aircraft?",
    options: [
      "As close as possible for efficiency",
      "At safe distances specified in ground safety procedures",
      "No specific requirements",
      "Only when aircraft engines are running"
    ],
    correctAnswer: 1,
    category: "equipment-handling",
    difficulty: "medium"
  },
  {
    id: "eh-12",
    question: "What is the primary safety concern when operating equipment near aircraft?",
    options: [
      "Equipment efficiency",
      "Fuel consumption",
      "Foreign object damage (FOD) and collision avoidance",
      "Equipment maintenance costs"
    ],
    correctAnswer: 2,
    category: "equipment-handling",
    difficulty: "easy"
  },
  {
    id: "eh-7",
    question: "When securing rolling stock with chains, what is the proper way to attach the chain to the vehicle?",
    options: [
      "To any convenient structural member",
      "To designated tie-down points only",
      "To the lightest part of the vehicle",
      "To the wheels or axles"
    ],
    correctAnswer: 1,
    category: "equipment-handling",
    difficulty: "medium"
  }
];

// Utility function to get random questions by categories
export function getQuestionsByCategories(categories: QuestionCategory[], count: number): QuizQuestion[] {
  // Filter questions by categories
  const filteredQuestions = loadmasterQuestions.filter(question => 
    categories.includes(question.category)
  );
  
  // If we don't have enough questions, return all filtered questions
  if (filteredQuestions.length <= count) {
    return [...filteredQuestions];
  }
  
  // Randomly select the requested number of questions
  const shuffled = [...filteredQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}