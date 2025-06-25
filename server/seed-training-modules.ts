import { db } from './db';
import { trainingModules } from '../shared/schema';

async function seedTrainingModules() {
  try {
    console.log('🌱 Seeding training modules...');

    const modules = [
      {
        title: "C-17 Globemaster III Fundamentals",
        description: "Introduction to C-17 cargo loading fundamentals",
        aircraft: "c17",
        difficulty: "beginner",
        duration: "45 minutes",
        topics: ["Aircraft Familiarization", "Standard Cargo Configurations", "Basic Weight and Balance"],
        objectives: [
          "Understand C-17 cargo area layout and capabilities",
          "Learn standard pallet configurations and positions",
          "Master basic weight and balance principles"
        ],
        reading_content: `# C-17 Globemaster III - Aircraft Overview

## Aircraft Specifications
- **Length**: 174 feet (53.0 meters)
- **Wingspan**: 169.8 feet (51.8 meters)
- **Height**: 55.1 feet (16.8 meters)
- **Maximum Takeoff Weight**: 585,000 lbs (265,352 kg)
- **Maximum Payload**: 170,900 lbs (77,519 kg)
- **Cargo Volume**: 18,216 cubic feet (515.8 cubic meters)

## Cargo Compartment Dimensions
- **Length**: 88 feet (26.8 meters)
- **Width**: 18 feet (5.5 meters)
- **Height**: 12.4 feet (3.8 meters)
- **Usable Floor Area**: 1,584 square feet (147.2 square meters)

## Standard Pallet Configurations
The C-17 can accommodate various pallet arrangements:
- **18 Standard 463L Pallets** (88" x 108")
- **Large vehicles** up to 169,000 lbs
- **102 Paratroopers** with full equipment
- **36 Litter patients** with medical attendants

## Weight and Balance Fundamentals
- **Center of Gravity Range**: 25% to 35% MAC
- **Maximum Floor Loading**: 250 PSF (pounds per square foot)
- **Fuel Capacity**: 180,000 lbs maximum
- **Operating Empty Weight**: 282,500 lbs typical

## Key Capabilities
- **Strategic range**: 2,400 nautical miles with maximum payload
- **Aerial delivery**: Personnel and equipment airdrop capability
- **Tactical operations**: Short, rough runway capability
- **Self-sufficiency**: Built-in cargo handling equipment

## Safety Considerations
- Always verify cargo securing before flight
- Monitor weight distribution throughout loading
- Ensure proper aisle space for emergency egress
- Follow established loading sequences for safety
- Coordinate with aircrew for all operations

## Basic Loading Principles
1. Plan the load before aircraft arrival
2. Load heaviest items first and near center of gravity
3. Secure all cargo with appropriate restraint systems
4. Verify weight and balance calculations
5. Conduct final walkthrough inspection`,
        videoContent: `# Video Training Modules

## Module 1: Aircraft Familiarization (15 minutes)
- External walkround and cargo door operations
- Interior layout and equipment locations
- Safety equipment and emergency procedures

## Module 2: Basic Loading Procedures (20 minutes)
- Standard pallet loading sequences
- Cargo restraint systems and techniques
- Weight and balance verification

## Module 3: Cargo Configurations (18 minutes)
- Standard 18-pallet configuration
- Mixed cargo and passenger loads
- Vehicle loading procedures`,
        interactiveContent: `# Interactive Training Exercises

## Exercise 1: C-17 Cargo Bay Virtual Tour
Navigate through the C-17 cargo compartment and identify key features:
- 18 standard pallet positions
- Cargo restraint anchor points
- Emergency equipment locations
- Load planning reference points

## Exercise 2: Weight and Balance Calculator
Practice calculating weight and balance for various load configurations:
- Empty aircraft weight: 282,500 lbs
- Fuel load: Variable up to 180,000 lbs
- Cargo weight: Student input up to 170,900 lbs
- Calculate center of gravity position

## Exercise 3: Pallet Loading Simulator
Drag and drop pallets to create efficient load plans:
- 18 pallets of varying weights
- Maintain CG within 25-35% MAC
- Optimize for mission requirements`,
        quizContent: `# C-17 Fundamentals Knowledge Assessment

## Question 1: What is the maximum payload capacity?
A) 150,000 lbs
B) 170,900 lbs
C) 190,000 lbs
D) 210,000 lbs
**Answer: B) 170,900 lbs**

## Question 2: How many standard 463L pallets can the C-17 carry?
A) 16 pallets
B) 18 pallets
C) 20 pallets
D) 22 pallets
**Answer: B) 18 pallets**

## Question 3: What is the acceptable CG range?
A) 20% to 30% MAC
B) 25% to 35% MAC
C) 30% to 40% MAC
D) 35% to 45% MAC
**Answer: B) 25% to 35% MAC**`,
        isActive: true,
        createdBy: "System"
      },
      {
        title: "C-130 Hercules Fundamentals",
        description: "Introduction to C-130 cargo loading fundamentals",
        aircraft: "c130",
        difficulty: "beginner",
        duration: "45 minutes",
        topics: ["Aircraft Familiarization", "Standard Cargo Configurations", "Weight Limitations"],
        objectives: [
          "Understand C-130 cargo area layout and limitations",
          "Learn proper securing techniques",
          "Identify standard cargo positions"
        ],
        readingContent: `# C-130 Hercules - Aircraft Overview

## Aircraft Specifications
- **Length**: 97.9 feet (29.8 meters)
- **Wingspan**: 132.2 feet (40.3 meters)
- **Height**: 38.5 feet (11.7 meters)
- **Maximum Takeoff Weight**: 155,000 lbs (70,307 kg)
- **Maximum Payload**: 42,000 lbs (19,050 kg)
- **Cargo Volume**: 4,500 cubic feet (127.4 cubic meters)

## Cargo Compartment Dimensions
- **Length**: 40 feet (12.2 meters)
- **Width**: 10.3 feet (3.1 meters)
- **Height**: 9 feet (2.7 meters)
- **Usable Floor Area**: 412 square feet (38.3 square meters)

## Standard Pallet Configurations
The C-130 can accommodate:
- **6 Standard 463L Pallets** (88" x 108")
- **12 Standard Pallets** with rolling stock removed
- **128 Passengers** in troop seating configuration
- **92 Paratroopers** with full equipment

## Weight and Balance Fundamentals
- **Center of Gravity Range**: 25% to 35% MAC
- **Maximum Floor Loading**: 250 PSF (pounds per square foot)
- **Rolling Load Limit**: 3,500 lbs per running foot
- **Fuel Capacity**: 9,680 gallons (61,364 lbs maximum)

## Key Differences from C-17
- **Smaller cargo bay**: Requires careful space planning
- **Lower payload**: More restrictive weight limitations
- **Tactical focus**: Designed for shorter, rough airfields
- **Manual systems**: More hands-on loading procedures

## Safety Considerations
- Verify adequate clearance for all cargo
- Maintain proper aisle space for crew movement
- Ensure emergency exit accessibility
- Follow strict weight distribution guidelines
- Use appropriate restraint systems for cargo type

## Basic Loading Principles
1. Plan load sequence before aircraft arrival
2. Position heaviest items near CG
3. Secure all cargo with military specification restraints
4. Verify weight and balance within limits
5. Conduct final safety inspection before flight`,
        videoContent: `# Video Training Modules

## Module 1: C-130 Aircraft Familiarization (18 minutes)
- External walkround procedures
- Cargo door and ramp operations
- Loading equipment and tools
- Safety equipment locations

## Module 2: Cargo Bay Layout and Systems (22 minutes)
- Interior dimensions and limitations
- Pallet positions and tie-down points
- Environmental control systems
- Emergency equipment locations

## Module 3: Basic Loading Procedures (25 minutes)
- Standard loading sequences
- Restraint system applications
- Weight distribution techniques
- Pre-flight inspection procedures`,
        interactiveContent: `# Interactive Training Exercises

## Exercise 1: C-130 Cargo Bay Explorer
Virtual tour of the C-130 cargo compartment:
- Navigate through 3D cargo bay model
- Identify 6 standard pallet positions
- Locate tie-down points and anchor systems
- Find emergency equipment and exits
- Practice measuring cargo dimensions

## Exercise 2: Weight and Balance Calculator
Practice C-130 weight calculations:
- Empty aircraft weight: 76,469 lbs
- Fuel load: Variable (up to 61,364 lbs)
- Cargo weight: Student input (up to 42,000 lbs)
- Passenger/crew weight: Variable
- Calculate total weight and CG position

## Exercise 3: Cargo Loading Simulator
Drag and drop cargo into C-130:
- 6 standard pallets of varying weights
- Maintain CG within 25-35% MAC
- Respect floor loading limits (250 PSF)
- Ensure proper load distribution
- Verify emergency egress routes

## Exercise 4: Restraint System Trainer
Interactive guide to C-130 restraint systems:
- Chain restraints for heavy cargo
- Strap systems for standard pallets
- Net systems for loose cargo
- Special restraints for vehicles
- Practice restraint calculations`,
        quizContent: `# C-130 Fundamentals Knowledge Assessment

## Question 1: Aircraft Specifications
What is the maximum payload capacity of the C-130 Hercules?
A) 35,000 lbs
B) 42,000 lbs
C) 50,000 lbs
D) 55,000 lbs
**Answer: B) 42,000 lbs**

## Question 2: Cargo Bay Dimensions
What is the usable length of the C-130 cargo compartment?
A) 35 feet
B) 40 feet
C) 45 feet
D) 50 feet
**Answer: B) 40 feet**

## Question 3: Standard Pallet Configuration
How many standard 463L pallets can the C-130 accommodate?
A) 4 pallets
B) 6 pallets
C) 8 pallets
D) 10 pallets
**Answer: B) 6 pallets**

## Question 4: Center of Gravity Range
What is the acceptable CG range for the C-130?
A) 20% to 30% MAC
B) 25% to 35% MAC
C) 30% to 40% MAC
D) 35% to 45% MAC
**Answer: B) 25% to 35% MAC**

## Question 5: Maximum Floor Loading
What is the maximum floor loading limit for the C-130?
A) 200 PSF
B) 225 PSF
C) 250 PSF
D) 275 PSF
**Answer: C) 250 PSF**`,
        isActive: true,
        createdBy: "System"
      },
      {
        title: "KC30-A Airbus Cargo Basics",
        description: "Introduction to KC30-A cargo loading fundamentals",
        aircraft: "kc30a",
        difficulty: "beginner",
        duration: "45 minutes",
        topics: ["Aircraft Configuration", "ULD Management", "Weight in Kilograms"],
        objectives: [
          "Understand KC30-A cargo area layout and capabilities",
          "Learn ULD (Unit Load Device) handling procedures",
          "Master metric weight and balance calculations"
        ],
        readingContent: `# KC30-A Multi-Role Tanker Transport - Aircraft Overview

## Aircraft Specifications
- **Length**: 58.8 meters (192.9 feet)
- **Wingspan**: 60.3 meters (197.8 feet)
- **Height**: 17.4 meters (57.1 feet)
- **Maximum Takeoff Weight**: 233,000 kg (513,677 lbs)
- **Maximum Payload**: 45,000 kg (99,208 lbs)
- **Cargo Volume**: 858 cubic meters (30,300 cubic feet)

## Cargo Compartment Configuration
- **Lower Deck Length**: 43.9 meters (144 feet)
- **Lower Deck Width**: 3.0 meters (9.8 feet)
- **Lower Deck Height**: 2.4 meters (7.9 feet)
- **Main Deck Option**: Available for cargo configuration

## Unit Load Device (ULD) System
The KC30-A uses standardized ULD containers:
- **LD3 Containers**: 2.44m x 1.53m x 1.63m (8' x 5' x 5.3')
- **LD6 Containers**: 3.17m x 2.24m x 1.63m (10.4' x 7.3' x 5.3')
- **LD8 Containers**: 2.44m x 3.17m x 1.63m (8' x 10.4' x 5.3')
- **Maximum ULD Count**: 28 LD3 containers in lower deck

## Weight and Balance (Metric System)
- **Center of Gravity Range**: 25% to 40% MAC
- **Maximum Floor Loading**: 732 kg/m² (150 PSF equivalent)
- **Fuel Capacity**: 111,000 kg (245,000 lbs)
- **Operating Empty Weight**: 109,000 kg (240,300 lbs)

## Dual-Role Capability
**Tanker Configuration**
- Air-to-air refueling boom system
- Wing aerial refueling pods (WARP)
- Fuel transfer capacity: 111,000 kg
- Simultaneous cargo and fuel missions

**Transport Configuration**
- 270 passengers in high-density seating
- Mixed passenger and cargo operations
- Medical evacuation configuration available
- VIP transport capability

## Key Differences from Military Transports
- **Commercial aircraft basis**: Airbus A330-200 derivative
- **Metric measurements**: All weights in kilograms
- **ULD system**: Containerized cargo handling
- **Automated systems**: Computer-controlled loading
- **Civilian standards**: Different safety and operational procedures

## Safety Considerations
- Verify ULD weight distribution and securing
- Monitor fuel system during cargo operations
- Ensure proper environmental control settings
- Follow civilian aviation safety standards
- Coordinate with boom operator for fuel operations

## Basic Loading Principles
1. Plan ULD arrangement before loading begins
2. Distribute weight evenly across cargo floor
3. Secure ULDs with certified restraint systems
4. Calculate weight and balance in metric units
5. Verify environmental system settings for cargo type`,
        videoContent: `# Video Training Modules

## Module 1: KC30-A Aircraft Familiarization (20 minutes)
- External aircraft inspection and systems
- Cargo door operations and access
- Fuel system overview and safety
- Dual-role configuration differences

## Module 2: ULD System Operations (18 minutes)
- Container types and specifications
- Loading and securing procedures
- Weight distribution principles
- ULD restraint systems

## Module 3: Metric Calculations and Procedures (22 minutes)
- Weight and balance in kilograms
- Center of gravity calculations
- Fuel load impact on cargo operations
- Performance planning considerations`,
        interactiveContent: `# Interactive Training Exercises

## Exercise 1: KC30-A Virtual Tour
Navigate through 3D model of KC30-A:
- Explore lower deck cargo compartment
- Identify ULD loading positions (28 locations)
- Locate restraint systems and tie-down points
- Find environmental control systems
- Practice measuring ULD dimensions

## Exercise 2: Metric Weight Calculator
Practice KC30-A weight calculations:
- Operating empty weight: 109,000 kg
- Fuel load: Variable (up to 111,000 kg)
- Cargo weight: Student input (up to 45,000 kg)
- Passenger weight: Variable
- Calculate total weight and CG in metric

## Exercise 3: ULD Loading Simulator
Plan and load ULD configuration:
- 24 LD3 containers of varying weights
- Maintain CG within 25-40% MAC
- Respect floor loading limits (732 kg/m²)
- Optimize for dual-role mission requirements
- Verify restraint system capacity

## Exercise 4: Dual-Role Mission Planner
Configure aircraft for combined mission:
- 15,000 kg cargo load
- 60,000 kg fuel for air-to-air refueling
- 50 passengers
- Calculate performance impact
- Plan mission profile and limitations`,
        quizContent: `# KC30-A Fundamentals Knowledge Assessment

## Question 1: Aircraft Specifications
What is the maximum payload capacity of the KC30-A?
A) 40,000 kg
B) 45,000 kg
C) 50,000 kg
D) 55,000 kg
**Answer: B) 45,000 kg**

## Question 2: ULD Configuration
Maximum number of LD3 containers in lower deck:
A) 24 containers
B) 26 containers
C) 28 containers
D) 30 containers
**Answer: C) 28 containers**

## Question 3: Weight System
What measurement system is used for KC30-A operations?
A) Imperial (pounds and feet)
B) Metric (kilograms and meters)
C) Mixed system depending on mission
D) Either system based on crew preference
**Answer: B) Metric (kilograms and meters)**

## Question 4: CG Range
Acceptable center of gravity range for KC30-A:
A) 20% to 35% MAC
B) 25% to 40% MAC
C) 30% to 45% MAC
D) 35% to 50% MAC
**Answer: B) 25% to 40% MAC**

## Question 5: Dual-Role Capability
Primary advantage of KC30-A dual-role design:
A) Increased cargo capacity
B) Better fuel efficiency
C) Simultaneous tanker and transport missions
D) Reduced crew requirements
**Answer: C) Simultaneous tanker and transport missions**`,
        isActive: true,
        createdBy: "System"
      },
      {
        title: "C-27J Spartan Fundamentals",
        description: "Introduction to C-27J tactical airlift operations",
        aircraft: "c27j",
        difficulty: "beginner",
        duration: "45 minutes",
        topics: ["Aircraft Overview", "Tactical Operations", "Short Field Performance"],
        objectives: [
          "Understand C-27J capabilities and limitations",
          "Learn tactical airlift procedures",
          "Master short field loading operations"
        ],
        readingContent: `# C-27J Spartan - Tactical Airlift Aircraft Overview

## Aircraft Specifications
- **Length**: 22.7 meters (74.5 feet)
- **Wingspan**: 28.7 meters (94.2 feet)
- **Height**: 9.6 meters (31.6 feet)
- **Maximum Takeoff Weight**: 31,000 kg (68,343 lbs)
- **Maximum Payload**: 11,500 kg (25,353 lbs)
- **Cargo Volume**: 235 cubic meters (8,300 cubic feet)

## Cargo Compartment Dimensions
- **Length**: 11.5 meters (37.7 feet)
- **Width**: 3.35 meters (11.0 feet)
- **Height**: 3.35 meters (11.0 feet)
- **Usable Floor Area**: 38.5 square meters (414 square feet)

## Tactical Airlift Capabilities
The C-27J is designed for tactical missions:
- **Short field performance**: 500-meter runways
- **Rough field operations**: Unpaved and semi-prepared surfaces
- **Low-level flight**: Terrain following capability
- **Rapid deployment**: Quick turnaround times

## Standard Load Configurations
**Pallet Configuration**
- **5 Standard 463L Pallets** (88" x 108")
- **3 Large Pallets** with passenger seating
- **Mixed configurations** for multi-role missions

**Passenger Configuration**
- **68 Passengers** in standard seating
- **46 Paratroopers** with full equipment
- **36 Litter patients** in medical configuration

**Vehicle Transport**
- **1 HMMWV** with trailer
- **2 Motorcycles** or ATVs
- **Light equipment** up to 11,500 kg total

## Weight and Balance Fundamentals
- **Center of Gravity Range**: 20% to 35% MAC
- **Maximum Floor Loading**: 586 kg/m² (120 PSF)
- **Rolling Load Limit**: 2,000 kg per running meter
- **Fuel Capacity**: 5,000 kg (11,023 lbs)

## Tactical Advantages
**Short Field Performance**
- Takeoff distance: 500 meters at maximum weight
- Landing distance: 400 meters at normal landing weight
- Obstacle clearance: 15-meter (50-foot) obstacles
- Soft field capability: Grass and dirt runways

**Operational Flexibility**
- Self-loading and unloading capability
- Independent operations without ground support
- All-weather operations capability
- Night vision goggle compatible cockpit

## Safety Considerations
- Verify runway condition and length before operations
- Monitor cargo securing during tactical maneuvers
- Maintain proper weight distribution for short field performance
- Follow noise abatement procedures in populated areas
- Coordinate with air traffic control for tactical approaches

## Basic Loading Principles
1. Plan cargo arrangement for quick offload if needed
2. Secure all cargo for tactical flight maneuvers
3. Position heavy items forward of CG for stability
4. Verify weight and balance within tactical limits
5. Prepare for rapid departure if required

## Key Differences from Larger Transports
- **Smaller cargo bay**: More restrictive dimensions
- **Tactical focus**: Designed for forward operating bases
- **Manual systems**: More hands-on procedures
- **Rapid deployment**: Emphasis on speed over capacity
- **Austere operations**: Self-sufficient capability`,
        videoContent: `# Video Training Modules

## Module 1: C-27J Aircraft Overview (18 minutes)
- External aircraft familiarization
- Tactical capabilities and mission roles
- Cargo door and loading systems
- Cockpit and crew stations

## Module 2: Cargo Bay Operations (15 minutes)
- Interior layout and dimensions
- Pallet positions and securing systems
- Vehicle loading procedures
- Passenger configuration options

## Module 3: Tactical Loading Procedures (22 minutes)
- Rapid loading and unloading techniques
- Short field considerations
- Weight and balance for tactical operations
- Emergency procedures and safety`,
        interactiveContent: `# Interactive Training Exercises

## Exercise 1: C-27J Virtual Tour
Explore 3D model of C-27J aircraft:
- Navigate through cargo compartment
- Identify 5 pallet positions
- Locate cargo restraint systems
- Find emergency equipment
- Practice tactical loading scenarios

## Exercise 2: Tactical Mission Planner
Plan forward operating base resupply:
- 5 pallets of supplies (varying weights)
- 12 personnel with equipment
- Destination: 600-meter grass runway
- Calculate weight and balance
- Verify short field performance

## Exercise 3: Short Field Calculator
Practice C-27J performance calculations:
- Takeoff weight: Variable up to 31,000 kg
- Runway length: 500-1,200 meters
- Surface condition: Paved, grass, dirt
- Weather factors: Wind, temperature
- Calculate required distances and margins

## Exercise 4: Multi-Role Configuration
Configure aircraft for diverse mission:
- 2 pallets of medical supplies
- 1 HMMWV vehicle
- 20 medical personnel
- Patient evacuation capability
- Optimize for mission flexibility`,
        quizContent: `# C-27J Fundamentals Knowledge Assessment

## Question 1: Aircraft Specifications
What is the maximum payload capacity of the C-27J?
A) 9,500 kg
B) 11,500 kg
C) 13,500 kg
D) 15,500 kg
**Answer: B) 11,500 kg**

## Question 2: Short Field Performance
Minimum runway length for C-27J operations:
A) 400 meters
B) 500 meters
C) 600 meters
D) 700 meters
**Answer: B) 500 meters**

## Question 3: Pallet Configuration
Maximum number of standard 463L pallets:
A) 3 pallets
B) 4 pallets
C) 5 pallets
D) 6 pallets
**Answer: C) 5 pallets**

## Question 4: Passenger Capacity
Maximum passengers in standard configuration:
A) 56 passengers
B) 62 passengers
C) 68 passengers
D) 74 passengers
**Answer: C) 68 passengers**

## Question 5: Weight and Balance
Acceptable CG range for C-27J:
A) 15% to 30% MAC
B) 20% to 35% MAC
C) 25% to 40% MAC
D) 30% to 45% MAC
**Answer: B) 20% to 35% MAC**`,
        isActive: true,
        createdBy: "System"
      }
    ];

    // Clear existing modules and insert new ones
    await db.delete(trainingModules);
    
    for (const module of modules) {
      await db.insert(trainingModules).values(module);
    }

    console.log('✅ Training modules seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed training modules:', error);
    throw error;
  }
}

// Run seeding directly
seedTrainingModules()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export { seedTrainingModules };