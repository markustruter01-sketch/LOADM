import { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plane, 
  ArrowLeft, 
  BookOpen, 
  Star, 
  GraduationCap,
  BarChart2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Upload,
  VideoIcon,
  X,
  Play
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { aircraftConfigs } from "@/utils/aircraft-config";

type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  aircraft: string;
  difficulty: DifficultyLevel;
  duration: string;
  topics: string[];
  objectives: string[];
  content?: string;
  videoUrl?: string;
  isActive: boolean;
  createdBy?: string;
  lastModified?: string;
}

// Initial training modules data
const initialTrainingModules: TrainingModule[] = [
  // C-17 Modules
  {
    id: "c17-basics",
    title: "C-17 Globemaster Basics",
    description: "Introduction to C-17 cargo loading fundamentals for beginner loadmasters",
    aircraft: "c17",
    difficulty: "beginner",
    duration: "45 minutes",
    topics: ["Aircraft Overview", "Safety Procedures", "Basic Loading Configurations"],
    objectives: [
      "Understand C-17 cargo area layout and dimensions",
      "Learn basic weight and balance principles",
      "Identify standard pallet positions"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-17 Globemaster III - Aircraft Overview

## Aircraft Specifications
- **Length**: 174 feet (53 meters)
- **Wingspan**: 169.8 feet (51.75 meters)  
- **Height**: 55.1 feet (16.8 meters)
- **Maximum Takeoff Weight**: 585,000 lbs (265,350 kg)
- **Maximum Payload**: 170,900 lbs (77,519 kg)
- **Cargo Volume**: 18,216 cubic feet (515.8 cubic meters)

## Cargo Compartment Dimensions
- **Length**: 88 feet (26.82 meters)
- **Width**: 18 feet (5.49 meters)
- **Height**: 12.4 feet (3.78 meters)
- **Usable Floor Area**: 1,584 square feet (147.2 square meters)

## Standard Pallet Positions
The C-17 can accommodate:
- **18 Standard 463L Pallets** (88" x 108")
- **36 Standard Pallets** with rolling stock removed
- **102 Passengers** in airline seating configuration
- **188 Combat Troops** on sidewall seats

## Weight and Balance Fundamentals
- **Center of Gravity Range**: Station 1036 to 1046 (depending on configuration)
- **Maximum Floor Loading**: 250 PSF (pounds per square foot)
- **Rolling Load Limit**: 10,500 lbs per running foot

## Safety Considerations
- Always verify cargo restraint before flight
- Maintain proper load distribution
- Follow 25% safety margin for CG calculations
- Ensure emergency egress routes remain clear

## Basic Loading Principles
1. Load heaviest items first and center them
2. Distribute weight evenly across the cargo floor
3. Secure all cargo with appropriate restraint systems
4. Verify weight and balance calculations before flight`,
    videoContent: `# Video Training Modules

## Module 1: C-17 Walk-Around Inspection (15 minutes)
- External aircraft familiarization
- Cargo door operations
- Safety equipment locations

## Module 2: Cargo Compartment Layout (20 minutes)  
- Interior dimensions and features
- Pallet positions and tie-down points
- Loading system components

## Module 3: Basic Loading Procedures (25 minutes)
- Step-by-step loading process
- Equipment operation
- Safety protocols and checks`,
    interactiveContent: `# Interactive Training Exercises

## Exercise 1: Virtual Cargo Bay Tour
Navigate through a 3D model of the C-17 cargo bay and identify:
- Pallet positions (18 standard locations)
- Tie-down points and anchor locations
- Emergency equipment locations
- Loading system controls

## Exercise 2: Basic Weight Calculation
Practice calculating total aircraft weight using:
- Empty aircraft weight: 282,500 lbs
- Fuel load: Variable (up to 180,000 lbs)
- Cargo weight: Student input
- Passenger/crew weight: Variable

## Exercise 3: Pallet Positioning Simulator
Drag and drop virtual pallets into correct positions while maintaining:
- Proper weight distribution
- CG within limits
- Floor loading restrictions
- Emergency egress requirements

## Exercise 4: Safety Equipment Identification
Interactive quiz identifying locations of:
- Fire extinguishers
- Emergency exits  
- First aid equipment
- Communication systems`,
    quizContent: `# C-17 Basics Knowledge Assessment

## Question 1: Aircraft Specifications
What is the maximum payload capacity of the C-17 Globemaster III?
A) 150,000 lbs
B) 170,900 lbs
C) 185,000 lbs  
D) 200,000 lbs
**Answer: B) 170,900 lbs**

## Question 2: Cargo Bay Dimensions
What is the usable length of the C-17 cargo compartment?
A) 75 feet
B) 82 feet
C) 88 feet
D) 95 feet
**Answer: C) 88 feet**

## Question 3: Standard Pallet Configuration
How many standard 463L pallets can the C-17 accommodate?
A) 16 pallets
B) 18 pallets  
C) 20 pallets
D) 24 pallets
**Answer: B) 18 pallets**

## Question 4: Weight Distribution
What is the maximum floor loading limit for the C-17?
A) 200 PSF
B) 225 PSF
C) 250 PSF
D) 275 PSF
**Answer: C) 250 PSF**

## Question 5: Safety Procedures
What is the required safety margin for CG calculations?
A) 15%
B) 20%
C) 25%
D) 30%
**Answer: C) 25%**`
  },
  {
    id: "c17-intermediate",
    title: "C-17 Weight Distribution",
    description: "Intermediate training on C-17 weight balancing and cargo distribution",
    aircraft: "c17",
    difficulty: "intermediate",
    duration: "60 minutes", 
    topics: ["Weight & Balance Management", "CG Calculation", "Load Planning Software"],
    objectives: [
      "Calculate center of gravity accurately",
      "Plan mixed cargo loads effectively",
      "Develop load plans for various mission profiles"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-17 Advanced Weight & Balance Operations

## Center of Gravity Calculations
The C-17's CG must remain within specific limits for safe flight:

### CG Limits by Configuration
- **Cargo Only**: 25.0% to 35.0% MAC (Mean Aerodynamic Chord)
- **Mixed Load**: 25.0% to 33.0% MAC  
- **Passenger Config**: 27.0% to 35.0% MAC
- **Combat Load**: 25.0% to 31.0% MAC

### Weight Stations
- **Nose Gear**: Station 582
- **Main Gear**: Station 1373
- **Cargo Bay Center**: Station 1041
- **Reference Datum**: Nose of aircraft (Station 0)

## Load Planning Software
### CAPS (Computer Aided Pallet System)
- Real-time weight and balance calculations
- Automated load planning optimization
- Restraint pattern recommendations
- Performance prediction capabilities

### Manual Calculation Method
**Formula**: CG = (Σ(Weight × Arm)) / Total Weight

**Example Calculation:**
- Empty Aircraft: 282,500 lbs @ Station 1041
- Fuel: 120,000 lbs @ Station 1125  
- Cargo: 80,000 lbs @ Station 1000
- Total: 482,500 lbs

CG = ((282,500 × 1041) + (120,000 × 1125) + (80,000 × 1000)) / 482,500
CG = (294,082,500 + 135,000,000 + 80,000,000) / 482,500 = 1054.4

## Mixed Cargo Considerations
### Vehicle Loading
- **Wheeled vehicles**: Maximum 40,000 lbs each
- **Tracked vehicles**: Special handling required
- **Multiple vehicles**: Maintain 5-foot separation

### Bulk Cargo Guidelines  
- **Maximum single item**: 45,000 lbs
- **Concentrated loads**: Distribute over multiple pallets
- **Height restrictions**: 9 feet maximum with standard pallets

## Performance Impact
Weight and balance affects:
- **Takeoff distance**: +10% per 1% aft CG shift
- **Landing distance**: +5% per 1% aft CG shift  
- **Fuel consumption**: +3% per 10,000 lbs over optimal
- **Climb performance**: Reduced with aft CG

## Critical Loading Scenarios
1. **Forward CG Issues**: Nose-heavy condition, difficult rotation
2. **Aft CG Issues**: Tail-heavy condition, pitch instability
3. **Overweight**: Reduced performance, structural stress
4. **Improper distribution**: Uneven floor loading, structural damage`,
    videoContent: `# Advanced Weight & Balance Video Training

## Module 1: CAPS Software Operation (25 minutes)
- System navigation and input procedures
- Load planning optimization features
- Generating and interpreting reports
- Troubleshooting common issues

## Module 2: Complex Load Scenarios (20 minutes)
- Mixed cargo configurations
- Vehicle and equipment loading
- Dangerous goods integration
- Emergency load modifications

## Module 3: Performance Calculations (15 minutes)  
- Takeoff and landing distance calculations
- Fuel planning considerations
- Altitude and temperature effects
- Mission planning integration`,
    interactiveContent: `# Advanced Interactive Simulations

## Simulation 1: Multi-Cargo Load Planner
Plan a complex mission with:
- 6 vehicles (various weights and dimensions)
- 8 standard cargo pallets  
- 45 passengers with baggage
- Fuel for 2,500 nm mission

Calculate optimal placement for:
- CG within limits
- Balanced floor loading
- Emergency egress compliance
- Weight distribution efficiency

## Simulation 2: CG Envelope Explorer
Interactive graph showing:
- CG limits for different configurations
- Real-time CG calculation as cargo is moved
- Visual representation of MAC percentage
- Warning indicators for limit violations

## Simulation 3: Mission Modification Trainer
Start with base load plan, then accommodate:
- Last-minute cargo additions
- Passenger count changes
- Fuel load adjustments
- Equipment substitutions

## Simulation 4: Performance Impact Calculator
Adjust weight and CG to observe effects on:
- Takeoff and landing distances
- Climb performance
- Fuel consumption
- Maximum altitude capability`,
    quizContent: `# Intermediate Weight & Balance Assessment

## Question 1: CG Calculation
An aircraft weighs 450,000 lbs with CG at station 1050. Adding 25,000 lbs at station 900 moves the CG to:
A) Station 1041.7
B) Station 1042.8  
C) Station 1045.3
D) Station 1048.2
**Answer: A) Station 1041.7**

## Question 2: Mixed Load Limits  
What is the maximum CG limit for mixed cargo configuration?
A) 31.0% MAC
B) 33.0% MAC
C) 35.0% MAC
D) 37.0% MAC
**Answer: B) 33.0% MAC**

## Question 3: Vehicle Loading
Maximum weight for a single wheeled vehicle on C-17:
A) 35,000 lbs
B) 40,000 lbs
C) 45,000 lbs
D) 50,000 lbs  
**Answer: B) 40,000 lbs**

## Question 4: Floor Loading
Distributing 60,000 lbs over a 12-foot section results in:
A) 125 PSF
B) 150 PSF
C) 175 PSF
D) 208 PSF
**Answer: D) 208 PSF (60,000 ÷ (12 × 24) = 208)**

## Question 5: Performance Impact
A 1% aft CG shift increases takeoff distance by:
A) 5%
B) 8%
C) 10%
D) 12%
**Answer: C) 10%**`
  },
  {
    id: "c17-advanced",
    title: "C-17 Complex Cargo Configurations",
    description: "Advanced techniques for complex cargo arrangements on C-17 aircraft",
    aircraft: "c17",
    difficulty: "advanced",
    duration: "90 minutes",
    topics: ["Mixed Cargo Types", "Oversized Equipment", "Dangerous Goods Integration"],
    objectives: [
      "Secure and transport oversized equipment safely",
      "Integrate multiple cargo types in single mission",
      "Implement special handling procedures for sensitive cargo"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-17 Complex Cargo Operations

## Oversized Cargo Handling

### Dimensional Limits
- **Length**: Up to 88 feet (full cargo bay)
- **Width**: 18 feet maximum (wall to wall)
- **Height**: 12.4 feet maximum
- **Weight**: Up to 170,900 lbs total payload

### Special Equipment Categories
**Class I - Standard Oversized**
- Single items 15,000-45,000 lbs
- Standard restraint systems adequate
- Normal loading procedures apply

**Class II - Heavy Oversized**  
- Single items 45,000-85,000 lbs
- Special restraint patterns required
- Engineering analysis needed

**Class III - Maximum Oversized**
- Single items over 85,000 lbs
- Custom restraint solutions
- Manufacturer coordination required

### Vehicle Transport Specifications
**Main Battle Tanks**
- M1A2 Abrams: 68 tons, special loading procedures
- Challenger 2: 63 tons, requires shoring
- Leopard 2: 62 tons, standard tie-down points

**Armored Vehicles**
- Bradley Fighting Vehicle: 27 tons
- Stryker: 19 tons  
- LAV-25: 14 tons

## Dangerous Goods Integration

### Classification System
**Class 1 - Explosives**
- 1.1: Mass explosion hazard
- 1.2: Projection hazard
- 1.3: Fire hazard with minor blast
- 1.4: No significant hazard
- 1.5: Very insensitive with mass explosion hazard
- 1.6: Extremely insensitive

**Class 2 - Gases**
- 2.1: Flammable gases
- 2.2: Non-flammable, non-toxic gases
- 2.3: Toxic gases

**Classes 3-9**: Flammable liquids, solids, oxidizers, toxic substances, radioactive materials, corrosives, miscellaneous

### Segregation Requirements
- **Class 1.1 from Class 1.1**: 50 feet minimum
- **Class 1 from passengers**: Prohibited
- **Class 2.3 from food**: 12 feet minimum
- **Radioactive materials**: Special isolation requirements

### Loading Restrictions
- Maximum 15,000 lbs net explosive weight
- Segregation distances strictly enforced
- Special placarding and documentation required
- Emergency response procedures mandatory

## Mixed Load Configurations

### Passenger + Cargo Combinations
**Standard Configuration**
- 102 passengers + 8 pallets
- 54 passengers + 12 pallets  
- 18 passengers + 16 pallets

**Combat Configuration**  
- 188 troops + 6 pallets
- 134 troops + 10 pallets
- 80 troops + 14 pallets

### Cargo Combination Strategies
1. **Heavy Forward, Light Aft**: Optimal CG management
2. **Bulk Distributed**: Even floor loading
3. **Priority Access**: Mission-critical items accessible
4. **Hazmat Isolated**: Dangerous goods properly segregated

## Restraint Systems

### Chain Restraints
- **Grade 70**: 11,300 lbs working load
- **Grade 80**: 12,800 lbs working load  
- **Grade 100**: 15,800 lbs working load

### Strap Systems
- **CGU-1/B**: 5,000 lbs working load
- **CGU-1/B (double)**: 10,000 lbs working load
- **Aircraft tie-down**: 25,000 lbs ultimate

### Net Systems
- **Cargo nets**: 5,000 lbs distributed load
- **Barrier nets**: 7,500 lbs concentrated load
- **Aircraft restraint nets**: 10,000 lbs working load

## Environmental Considerations

### Temperature Control
- Cargo bay heating: -40°F to +160°F capability
- Refrigerated container support
- Temperature monitoring systems
- Environmental protection protocols

### Altitude Effects
- Pressurization to 8,000 feet equivalent
- Oxygen requirements for live cargo
- Pressure-sensitive equipment considerations
- Decompression emergency procedures`,
    videoContent: `# Complex Cargo Operations Video Series

## Module 1: Oversized Equipment Loading (35 minutes)
- Tank and heavy vehicle loading procedures
- Special equipment and rigging techniques
- Multi-person coordination protocols
- Safety considerations and risk mitigation

## Module 2: Dangerous Goods Operations (30 minutes)
- Classification and segregation procedures
- Documentation and placarding requirements
- Emergency response protocols
- Real-world case studies and lessons learned

## Module 3: Mixed Load Integration (25 minutes)
- Passenger and cargo combinations
- Balancing competing requirements
- Load optimization strategies
- Mission flexibility considerations`,
    interactiveContent: `# Advanced Cargo Simulation Center

## Complex Mission Simulator
Plan and load a humanitarian relief mission:
- 8 vehicles (ambulances, trucks, generators)
- 12 pallets of medical supplies
- 4 pallets of food and water
- 65 medical personnel with equipment
- Mixed dangerous goods (medical oxygen, fuel)

Requirements:
- Maintain CG within 25-33% MAC
- Comply with all DG segregation rules
- Ensure rapid offload capability
- Optimize for 3,200 nm range

## Dangerous Goods Trainer
Interactive scenario with:
- 15 different hazmat classes represented
- Real-time segregation distance calculator
- Documentation requirement checklist
- Emergency procedure decision tree
- Violation consequence simulator

## Vehicle Loading Mastermind
Load multiple vehicle types:
- 2 M1A2 Abrams tanks (68 tons each)
- 1 M88 Recovery Vehicle (63 tons)
- Support equipment and supplies
- Calculate restraint requirements
- Verify floor loading limits
- Plan loading sequence

## Emergency Reconfiguration Challenge
Mid-flight scenario requiring:
- Cargo redistribution due to CG shift
- Medical emergency patient accommodation
- Equipment failure workarounds
- Priority cargo access modification
- Real-time decision making under pressure`,
    quizContent: `# Advanced Cargo Operations Assessment

## Question 1: Oversized Cargo Classification
A single cargo item weighing 55,000 lbs is classified as:
A) Class I - Standard Oversized
B) Class II - Heavy Oversized  
C) Class III - Maximum Oversized
D) Requires special authorization
**Answer: B) Class II - Heavy Oversized**

## Question 2: Dangerous Goods Segregation
Minimum separation between Class 1.1 explosives and Class 1.1 explosives:
A) 25 feet
B) 40 feet
C) 50 feet
D) 100 feet
**Answer: C) 50 feet**

## Question 3: Chain Restraint Capacity
Working load limit for Grade 80 chain:
A) 11,300 lbs
B) 12,800 lbs
C) 15,800 lbs
D) 18,000 lbs
**Answer: B) 12,800 lbs**

## Question 4: Mixed Load Configuration  
Maximum passengers with 12 standard pallets:
A) 48 passengers
B) 54 passengers
C) 62 passengers
D) 78 passengers
**Answer: B) 54 passengers**

## Question 5: M1A2 Abrams Specifications
Weight of M1A2 Abrams tank:
A) 62 tons
B) 65 tons  
C) 68 tons
D) 72 tons
**Answer: C) 68 tons**

## Question 6: Environmental Limits
Cargo bay temperature control range:
A) -20°F to +120°F
B) -30°F to +140°F
C) -40°F to +160°F
D) -50°F to +180°F
**Answer: C) -40°F to +160°F**`
  },
  {
    id: "c17-expert",
    title: "C-17 Tactical Loading Operations",
    description: "Expert-level tactical loading operations for C-17 in combat environments",
    aircraft: "c17",
    difficulty: "expert", 
    duration: "120 minutes",
    topics: ["Combat Loading Techniques", "Rapid Deployment", "Tactical Airlift Operations"],
    objectives: [
      "Execute rapid loading/unloading in tactical situations",
      "Plan airdrops and special mission configurations",
      "Implement emergency loading procedures"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-17 Tactical Operations Manual

## Combat Loading Procedures

### Rapid Deployment Standards
**15-Minute Combat Load**
- Pre-positioned pallets and equipment
- Optimized load sequence planning
- Multiple loading team coordination
- Real-time communication protocols

**30-Minute Full Load**
- Complete mission package loading
- Mixed cargo and personnel integration
- Final systems checks and verification
- Launch readiness confirmation

### Threat Environment Operations
**Level 1 - Permissive Environment**
- Standard procedures with security awareness
- Normal loading timelines acceptable
- Full equipment complement available

**Level 2 - Uncertain Environment**  
- Accelerated procedures implemented
- Essential equipment prioritized
- Continuous security monitoring

**Level 3 - Hostile Environment**
- Minimum time on ground protocols
- Combat loading procedures mandatory
- Emergency departure capability maintained

## Airdrop Operations

### Personnel Airdrop Configurations
**Static Line Jumpers**
- Maximum 102 personnel (full seating)
- Equipment bundles on 4 pallets maximum
- Jump doors and ramp operations
- Altitude: 800-1,250 feet AGL

**HALO/HAHO Operations**
- Maximum 64 personnel with equipment
- Specialized oxygen systems required
- Altitude: 15,000-35,000 feet MSL
- Extended flight time considerations

### Equipment Airdrop Systems
**Container Delivery System (CDS)**
- Maximum 16 bundles per aircraft
- Individual bundle weight: 2,200 lbs maximum
- Velocity: 130-150 KIAS
- Altitude: 600-1,000 feet AGL

**Low Velocity Airdrop (LVAD)**
- Platform weight: up to 42,000 lbs
- Single platform deployment
- Velocity: 130-140 KIAS  
- Altitude: 800-1,200 feet AGL

**High Velocity Airdrop (HVAD)**
- Multiple platform capability
- Platform weight: up to 60,000 lbs
- Velocity: 140-160 KIAS
- Altitude: 1,200-2,500 feet AGL

## Emergency Procedures

### In-Flight Emergencies
**Cargo Shift Emergency**
1. Immediately secure aircraft control
2. Assess cargo restraint integrity
3. Reposition or jettison as required
4. Calculate new CG and performance limits

**Fire in Cargo Compartment**
1. Don oxygen masks and protective equipment
2. Activate cargo compartment fire suppression
3. Isolate electrical systems as required
4. Prepare for emergency landing

**Decompression Emergency**
1. Emergency descent to 10,000 feet
2. Secure loose cargo and equipment
3. Check passenger oxygen systems
4. Assess structural damage

### Ground Emergencies
**Hostile Fire During Loading**
1. Immediate defensive positions
2. Protect critical personnel and equipment
3. Continue essential loading operations
4. Prepare for emergency departure

**Equipment Failure**
1. Assess mission criticality
2. Implement backup procedures
3. Modify load plan as required
4. Coordinate with maintenance personnel

## Special Mission Configurations

### Medical Evacuation (MEDEVAC)
**Patient Transport Setup**
- Litter patient capacity: 36 patients
- Ambulatory patient capacity: 54 patients
- Medical equipment integration
- Life support system requirements

**Critical Care Air Transport Team (CCATT)**
- Intensive care capability
- Specialized medical equipment
- Extended flight duration support
- Multiple patient monitoring

### Humanitarian Operations
**Disaster Relief Configuration**
- Maximum supply capacity: 18 pallets
- Rapid offload capability
- Mixed passenger/cargo operations
- Flexible mission modification

**Food Distribution Operations**
- Optimized for bulk commodities
- Rapid distribution systems
- Multiple delivery point capability
- Real-time inventory management

## Advanced Load Planning

### Mission Analysis Framework
1. **Threat Assessment**: Environmental and tactical considerations
2. **Cargo Priority Matrix**: Mission-critical vs. nice-to-have
3. **Timeline Constraints**: Loading, flight, and offload windows
4. **Resource Allocation**: Personnel, equipment, and facility requirements

### Contingency Planning
**Primary Plan**: Optimal configuration for stated mission
**Alternate Plan**: Modified configuration for changed requirements  
**Emergency Plan**: Minimum essential configuration for survival
**Abort Plan**: Safe configuration for mission termination

### Multi-Aircraft Coordination
**Formation Loading**: Synchronized operations across multiple aircraft
**Sequential Loading**: Prioritized loading based on departure sequence
**Backup Aircraft**: Redundant capability planning
**Cross-Loading**: Load distribution across multiple platforms`,
    videoContent: `# Tactical Operations Video Training

## Module 1: Combat Loading Procedures (45 minutes)
- Threat environment assessment
- Rapid loading techniques and team coordination
- Equipment positioning and restraint
- Communication protocols under stress
- Real combat loading exercises

## Module 2: Airdrop Operations (40 minutes)
- Personnel airdrop configurations and procedures
- Equipment delivery systems (CDS, LVAD, HVAD)
- Jump master coordination
- Safety procedures and emergency protocols
- Case studies from recent operations

## Module 3: Emergency Response Procedures (35 minutes)
- In-flight emergency scenarios and responses
- Ground emergency procedures
- Cargo shift and fire suppression
- Medical emergency protocols
- Decision-making under pressure training`,
    interactiveContent: `# Tactical Operations Simulation Suite

## Combat Loading Challenge
High-pressure scenario simulation:
- 20-minute countdown timer
- Incoming threat reports
- Equipment failures and delays
- Personnel injuries requiring medical attention
- Communication system disruptions
- Mission priority changes

Objectives:
- Complete mission-essential loading within time limit
- Maintain safety standards under pressure
- Adapt to changing tactical situation
- Coordinate multiple teams effectively

## Airdrop Mission Planner
Plan complex airdrop operation:
- 64 special operations personnel
- 8 vehicles (various types and weights)
- 12 equipment bundles
- Weather constraints (wind, visibility)
- Terrain considerations (mountains, urban areas)
- Enemy threat assessment

Calculate:
- Drop zone requirements
- Aircraft approach parameters
- Load sequence optimization
- Backup landing zones
- Emergency abort procedures

## Emergency Response Trainer
Real-time emergency scenarios:
- Cargo fire during flight
- Rapid decompression at altitude
- Engine failure requiring weight reduction
- Medical emergency requiring reconfiguration
- Hostile fire during ground operations

Decision points:
- Immediate action requirements
- Risk assessment and mitigation
- Mission continuation vs. abort
- Resource allocation priorities
- Communication and coordination

## Multi-Platform Coordination Simulator
Coordinate loading across 4 C-17 aircraft:
- Different departure times and routes
- Varying cargo and personnel loads
- Equipment cross-loading requirements
- Backup aircraft assignments
- Real-time mission modifications

Challenge elements:
- Weather delays affecting timeline
- Aircraft maintenance issues
- Cargo priority changes
- Personnel reassignments
- Communication system failures`,
    quizContent: `# Tactical Operations Expert Assessment

## Question 1: Combat Loading Standards
Standard time limit for 15-minute combat load:
A) 10 minutes for essential items only
B) 15 minutes for complete mission package
C) 15 minutes for pre-positioned equipment only
D) 20 minutes including final checks
**Answer: C) 15 minutes for pre-positioned equipment only**

## Question 2: HALO Operations
Maximum personnel capacity for HALO operations:
A) 48 personnel
B) 54 personnel
C) 64 personnel
D) 72 personnel
**Answer: C) 64 personnel**

## Question 3: Low Velocity Airdrop
Maximum platform weight for LVAD operations:
A) 35,000 lbs
B) 42,000 lbs
C) 50,000 lbs
D) 60,000 lbs
**Answer: B) 42,000 lbs**

## Question 4: CDS Operations
Maximum number of CDS bundles per aircraft:
A) 12 bundles
B) 14 bundles
C) 16 bundles
D) 18 bundles
**Answer: C) 16 bundles**

## Question 5: Medical Evacuation
Litter patient capacity in MEDEVAC configuration:
A) 24 patients
B) 30 patients
C) 36 patients
D) 42 patients
**Answer: C) 36 patients**

## Question 6: Emergency Descent
Target altitude for emergency decompression descent:
A) 8,000 feet
B) 10,000 feet
C) 12,000 feet
D) 15,000 feet
**Answer: B) 10,000 feet**

## Question 7: Threat Levels
Level 3 threat environment is characterized by:
A) Permissive environment with security awareness
B) Uncertain environment with accelerated procedures
C) Hostile environment with minimum ground time
D) Extreme threat requiring immediate evacuation
**Answer: C) Hostile environment with minimum ground time**`
  },
  
  // C-130 Modules
  {
    id: "c130-basics",
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
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
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
**Answer: C) 250 PSF**`
  },
  {
    id: "c130-intermediate",
    title: "C-130 Load Planning Essentials",
    description: "Intermediate training on C-130 load planning and configuration",
    aircraft: "c130",
    difficulty: "intermediate",
    duration: "60 minutes",
    topics: ["Load Planning", "Weight Distribution", "Mixed Load Configuration"],
    objectives: [
      "Create effective load plans for varied mission types",
      "Calculate proper weight distribution",
      "Configure the aircraft for dual-role missions"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-130 Advanced Load Planning

## Mission-Specific Configurations

### Tactical Airlift Missions
**Standard Cargo Configuration**
- 6 pallets maximum capacity
- Mixed cargo types (vehicles, supplies, equipment)
- Optimal weight distribution for short field performance
- Rapid offload capability for tactical environments

**Passenger Configuration**
- 128 troops in standard seating
- 92 paratroopers with equipment
- 74 litter patients in medical configuration
- Mixed passenger/cargo combinations

### Weight and Balance Management
**CG Envelope Calculations**
- Forward limit: 25% MAC (Critical for nose-heavy conditions)
- Aft limit: 35% MAC (Critical for tail-heavy conditions)
- Operational envelope: 27-33% MAC (Optimal performance)

**Loading Sequence Strategy**
1. **Heavy items first**: Position near aircraft CG
2. **Progressive loading**: Work from center outward
3. **Balance verification**: Check CG after each major item
4. **Final optimization**: Adjust positions for optimal performance

### Fuel Planning Integration
**Fuel System Overview**
- Main tanks: 2,300 gallons each (4 tanks)
- External tanks: 1,400 gallons each (2 optional)
- Fuel CG impact: Significant on aircraft balance
- Consumption patterns: Affects CG throughout flight

**Range vs. Payload Trade-offs**
- Maximum payload: 2,500 nm range
- Maximum range: 3,800 nm with reduced payload
- Critical decision points for mission planning
- Fuel reserve requirements for tactical operations

## Vehicle and Equipment Loading

### Vehicle Specifications
**Light Vehicles (Under 15,000 lbs)**
- HMMWV: 5,900 lbs, fits standard pallet positions
- Light Strike Vehicle: 4,800 lbs, special tie-down required
- Motorcycle/ATV: Multiple units possible

**Heavy Vehicles (15,000-30,000 lbs)**
- LAV-25: 14 tons, requires special loading procedures
- M113 APC: 11 tons, center loading mandatory
- Engineering vehicles: Case-by-case analysis

### Equipment Handling
**Palletized Loading**
- Standard 463L pallets: 10,000 lbs maximum
- Special handling pallets: 12,000 lbs maximum
- Bulk cargo pallets: Height restrictions apply

**Roll-on/Roll-off Procedures**
- Vehicle self-loading capabilities
- Ramp angle limitations: 15 degrees maximum
- Ground clearance requirements
- Turning radius considerations

## Mixed Load Configurations

### Passenger + Cargo Combinations
**75% Passenger / 25% Cargo**
- 96 passengers + 2 pallets
- Optimal for personnel movement with equipment
- Emergency egress considerations

**50% Passenger / 50% Cargo**
- 64 passengers + 4 pallets
- Balanced mission capability
- Flexible configuration options

**25% Passenger / 75% Cargo**
- 32 passengers + 5-6 pallets
- Equipment-heavy missions
- Specialist team deployment

### Performance Implications
**Takeoff Performance**
- Field length requirements increase with weight
- Temperature and altitude effects
- Obstacle clearance considerations
- Abort procedures for overweight conditions

**Landing Performance**
- Approach speed increases with weight
- Runway condition factors (wet, soft, short)
- Reverse thrust effectiveness
- Ground roll distance calculations

## Environmental Considerations

### Climate Operations
**Hot Weather Operations**
- Reduced payload capacity in high temperatures
- Engine performance degradation
- Cooling system limitations
- Crew endurance factors

**Cold Weather Operations**
- Aircraft heating requirements
- Cargo environmental protection
- Ground equipment limitations
- Ice and snow considerations

### Altitude Operations
**High Altitude Factors**
- Reduced engine performance
- Longer takeoff and landing distances
- Cargo compartment pressurization
- Oxygen requirements for personnel

**Low Altitude Factors**
- Increased fuel consumption
- Turbulence effects on cargo
- Navigation challenges
- Terrain clearance requirements`,
    videoContent: `# Advanced Load Planning Video Series

## Module 1: Mission Planning and Configuration (25 minutes)
- Mission analysis and requirements
- Configuration selection criteria
- Load planning software utilization
- Performance calculations and trade-offs

## Module 2: Vehicle and Heavy Equipment Loading (20 minutes)
- Vehicle loading procedures and safety
- Equipment restraint systems
- Special handling requirements
- Multi-vehicle configurations

## Module 3: Mixed Load Operations (15 minutes)
- Passenger and cargo combinations
- Safety considerations and procedures
- Emergency evacuation planning
- Crew coordination requirements`,
    interactiveContent: `# Advanced Load Planning Simulations

## Mission Planning Simulator
Plan complex C-130 mission:
- Destination: Remote airfield, 2,400 nm
- Cargo: 2 vehicles, 4 pallets of supplies
- Personnel: 24 specialists with equipment
- Constraints: Short runway, high altitude, hot weather

Requirements:
- Calculate fuel requirements
- Optimize cargo placement
- Verify performance limitations
- Plan alternate configurations

## Vehicle Loading Challenge
Load multiple vehicles safely:
- 1 LAV-25 (14 tons)
- 2 HMMWVs (6 tons each)
- Support equipment and supplies
- Calculate restraint requirements
- Verify CG and floor loading
- Plan loading sequence

## Mixed Configuration Optimizer
Balance competing requirements:
- 64 medical personnel
- 8 litter patients
- Medical equipment (4 pallets)
- Life support systems
- Emergency medical supplies

Optimize for:
- Patient care accessibility
- Equipment functionality
- Emergency procedures
- Weight and balance

## Performance Trade-off Analyzer
Interactive tool showing effects of:
- Weight changes on range
- CG position on handling
- Altitude on performance
- Temperature on capabilities
- Fuel load on payload`,
    quizContent: `# Intermediate Load Planning Assessment

## Question 1: CG Envelope
Optimal CG range for C-130 operations:
A) 25-30% MAC
B) 27-33% MAC
C) 30-35% MAC
D) 32-37% MAC
**Answer: B) 27-33% MAC**

## Question 2: Vehicle Loading
Maximum weight for LAV-25 vehicle:
A) 12 tons
B) 14 tons
C) 16 tons
D) 18 tons
**Answer: B) 14 tons**

## Question 3: Mixed Configuration
Maximum passengers with 4 standard pallets:
A) 48 passengers
B) 56 passengers
C) 64 passengers
D) 72 passengers
**Answer: C) 64 passengers**

## Question 4: Fuel Capacity
Total fuel capacity with external tanks:
A) 7,200 gallons
B) 8,400 gallons
C) 9,680 gallons
D) 12,080 gallons
**Answer: D) 12,080 gallons (4×2,300 + 2×1,400)**

## Question 5: Performance Factor
Primary factor affecting C-130 takeoff distance:
A) Aircraft weight only
B) Temperature only
C) Altitude only
D) Weight, temperature, and altitude combined
**Answer: D) Weight, temperature, and altitude combined**`
  },
  {
    id: "c130-advanced",
    title: "C-130 Specialized Cargo Handling",
    description: "Advanced training for specialized cargo types on C-130 aircraft",
    aircraft: "c130",
    difficulty: "advanced",
    duration: "90 minutes",
    topics: ["Special Cargo Procedures", "Airdrop Operations", "Combat Offload Techniques"],
    objectives: [
      "Prepare and secure cargo for airdrop operations",
      "Execute safe combat offload procedures",
      "Handle specialized military equipment configurations"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-130 Specialized Operations Manual

## Airdrop Operations

### Personnel Airdrop Configurations
**Static Line Jumpers**
- Maximum 64 personnel with equipment
- Door configuration: Both paratroop doors operational
- Jump altitude: 800-1,250 feet AGL
- Airspeed: 130-140 KIAS during drop

**HALO/HAHO Operations**
- Maximum 32 personnel with oxygen equipment
- Altitude range: 15,000-25,000 feet MSL
- Extended flight time considerations
- Specialized breathing apparatus required

### Equipment Airdrop Systems
**Container Delivery System (CDS)**
- Maximum 12 bundles per aircraft
- Individual bundle weight: 2,200 lbs maximum
- Velocity: 125-140 KIAS
- Altitude: 600-1,000 feet AGL
- Sequential release timing: 1-second intervals

**Low Velocity Airdrop (LVAD)**
- Platform weight: up to 20,000 lbs (C-130 limitation)
- Single platform deployment only
- Velocity: 130-140 KIAS
- Altitude: 800-1,200 feet AGL
- Parachute system: G-11/G-12 cargo chutes

**Heavy Equipment Drop**
- Maximum item weight: 35,000 lbs
- Special rigging required
- Engineering analysis mandatory
- Multiple parachute systems
- Specialized extraction procedures

## Dangerous Goods Handling

### Classification and Restrictions
**Explosive Materials (Class 1)**
- Maximum net explosive weight: 3,000 lbs
- Segregation requirements strictly enforced
- Special documentation required
- Crew protective equipment mandatory

**Hazardous Chemicals (Classes 2-9)**
- Limited quantities based on compatibility
- Special ventilation procedures
- Emergency response equipment required
- Crew training certification needed

### Loading Procedures
**Segregation Requirements**
- Class 1 explosives: Minimum 12 feet from personnel
- Flammable materials: Isolated from ignition sources
- Toxic substances: Special containment required
- Radioactive materials: Dosimeter monitoring

**Emergency Procedures**
- Spill containment protocols
- Fire suppression systems
- Evacuation procedures
- Crew protection measures

## Combat Offload Operations

### Tactical Offload Procedures
**Engine Running Offload (ERO)**
- Maximum ground time: 3 minutes
- Continuous engine operation
- Rapid cargo deployment
- Immediate departure capability

**Combat Offload**
- Hostile environment procedures
- Minimal ground exposure time
- Priority cargo identification
- Emergency departure protocols

### Equipment and Techniques
**Cargo Handling Equipment**
- 25K loader operation in tactical environment
- Manual handling procedures
- Expedient unloading techniques
- Equipment recovery and security

**Communication Procedures**
- Ground-to-air coordination
- Visual signal protocols
- Radio communication backup
- Emergency abort signals

## Special Cargo Categories

### Live Animal Transport
**Livestock Handling**
- Ventilation requirements
- Temperature control
- Feeding and watering systems
- Waste management procedures

**Military Working Dogs**
- Individual crate requirements
- Sedation protocols
- Handler accompaniment
- Emergency veterinary procedures

### Oversized Cargo
**Dimensional Limitations**
- Length: 40 feet maximum
- Width: 10.3 feet maximum
- Height: 9 feet maximum
- Weight: 42,000 lbs total

**Special Handling**
- Custom restraint systems
- Engineering analysis required
- Load distribution calculations
- Center of gravity verification

### Medical Cargo
**Blood and Organ Transport**
- Temperature control requirements
- Chain of custody procedures
- Time-critical handling
- Emergency medical protocols

**Medical Equipment**
- Fragile item protection
- Calibration considerations
- Power requirements
- Contamination prevention

## Environmental Operations

### Arctic Operations
**Cold Weather Procedures**
- Aircraft heating requirements
- Cargo protection from freezing
- Ground equipment limitations
- Personnel endurance factors

**Equipment Considerations**
- Cold weather lubricants
- Battery performance degradation
- Metal brittleness factors
- Ice formation prevention

### Desert Operations
**Hot Weather Limitations**
- Reduced payload in high temperatures
- Increased takeoff distances
- Cargo heat protection
- Crew heat stress management

**Sand and Dust Protection**
- Engine intake protection
- Cargo sealing procedures
- Equipment maintenance intervals
- Visibility considerations

### Humanitarian Operations
**Disaster Relief Configuration**
- Rapid distribution systems
- Bulk commodity handling
- Multi-drop capabilities
- Coordination with relief agencies

**Medical Evacuation**
- Litter patient configuration: 36 patients
- Medical equipment integration
- Life support systems
- Medical team accommodation

## Advanced Restraint Systems

### Chain Systems
**Grade 70 Transport Chain**
- Working load limit: 11,300 lbs
- Standard for heavy cargo
- Proper tensioning techniques
- Inspection requirements

**Aircraft Cable**
- Working load limit: 20,000 lbs
- Special applications only
- Engineering approval required
- Installation procedures

### Specialized Restraints
**Net Systems**
- Cargo nets: 5,000 lbs distributed
- Barrier nets: 7,500 lbs point load
- Installation and inspection
- Proper application techniques

**Custom Restraints**
- Designed for specific cargo
- Engineering analysis required
- Load testing procedures
- Documentation requirements`,
    videoContent: `# Specialized Operations Video Training

## Module 1: Airdrop Operations (35 minutes)
- Personnel and equipment airdrop procedures
- Rigging and safety checks
- Drop zone coordination
- Emergency procedures during drops
- Real-world airdrop examples

## Module 2: Dangerous Goods Operations (30 minutes)
- Classification and handling procedures
- Safety protocols and equipment
- Documentation requirements
- Emergency response procedures
- Case studies and lessons learned

## Module 3: Combat and Tactical Operations (25 minutes)
- Combat offload procedures
- Tactical environment considerations
- Communication protocols
- Risk assessment and mitigation
- Mission adaptability training`,
    interactiveContent: `# Specialized Operations Training Center

## Airdrop Mission Planner
Complex airdrop scenario:
- 48 paratroopers with equipment
- 8 CDS bundles of supplies
- 1 vehicle (HMMWV) on platform
- Weather: 15-knot crosswind
- Terrain: Mountainous drop zone

Calculate:
- Drop zone requirements
- Release points and timing
- Weight and balance for each phase
- Emergency abort procedures
- Backup landing zones

## Dangerous Goods Trainer
Interactive hazmat scenario:
- 12 different hazardous materials
- Proper classification and segregation
- Documentation requirements
- Emergency response planning
- Violation consequence modeling

Tasks:
- Sort materials by compatibility
- Calculate segregation distances
- Complete shipping documentation
- Plan emergency procedures
- Assess risk factors

## Combat Offload Simulator
High-stress tactical scenario:
- Enemy activity in area
- 3-minute maximum ground time
- Priority cargo selection
- Equipment positioning
- Crew coordination under fire

Objectives:
- Identify mission-critical cargo
- Execute rapid offload procedures
- Maintain situational awareness
- Coordinate with ground forces
- Prepare for emergency departure

## Special Cargo Challenge
Handle multiple special cargo types:
- Live animals (military working dogs)
- Medical supplies (blood products)
- Oversized equipment (radar system)
- Dangerous goods (ammunition)
- Time-critical materials (organs)

Requirements:
- Plan loading sequence
- Verify environmental controls
- Calculate restraint requirements
- Develop contingency procedures
- Coordinate with specialists`,
    quizContent: `# Advanced Specialized Operations Assessment

## Question 1: CDS Operations
Maximum CDS bundles per C-130:
A) 8 bundles
B) 10 bundles
C) 12 bundles
D) 16 bundles
**Answer: C) 12 bundles**

## Question 2: LVAD Limitations
Maximum platform weight for C-130 LVAD:
A) 15,000 lbs
B) 20,000 lbs
C) 25,000 lbs
D) 30,000 lbs
**Answer: B) 20,000 lbs**

## Question 3: Explosive Materials
Maximum net explosive weight for Class 1 dangerous goods:
A) 2,000 lbs
B) 3,000 lbs
C) 4,000 lbs
D) 5,000 lbs
**Answer: B) 3,000 lbs**

## Question 4: Combat Offload
Maximum ground time for engine running offload:
A) 2 minutes
B) 3 minutes
C) 5 minutes
D) 10 minutes
**Answer: B) 3 minutes**

## Question 5: Medical Configuration
Litter patient capacity for C-130:
A) 24 patients
B) 30 patients
C) 36 patients
D) 42 patients
**Answer: C) 36 patients**

## Question 6: Grade 70 Chain
Working load limit for Grade 70 transport chain:
A) 9,800 lbs
B) 11,300 lbs
C) 13,500 lbs
D) 15,200 lbs
**Answer: B) 11,300 lbs**`
  },
  {
    id: "c130-expert",
    title: "C-130 Master Loadmaster Operations",
    description: "Expert level training for C-130 loadmasters in complex operations",
    aircraft: "c130",
    difficulty: "expert",
    duration: "120 minutes",
    topics: ["Complex Mission Planning", "Tactical Loading", "Multi-Drop Operations"],
    objectives: [
      "Plan and execute multi-drop missions",
      "Coordinate complex loading operations",
      "Implement contingency procedures for mission changes"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15",
    readingContent: `# C-130 Master Loadmaster Operations Manual

## Advanced Mission Planning

### Multi-Drop Mission Coordination
**Sequential Drop Operations**
- Multiple drop zones per mission
- Cargo reconfiguration between drops
- Timing and coordination requirements
- Navigation and communication protocols

**Mission Profile Analysis**
- Route planning and optimization
- Fuel consumption calculations
- Weather impact assessment
- Threat environment evaluation
- Alternative route planning

### Complex Load Configurations
**Multi-Phase Loading**
- Phase 1: Long-range cargo (secured for entire mission)
- Phase 2: Intermediate drops (accessible for offload)
- Phase 3: Final destination cargo (optimized position)
- Emergency cargo (accessible throughout mission)

**Load Reconfiguration Procedures**
- In-flight cargo movement protocols
- Safety considerations during reconfiguration
- Crew coordination requirements
- Weight and balance monitoring
- Emergency procedures during reconfiguration

## Tactical Operations Mastery

### Special Operations Support
**SOCOM Mission Requirements**
- Covert insertion/extraction operations
- Specialized equipment and vehicles
- Time-critical delivery windows
- Stealth and noise considerations
- Rapid departure capabilities

**Joint Operations Coordination**
- Multi-service mission integration
- Communication protocols
- Command and control procedures
- Coordination with ground forces
- Air-to-air coordination requirements

### Combat Environment Operations
**Threat Assessment and Mitigation**
- Surface-to-air missile (SAM) threats
- Small arms fire exposure
- Electronic warfare considerations
- Countermeasures deployment
- Escape and evasion procedures

**Tactical Approach Procedures**
- Low-level navigation techniques
- Terrain masking utilization
- Formation flying considerations
- Communication discipline
- Emergency abort procedures

## Advanced Airdrop Operations

### Precision Airdrop Systems
**Joint Precision Airdrop System (JPADS)**
- GPS-guided parachute systems
- Accuracy requirements: 50-meter CEP
- Weather compensation algorithms
- Real-time tracking capabilities
- Recovery procedures

**Containerized Delivery System (CDS) Advanced**
- Sequential release programming
- Wind compensation calculations
- Drop pattern optimization
- Impact zone safety procedures
- Equipment recovery operations

### Heavy Equipment Airdrop
**Vehicle Airdrop Procedures**
- HMMWV airdrop configuration
- All-terrain vehicle (ATV) multi-drop
- Engineering equipment deployment
- Rigging inspection requirements
- Ground recovery coordination

**Platform Extraction Systems**
- Low Altitude Parachute Extraction System (LAPES)
- Ground Proximity Extraction System (GPES)
- Container Delivery System variations
- Safety procedures and limitations
- Equipment maintenance requirements

## Emergency Operations Management

### In-Flight Emergency Procedures
**Cargo Fire Emergency**
1. Immediate crew actions and communication
2. Fire suppression system activation
3. Cabin pressurization considerations
4. Emergency descent procedures
5. Diversion planning and execution

**Cargo Shift Emergency**
1. Aircraft control and stabilization
2. Cargo assessment and securing
3. Weight and balance recalculation
4. Performance limitation assessment
5. Emergency landing preparation

**Decompression Emergency**
1. Immediate oxygen procedures
2. Emergency descent execution
3. Cargo securing and assessment
4. Passenger safety management
5. Diversion and landing procedures

### Ground Emergency Procedures
**Hostile Fire During Operations**
1. Immediate defensive procedures
2. Critical cargo prioritization
3. Expedited loading/offloading
4. Crew protection protocols
5. Emergency departure procedures

**Equipment Failure Management**
1. Backup procedure implementation
2. Mission modification planning
3. Alternative equipment utilization
4. Maintenance coordination
5. Mission continuation assessment

## Leadership and Training

### Crew Resource Management
**Team Leadership Principles**
- Situational awareness maintenance
- Decision-making under pressure
- Communication effectiveness
- Workload distribution
- Error prevention and management

**Training and Mentorship**
- Junior loadmaster development
- Standard operating procedure (SOP) enforcement
- Safety culture promotion
- Continuous improvement processes
- Knowledge transfer protocols

### Quality Assurance
**Mission Planning Review**
- Load plan verification procedures
- Safety assessment protocols
- Regulatory compliance checking
- Risk mitigation planning
- Contingency procedure development

**Post-Mission Analysis**
- Performance evaluation metrics
- Lesson learned identification
- Procedure improvement recommendations
- Training requirement updates
- Safety incident reporting

## Advanced Systems Integration

### Load Planning Software Mastery
**Advanced CAPS Utilization**
- Complex scenario modeling
- Multi-phase mission planning
- Performance optimization algorithms
- Risk assessment integration
- Real-time modification capabilities

**Manual Calculation Proficiency**
- Backup calculation procedures
- Verification methodologies
- Error checking protocols
- Quick estimation techniques
- Field expedient methods

### Communication Systems
**Advanced Radio Procedures**
- Multi-frequency coordination
- Secure communication protocols
- International aviation standards
- Emergency communication procedures
- Backup communication methods

**Data Link Integration**
- Real-time mission updates
- Weather information integration
- Threat information sharing
- Navigation data coordination
- Mission modification protocols

## Specialized Mission Types

### Humanitarian Operations
**Disaster Relief Coordination**
- International relief agency coordination
- Multi-national operation procedures
- Cultural sensitivity considerations
- Language barrier management
- Local authority coordination

**Medical Evacuation Leadership**
- Medical team coordination
- Patient care integration
- Equipment compatibility verification
- Flight medical procedures
- Emergency medical protocols

### Special Mission Requirements
**VIP Transport Operations**
- Security protocol compliance
- Special handling requirements
- Communication restrictions
- Route security considerations
- Emergency evacuation procedures

**Scientific Mission Support**
- Research equipment handling
- Environmental control requirements
- Data protection protocols
- Scientific team coordination
- Specialized cargo considerations`,
    videoContent: `# Master Loadmaster Video Training Series

## Module 1: Advanced Mission Planning (45 minutes)
- Multi-drop mission coordination
- Complex load configuration planning
- Risk assessment and mitigation
- Contingency planning procedures
- Leadership decision-making scenarios

## Module 2: Tactical Operations Leadership (40 minutes)
- Special operations support procedures
- Combat environment decision-making
- Crew resource management
- Emergency leadership protocols
- Real-world case study analysis

## Module 3: Advanced Airdrop Operations (35 minutes)
- Precision airdrop system operation
- Heavy equipment drop procedures
- Weather compensation techniques
- Safety management protocols
- Recovery operation coordination`,
    interactiveContent: `# Master Loadmaster Training Simulation Suite

## Multi-Drop Mission Commander
Lead complex 8-hour mission:
- 4 different drop zones
- Mixed cargo and personnel
- Weather complications
- Equipment failures
- Route modifications
- Fuel management decisions

Responsibilities:
- Mission planning and execution
- Crew coordination and leadership
- Real-time decision making
- Emergency response management
- Post-mission analysis

## Combat Operations Decision Trainer
High-stress scenario simulation:
- Hostile environment insertion
- Equipment malfunction during approach
- Injured crew member
- Mission priority changes
- Limited communication
- Time-critical decisions

Leadership challenges:
- Crew safety vs. mission success
- Resource allocation decisions
- Risk assessment under pressure
- Communication management
- Contingency plan execution

## Emergency Response Leadership
Multiple simultaneous emergencies:
- Cargo fire during flight
- Partial decompression
- Engine failure indication
- Hostile fire on ground
- Injured passengers
- Communication system failure

Test abilities:
- Priority management
- Crew coordination
- Passenger safety
- Mission continuation decisions
- Emergency procedure execution

## Advanced Airdrop Coordinator
Plan and execute precision airdrop:
- Multiple aircraft coordination
- Sequential drop timing
- Weather delay management
- Ground force coordination
- Equipment tracking
- Recovery operations

Master coordination of:
- Multi-platform operations
- Real-time communication
- Weather impact assessment
- Safety protocol enforcement
- Mission success evaluation`,
    quizContent: `# Master Loadmaster Expert Assessment

## Question 1: JPADS Accuracy
Required accuracy for Joint Precision Airdrop System:
A) 25-meter CEP
B) 50-meter CEP
C) 75-meter CEP
D) 100-meter CEP
**Answer: B) 50-meter CEP**

## Question 2: Multi-Drop Planning
Primary consideration for multi-drop mission cargo arrangement:
A) Weight distribution only
B) Accessibility for each drop zone
C) Fuel consumption optimization
D) Crew convenience
**Answer: B) Accessibility for each drop zone**

## Question 3: Emergency Priorities
During cargo fire emergency, first priority after crew actions:
A) Cargo preservation
B) Mission continuation
C) Aircraft and passenger safety
D) Equipment protection
**Answer: C) Aircraft and passenger safety**

## Question 4: Combat Operations
Maximum acceptable risk level for hostile environment operations:
A) Minimal risk acceptable
B) Moderate risk with mitigation
C) High risk if mission critical
D) Risk level determined by mission commander
**Answer: D) Risk level determined by mission commander**

## Question 5: Crew Resource Management
Most critical element of effective crew leadership:
A) Technical knowledge
B) Communication skills
C) Situational awareness
D) All elements equally important
**Answer: D) All elements equally important**

## Question 6: LAPES Operations
Low Altitude Parachute Extraction System altitude:
A) 5-10 feet AGL
B) 10-15 feet AGL
C) 15-20 feet AGL
D) 20-25 feet AGL
**Answer: A) 5-10 feet AGL**

## Question 7: Mission Modification
Authority required for major mission modification during flight:
A) Aircraft commander only
B) Mission commander approval
C) Ground control authorization
D) Crew consensus decision
**Answer: B) Mission commander approval**`
  },
  
  // KC30A Modules
  {
    id: "kc30a-basics",
    title: "KC30-A Airbus Cargo Basics",
    description: "Introduction to KC30-A cargo loading fundamentals",
    aircraft: "kc30a",
    difficulty: "beginner",
    duration: "45 minutes",
    topics: ["Aircraft Configuration", "ULD Management", "Weight in Kilograms"],
    objectives: [
      "Understand KC30-A unique cargo systems",
      "Properly plan loads using kg measurements",
      "Learn LD3 container and pallet positioning"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "kc30a-intermediate",
    title: "KC30-A Mixed Operations",
    description: "Intermediate level training for mixed cargo/passenger/fuel operations",
    aircraft: "kc30a",
    difficulty: "intermediate",
    duration: "60 minutes",
    topics: ["Dual-Role Operations", "Passenger Cargo Mix", "Fuel Considerations"],
    objectives: [
      "Configure aircraft for mixed passenger/cargo operations",
      "Calculate weight balance with variable fuel loads",
      "Optimize cargo arrangement for dual-role missions"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "kc30a-advanced",
    title: "KC30-A Advanced Configuration Management",
    description: "Advanced KC30-A configuration and cargo management",
    aircraft: "kc30a",
    difficulty: "advanced",
    duration: "90 minutes",
    topics: ["Configuration Changes", "Long-Range Operations", "Cargo System Troubleshooting"],
    objectives: [
      "Plan configuration changes during deployed operations",
      "Optimize loading for extended range missions",
      "Troubleshoot and resolve cargo system issues"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "kc30a-expert",
    title: "KC30-A Operations Management",
    description: "Expert level KC30-A operations and cargo management",
    aircraft: "kc30a",
    difficulty: "expert",
    duration: "120 minutes",
    topics: ["Complete Aircraft Management", "Mission Replanning", "System Integration"],
    objectives: [
      "Manage complete aircraft loading operations",
      "Implement rapid reconfiguration procedures",
      "Integrate with aerial refueling mission requirements"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  
  // C-27J Modules
  {
    id: "c27j-basics",
    title: "C-27J Spartan Fundamentals",
    description: "Introduction to C-27J cargo loading basics",
    aircraft: "c27j",
    difficulty: "beginner",
    duration: "30 minutes",
    topics: ["Aircraft Overview", "Basic Loading", "Small Configuration Management"],
    objectives: [
      "Understand C-27J cargo area layout and limitations",
      "Learn proper tie-down and securing techniques",
      "Configure aircraft for basic cargo missions"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "c27j-intermediate",
    title: "C-27J Tactical Operations",
    description: "Intermediate tactical loading for C-27J operations",
    aircraft: "c27j",
    difficulty: "intermediate",
    duration: "45 minutes",
    topics: ["Tactical Loading", "Short Field Operations", "Rapid Reconfiguration"],
    objectives: [
      "Execute loading plans for tactical operations",
      "Prepare aircraft for short field operations",
      "Perform rapid cargo-to-personnel conversions"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "c27j-advanced",
    title: "C-27J Multi-Mission Configuration",
    description: "Advanced training for C-27J multi-mission configurations",
    aircraft: "c27j",
    difficulty: "advanced",
    duration: "60 minutes",
    topics: ["Multi-Role Operations", "Medevac Configuration", "Special Mission Support"],
    objectives: [
      "Configure aircraft for medevac operations",
      "Support special mission requirements",
      "Implement rapid role change procedures"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "c27j-expert",
    title: "C-27J Master Operations",
    description: "Expert level C-27J operational management",
    aircraft: "c27j",
    difficulty: "expert",
    duration: "90 minutes",
    topics: ["Complete Platform Management", "Austere Field Operations", "Mission Command"],
    objectives: [
      "Plan complete aircraft utilization for austere operations",
      "Manage loading operations in forward locations",
      "Coordinate multiple mission types in single deployment"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  
  // Multi-Aircraft Cross-Training Modules
  {
    id: "multi-dg-handling",
    title: "Multi-Aircraft Dangerous Goods Procedures", 
    description: "Comprehensive dangerous goods handling across all aircraft types",
    aircraft: "all",
    difficulty: "advanced",
    duration: "75 minutes",
    topics: ["DG Classification", "Aircraft-Specific Requirements", "Emergency Procedures"],
    objectives: [
      "Apply DG regulations across all aircraft platforms",
      "Implement aircraft-specific DG procedures", 
      "Execute emergency response protocols"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "multi-weight-balance",
    title: "Universal Weight & Balance Principles",
    description: "Weight and balance fundamentals applicable to all aircraft",
    aircraft: "all", 
    difficulty: "intermediate",
    duration: "90 minutes",
    topics: ["Universal Principles", "CG Calculations", "Load Distribution"],
    objectives: [
      "Master weight and balance principles across platforms",
      "Calculate center of gravity for any aircraft type",
      "Optimize load distribution for mission effectiveness"
    ],
    isActive: true,
    createdBy: "System", 
    lastModified: "2025-01-15"
  },
  {
    id: "emergency-procedures",
    title: "Emergency Response Procedures",
    description: "Critical emergency procedures for all loadmaster operations",
    aircraft: "all",
    difficulty: "expert",
    duration: "60 minutes", 
    topics: ["Emergency Response", "Cargo Fire Procedures", "In-Flight Emergencies"],
    objectives: [
      "Execute emergency cargo procedures",
      "Respond to in-flight emergency situations",
      "Coordinate with aircrew during emergencies"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  },
  {
    id: "leadership-training",
    title: "Loadmaster Leadership Development",
    description: "Leadership skills for senior loadmasters and instructors", 
    aircraft: "all",
    difficulty: "expert",
    duration: "120 minutes",
    topics: ["Team Leadership", "Training Development", "Operational Planning"],
    objectives: [
      "Develop leadership skills for loadmaster operations",
      "Create effective training programs",
      "Lead complex multi-aircraft operations"
    ],
    isActive: true,
    createdBy: "System",
    lastModified: "2025-01-15"
  }
];

// Difficulty color mapping
const difficultyColors: Record<DifficultyLevel, string> = {
  beginner: "bg-green-500/20 text-green-500 border-green-500/30",
  intermediate: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  advanced: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  expert: "bg-red-500/20 text-red-500 border-red-500/30"
};

// Difficulty stars mapping
const difficultyStars: Record<DifficultyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4
};

export default function TrainingModulesManagement() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);

  // Fetch training modules from API
  const { data: trainingModules = [], refetch: refetchModules, isLoading } = useQuery({
    queryKey: ['/api/training-modules'],
    queryFn: async () => {
      const response = await fetch('/api/training-modules');
      if (!response.ok) throw new Error('Failed to fetch training modules');
      return response.json();
    },
  });

  // Create module mutation
  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await fetch('/api/training-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData),
      });
      if (!response.ok) throw new Error('Failed to create module');
      return response.json();
    },
    onSuccess: () => {
      refetchModules();
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Training module created successfully.",
      });
    },
  });

  // Edit module mutation
  const editModuleMutation = useMutation({
    mutationFn: async (moduleData: any) => {
      const response = await fetch(`/api/training-modules/${selectedModule?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData),
      });
      if (!response.ok) throw new Error('Failed to update module');
      return response.json();
    },
    onSuccess: () => {
      refetchModules();
      setIsEditDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Training module updated successfully.",
      });
    },
  });

  // Delete module mutation
  const deleteModuleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/training-modules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete module');
    },
    onSuccess: () => {
      refetchModules();
      toast({
        title: "Success",
        description: "Training module deleted successfully.",
      });
    },
  });
  interface FormData {
    title: string;
    description: string;
    aircraft: string;
    difficulty: DifficultyLevel;
    duration: string;
    topicsString: string;
    objectivesString: string;
    content: string;
    videoUrl: string;
    isActive: boolean;
    // Enhanced content sections
    overviewContent: string;
    readingContent: string;
    interactiveContent: string;
    videoContent: string;
    quizContent: string;
    videoUrls: string[];
    learningObjectives: string[];
    prerequisites: string;
    resources: string;
  }

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    aircraft: "c17",
    difficulty: "beginner",
    duration: "",
    topicsString: "",
    objectivesString: "",
    content: "",
    videoUrl: "",
    isActive: true,
    overviewContent: "",
    readingContent: "",
    interactiveContent: "",
    videoContent: "",
    quizContent: "",
    videoUrls: [],
    learningObjectives: [],
    prerequisites: "",
    resources: ""
  });

  // Video upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [videoTitles, setVideoTitles] = useState<string[]>(["", "", ""]);
  const [videoDescriptions, setVideoDescriptions] = useState<string[]>(["", "", ""]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video upload related state

  // Filter modules based on selected aircraft and squadron
  const filteredModules = activeTab === "all" 
    ? trainingModules 
    : activeTab === "all-aircraft" 
    ? trainingModules.filter((module: any) => module.aircraft === "all")
    : trainingModules.filter((module: any) => module.aircraft === activeTab);

  const handleCreateModule = () => {
    const newModule: TrainingModule = {
      id: `${formData.aircraft}-${Date.now()}`,
      title: formData.title || "",
      description: formData.description || "",
      aircraft: formData.aircraft || "c17",
      difficulty: formData.difficulty || "beginner",
      duration: formData.duration || "",
      topics: (formData.topicsString || "").split(",").map(t => t.trim()).filter(Boolean),
      objectives: (formData.objectivesString || "").split(",").map(o => o.trim()).filter(Boolean),
      content: formData.content || "",
      videoUrl: formData.videoUrl || "",
      createdBy: "Current User",
      lastModified: new Date().toISOString().split('T')[0],
      isActive: true
    };

    // Use API mutation instead of local state
    setIsCreateDialogOpen(false);
    resetForm();
    
    toast({
      title: "Module Created",
      description: `Training module "${newModule.title}" has been created successfully.`,
    });
  };

  const handleEditModule = () => {
    if (!selectedModule) return;

    const updatedModule: TrainingModule = {
      ...selectedModule,
      title: formData.title,
      description: formData.description,
      aircraft: formData.aircraft,
      difficulty: formData.difficulty,
      duration: formData.duration,
      topics: formData.topicsString.split(",").map(t => t.trim()).filter(Boolean),
      objectives: formData.objectivesString.split(",").map(o => o.trim()).filter(Boolean),
      content: formData.content,
      videoUrl: formData.videoUrl,
      isActive: formData.isActive,
      lastModified: new Date().toISOString().split('T')[0]
    };

    // Use API mutation instead of local state
    setIsEditDialogOpen(false);
    setSelectedModule(null);
    resetForm();
    
    toast({
      title: "Module Updated",
      description: `Training module "${updatedModule.title}" has been updated successfully.`,
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    if (confirm("Are you sure you want to delete this training module?")) {
      setLocalModules(prev => prev.filter(module => module.id !== moduleId));
      
      toast({
        title: "Success",
        description: "Training module deleted successfully.",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      aircraft: "c17",
      difficulty: "beginner",
      duration: "",
      topicsString: "",
      objectivesString: "",
      content: "",
      videoUrl: "",
      isActive: true,
      overviewContent: "",
      readingContent: "",
      interactiveContent: "",
      videoContent: "",
      quizContent: "",
      videoUrls: [],
      learningObjectives: [],
      prerequisites: "",
      resources: ""
    });
    setSelectedFiles([]);
    setVideoTitles(["", "", ""]);
    setVideoDescriptions(["", "", ""]);
  };

  // Video upload mutation
  const uploadVideosMutation = useMutation({
    mutationFn: async ({ moduleId, files, titles, descriptions }: {
      moduleId: number;
      files: File[];
      titles: string[];
      descriptions: string[];
    }) => {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append('videos', file);
      });
      
      titles.forEach((title, index) => {
        formData.append('videoTitles', title);
      });
      
      descriptions.forEach((description, index) => {
        formData.append('videoDescriptions', description);
      });

      const response = await fetch(`/api/training-modules/${moduleId}/videos`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload videos');
      }

      return response.json();
    },
    onSuccess: () => {
      setSelectedFiles([]);
      setVideoTitles(["", "", ""]);
      setVideoDescriptions(["", "", ""]);
      setIsUploading(false);
      setUploadProgress(0);
      queryClient.invalidateQueries({ 
        queryKey: ['/api/training-modules', selectedModule?.id, 'videos'] 
      });
      toast({
        title: "Success",
        description: "Videos uploaded successfully!",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch videos for selected module
  const { data: moduleVideos } = useQuery({
    queryKey: ['/api/training-modules', selectedModule?.id, 'videos'],
    queryFn: async () => {
      if (!selectedModule?.id || selectedModule.id === "undefined") return [];
      const moduleIdNum = parseInt(selectedModule.id);
      if (isNaN(moduleIdNum)) return [];
      const response = await fetch(`/api/training-modules/${moduleIdNum}/videos`);
      if (!response.ok) throw new Error('Failed to fetch videos');
      return response.json();
    },
    enabled: !!selectedModule?.id && selectedModule.id !== "undefined" && !isNaN(parseInt(selectedModule.id)) && isEditDialogOpen,
  });

  const openEditDialog = (module: any) => {
    setSelectedModule(module);
    setFormData({
      title: module.title,
      description: module.description,
      aircraft: module.aircraft,
      difficulty: module.difficulty,
      duration: module.duration,
      topicsString: module.topics.join(", "),
      objectivesString: module.objectives.join(", "),
      content: module.content || "",
      videoUrl: module.videoUrl || "",
      isActive: module.isActive,
      overviewContent: module.content || "",
      readingContent: "",
      interactiveContent: "",
      videoContent: "",
      quizContent: "",
      videoUrls: module.videoUrl ? [module.videoUrl] : [],
      learningObjectives: module.objectives,
      prerequisites: "",
      resources: ""
    });
    setIsEditDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Training Module Management | Instructors Portal</title>
        <meta name="description" content="Create and manage aircraft-specific training modules for loadmaster training" />
      </Helmet>

      <div className="container mx-auto px-4 py-8 mb-16">
        <div className="max-w-6xl mx-auto">
          
          {/* Header Section */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/instructors-portal')}
                className="p-2 -ml-2"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Instructors Portal
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-7 w-7 text-orange-500" />
                  <h1 className="text-3xl font-bold text-foreground">
                    Training Module Management
                  </h1>
                </div>
                <p className="text-muted-foreground max-w-3xl">
                  Create, edit, and manage aircraft-specific training modules. Organize content by squadron preferences and difficulty levels to provide comprehensive loadmaster training.
                </p>
              </div>
              
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Training Module</DialogTitle>
                    <DialogDescription>
                      Create a new aircraft-specific training module with content and assessments.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Module Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter module title"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter module description"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="aircraft">Aircraft Type</Label>
                        <Select 
                          value={formData.aircraft} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, aircraft: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select aircraft" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="c17">C-17 Globemaster</SelectItem>
                            <SelectItem value="c130">C-130 Hercules</SelectItem>
                            <SelectItem value="kc30a">KC30-A Airbus</SelectItem>
                            <SelectItem value="c27j">C-27J Spartan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="difficulty">Difficulty Level</Label>
                        <Select 
                          value={formData.difficulty} 
                          onValueChange={(value: DifficultyLevel) => setFormData(prev => ({ ...prev, difficulty: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 45 minutes"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="topics">Topics (comma-separated)</Label>
                      <Input
                        id="topics"
                        value={formData.topicsString}
                        onChange={(e) => setFormData(prev => ({ ...prev, topicsString: e.target.value }))}
                        placeholder="Topic 1, Topic 2, Topic 3"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="objectives">Learning Objectives (comma-separated)</Label>
                      <Textarea
                        id="objectives"
                        value={formData.objectivesString}
                        onChange={(e) => setFormData(prev => ({ ...prev, objectivesString: e.target.value }))}
                        placeholder="Objective 1, Objective 2, Objective 3"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="videoUrl">Video URL (optional)</Label>
                      <Input
                        id="videoUrl"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                        placeholder="https://example.com/video"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateModule} className="bg-primary hover:bg-primary/90 text-white">
                      Create Module
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>

          {/* Squadron Selection Tabs */}
          <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                All Aircraft
              </TabsTrigger>
              <TabsTrigger value="c17" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                C-17 Globemaster
              </TabsTrigger>
              <TabsTrigger value="c130" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                C-130 Hercules
              </TabsTrigger>
              <TabsTrigger value="kc30a" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                KC30-A Airbus
              </TabsTrigger>
              <TabsTrigger value="c27j" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                C-27J Spartan
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredModules.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "all" ? "All aircraft" : `${activeTab.toUpperCase()} modules`}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredModules.filter((m: any) => m.isActive).length}</div>
                <p className="text-xs text-muted-foreground">Currently available</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Difficulty Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Set(filteredModules.map((m: any) => m.difficulty)).size}</div>
                <p className="text-xs text-muted-foreground">Available levels</p>
              </CardContent>
            </Card>
            
            <Card className="border-gray-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">Today</div>
                <p className="text-xs text-muted-foreground">Recent modifications</p>
              </CardContent>
            </Card>
          </div>

          {/* Module Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module: any) => (
              <Card key={module.id} className="border-gray-800 bg-card hover:bg-card/90 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`${(difficultyColors as any)[module.difficulty]} border`}>
                      {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      {' '}
                      {[...Array((difficultyStars as any)[module.difficulty])].map((_, i) => (
                        <Star key={i} className="h-3 w-3 inline ml-0.5 fill-current" />
                      ))}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-800/20 text-gray-400 border-gray-800/30">
                      {module.duration}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500/20 p-1.5 rounded-md">
                      <Plane className="h-5 w-5 text-orange-500" />
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <h4 className="text-sm font-medium mb-1.5">Topics Covered:</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {module.topics.slice(0, 3).map((topic: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-gray-800/30 text-gray-400">
                        {topic}
                      </Badge>
                    ))}
                    {module.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs bg-gray-800/30 text-gray-400">
                        +{module.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    <div>Created by: {module.createdBy}</div>
                    <div>Last modified: {module.lastModified}</div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/training-modules/${module.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(module)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteModule(module.id)}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Enhanced Full-Screen Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-xl">Edit Training Module: {selectedModule?.title}</DialogTitle>
                <DialogDescription>
                  Comprehensive content editing for all training module sections
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="overview" className="flex-1 flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="readings" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Readings
                  </TabsTrigger>
                  <TabsTrigger value="interactive" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Interactive
                  </TabsTrigger>
                  <TabsTrigger value="quizzes" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Quizzes
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-title">Module Title</Label>
                        <Input
                          id="edit-title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter module title"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter module description"
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-aircraft">Aircraft Type</Label>
                          <Select 
                            value={formData.aircraft} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, aircraft: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select aircraft" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="c17">C-17 Globemaster</SelectItem>
                              <SelectItem value="c130">C-130 Hercules</SelectItem>
                              <SelectItem value="kc30a">KC30-A Airbus</SelectItem>
                              <SelectItem value="c27j">C-27J Spartan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-difficulty">Difficulty Level</Label>
                          <Select 
                            value={formData.difficulty} 
                            onValueChange={(value: DifficultyLevel) => setFormData(prev => ({ ...prev, difficulty: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-duration">Duration</Label>
                        <Input
                          id="edit-duration"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 45 minutes"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-prerequisites">Prerequisites</Label>
                        <Textarea
                          id="edit-prerequisites"
                          value={formData.prerequisites}
                          onChange={(e) => setFormData(prev => ({ ...prev, prerequisites: e.target.value }))}
                          placeholder="Required knowledge or previous modules"
                          rows={2}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-topics">Topics (comma-separated)</Label>
                        <Textarea
                          id="edit-topics"
                          value={formData.topicsString}
                          onChange={(e) => setFormData(prev => ({ ...prev, topicsString: e.target.value }))}
                          placeholder="Topic 1, Topic 2, Topic 3"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-objectives">Learning Objectives</Label>
                        <Textarea
                          id="edit-objectives"
                          value={formData.objectivesString}
                          onChange={(e) => setFormData(prev => ({ ...prev, objectivesString: e.target.value }))}
                          placeholder="Objective 1, Objective 2, Objective 3"
                          rows={4}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-resources">Additional Resources</Label>
                        <Textarea
                          id="edit-resources"
                          value={formData.resources}
                          onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
                          placeholder="Additional learning materials, manuals, references"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-overview-content">Overview Content</Label>
                    <Textarea
                      id="edit-overview-content"
                      value={formData.overviewContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, overviewContent: e.target.value }))}
                      placeholder="Detailed overview content for this training module..."
                      rows={8}
                      className="w-full"
                    />
                  </div>
                </TabsContent>

                {/* Videos Tab */}
                <TabsContent value="videos" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-6">
                    {/* Video Upload Section */}
                    <div className="border rounded-lg p-4 bg-gray-800/50">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Direct Video Upload (Up to 3 videos)
                      </h4>
                      
                      <div className="space-y-4">
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={selectedFiles.length >= 3 || isUploading}
                            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                          >
                            <VideoIcon className="h-4 w-4 mr-2" />
                            Select Video Files ({selectedFiles.length}/3)
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              const totalFiles = selectedFiles.length + files.length;
                              if (totalFiles > 3) {
                                toast({
                                  title: "Too many files",
                                  description: "You can only upload up to 3 videos per module.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setSelectedFiles(prev => [...prev, ...files]);
                            }}
                          />
                        </div>

                        {/* Selected Files Display */}
                        {selectedFiles.length > 0 && (
                          <div className="space-y-3">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="border rounded-lg p-3 bg-gray-700 border-gray-600">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <VideoIcon className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm font-medium text-white">{file.name}</span>
                                    <span className="text-xs text-gray-400">
                                      ({Math.round(file.size / 1024 / 1024)}MB)
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="bg-gray-600 hover:bg-gray-500 text-white"
                                    onClick={() => {
                                      setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                      setVideoTitles(prev => {
                                        const newTitles = [...prev];
                                        newTitles[index] = "";
                                        return newTitles;
                                      });
                                      setVideoDescriptions(prev => {
                                        const newDescriptions = [...prev];
                                        newDescriptions[index] = "";
                                        return newDescriptions;
                                      });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label htmlFor={`video-title-${index}`} className="text-white">Video Title</Label>
                                    <Input
                                      id={`video-title-${index}`}
                                      value={videoTitles[index] || ""}
                                      onChange={(e) => {
                                        setVideoTitles(prev => {
                                          const newTitles = [...prev];
                                          newTitles[index] = e.target.value;
                                          return newTitles;
                                        });
                                      }}
                                      placeholder={`Video ${index + 1} title`}
                                      className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`video-description-${index}`} className="text-white">Description</Label>
                                    <Input
                                      id={`video-description-${index}`}
                                      value={videoDescriptions[index] || ""}
                                      onChange={(e) => {
                                        setVideoDescriptions(prev => {
                                          const newDescriptions = [...prev];
                                          newDescriptions[index] = e.target.value;
                                          return newDescriptions;
                                        });
                                      }}
                                      placeholder="Brief description of video content"
                                      className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {selectedFiles.length > 0 && (
                              <Button
                                type="button"
                                onClick={() => {
                                  if (!selectedModule?.id || selectedModule.id === "undefined") {
                                    toast({
                                      title: "Error",
                                      description: "Please save the module first before uploading videos.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const moduleIdNum = parseInt(selectedModule.id);
                                  if (isNaN(moduleIdNum)) {
                                    toast({
                                      title: "Error",
                                      description: "Invalid module ID. Please try again.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  setIsUploading(true);
                                  uploadVideosMutation.mutate({
                                    moduleId: moduleIdNum,
                                    files: selectedFiles,
                                    titles: videoTitles.slice(0, selectedFiles.length),
                                    descriptions: videoDescriptions.slice(0, selectedFiles.length),
                                  });
                                }}
                                disabled={isUploading || selectedFiles.length === 0}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                {isUploading ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                    Uploading Videos...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload {selectedFiles.length} Video{selectedFiles.length > 1 ? 's' : ''}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Existing Videos Display */}
                    {moduleVideos && moduleVideos.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-4 flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Uploaded Videos ({moduleVideos.length}/3)
                        </h4>
                        <div className="space-y-3">
                          {moduleVideos.map((video: any, index: number) => (
                            <div key={video.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border border-gray-600">
                              <div className="flex items-center gap-3">
                                <VideoIcon className="h-5 w-5 text-orange-500" />
                                <div>
                                  <p className="font-medium text-white">{video.videoTitle}</p>
                                  <p className="text-sm text-gray-300">{video.videoDescription}</p>
                                  <p className="text-xs text-gray-400">
                                    Uploaded by {video.uploadedBy?.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                                  onClick={() => {
                                    window.open(`/api/training-modules/videos/stream/${video.id}`, '_blank');
                                  }}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="bg-gray-600 border-gray-500 text-white hover:bg-gray-500"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this video?')) {
                                      fetch(`/api/training-modules/videos/${video.id}`, {
                                        method: 'DELETE',
                                      }).then(() => {
                                        toast({
                                          title: "Success",
                                          description: "Video deleted successfully.",
                                        });
                                        queryClient.invalidateQueries({ 
                                          queryKey: ['/api/training-modules', selectedModule?.id?.toString(), 'videos'] 
                                        });
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor="edit-video-content">Video Content Description</Label>
                      <Textarea
                        id="edit-video-content"
                        value={formData.videoContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoContent: e.target.value }))}
                        placeholder="Describe the video content, key points covered, and learning outcomes..."
                        rows={6}
                      />
                    </div>
                    
                    <div className="bg-gray-800/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Video Upload Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Maximum file size: 100MB per video</li>
                        <li>• Supported formats: MP4, WebM, MOV, AVI</li>
                        <li>• Up to 3 videos per training module</li>
                        <li>• Include descriptive titles and descriptions</li>
                        <li>• Ensure videos are accessible and professional quality</li>
                        <li>• Videos will be stored securely on the server</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Readings Tab */}
                <TabsContent value="readings" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-reading-content">Reading Material Content</Label>
                      <Textarea
                        id="edit-reading-content"
                        value={formData.readingContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, readingContent: e.target.value }))}
                        placeholder="Enter comprehensive reading material content. Use markdown formatting for structure..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="bg-gray-800/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Reading Content Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Use clear headings and subheadings</li>
                        <li>• Include relevant diagrams and illustrations references</li>
                        <li>• Reference official military publications when applicable</li>
                        <li>• Structure content progressively from basic to advanced concepts</li>
                        <li>• Include real-world examples and case studies</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Interactive Tab */}
                <TabsContent value="interactive" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-interactive-content">Interactive Content</Label>
                      <Textarea
                        id="edit-interactive-content"
                        value={formData.interactiveContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, interactiveContent: e.target.value }))}
                        placeholder="Define interactive exercises, simulations, drag-and-drop activities, or hands-on practice scenarios..."
                        rows={12}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-800/20 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Interactive Types:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Load planning simulations</li>
                          <li>• Weight & balance calculators</li>
                          <li>• Drag-and-drop cargo exercises</li>
                          <li>• 3D aircraft visualization</li>
                          <li>• Safety procedure walkthroughs</li>
                        </ul>
                      </div>
                      
                      <div className="bg-gray-800/20 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Implementation Notes:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Ensure mobile compatibility</li>
                          <li>• Include progress tracking</li>
                          <li>• Provide immediate feedback</li>
                          <li>• Allow multiple attempts</li>
                          <li>• Save progress automatically</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes" className="flex-1 space-y-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-quiz-content">Quiz Content & Questions</Label>
                      <Textarea
                        id="edit-quiz-content"
                        value={formData.quizContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, quizContent: e.target.value }))}
                        placeholder="Define quiz questions, multiple choice options, correct answers, and explanations..."
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="bg-gray-800/20 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Quiz Format Example:</h4>
                      <pre className="text-xs text-muted-foreground bg-gray-900/50 p-3 rounded overflow-x-auto">
{`Question 1: What is the maximum cargo weight for C-17?
A) 170,900 lbs
B) 169,000 lbs  
C) 171,000 lbs
D) 168,500 lbs
Correct: A
Explanation: The C-17 maximum payload is 170,900 lbs...

Question 2: Which pallet position affects CG most?
A) Position 1
B) Position 2
C) Position 3
D) Position 4
Correct: A
Explanation: Forward positions have greater impact...`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                  Cancel
                </Button>
                <Button onClick={handleEditModule} className="bg-primary hover:bg-primary/90 text-white">
                  Update Training Module
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}