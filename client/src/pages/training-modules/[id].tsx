import { useState, useEffect, useRef } from 'react'
import { useRoute, useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle2, PlayCircle, Download, GraduationCap, Clock, Users, Star, Plane, BookOpen, Target, Award, FileText, FileCheck, AlertCircle, Check, X } from "lucide-react"
import { downloadModulePDF } from "@/lib/pdf-download"
import { useToast } from "@/hooks/use-toast"
import { useQuery } from '@tanstack/react-query'
import { useIsolatedAuth } from "@/auth-isolated/auth-context"
import C17CargoBayLayout from "./reading-content/c17-cargo-bay-layout"
import C17WeightBalance from "./reading-content/c17-weight-balance"
import C130CargoConfigurations from "./reading-content/c130-cargo-configurations"
import KC30ACargoBaySystems from "./reading-content/kc30a-cargo-systems"
import C27JOperations from "./reading-content/c27j-operations"
import { getDynamicReadingJSX } from "./reading-content/dynamic-content"

// Video player using the placeholder training video
const TrainingVideoPlayer = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-lg border border-gray-700 overflow-hidden bg-black">
    <video
      controls
      className="w-full aspect-video"
      src="/videos/placeholder.mp4"
      preload="metadata"
    >
      Your browser does not support video playback.
    </video>
    <div className="p-4 bg-gray-900/60">
      <h4 className="text-base font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
)

// Local training modules data (fallback)
const trainingModules = [
  {
    id: "c17-basics",
    title: "C-17 Basics",
    aircraft: "C-17 Globemaster III",
    difficulty: "Beginner",
    duration: "2 hours",
    description: "Learn the fundamentals of C-17 Globemaster III loadmaster operations",
    objectives: ["Understanding aircraft capabilities", "Basic loading procedures", "Safety protocols"],
    prerequisites: "None",
    instructor: "Loadmaster Instructor",
    lastUpdated: "2024-01-15"
  }
]

// Aircraft configurations for display
const aircraftConfigs = {
  "c17-basics": { name: "C-17 Globemaster III", type: "Strategic Airlift" },
  "c130-basics": { name: "C-130 Hercules", type: "Tactical Airlift" },
  "kc30a-basics": { name: "KC30-A MRTT", type: "Multi-Role Tanker" },
  "c27j-basics": { name: "C-27J Spartan", type: "Tactical Airlift" }
}

// Clean module contents without duplicates
const moduleContents: Record<string, any[]> = {
  "c17-basics": [
    {
      id: "c17-basics-1",
      title: "C-17 Globemaster III Overview",
      type: "video",
      duration: "20 min",
      description: "Introduction to the C-17 Globemaster III aircraft and its cargo capabilities",
      content: "Video content would be embedded here",
      completed: false
    },
    {
      id: "c17-cargo-bay-layout",
      title: "C-17 Cargo Bay Layout and Features",
      type: "reading",
      duration: "15 min",
      description: "Detailed study of the C-17 cargo bay configuration and loadmaster workspace",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-3",
      title: "Basic Loading Procedures Quiz",
      type: "quiz",
      duration: "25 min",
      description: "Quiz on fundamental C-17 loading procedures",
      content: "Quiz content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-4",
      title: "Weight and Balance Basics",
      type: "reading",
      duration: "18 min",
      description: "Introduction to C-17 weight and balance principles",
      content: "Reading content would be displayed here",
      completed: false
    },
    {
      id: "c17-basics-5",
      title: "C-17 Fundamentals Assessment",
      type: "assessment",
      duration: "15 min",
      description: "Final assessment of C-17 fundamentals knowledge",
      content: "Assessment content would be displayed here",
      completed: false
    }
  ],
  "c130-basics": [
    {
      id: "c130-basics-1",
      title: "C-130 Hercules Overview",
      type: "video",
      duration: "18 min",
      description: "Introduction to C-130 Hercules capabilities",
      content: "Video content for C-130 overview",
      completed: false
    },
    {
      id: "c130-basics-2",
      title: "C-130 Cargo Compartment",
      type: "reading",
      duration: "12 min",
      description: "Detailed study of C-130 cargo compartment",
      content: "Reading content for cargo compartment",
      completed: false
    },
    {
      id: "c130-basics-3",
      title: "Basic Loading Procedures Quiz",
      type: "quiz",
      duration: "20 min",
      description: "Quiz on basic C-130 loading procedures",
      content: "Quiz content for C-130 loading",
      completed: false
    },
    {
      id: "c130-basics-4",
      title: "C-130 Fundamentals Assessment",
      type: "assessment",
      duration: "12 min",
      description: "Final assessment of C-130 fundamental knowledge",
      content: "Assessment for C-130 fundamentals",
      completed: false
    }
  ],
  "kc30a-basics": [
    {
      id: "kc30a-basics-1",
      title: "KC30-A Introduction",
      type: "video",
      duration: "20 min",
      description: "Introduction to KC30-A Multi-Role Tanker Transport",
      content: "Video content for KC30-A introduction",
      completed: false
    },
    {
      id: "kc30a-basics-2",
      title: "Cargo Bay Systems",
      type: "reading",
      duration: "15 min",
      description: "Study of KC30-A cargo bay systems",
      content: "Reading content for cargo bay systems",
      completed: false
    },
    {
      id: "kc30a-basics-3",
      title: "Basic Cargo Operations Quiz",
      type: "quiz",
      duration: "25 min",
      description: "Quiz on basic KC30-A cargo operations",
      content: "Quiz content for KC30-A operations",
      completed: false
    },
    {
      id: "kc30a-basics-4",
      title: "KC30-A Basics Assessment",
      type: "assessment",
      duration: "15 min",
      description: "Final assessment of KC30-A basic knowledge",
      content: "Assessment for KC30-A basics",
      completed: false
    }
  ],
  "c27j-basics": [
    {
      id: "c27j-basics-1",
      title: "C-27J Spartan Overview",
      type: "video",
      duration: "18 min",
      description: "Introduction to C-27J Spartan capabilities",
      content: "Video content for C-27J overview",
      completed: false
    },
    {
      id: "c27j-basics-2",
      title: "Spartan Cargo Systems",
      type: "reading",
      duration: "14 min",
      description: "Study of C-27J cargo systems and layout",
      content: "Reading content for cargo systems",
      completed: false
    },
    {
      id: "c27j-basics-3",
      title: "Basic Loading Procedures Quiz",
      type: "quiz",
      duration: "22 min",
      description: "Quiz on basic C-27J loading procedures",
      content: "Quiz content for C-27J loading",
      completed: false
    },
    {
      id: "c27j-basics-4",
      title: "C-27J Fundamentals Assessment",
      type: "assessment",
      duration: "14 min",
      description: "Final assessment of C-27J fundamental knowledge",
      content: "Assessment for C-27J fundamentals",
      completed: false
    }
  ]
}

// Map lesson IDs to their reading content components
const readingContentMap: Record<string, () => JSX.Element> = {
  "c17-cargo-bay-layout": C17CargoBayLayout,
  "c17-basics-4": C17WeightBalance,
  "c130-basics-2": C130CargoConfigurations,
  "kc30a-basics-2": KC30ACargoBaySystems,
  "c27j-basics-2": C27JOperations,
}

// Sample quiz questions per airframe
const moduleQuizData: Record<string, { questions: { id: string; question: string; options: string[]; correct: number }[] }> = {
  "c17-basics": {
    questions: [
      {
        id: "c17-q1",
        question: "What is the maximum payload capacity of the C-17 Globemaster III?",
        options: ["55,000 kg", "77,519 kg", "100,000 kg", "45,000 kg"],
        correct: 1
      },
      {
        id: "c17-q2",
        question: "What type of cargo restraint system is primarily used in C-17 operations?",
        options: ["Netting only", "Chains and heavy straps", "Pallet locks and NATO-standard tie-down rings", "Foam padding and friction mats"],
        correct: 2
      },
      {
        id: "c17-q3",
        question: "The C-17 cargo floor roller system is designed to assist with:",
        options: ["Passenger boarding", "Fuel transfer operations", "Movement and positioning of palletised cargo", "Crew rest equipment setup"],
        correct: 2
      },
      {
        id: "c17-q4",
        question: "What is the maximum floor load rating per linear metre for the C-17 main cargo deck?",
        options: ["5,000 kg/lm", "10,000 kg/lm", "15,450 kg/lm", "20,000 kg/lm"],
        correct: 2
      },
      {
        id: "c17-q5",
        question: "Before commencing C-17 cargo loading, the loadmaster must first verify:",
        options: ["Fuel state only", "Load plan, weight and balance sheet, and aircraft documentation", "Passenger manifest", "Maintenance crew availability"],
        correct: 1
      },
      {
        id: "c17-q6",
        question: "What minimum breaking strength (MBS) is required for tie-down chains used on the C-17?",
        options: ["5,000 lb MBS", "10,000 lb MBS", "20,000 lb MBS", "25,000 lb MBS"],
        correct: 2
      },
      {
        id: "c17-q7",
        question: "The C-17's rear cargo ramp can support vehicle loading up to what maximum axle load?",
        options: ["5 tonnes per axle", "10 tonnes per axle", "15 tonnes per axle", "20 tonnes per axle"],
        correct: 1
      }
    ]
  },
  "c130-basics": {
    questions: [
      {
        id: "c130-q1",
        question: "What is the maximum payload weight of the C-130 Hercules?",
        options: ["10,000 kg", "19,000 kg", "25,000 kg", "30,000 kg"],
        correct: 1
      },
      {
        id: "c130-q2",
        question: "The C-130's cargo ramp is primarily designed to support:",
        options: ["Passenger boarding only", "Vehicle loading and airdrop operations", "Fuel transfer", "Medical evacuation only"],
        correct: 1
      },
      {
        id: "c130-q3",
        question: "When loading wheeled vehicles on the C-130, the loadmaster must observe:",
        options: ["No restrictions apply", "Floor load limits per square metre", "Weight distribution via pallets only", "Maximum axle load limits per the load manual"],
        correct: 3
      },
      {
        id: "c130-q4",
        question: "What safety check must be completed before closing the C-130 cargo ramp for departure?",
        options: ["Fuel check only", "Tie-down tension verification and cargo headcount", "Engine start clearance from ATC", "Altimeter setting confirmation"],
        correct: 1
      },
      {
        id: "c130-q5",
        question: "The C-130 cargo compartment is approximately how long?",
        options: ["7.5 m", "12.0 m", "16.9 m", "20.0 m"],
        correct: 1
      },
      {
        id: "c130-q6",
        question: "What is the standard tie-down pattern for palletised cargo in the C-130?",
        options: ["2 forward, 2 aft", "4 forward, 4 aft at 45-degree angles", "Chain only fore and aft", "No pattern required if pallet locks engaged"],
        correct: 1
      },
      {
        id: "c130-q7",
        question: "At what aircraft bank angle must cargo be secured to prevent shifting during flight?",
        options: ["10 degrees", "20 degrees", "30 degrees", "45 degrees"],
        correct: 2
      }
    ]
  },
  "kc30a-basics": {
    questions: [
      {
        id: "kc30a-q1",
        question: "What is the primary dual role of the KC30-A MRTT?",
        options: ["Fighter escort and surveillance", "Aerial refuelling and cargo/passenger transport", "Maritime patrol and electronic warfare", "VIP transport and medical evacuation"],
        correct: 1
      },
      {
        id: "kc30a-q2",
        question: "The KC30-A uses which refuelling system for fast-jet operations?",
        options: ["Probe and drogue only", "Flying boom only", "Both probe/drogue pods and centreline flying boom", "Gravity transfer only"],
        correct: 2
      },
      {
        id: "kc30a-q3",
        question: "What document must be verified before initiating KC30-A cargo loading operations?",
        options: ["Passenger manifest only", "Load plan and weight and balance sheet", "Fuel uplift record only", "Maintenance crew sign-off only"],
        correct: 1
      },
      {
        id: "kc30a-q4",
        question: "The KC30-A main deck can accommodate how many standard military cargo pallets?",
        options: ["4 pallets", "8 pallets", "12 pallets", "20 pallets"],
        correct: 2
      },
      {
        id: "kc30a-q5",
        question: "What is the approximate maximum fuel transfer capacity of the KC30-A?",
        options: ["50,000 litres", "100,000 litres", "270,000 litres", "150,000 litres"],
        correct: 2
      },
      {
        id: "kc30a-q6",
        question: "When transitioning the KC30-A from passenger configuration to cargo, the loadmaster must first:",
        options: ["Remove all seating and notify engineering", "Complete a pre-conversion inspection and update the load plan", "Refuel the aircraft to maximum capacity", "Brief the flight crew on new weight limits"],
        correct: 1
      },
      {
        id: "kc30a-q7",
        question: "Dangerous goods carried on the KC30-A must comply with which regulations?",
        options: ["ICAO TI and IATA DGR", "Local ground transport rules only", "Manufacturer guidelines only", "No formal regulations apply to military aircraft"],
        correct: 0
      }
    ]
  },
  "c27j-basics": {
    questions: [
      { id: "c27j-q1", question: "What is the maximum payload of the C-27J Spartan?", options: ["4,000 kg", "6,000 kg", "11,500 kg", "15,000 kg"], correct: 2 },
      { id: "c27j-q2", question: "What characteristic makes the C-27J suited for short unprepared airstrip operations?", options: ["Jet engines for rapid acceleration", "High-lift wing design combined with turboprop propulsion", "Extended undercarriage for rough terrain", "Retractable cargo ramp"], correct: 1 },
      { id: "c27j-q3", question: "The C-27J is primarily employed for which mission type?", options: ["Strategic long-range airlift", "Ocean patrol", "Tactical intra-theatre transport and battlefield logistics", "Heavy outsized cargo"], correct: 2 },
      { id: "c27j-q4", question: "Standard tie-down method for palletised cargo in the C-27J:", options: ["Friction mats only", "CGU-1/B straps to floor tie-down rings", "Bungee cords rated 500 kg", "Fuselage wall nets"], correct: 1 },
      { id: "c27j-q5", question: "Before a C-27J airdrop the loadmaster must confirm:", options: ["Fuel state only", "DZ weather, rigging configuration, and equipment inspection complete", "Passenger count only", "Maintenance release only"], correct: 1 },
      { id: "c27j-q6", question: "Approximate usable cargo compartment length of the C-27J Spartan:", options: ["5.5 m", "8.0 m", "10.5 m", "12.2 m"], correct: 1 },
      { id: "c27j-q7", question: "When loading hazardous materials into the C-27J, the loadmaster is responsible for:", options: ["Confirming items are declared and segregated per DG regulations", "Verbal notification to pilot only", "Signing manifest and ignoring segregation rules", "Delegating responsibility to ground crew"], correct: 0 }
    ]
  },

  // ── Cross-aircraft (all) ──────────────────────────────────────────────────
  "all-beginner": {
    questions: [
      { id: "ab-q1", question: "The loadmaster's primary legal responsibility aboard a military transport is:", options: ["Fuel system monitoring", "Safe loading, securing, and manifesting of all cargo and passengers", "Navigation assistance", "Passenger catering"], correct: 1 },
      { id: "ab-q2", question: "Operating Weight (OW) is defined as:", options: ["Basic empty weight only", "Basic empty weight plus crew, crew equipment, and removable operational items", "Max takeoff weight minus fuel", "Payload plus fuel"], correct: 1 },
      { id: "ab-q3", question: "A 463L military pallet measures:", options: ["88 × 54 inches", "108 × 88 inches", "120 × 96 inches", "72 × 60 inches"], correct: 1 },
      { id: "ab-q4", question: "CG too far aft causes:", options: ["Difficult nose-up rotation", "Pitch instability and potential loss of control", "Increased fuel consumption", "Reduced engine power"], correct: 1 },
      { id: "ab-q5", question: "Which UN Class covers flammable liquids?", options: ["Class 2", "Class 3", "Class 5", "Class 8"], correct: 1 },
      { id: "ab-q6", question: "Minimum forward restraint G-force for military cargo:", options: ["1G", "2G", "3G", "4G"], correct: 2 },
      { id: "ab-q7", question: "Zero Fuel Weight (ZFW) limits exist to protect:", options: ["Fuel tank capacity", "Wing-root structural integrity under bending loads", "Engine performance limits", "Landing gear stress"], correct: 1 }
    ]
  },
  "all-intermediate": {
    questions: [
      { id: "ai-q1", question: "UN Class 5.1 (oxidising substances) must be segregated from Class 3 because:", options: ["They share UN numbers", "Oxidisers accelerate burning of flammable liquids if a breach occurs", "Their vapour pressures are incompatible", "Both require refrigeration"], correct: 1 },
      { id: "ai-q2", question: "A Shipper's Declaration for DG must be completed by:", options: ["The loadmaster", "The consignor (shipper)", "The aircraft commander", "The safety officer"], correct: 1 },
      { id: "ai-q3", question: "Classified cargo left unattended on an aircraft requires:", options: ["A note on the manifest", "Removal to a secure facility or placement under armed guard", "A sealed outer bag", "No additional action if the ramp is closed"], correct: 1 },
      { id: "ai-q4", question: "The Transport Index (TI) for radioactive cargo determines:", options: ["Package weight only", "Required separation distance based on dose rate at 1 metre", "Temperature storage limits", "Packaging group"], correct: 1 },
      { id: "ai-q5", question: "Multi-leg CG checks are required:", options: ["Only at the first departure", "At every departure — offloading cargo changes weight and CG", "Only if fuel is uplift between legs", "Only if gross weight exceeds 90% of MTOW"], correct: 1 },
      { id: "ai-q6", question: "The 'most restrictive regulation applies' rule means:", options: ["Military rules always override ICAO", "Whichever regulation (international, national, or defence) is most restrictive governs the action", "Regulations are applied alphabetically", "The most recently published rule always applies"], correct: 1 },
      { id: "ai-q7", question: "W&B currency lapses when:", options: ["The loadmaster transfers units", "The minimum number of qualifying load planning events has not been completed within the currency period", "The loadmaster's aircraft type converts", "Annual renewal date passes regardless of activity"], correct: 1 }
    ]
  },
  "all-advanced": {
    questions: [
      { id: "aa-q1", question: "Emergency jettison is authorised by:", options: ["The loadmaster independently", "The aircraft commander — loadmaster executes on order", "ATC only", "Ground safety officer"], correct: 1 },
      { id: "aa-q2", question: "Post-incident Air Safety Occurrence Reports must be lodged within:", options: ["72 hours", "24 hours", "7 days", "48 hours"], correct: 1 },
      { id: "aa-q3", question: "Removing a heavy aft pallet at an intermediate stop shifts CG:", options: ["Aft", "Forward — removing aft weight removes rearward moment", "No change", "Laterally"], correct: 1 },
      { id: "aa-q4", question: "For coalition airlift, compliance is required with:", options: ["RAAF regulations only", "Both host-nation requirements and RAAF safety standards — most restrictive applies", "Host-nation rules only in their airspace", "No additional requirements"], correct: 1 },
      { id: "aa-q5", question: "Automated load-planning tools (JMAPS/AALPS) require the loadmaster to:", options: ["Accept output without review", "Verify all outputs — tools rely on accurate inputs and may not account for physical constraints", "Use them for C-17 only", "Replace manual W&B qualification"], correct: 1 },
      { id: "aa-q6", question: "Decompression at altitude requires oxygen donning within:", options: ["30 seconds", "5 seconds", "60 seconds", "15 seconds"], correct: 1 },
      { id: "aa-q7", question: "Class B (flammable liquid) cargo fires must NOT be extinguished with:", options: ["Halon 1211", "CO₂", "Water", "Dry powder"], correct: 2 }
    ]
  },
  "all-expert": {
    questions: [
      { id: "ae-q1", question: "Pre-refuelling and post-refuelling CG checks are required on refuelling missions because:", options: ["Fuel burn only affects fuel CG arm", "Receiving fuel adds wing mass and shifts CG through the entire refuelling window", "Only arrival CG matters", "Refuelling does not affect loadmaster duties"], correct: 1 },
      { id: "ae-q2", question: "Multi-aircraft load optimisation begins with:", options: ["Assigning cargo randomly to reduce planning time", "Categorising all cargo by weight, dimensions, priority, and destination before building a load matrix", "Filling each aircraft to max payload first", "Prioritising heaviest cargo always"], correct: 1 },
      { id: "ae-q3", question: "A W&B quality assurance cross-check requires the checker to:", options: ["Sign after a brief review", "Independently verify OW currency, cargo weights, arm values, and arithmetic", "Confirm fuel weight only", "Check cargo type only"], correct: 1 },
      { id: "ae-q4", question: "In-flight load shift — multiple restraint failures — the first priority is:", options: ["Attempt to re-secure before notifying crew", "Advise aircraft commander with location, weight, and restraint status of the shift", "Evacuate passengers immediately", "Reduce speed via interphone request"], correct: 1 },
      { id: "ae-q5", question: "Sensitive Site Exploitation (SSE) material brought aboard requires:", options: ["Standard manifest entry only", "Chain of custody documentation and clearance verification", "Verbal authority from the aircraft commander", "Ignoring clearance requirements at high tempo"], correct: 1 },
      { id: "ae-q6", question: "HALO differs from HAHO in that:", options: ["HALO uses parachutes, HAHO does not", "HALO is a high-altitude free-fall with low opening; HAHO is a high-altitude high-opening glide insertion", "They are identical operationally", "HAHO is over water only"], correct: 1 },
      { id: "ae-q7", question: "For a classified DG spill from a classified source, the loadmaster:", options: ["Repackages using a standard spill kit", "Does not handle or repackage — advises the aircraft commander and contacts specialist response", "Jettisons immediately without aircraft commander authority", "Seals the cargo area and continues the mission"], correct: 1 }
    ]
  },

  // ── C-17 intermediate / advanced / expert ────────────────────────────────
  "c17-intermediate": {
    questions: [
      { id: "c17i-q1", question: "At C-17 maximum payload, the allowable CG range may be as narrow as:", options: ["20–25% MAC", "8–10% MAC", "15–18% MAC", "5–6% MAC"], correct: 1 },
      { id: "c17i-q2", question: "The C-17 floor roller system must be disengaged before:", options: ["Engine-running offload begins", "Vehicle loading — floor locks must be engaged first", "All airdrop missions", "Night operations"], correct: 1 },
      { id: "c17i-q3", question: "For an oversize cargo item spanning multiple pallet positions, the W&B arm used is:", options: ["Forward-most position arm", "Actual item CG position measured from the nose", "Average of all positions spanned", "Heaviest single-position arm"], correct: 1 },
      { id: "c17i-q4", question: "Rolling stock fuel in external tanks is classified as:", options: ["Part of vehicle tare weight", "Class 3 dangerous goods requiring documentation and segregation", "Passenger baggage", "An oversize load only"], correct: 1 },
      { id: "c17i-q5", question: "C-17 maximum takeoff weight (MTOW) constrains the formula:", options: ["MTOW minus fuel equals max payload", "MTOW minus OW minus payload equals maximum available fuel", "MTOW plus payload equals max fuel", "Fuel is unconstrained by MTOW"], correct: 1 },
      { id: "c17i-q6", question: "Emergency load shift: the loadmaster's first action is:", options: ["Attempt re-securing before notifying crew", "Report to aircraft commander via interphone with weight, position, and restraint status", "Reduce speed using throttle controls", "Secure all loose items in the bay"], correct: 1 },
      { id: "c17i-q7", question: "The C-17 27-pallet single-rail vs 18-pallet configuration differs in:", options: ["Floor load limits double", "Arm values differ per position — load plan must reflect actual config", "Fuel capacity changes", "Number of tie-down chains required halves"], correct: 1 }
    ]
  },
  "c17-advanced": {
    questions: [
      { id: "c17a-q1", question: "C-17 ditching preparation: the loadmaster's primary duty is:", options: ["Computing new W&B for water landing", "Life raft deployment sequence and exit priority briefing to passengers", "Closing all cargo doors from inside", "Activating ELT from the cargo compartment"], correct: 1 },
      { id: "c17a-q2", question: "Class D metal fire (magnesium) in the C-17 cargo bay is extinguished with:", options: ["Halon 1211", "CO₂", "Water mist", "Dry sand or approved dry powder"], correct: 3 },
      { id: "c17a-q3", question: "Emergency jettison authority rests with:", options: ["The loadmaster — executes independently", "The aircraft commander — loadmaster executes on order", "ATC — must authorise the drop zone", "The ground safety officer"], correct: 1 },
      { id: "c17a-q4", question: "The C-17 has how many emergency exit options for passengers?", options: ["Two — ramp and crew door", "Three — crew door, ramp, one paratroop door", "Six — crew door, two paratroop doors, ramp, two overwing hatches", "Four — crew door, ramp, two overwing hatches"], correct: 2 },
      { id: "c17a-q5", question: "Rapid decompression requires oxygen donning within:", options: ["30 seconds", "15 seconds", "5 seconds", "60 seconds"], correct: 2 },
      { id: "c17a-q6", question: "Post-incident Air Safety Occurrence Reports for C-17 are lodged within:", options: ["7 days", "72 hours", "24 hours", "48 hours"], correct: 2 },
      { id: "c17a-q7", question: "During passenger evacuation the loadmaster:", options: ["Exits first to direct from outside", "Exits last after directing all passengers to exits", "Remains at the forward station throughout", "Exits via crew door only regardless of passenger status"], correct: 1 }
    ]
  },
  "c17-expert": {
    questions: [
      { id: "c17e-q1", question: "For a covert C-17 mission, cargo weights on the manifest must be:", options: ["Estimated if identity cannot be confirmed", "Accurate from direct weighing — estimated weights are unacceptable regardless of security constraints", "Omitted for operational security", "Based on standard pallet tables"], correct: 1 },
      { id: "c17e-q2", question: "HALO insertion support from the C-17 requires which additional pre-mission action?", options: ["Standard W&B only", "Oxygen compatibility check and high-altitude door operation verification", "Removal of floor rollers", "Activation of cargo heaters at altitude"], correct: 1 },
      { id: "c17e-q3", question: "When a JSOA (joint special operations authority) directs the C-17 loadmaster to shortcut safety procedures:", options: ["Comply — operational urgency overrides safety", "Resist and escalate to aircraft commander — safety requirements are non-negotiable", "Comply but document post-flight", "Request written authority then comply"], correct: 1 },
      { id: "c17e-q4", question: "SSE material brought aboard the C-17 requires:", options: ["Standard manifest only", "Chain-of-custody documentation and clearance verification matching the classification", "Verbal authority only", "Clearance requirements can be waived at high operational tempo"], correct: 1 },
      { id: "c17e-q5", question: "Pre-refuelling and post-refuelling CG checks for C-17 AR missions are required because:", options: ["Fuel burn is the only CG variable", "Receiving fuel adds mass to the wing tanks and shifts CG through the entire refuelling window", "Only departure CG matters for AR missions", "AR missions are exempt from CG checks"], correct: 1 },
      { id: "c17e-q6", question: "For a GALZ (ground assault landing zone) C-17 turnaround, cargo offload sequence must be:", options: ["Any order — speed is the priority", "Pre-planned by the loadmaster before arrival, executed in delivery-priority order", "Determined by ground crew on arrival", "Directed by the aircraft commander from the flight deck in real time"], correct: 1 },
      { id: "c17e-q7", question: "A C-17 classified DG spill from a classified source: the loadmaster:", options: ["Repackages with a standard spill kit", "Does not handle or repackage — advises aircraft commander and contacts specialist response", "Jettisons without aircraft commander authority", "Seals the bay and continues"], correct: 1 }
    ]
  },

  // ── C-130 intermediate / advanced / expert ───────────────────────────────
  "c130-intermediate": {
    questions: [
      { id: "c130i-q1", question: "Engine-Running Offload (ERO) on the C-130 is executed:", options: ["After engine shutdown", "By the loadmaster alone with engines running and ramp lowered", "With co-pilot assistance throughout", "Only with full ground support team present"], correct: 1 },
      { id: "c130i-q2", question: "NVG field of view is approximately:", options: ["180°", "90°", "40°", "120°"], correct: 2 },
      { id: "c130i-q3", question: "For LAPES, incorrect extraction parachute size:", options: ["Improves cargo attitude on delivery", "Affects extraction force and platform attitude, risking loss of aircraft control", "Only affects timing, not safety", "Is corrected by the drogue chute"], correct: 1 },
      { id: "c130i-q4", question: "Combat offload (COLDO) uses aircraft momentum when:", options: ["Ground equipment is fully available", "Pallets are too heavy for manual handling", "No mechanical handling equipment exists at the airfield", "ATC requires expedited offload"], correct: 2 },
      { id: "c130i-q5", question: "CDS (Container Delivery System) A-22 bags: maximum weight per container:", options: ["500 kg", "1,000 kg", "2,200 lbs (~1,000 kg)", "5,000 lbs"], correct: 2 },
      { id: "c130i-q6", question: "At an austere airfield before C-130 loading begins, the loadmaster must:", options: ["Confirm weather only", "Survey the surface for obstacles, soft spots, and debris", "Obtain ATC clearance", "Brief ground crew on standard pallet weights"], correct: 1 },
      { id: "c130i-q7", question: "NVG-compatible cargo compartment lighting uses:", options: ["Full white light throughout", "Blue-green filtered lighting that preserves NVG image without losing restraint visibility", "Complete darkness", "Red lighting only"], correct: 1 }
    ]
  },
  "c130-advanced": {
    questions: [
      { id: "c130a-q1", question: "Covert C-130 load plan weights must be:", options: ["Estimated if cargo identity is unknown", "Accurate from direct weighing — estimated weights are unacceptable for covert loads", "Omitted for security", "Based on standard pallet tables"], correct: 1 },
      { id: "c130a-q2", question: "Joint SOF authority directing C-130 loadmaster to shortcut safety procedures:", options: ["Comply — operational urgency overrides safety", "Resist and escalate to aircraft commander — safety is non-negotiable", "Comply and document post-flight", "Request written authority then comply"], correct: 1 },
      { id: "c130a-q3", question: "For C-130 maritime rubber-craft airdrop, the loadmaster must:", options: ["Confirm craft is deflated only", "Confirm rigging integrity, water activation systems, and coordinate deployment sequence", "Ensure craft is fully inflated", "Delegate all rigging to the SOF unit"], correct: 1 },
      { id: "c130a-q4", question: "NVG depth perception is reduced because:", options: ["NVGs amplify light, flattening contrast", "Image intensifier tubes produce a monocular 40° image, eliminating binocular depth cues", "NVGs have lower resolution", "Night air scatters light"], correct: 1 },
      { id: "c130a-q5", question: "HALO vs HAHO operations from the C-130 differ in that:", options: ["HALO uses parachutes, HAHO does not", "HALO is high-altitude free-fall with low opening; HAHO is high-opening with long canopy glide", "They are operationally identical", "HAHO is over water only"], correct: 1 },
      { id: "c130a-q6", question: "NVG qualification for C-130 loadmasters is separate from pilot NVG because:", options: ["Loadmasters use different NVG equipment", "Loadmaster NVG tasks include cargo handling (ramp guidance, restraint checks) not evaluated in pilot courses", "They operate on different radio frequencies", "Loadmaster NVGs must be military specification only"], correct: 1 },
      { id: "c130a-q7", question: "Abort criteria for a C-130 low-level tactical airdrop are established:", options: ["By the aircraft commander during the drop", "By the loadmaster during rigging", "During pre-mission briefing before the sortie commences", "By ATC at the drop zone"], correct: 2 }
    ]
  },
  "c130-expert": {
    questions: [
      { id: "c130e-q1", question: "Unconventional warfare support cargo described only as 'equipment' on the manifest requires the loadmaster to:", options: ["Accept the description — OPSEC precludes details", "Obtain weight confirmation from a cleared source and verify DG classification even if description is sanitised", "Reject the load — unidentified cargo cannot be carried", "Increase tie-down density to compensate for unknown weight distribution"], correct: 1 },
      { id: "c130e-q2", question: "At a GALZ (ground assault landing zone) the C-130's turnaround offload sequence must be:", options: ["Any order — speed is the priority", "Pre-planned by loadmaster before arrival in delivery-priority order", "Ground crew determines on arrival", "Aircraft commander directs from the flight deck in real time"], correct: 1 },
      { id: "c130e-q3", question: "For a C-130 multi-stop mission, the loadmaster removes a heavy aft pallet at stop one. CG shifts:", options: ["Aft", "Forward — removing aft weight removes rearward moment", "No change", "Laterally only"], correct: 1 },
      { id: "c130e-q4", question: "SSE material brought aboard the C-130 after a ground assault requires:", options: ["Standard manifest only", "Chain-of-custody documentation and clearance verification matching classification level", "Verbal authority only", "Clearance requirements can be waived at high operational tempo"], correct: 1 },
      { id: "c130e-q5", question: "C-130 AFSOC pre-planned pallet restraint checks at low level are critical because:", options: ["Pallet locks disengage below 500 ft AGL", "Low-level turbulence can cause pallet movement if tie-downs are not at full tension", "The floor roller system is inactive at low altitude", "Restraint chains are not rated for G-loads below 1,000 ft"], correct: 1 },
      { id: "c130e-q6", question: "For a classified DG spill from a classified source on the C-130, the loadmaster:", options: ["Repackages with a standard spill kit", "Does not handle or repackage — advises aircraft commander and contacts specialist response", "Jettisons without aircraft commander authority", "Seals the bay and continues mission"], correct: 1 },
      { id: "c130e-q7", question: "Coalition airlift compliance requires the C-130 loadmaster to apply:", options: ["RAAF regulations only", "Both receiving-nation requirements and RAAF safety standards — most restrictive applies", "Host-nation rules only while in their airspace", "No additional requirements for allied flights"], correct: 1 }
    ]
  },

  // ── KC30-A intermediate / advanced / expert ──────────────────────────────
  "kc30a-intermediate": {
    questions: [
      { id: "kc30i-q1", question: "Mixed passenger/cargo on KC30-A main deck requires:", options: ["A curtain divider", "A structural barrier preventing cargo movement reaching passengers under deceleration loads", "A rope or strap across the door", "A safety net only"], correct: 1 },
      { id: "kc30i-q2", question: "Classified cargo on a KC30-A VIP mission requires a Security Receipt because:", options: ["VIP flights have lower classification", "It provides chain of custody from releasing to receiving authority — travels with the aircraft", "Security Receipts are only for classified passengers", "KC30-A manifests auto-classify all cargo"], correct: 1 },
      { id: "kc30i-q3", question: "KC30-A lower hold LD3 containers cannot be accessed in flight. This means:", options: ["DG can be placed there without restriction", "All lower hold cargo must be compliant before departure — no in-flight adjustment possible", "Loadmaster can access via pressurised hatch", "Container weight limits are relaxed"], correct: 1 },
      { id: "kc30i-q4", question: "KC30-A aerial refuelling can be delivered via:", options: ["Wing pods (probe/drogue) and centreline flying boom", "Gravity transfer and pressure fuelling only", "Drogue only — no boom capability", "Boom only — no pod capability"], correct: 0 },
      { id: "kc30i-q5", question: "In AEROMED configuration, KC30-A litter brackets — the loading sequence is determined by:", options: ["Heaviest patient first", "The medical team based on clinical priority", "Alphabetical order of patient name", "CG requirements alone"], correct: 1 },
      { id: "kc30i-q6", question: "KC30-A VIP configuration requires an updated OW extract because:", options: ["Standard OW always applies", "VIP cabin equipment changes the actual operating weight and CG — standard OW may not be accurate", "OW extracts are only required for cargo missions", "VIP passengers are assumed heavier"], correct: 1 },
      { id: "kc30i-q7", question: "DG Class 1 (explosives) with passengers aboard KC30-A:", options: ["Permitted in sealed military packaging", "Permitted for Divisions 1.4 and 1.6 with specific approval", "Prohibited", "At aircraft commander's discretion"], correct: 2 }
    ]
  },
  "kc30a-advanced": {
    questions: [
      { id: "kc30av-q1", question: "Post-refuelling CG must be checked because:", options: ["Fuel burn only shifts CG via fuel arms", "Receiving fuel adds mass to wing tanks and shifts CG through the refuelling window", "Cargo CG is unaffected during AR operations", "Only pre-refuelling CG matters for planning"], correct: 1 },
      { id: "kc30av-q2", question: "KC30-A VIP mission cargo security: a Security Receipt provides:", options: ["Insurance documentation", "Chain of custody from releasing authority to receiving authority — must travel with the aircraft", "Passenger manifest confirmation", "Aircraft commander authorisation only"], correct: 1 },
      { id: "kc30av-q3", question: "Lateral CG uncertainty in KC30-A mixed pax/cargo configuration arises because:", options: ["Cargo is always loaded on one side", "Passengers move during flight and do not remain at assigned seats", "Aircraft is not symmetric", "Lateral CG is managed solely by the fuel system"], correct: 1 },
      { id: "kc30av-q4", question: "KC30-A cargo door maximum cross-section constraint means:", options: ["Weight is the only constraint", "Cargo cross-section must be verified — C-17 standard pallets may not fit", "ICAO requires dimensional documentation for all cargo", "Oversized cargo needs a different LD3 specification"], correct: 1 },
      { id: "kc30av-q5", question: "When transitioning KC30-A main deck from pax to cargo, the FIRST action is:", options: ["Brief crew on new fuel limits", "Complete a pre-conversion inspection, remove seats, and update the load plan", "Refuel to maximum capacity", "Confirm ICAO DG compliance"], correct: 1 },
      { id: "kc30av-q6", question: "AEROMED patient weight assumed per litter for KC30-A W&B purposes:", options: ["60 kg", "75 kg", "86 kg", "100 kg"], correct: 2 },
      { id: "kc30av-q7", question: "KC30-A approximate maximum fuel offload capacity:", options: ["50,000 litres", "100,000 litres", "150,000 litres", "270,000 litres"], correct: 2 }
    ]
  },
  "kc30a-expert": {
    questions: [
      { id: "kc30e-q1", question: "For a KC30-A dual-role mission (AR tanker + cargo), the loadmaster must plan CG at:", options: ["Max fuel state only", "Both minimum and maximum fuel states — envelope must be maintained throughout the refuelling window", "Departure state only", "Arrival state only"], correct: 1 },
      { id: "kc30e-q2", question: "Coalition KC30-A operations require compliance with:", options: ["RAAF regulations only", "Both the partnering nation's requirements and RAAF safety standards — most restrictive applies", "Only ICAO Annex 18", "No additional requirements for allied flights"], correct: 1 },
      { id: "kc30e-q3", question: "A KC30-A carrying classified cargo with VIP passengers: clearance levels must:", options: ["Be confirmed only for the aircraft commander", "Cover both the loadmaster and the relevant custodian — loadmaster cannot physically handle material above their clearance", "Be confirmed verbally on departure", "Only apply to the classified passenger escort"], correct: 1 },
      { id: "kc30e-q4", question: "Automated load planning tool outputs for KC30-A must be verified by the loadmaster because:", options: ["Tools are not approved for KC30-A", "Tools rely on accurate inputs and may not account for all physical cabin constraints", "Outputs are legally binding without review", "Verification is only required for cargo loads over 20 tonnes"], correct: 1 },
      { id: "kc30e-q5", question: "KC30-A post-mission audit trail for classified material requires:", options: ["Verbal confirmation only", "Written receipt signatures at each custody transfer with file retention", "Standard manifest notation", "Nothing additional — standard manifest suffices"], correct: 1 },
      { id: "kc30e-q6", question: "In-flight KC30-A AEROMED deterioration requiring patient repositioning: the loadmaster must:", options: ["Action it immediately without crew notification", "Coordinate with the medical officer and inform the aircraft commander before any repositioning that could affect CG", "Only act if the aircraft commander specifically instructs", "Delay repositioning until landing"], correct: 1 },
      { id: "kc30e-q7", question: "For a KC30-A emergency jettison, cargo is released:", options: ["By loadmaster independently if delay would endanger the aircraft", "On aircraft commander's order only — loadmaster executes and notifies ATC", "Only after ATC authorises a drop zone", "Never — jettison is prohibited on KC30-A"], correct: 1 }
    ]
  },

  // ── C-27J intermediate / advanced / expert ───────────────────────────────
  "c27j-intermediate": {
    questions: [
      { id: "c27ji-q1", question: "C-27J high-altitude airstrip performance tables used unadjusted will:", options: ["Underestimate ground roll — aircraft exceeds performance", "Overestimate performance — actual ground roll will be longer", "Produce identical results — tables cover all conditions", "Only affect fuel burn, not ground roll"], correct: 1 },
      { id: "c27ji-q2", question: "NGO humanitarian cargo for C-27J with inaccurate manifests should be:", options: ["Accepted at label weight — legally binding", "Estimated visually from cargo volume", "Refused until certified weight documents are provided", "Directly weighed — NGO manifests are frequently inaccurate"], correct: 3 },
      { id: "c27ji-q3", question: "C-27J AEROMED loading sequence is determined by:", options: ["Loadmaster — heaviest patient first", "CG requirements — forward patients first", "The medical team based on clinical priority", "Aircraft commander based on patient rank"], correct: 2 },
      { id: "c27ji-q4", question: "C-27J ERO pallet movement uses gravity rollers rather than PDUs, meaning:", options: ["Pallets move faster with less effort", "Physical manual handling is required — loadmaster paces work within the time requirement", "No manual effort needed", "PDUs are available but at a different switch location"], correct: 1 },
      { id: "c27ji-q5", question: "C-27J 'last tactical mile' role is enabled by operating from strips inaccessible to:", options: ["All RAAF aircraft including King Air", "C-130, C-17, and KC30-A — too short, narrow, or rough for those types", "Rotary-wing aircraft in most cases", "Civilian aircraft only"], correct: 1 },
      { id: "c27ji-q6", question: "C-27J surface assessment before unprepared strip operations must identify:", options: ["Weather and visibility only", "Obstacles, soft spots, debris, and surface bearing capacity", "Fuel availability and communications", "Civil air traffic in the circuit"], correct: 1 },
      { id: "c27ji-q7", question: "Litter bracket verification in C-27J AEROMED config is the loadmaster's responsibility because:", options: ["Brackets are installed by maintenance — loadmaster counts only", "Incorrect installation could fail under patient weight in turbulence — loadmaster must verify and load-test", "Brackets are self-certifying", "Medical crew are responsible for all AEROMED equipment"], correct: 1 }
    ]
  },
  "c27j-advanced": {
    questions: [
      { id: "c27ja-q1", question: "C-27J departure weight for a mountain airstrip with no fuel available must ensure:", options: ["Maximum payload regardless of distance", "Payload does not exceed the performance-limited TOW for altitude, temperature, and runway length", "Fuel reserve not required below 3,000 m AMSL", "Only the pilot calculates mountain performance"], correct: 1 },
      { id: "c27ja-q2", question: "C-27J special forces in-flight mission changes require the loadmaster to:", options: ["Refuse in-flight changes — all parameters must be fixed on the ground", "Rapidly reconfigure the cargo compartment accurately under time pressure with minimal lighting", "Accept changes only with written aircraft commander authority", "Contact mission control before accepting any change"], correct: 1 },
      { id: "c27ja-q3", question: "C-27J joint SOF mission: a JSOA directive to shortcut safety procedures:", options: ["Must be complied with — operational urgency overrides safety", "Must be resisted and escalated to aircraft commander — safety requirements are non-negotiable", "Should be complied with and documented post-flight", "Requires written authority before complying"], correct: 1 },
      { id: "c27ja-q4", question: "Pre-mission C-27J surface survey at a suspected unimproved strip must confirm:", options: ["Weather conditions only", "Surface obstacles, soft spots, debris, and ground bearing capacity to support aircraft weight", "Fuel availability and communications only", "Civil air traffic only"], correct: 1 },
      { id: "c27ja-q5", question: "Humanitarian cargo for C-27J that arrives non-palletised requires the loadmaster to:", options: ["Use improvised restraint — standard regulations do not apply to humanitarian flights", "Devise a compliant restraint solution meeting applicable G-force requirements", "Refuse the load — non-palletised cargo cannot be carried", "Load it unsecured if the trip is short"], correct: 1 },
      { id: "c27ja-q6", question: "At a high-altitude C-27J strip in summer, 'hot and high' performance margins shrink because:", options: ["Turboprop engines are less efficient in mountains", "Reduced air density decreases engine output and increases stall speed, extending ground roll", "Cargo shifts due to turbulence at altitude", "Navigation equipment loses accuracy at high elevation"], correct: 1 },
      { id: "c27ja-q7", question: "C-27J AEROMED oxygen supply must be confirmed before loading patients because:", options: ["Oxygen system operates differently in AEROMED than in cargo mode", "Patient care may require continuous oxygen — an unexpected failure in flight cannot be remedied", "Standard pre-flight check covers oxygen automatically", "The medical crew confirms oxygen without loadmaster involvement"], correct: 1 }
    ]
  },
  "c27j-expert": {
    questions: [
      { id: "c27je-q1", question: "C-27J classified cargo clearance requirements at high operational tempo:", options: ["Can be waived by the aircraft commander", "Must be maintained — loadmaster cannot handle material above their clearance regardless of tempo", "Only apply to non-military cargo", "Can be satisfied verbally on departure"], correct: 1 },
      { id: "c27je-q2", question: "C-27J GALZ turnaround offload sequence must be:", options: ["Any order — speed is the priority", "Pre-planned by loadmaster before arrival in delivery-priority order", "Determined by ground crew on arrival", "Directed by aircraft commander from the flight deck in real time"], correct: 1 },
      { id: "c27je-q3", question: "C-27J coalition airlift compliance requires:", options: ["RAAF regulations only", "Both partner-nation requirements and RAAF safety standards — most restrictive applies", "Host-nation rules only while in their airspace", "No additional requirements for allied flights"], correct: 1 },
      { id: "c27je-q4", question: "For a C-27J multi-leg mission, removing a heavy forward pallet at stop one shifts CG:", options: ["Forward", "Aft — removing forward weight removes forward moment, shifting CG rearward", "No change", "Laterally only"], correct: 1 },
      { id: "c27je-q5", question: "SSE material brought aboard the C-27J after a ground assault requires:", options: ["Standard manifest entry only", "Chain-of-custody documentation and clearance verification matching classification", "Verbal aircraft commander authority only", "No additional procedures — standard manifest suffices"], correct: 1 },
      { id: "c27je-q6", question: "C-27J in-flight load shift — multiple restraint failures — first priority:", options: ["Attempt re-securing before notifying crew", "Advise aircraft commander via interphone with location, weight, and restraint status", "Evacuate passengers from cargo compartment", "Reduce airspeed via interphone request"], correct: 1 },
      { id: "c27je-q7", question: "A classified DG spill on the C-27J from a classified source — the loadmaster:", options: ["Repackages using a standard spill kit", "Does not handle or repackage — advises aircraft commander and contacts specialist response", "Jettisons without aircraft commander authority", "Seals the cargo area and continues"], correct: 1 }
    ]
  }
}

// Assessment questions — harder than quiz, 80% pass threshold (8/10)
type AssessmentQuestion = { id: string; question: string; options: string[]; correct: number }
type AssessmentData = { questions: AssessmentQuestion[] }

const moduleAssessmentData: Record<string, AssessmentData> = {
  "c17-basics": { questions: [
    { id:"a-c17-1", question:"The C-17 maximum payload capacity is 170,900 lbs. What is the primary structural limit that defines this value?", options:["Maximum zero fuel weight minus operating weight","Maximum landing weight divided by fuel burn rate","Maximum ramp weight minus fuel load","MTOW minus maximum fuel capacity"], correct:0 },
    { id:"a-c17-2", question:"When loading a wheeled vehicle into the C-17 that carries fuel in an external tank, the loadmaster must treat the fuel as:", options:["Ignored — it is part of the vehicle tare weight","Class 3 dangerous goods requiring DG documentation and segregation","Passenger baggage","An oversize load only"], correct:1 },
    { id:"a-c17-3", question:"The C-17 uses a station numbering system from FS 240 to FS 1270. What does a higher fuselage station number indicate?", options:["A position further aft in the aircraft","A heavier cargo item","A restricted access area","A forward crew position"], correct:0 },
    { id:"a-c17-4", question:"When computing CG for a C-17 configuration at maximum payload, the allowable CG range narrows because:", options:["The engines produce more torque at high weight","Heavier gross weight moves the CG envelope boundaries closer together","Less fuel is carried, reducing wing lift","The empennage becomes aerodynamically ineffective"], correct:1 },
    { id:"a-c17-5", question:"A change to the approved C-17 load plan after the W&B form is completed requires:", options:["No action — the pilot accepts responsibility","An immediate recalculation before departure","Verbal notification to the crew only","A post-departure correction in the flight log"], correct:1 },
    { id:"a-c17-6", question:"The C-17 has how many emergency exit options available to passengers?", options:["Two — ramp and crew door only","Three — crew door, ramp, paratroop doors (same side)","Six — crew door, two paratroop doors, tail ramp, two overwing hatches","Four — crew door, ramp, and two overwing hatches"], correct:2 },
    { id:"a-c17-7", question:"What is the correct immediate action when cargo shifts in flight and the C-17's CG moves outside approved limits?", options:["Continue the mission and document post-flight","Immediately advise the aircraft commander and assess whether re-securing is safe","Lock the ramp and wait for turbulence to cease","Increase airspeed to reduce pitch sensitivity"], correct:1 },
    { id:"a-c17-8", question:"For a Class D metal fire (magnesium) in the cargo compartment, the correct extinguishing agent is:", options:["Halon 1211","CO₂","Water mist","Dry sand or approved dry powder"], correct:3 },
    { id:"a-c17-9", question:"Before a long over-water leg in the C-17, the loadmaster must brief passengers on:", options:["Fuel system operation and engine specifications","Life preserver donning, survival raft boarding sequence, and emergency exits","Cargo tie-down procedures and floor load limits","Navigation waypoints and alternate airfields"], correct:1 },
    { id:"a-c17-10", question:"The C-17 floor roller system is rated to assist with movement of palletised cargo. When it must NOT be used:", options:["During engine-running offload operations","When gross weight exceeds 300,000 lbs","For vehicles — floor locks must be engaged before vehicle loading begins","During night operations"], correct:2 }
  ]},
  "c130-basics": { questions: [
    { id:"a-c130-1", question:"LAPES stands for Low Altitude Parachute Extraction System. At what approximate altitude above ground level does a LAPES delivery occur?", options:["500–1,000 feet AGL","200–300 feet AGL","5–10 feet AGL","50 feet AGL"], correct:2 },
    { id:"a-c130-2", question:"During an engine-running offload (ERO) on the C-130, the loadmaster:", options:["Waits for engines to shut down before unloading","Executes the complete offload with ramp lowered while engines run","Directs ground crew from the flight deck","Requires co-pilot assistance throughout"], correct:1 },
    { id:"a-c130-3", question:"The C-130 Container Delivery System (CDS) uses A-22 cargo bags. What is the maximum weight per A-22 container?", options:["500 kg","1,000 kg","2,200 lbs (approximately 1,000 kg)","5,000 lbs"], correct:2 },
    { id:"a-c130-4", question:"When conducting night operations with NVGs on the C-130, the loadmaster must:", options:["Use white light to supplement NVG field of view","Use NVG-compatible blue-green filtered lighting and avoid any white light","Disable all cargo compartment lighting","Operate solely by torchlight"], correct:1 },
    { id:"a-c130-5", question:"The C-130's cargo compartment is approximately how long (excluding ramp)?", options:["7.5 metres","12 metres","16.9 metres","20 metres"], correct:1 },
    { id:"a-c130-6", question:"For a covert special operations mission, cargo weights on the C-130 manifest must be:", options:["Described in detail including classification markings","Accurate, even if the description is sanitised — estimated weights are not acceptable","Estimated to the nearest tonne","Confirmed only by the mission commander, not the loadmaster"], correct:1 },
    { id:"a-c130-7", question:"What is the correct segregation level for Class 3 (flammable liquid) and Class 1 (explosive) dangerous goods on the C-130?", options:["Away from (1 metre separation)","Separated from (not in same compartment)","Separated longitudinally by an intervening compartment","No segregation required for military cargo"], correct:2 },
    { id:"a-c130-8", question:"During a C-130 low-level tactical airdrop abort, the primary abort criteria are established:", options:["By the aircraft commander during the drop","By the loadmaster during rigging","During the pre-mission briefing, before the sortie commences","By ATC at the drop zone"], correct:2 },
    { id:"a-c130-9", question:"The C-130 is configured for personnel airdrop via how many paratroop doors?", options:["One — left side only","Two — forward left and forward right","Two — one each side, aft of the wing","One — aft right only"], correct:2 },
    { id:"a-c130-10", question:"At what minimum G-force must C-130 cargo tie-downs restrain cargo in the forward direction?", options:["1G","2G","3G","4G"], correct:2 }
  ]},
  "kc30a-basics": { questions: [
    { id:"a-kc30a-1", question:"When transitioning the KC30-A main deck from passenger to cargo configuration, which action must be completed FIRST?", options:["Brief the flight crew on new fuel limits","Complete a pre-conversion inspection, remove seats, and update the load plan","Refuel to maximum capacity","Confirm ICAO DG compliance only"], correct:1 },
    { id:"a-kc30a-2", question:"The KC30-A lower cargo hold accommodates LD3 containers. What maximum weight is rated for a standard LD3 position?", options:["500 kg","1,000 kg","1,588 kg","2,500 kg"], correct:2 },
    { id:"a-kc30a-3", question:"During KC30-A in-flight aerial refuelling, cargo CG is affected because:", options:["Refuelled fuel adds weight; the CG shifts as fuel mass increases in the wing tanks","Cargo shifts during refuelling manoeuvres","The ramp opens during refuelling operations","Passengers move to the aft cabin"], correct:0 },
    { id:"a-kc30a-4", question:"Which dangerous goods classes are prohibited on the KC30-A when passengers are embarked?", options:["Class 9 only","Class 3 (flammable liquids) and above","Class 1 (explosives) without specific approval","Only Class 7 (radioactive)"], correct:2 },
    { id:"a-kc30a-5", question:"The KC30-A can deliver fuel via two systems. Name both:", options:["Wing pods (probe/drogue) and centreline flying boom","Gravity transfer and pressure fuelling","Drogue only — no boom capability","Boom only — no pod capability"], correct:0 },
    { id:"a-kc30a-6", question:"When loading the KC30-A for a VIP transport mission, the loadmaster must obtain:", options:["Standard operating weight extract — no change from normal","An updated OW extract specific to the VIP cabin configuration","A special DG waiver","Passenger manifest only"], correct:1 },
    { id:"a-kc30a-7", question:"For AEROMED configuration on the KC30-A, litter brackets are installed on seat tracks. What is the assumed patient weight per litter for W&B purposes?", options:["60 kg","75 kg","86 kg","100 kg"], correct:2 },
    { id:"a-kc30a-8", question:"The KC30-A's main deck cargo door accepts pallets from a cargo loader. What is the key dimensional constraint for large cargo?", options:["Pallet weight only — no door dimension constraint","Maximum cargo cross-section must fit through the door opening","Pallet height must not exceed 2 metres","Door width is fixed at 2.5 metres regardless of pallet"], correct:1 },
    { id:"a-kc30a-9", question:"Classified cargo carried on the KC30-A during a VIP mission requires the loadmaster to:", options:["Record receipt and sign chain-of-custody documentation","Place it with general cargo and note on the manifest","Delegate handling entirely to the VIP's protective detail","Apply no additional procedures beyond the standard manifest"], correct:0 },
    { id:"a-kc30a-10", question:"The KC30-A's approximate maximum fuel transfer capacity is:", options:["50,000 litres","100,000 litres","150,000 litres","270,000 litres"], correct:2 }
  ]},
  "c27j-basics": { questions: [
    { id:"a-c27j-1", question:"The C-27J's short-field obstacle clearance performance (50-foot obstacle) is achieved within what distance at maximum takeoff weight?", options:["300 metres","580 metres","850 metres","1,100 metres"], correct:1 },
    { id:"a-c27j-2", question:"At a high-altitude airstrip (e.g. 2,000 m AMSL in summer), C-27J payload must be reduced because:", options:["Fuel density increases at altitude","Reduced air density decreases engine performance and increases stall speed, extending ground roll","The ramp becomes aerodynamically unstable","Tie-down ratings are reduced in heat"], correct:1 },
    { id:"a-c27j-3", question:"When the C-27J is configured for aeromedical evacuation, the loadmaster must confirm which of the following before loading patients?", options:["Only fuel state and takeoff weight","Litter bracket installation, oxygen supply connection, power supply for medical equipment, and loading sequence with the medical crew","Passenger manifest and security clearance","Ramp angle and cargo net configuration only"], correct:1 },
    { id:"a-c27j-4", question:"Humanitarian cargo received at an austere strip from NGO sources should have weights verified by:", options:["Accepting the shipper's label weight as accurate","Direct physical weighing — NGO manifest weights are frequently inaccurate","Radio confirmation from the NGO headquarters","The aircraft commander's judgement based on cargo type"], correct:1 },
    { id:"a-c27j-5", question:"During a rapid turnaround ERO on the C-27J, the loadmaster moves pallets using:", options:["Power drive units (PDUs) identical to the C-17","A gravity roller system requiring manual physical handling","Electric winch only","Ground crew-operated forklifts"], correct:1 },
    { id:"a-c27j-6", question:"Before operating the C-27J from an unprepared surface, what specific survey must the loadmaster conduct?", options:["Weather check and fuel state verification only","Surface evaluation for obstacles, soft spots, debris, and ground load bearing capacity","Visual inspection of the ramp only","Check for bird activity"], correct:1 },
    { id:"a-c27j-7", question:"What is the C-27J's usable cargo compartment dimensions (approximate)?", options:["5.5 m × 2.5 m","9.1 m × 2.7 m × 2.4 m","15.0 m × 5.0 m","7.0 m × 3.0 m"], correct:1 },
    { id:"a-c27j-8", question:"Joint special operations missions conducted in the C-27J require the loadmaster to understand:", options:["Only the standard approval chain, no difference from regular flights","Which authority they are operating under, who can change the load plan, and which safety requirements are non-negotiable","No special considerations beyond normal W&B","Standard manifest only"], correct:1 },
    { id:"a-c27j-9", question:"In mountain airstrip operations, the C-27J's performance margins shrink primarily because:", options:["Turboprop engines are less efficient in mountains","Reduced air density at altitude decreases engine output and increases stall speed","Cargo shifts due to turbulence","Navigation equipment loses accuracy at high elevation"], correct:1 },
    { id:"a-c27j-10", question:"The C-27J's maximum payload is 11,500 kg. The 'last tactical mile' concept it enables means:", options:["Delivering cargo to the last stop on a regular logistics route","Delivering critical cargo directly to forward units at locations inaccessible by larger fixed-wing aircraft","Operating at night to the final destination","Flying the last leg of a C-17 mission"], correct:1 }
  ]},
  "all-beginner": { questions: [
    { id:"a-gen-1", question:"The loadmaster's legal and professional responsibility on a military transport aircraft covers:", options:["Fuel system management only","All cargo, passenger, and load manifest decisions — no item may be loaded without loadmaster approval","Passenger welfare only","Navigation and weather planning"], correct:1 },
    { id:"a-gen-2", question:"Operating Weight (OW) is defined as:", options:["Aircraft empty weight only","Basic Empty Weight plus crew, crew equipment, and removable operational items","Maximum takeoff weight minus fuel","Payload plus fuel"], correct:1 },
    { id:"a-gen-3", question:"Zero Fuel Weight (ZFW) has a maximum structural limit because:", options:["Fuel adds aerodynamic lift that reduces wing bending","Without fuel, wing bending loads are carried entirely by the fuselage-wing joint","The aircraft cannot be balanced without fuel","Fuel cools the structural components"], correct:1 },
    { id:"a-gen-4", question:"The standard 463L military pallet dimensions are:", options:["88 inches × 54 inches","108 inches × 88 inches","120 inches × 96 inches","72 inches × 60 inches"], correct:1 },
    { id:"a-gen-5", question:"If the CG moves too far aft, the primary flight safety risk is:", options:["Nose-heavy aircraft — difficult rotation on takeoff","Pitch instability — aircraft may become uncontrollable","Increased fuel consumption","Reduced passenger comfort"], correct:1 },
    { id:"a-gen-6", question:"Dangerous goods Class 7 (radioactive) cargo segregation distance is determined by:", options:["The loadmaster's judgement based on visual inspection","Transport Index — which determines maximum stackability and required separation distance","Cargo weight only","Class of surrounding cargo only"], correct:1 },
    { id:"a-gen-7", question:"Classified cargo in transit on an unattended aircraft requires:", options:["No special procedure if doors are locked","Removal to a secure facility or placement under armed guard","Only a notation on the manifest","A sealed outer bag"], correct:1 },
    { id:"a-gen-8", question:"The four load restraint G-force requirements (forward, aft, lateral, vertical) are:", options:["1G, 0.5G, 0.5G, 1G","3G, 1.5G, 1.5G, 2G","5G, 2G, 2G, 3G","2G, 1G, 1G, 2G"], correct:1 },
    { id:"a-gen-9", question:"For multi-leg missions, CG must be checked at:", options:["Departure only — all legs use the same calculation","Every departure — offloading cargo changes CG and requires recalculation","Landing only","The mid-point of the longest leg"], correct:1 },
    { id:"a-gen-10", question:"The primary international standard governing dangerous goods transport by air is:", options:["IATA Ground Operations Manual","ICAO Annex 18 and Doc 9284 Technical Instructions","ICAO Annex 6 — Aircraft Operations","IMO IMDG Code"], correct:1 }
  ]},
}

// Assessment data for API modules by aircraft+difficulty
const aircraftAssessmentData: Record<string, AssessmentData> = {
  "c17-intermediate": { questions: [
    { id:"ac17i-1", question:"At C-17 maximum payload, the allowable CG range may be as narrow as:", options:["20–25% MAC","8–10% MAC","15–18% MAC","5–6% MAC"], correct:1 },
    { id:"ac17i-2", question:"A standard 463L pallet placed one bay forward of the planned position can cause CG to exceed limits at maximum gross weight. This means:", options:["Small position changes are acceptable as the pilot can compensate","Any change to the load plan after W&B completion requires an immediate recalculation","Forward changes only matter if payload exceeds 100,000 lbs","Position changes never affect CG significantly"], correct:1 },
    { id:"ac17i-3", question:"For rolling stock loading, fuel in vehicle tanks must be:", options:["Drained before loading","Declared and documented as Class 3 DG if carried in external fuel cells","Topped up to reduce fire risk from vapour","Ignored — vehicle fuel is not cargo"], correct:1 },
    { id:"ac17i-4", question:"Vehicles delivered for air transport must have their fuel systems isolated or vented because:", options:["Full tanks increase floor load per axle","Residual flammable fluid in engines and hydraulics must be controlled as DG","Empty fuel tanks reduce vehicle weight","Aviation regulations prohibit all fuel in vehicles"], correct:1 },
    { id:"ac17i-5", question:"The C-17 in 27-pallet single-rail configuration differs from the standard 18-pallet configuration in that:", options:["Floor load limits are doubled","The arm values for each position differ — the load plan must reflect the actual configuration","It can carry more fuel","It requires fewer tie-down chains"], correct:1 },
    { id:"ac17i-6", question:"For an oversize cargo item spanning multiple pallet positions, the arm value used in W&B calculations is:", options:["The arm of the forward pallet position","The actual item CG position measured or obtained from the shipper","The average of all positions spanned","The arm of the heaviest single pallet position"], correct:1 },
    { id:"ac17i-7", question:"On a C-17 max-payload mission, available fuel is constrained by MTOW. The calculation is:", options:["MTOW minus fuel equals maximum payload","MTOW minus OW minus payload equals maximum fuel","MTOW plus payload equals maximum fuel","Fuel is not constrained by MTOW"], correct:1 },
    { id:"ac17i-8", question:"Emergency load shift response requires the loadmaster to first:", options:["Attempt to re-secure the load before notifying crew","Report to the aircraft commander on interphone with nature, weight, position and restraint status of the shift","Reduce aircraft speed by adjusting throttles","Secure all loose items in the cargo compartment"], correct:1 },
    { id:"ac17i-9", question:"The C-17 door height is approximately:", options:["8 feet","10 feet","12 feet 2 inches","15 feet"], correct:2 },
    { id:"ac17i-10", question:"During multi-segment C-17 missions, CG must be verified at each departure because:", options:["Fuel burn moves CG significantly between legs","Offloading cargo changes both weight and CG position — previous calculation may no longer be valid","ATIS requires a new W&B for each flight","Aircraft OW changes between legs"], correct:1 }
  ]},
  "c17-advanced": { questions: [
    { id:"ac17a-1", question:"When preparing the C-17 for an emergency landing, all cargo must be verified against loads of:", options:["3G vertical","6G vertical","9G vertical (crash-worthy design assumption)","1G vertical"], correct:2 },
    { id:"ac17a-2", question:"For a C-17 ditching preparation, the loadmaster's responsibilities include:", options:["Calculating new W&B for water landing","Life raft deployment sequence and exit priority briefing","Closing all cargo doors from inside","Activating ELT from the cargo compartment"], correct:1 },
    { id:"ac17a-3", question:"A decompression at altitude requires the loadmaster to don oxygen within:", options:["30 seconds","15 seconds","5 seconds","60 seconds"], correct:2 },
    { id:"ac17a-4", question:"Post-incident, a loadmaster must complete an Air Safety Occurrence Report within:", options:["7 days","72 hours","24 hours","48 hours"], correct:2 },
    { id:"ac17a-5", question:"Emergency jettison authority rests with:", options:["The loadmaster — they can execute without command authority","The aircraft commander — the loadmaster executes on order","ATC — they must authorise the drop zone","The safety officer on the ground"], correct:1 },
    { id:"ac17a-6", question:"When a DG container is breached in the C-17 cargo bay, the loadmaster's report to crew must include:", options:["Estimated repair time","Nature of the emergency, location, severity, and immediate action taken","Cargo value and consignee details","Weight of spilled material only"], correct:1 },
    { id:"ac17a-7", question:"Class B fire (flammable liquid) in the cargo bay must NOT be extinguished with:", options:["Halon 1211","CO₂","Water","Dry powder"], correct:2 },
    { id:"ac17a-8", question:"An AED (automated external defibrillator) is located in the C-17:", options:["Flight deck only","Cargo compartment","Forward crew station","External access panel only"], correct:1 },
    { id:"ac17a-9", question:"The loadmaster's role during passenger evacuation is:", options:["First to exit to direct passengers from outside","Last to exit — directs all passengers to exits before leaving","Remains at the forward station throughout","Exits via crew door only regardless of passenger status"], correct:1 },
    { id:"ac17a-10", question:"For a classified DG spill (e.g. toxic material from a classified source), the loadmaster:", options:["Must not attempt to handle or repackage — advise the aircraft commander and contact specialist response","Can repackage using standard spill kit","Must jettison immediately without aircraft commander authority","Seals the cargo area and continues the mission"], correct:0 }
  ]},
  "c130-intermediate": { questions: [
    { id:"ac130i-1", question:"Engine-running offload (ERO) on the C-130 must be completed:", options:["With engines shut down for safety","With loadmaster receiving co-pilot assistance throughout","Single-handed by the loadmaster while the crew holds position with engines running","With full ground support team present"], correct:2 },
    { id:"ac130i-2", question:"For a C-130 CDS drop, static lines are connected before departure because:", options:["Static lines cannot be attached in flight","They reduce drag during the drop","This allows pre-drop rigging checks to be completed on the ground","ICAO requires pre-rigging for all cargo drops"], correct:2 },
    { id:"ac130i-3", question:"At low level (under 500 feet AGL), the C-130 loadmaster must be:", options:["Free to inspect cargo at any time","Seated and belted — inspection during extreme low-level manoeuvring is unsafe","Standing at the ramp to observe the DZ","At the door controlling extraction chutes"], correct:1 },
    { id:"ac130i-4", question:"The NVG field of view is approximately:", options:["180° — equivalent to binocular vision","90°","40°","120°"], correct:2 },
    { id:"ac130i-5", question:"For LAPES, the incorrect size of extraction parachute is critical because:", options:["An oversized chute increases altitude during extraction","Incorrect chute sizing affects extraction force and platform attitude, risking aircraft control loss","Smaller chutes deploy faster, reducing risk","Platform attitude has no effect on safety"], correct:1 },
    { id:"ac130i-6", question:"At a C-130 austere airfield, before loading begins the loadmaster must:", options:["Confirm weather only","Survey the surface for obstacles, soft spots, and debris that could damage the aircraft or ramp","Obtain ATC clearance for loading","Brief ground crew on standard pallet weights"], correct:1 },
    { id:"ac130i-7", question:"Personnel airdrop via C-130 static-line requires anchor cables installed because:", options:["Anchor cables support the ramp during static-line operations","Static lines attach to anchor cables, which deploy the parachute as jumpers exit","Anchor cables prevent door damage during opening","They are required by manufacturer technical order only"], correct:1 },
    { id:"ac130i-8", question:"The passing score for the C-130 tactical operations module assessment is:", options:["70%","75%","80%","85%"], correct:2 },
    { id:"ac130i-9", question:"Combat offload uses aircraft momentum to deliver cargo. This technique is used when:", options:["Ground equipment is fully available","Pallets are too heavy for manual handling","No mechanical handling equipment is available at the airfield","Air traffic control requires expedited off-load"], correct:2 },
    { id:"ac130i-10", question:"For NVG cargo compartment lighting, the correct approach is:", options:["Full white light throughout","NVG-compatible blue-green filtered lighting at the level that preserves NVG image without losing restraint visibility","Complete darkness — loadmaster uses own NVGs only","Red lighting only — white and blue-green degrade NVGs"], correct:1 }
  ]},
  "c130-advanced": { questions: [
    { id:"ac130a-1", question:"A C-130 covert load plan weight must be:", options:["Estimated if cargo identity cannot be confirmed","Accurate, measured by direct weighing — estimated weights are unacceptable for covert loads","Omitted from the manifest for operational security","Based solely on standard pallet weight tables"], correct:1 },
    { id:"ac130a-2", question:"When a joint special operations authority directs the C-130 loadmaster to shortcut safety procedures, the correct response is:", options:["Comply — operational urgency outweighs safety in combat","Resist and escalate to the aircraft commander — safety requirements are non-negotiable","Comply but document post-flight","Request written authority before complying"], correct:1 },
    { id:"ac130a-3", question:"NVG depth perception is reduced because:", options:["NVGs amplify light, which flattens image contrast","Image intensifier tubes produce a monocular image within a 40° field of view, eliminating binocular depth cues","NVGs have lower resolution than human vision","Night air is denser, scattering light"], correct:1 },
    { id:"ac130a-4", question:"During low-level special operations, pallet restraint pre-check is critical because:", options:["Low-level turbulence can cause pallet movement if devices are not at full tension","Pallet locks automatically disengage below 500 feet AGL","The floor roller system is inactive at low altitude","Restraint chains are not rated for G-loads below 1,000 feet"], correct:0 },
    { id:"ac130a-5", question:"For maritime insertion via rubber raiding craft airdrop from the C-130, the loadmaster must:", options:["Only confirm craft deflation before loading","Confirm rigging integrity, water activation systems, and coordinate with the inserting unit on deployment sequence","Ensure craft is fully inflated for airdrop","Delegate all rigging to the special forces unit"], correct:1 },
    { id:"ac130a-6", question:"The C-130 can support HAHO and HALO operations via its paratroop doors. What distinguishes HALO from HAHO?", options:["HALO uses parachutes, HAHO does not","HALO involves free-fall from high altitude with low opening; HAHO involves high opening with long canopy glide","They are identical in all operational respects","HAHO is only used over water, HALO over land"], correct:1 },
    { id:"ac130a-7", question:"Sensitive site exploitation (SSE) support from the C-130 requires the loadmaster to:", options:["Handle classified materials from the site without cleared authority","Ensure chain of custody for any SSE material brought aboard and confirm the loadmaster's clearance level matches the classification","Disregard clearance requirements — operational tempo takes priority","Accept all materials on verbal authority only"], correct:1 },
    { id:"ac130a-8", question:"In an unconventional warfare support mission, cargo described only as 'equipment' on the manifest requires the loadmaster to:", options:["Accept the description — operational security precludes further details","Obtain weight confirmation from a cleared source and verify DG classification even if the description is sanitised","Reject the load — unidentified cargo cannot be carried","Increase tie-down density to compensate for unknown weight distribution"], correct:1 },
    { id:"ac130a-9", question:"During a GALZ (ground assault landing zone) operation, turnaround time is measured in seconds. The pre-planned offload sequence allows:", options:["Any order — speed is the priority","Cargo to be offloaded in reverse delivery order, pre-planned before arrival","Ground crew to determine sequence on arrival","The aircraft commander to direct sequence from the flight deck"], correct:1 },
    { id:"ac130a-10", question:"NVG qualification for C-130 loadmasters is separate from pilot NVG qualification. This is because:", options:["Loadmasters use different NVG equipment","Loadmaster NVG use includes cargo handling tasks (ramp guidance, restraint checks) not evaluated in pilot NVG courses","They operate on different frequencies","Loadmaster NVGs must be military-specification only"], correct:1 }
  ]},
  "kc30a-intermediate": { questions: [
    { id:"akc30i-1", question:"Mixed passenger/cargo configuration on the KC30-A requires the passenger/cargo divider to be:", options:["A curtain for easy reconfiguration","A structural barrier to prevent cargo movement reaching passengers in deceleration","A rope or strap across the door","A safety net only"], correct:1 },
    { id:"akc30i-2", question:"Classified cargo aboard the KC30-A during a VIP mission requires a Security Receipt because:", options:["VIP flights have lower security classification","The Security Receipt provides chain of custody from releasing authority to receiving authority — it travels with the aircraft, not in general files","Security Receipts are only required for classified passengers","KC30-A manifests automatically classify all cargo"], correct:1 },
    { id:"akc30i-3", question:"In AEROMED configuration, the loadmaster's loading sequence is determined by:", options:["Loadmaster — heaviest patient always loads first","The medical team — based on clinical priority","Alphabetical order of patient names","Aircraft CG requirements alone"], correct:1 },
    { id:"akc30i-4", question:"Lower hold LD3 containers on the KC30-A cannot be accessed during flight. This means:", options:["Dangerous goods can be placed in lower hold without restriction","All lower hold cargo must be complete and compliant before departure — no in-flight adjustment is possible","Loadmaster can access them via a pressurised access hatch","Container weight limits are relaxed since the hold is inaccessible"], correct:1 },
    { id:"akc30i-5", question:"KC30-A DG cargo must be evaluated for compatibility with the aircraft's fuel system because:", options:["ICAO requires this check for all commercial aircraft","Class 3 flammable liquids and Class 2 flammable gases must be positioned away from fuel system access points and vents","DG regulations do not apply to tanker aircraft","Fuel interactions only occur if DG is in the lower hold"], correct:1 },
    { id:"akc30i-6", question:"For KC30-A VIP configuration, the loadmaster obtains an updated OW extract because:", options:["Standard OW always applies regardless of cabin fit","VIP cabin equipment changes the actual operating weight and CG — standard OW may not be accurate","OW extracts are only needed for cargo missions","VIP passengers are heavier than standard passengers"], correct:1 },
    { id:"akc30i-7", question:"Lateral CG in KC30-A mixed passenger/cargo configuration is uncertain because:", options:["Cargo is always loaded on one side","Passengers move during flight and don't remain at assigned seats, affecting lateral weight distribution","Aircraft type is symmetric so lateral CG is not calculated","Lateral CG is managed by the fuel system only"], correct:1 },
    { id:"akc30i-8", question:"Maximum cargo cross-section must be verified before loading large items into the KC30-A because:", options:["The KC30-A cargo door is narrower than a C-17 door — C-17 standard configurations may not fit","Customs regulations require dimensional verification","ICAO requires cross-section documentation for all cargo","Oversized cargo requires a different LD3 container specification"], correct:0 },
    { id:"akc30i-9", question:"A KC30-A carrying Class 1 explosives with passengers embarked:", options:["Is permitted if the explosives are in sealed military packaging","Is permitted only for Divisions 1.4 and 1.6 with specific approval","Is prohibited — Class 1 is prohibited when passengers are aboard","Is at the aircraft commander's discretion"], correct:2 },
    { id:"akc30i-10", question:"The KC30-A refuelling boom provides approximately how much fuel flow per minute compared to probe-and-drogue pods?", options:["Same rate as drogue pods","Significantly higher flow rate (up to 1,000 litres/min more) due to larger pipe diameter","Half the drogue rate","The two systems cannot be compared as they operate at different altitudes"], correct:1 }
  ]},
  "c27j-intermediate": { questions: [
    { id:"ac27i-1", question:"C-27J short-field performance tables are calculated for specific conditions. Using tables without adjustment at a high-altitude hot-day airstrip will:", options:["Overestimate performance — actual ground roll will be longer than tables predict","Underestimate performance — the aircraft will exceed expectations","Produce identical results — tables cover all conditions","Only affect fuel burn, not ground roll"], correct:0 },
    { id:"ac27i-2", question:"When the C-27J cannot physically weigh NGO humanitarian cargo, the loadmaster should:", options:["Accept shipper label weights — they are legally binding","Visually estimate weight from cargo volume","Refuse the load until the shipper provides certified weight documents","Measure and physically weigh cargo directly rather than relying on incomplete manifests"], correct:3 },
    { id:"ac27i-3", question:"For a C-27J mountain airstrip with no fuelling, the loadmaster's departure weight planning must ensure:", options:["Maximum payload regardless of distance","Payload does not exceed the performance-limited takeoff weight for altitude, temperature, and runway length conditions","Fuel reserve is not required below 3,000 m AMSL","Only the pilot calculates mountain performance"], correct:1 },
    { id:"ac27i-4", question:"C-27J AEROMED loading sequence is determined by:", options:["Loadmaster — heaviest patient first","CG requirements — forward patients first","The medical team based on clinical priority and clinical condition","The aircraft commander based on patient rank"], correct:2 },
    { id:"ac27i-5", question:"During a C-27J ERO (engine-running offload), pallet movement uses gravity rollers rather than PDUs. This means:", options:["Pallets move faster and require less effort","Pallets require manual physical handling and the loadmaster must pace work to avoid injury within the time requirement","No manual effort is required","PDUs are available on C-27J — they just have a different switch location"], correct:1 },
    { id:"ac27i-6", question:"The C-27J's 'last tactical mile' role is enabled by its ability to operate from airstrips inaccessible to:", options:["All other RAAF aircraft including the King Air","C-130, C-17, and KC30-A — airstrips too short, narrow, or rough for those types","Only civilian aircraft — RAAF types can use the same strips","Rotary wing aircraft in most cases"], correct:1 },
    { id:"ac27i-7", question:"A surface assessment before C-27J operations at an unprepared strip must specifically identify:", options:["Weather conditions and visibility only","Obstacles, soft spots, debris, and whether the surface can support the aircraft's ground loads without wheel sink","Fuel availability and communications","Civilian air traffic in the circuit"], correct:1 },
    { id:"ac27i-8", question:"C-27J special forces insertion missions may change the drop zone or airdrop mode in-flight. This requires the loadmaster to:", options:["Refuse in-flight changes — all mission parameters must be fixed on the ground","Reconfigure the cargo compartment rapidly and accurately under time pressure with minimal lighting","Accept changes only if the aircraft commander authorises in writing","Contact mission control before accepting any change"], correct:1 },
    { id:"ac27i-9", question:"Litter bracket load-testing in C-27J AEROMED configuration is the loadmaster's responsibility because:", options:["Brackets are installed by maintenance — the loadmaster only needs to count them","Incorrect bracket installation could fail under patient weight during turbulence — the loadmaster must verify installation and load-test before acceptance","Brackets are self-certifying with tamper seals","Medical crew are responsible for all AEROMED equipment"], correct:1 },
    { id:"ac27i-10", question:"C-27J humanitarian operations typically require improvised restraint because:", options:["Standard pallets are not approved for C-27J","Humanitarian cargo frequently arrives non-palletised and requires the loadmaster to devise compliant restraint solutions","Improvised restraint is always superior to standard tie-down chains","Standard restraint regulations do not apply to humanitarian flights"], correct:1 }
  ]},
  "all-intermediate": { questions: [
    { id:"aalli-1", question:"The loadmaster's responsibility for dangerous goods acceptance cannot be:", options:["Shared with the aircraft commander","Delegated — the loadmaster is the sole authority for DG acceptance on the aircraft","Verified against the shipper's declaration","Extended to passenger manifest verification"], correct:1 },
    { id:"aalli-2", question:"UN hazard Class 5 (oxidising substances) must be segregated from Class 3 (flammable liquids) because:", options:["Both produce corrosive gases when combined","Oxidisers release oxygen that accelerates combustion of flammable liquids in the event of a breach","They share the same UN numbers and cause manifest confusion","Their vapour pressures are incompatible at altitude"], correct:1 },
    { id:"aalli-3", question:"A Shipper's Declaration for Dangerous Goods must be completed by:", options:["The loadmaster who accepts the cargo","The consignor (shipper) — the loadmaster's role is verification, not completion","The aircraft commander","The unit safety officer"], correct:1 },
    { id:"aalli-4", question:"Under ICAO Annex 18, Australia holds limited reservations. This means:", options:["Military flights are exempt from all ICAO DG standards","Narrow exceptions exist, but core safety requirements still apply to military operations","Military flights can transport any DG class without restriction","Reservations allow military flights to ignore all ICAO standards"], correct:1 },
    { id:"aalli-5", question:"A classified consignment with a security classification exceeding the loadmaster's clearance requires:", options:["The loadmaster to deny the load entirely","A cleared escort to be assigned — the loadmaster manages transport logistics only, not physical access to contents","The loadmaster to upgrade their clearance before departure","Verbal authority from the aircraft commander"], correct:1 },
    { id:"aalli-6", question:"The 'most restrictive regulation applies' rule means:", options:["Military regulations always take precedence over ICAO","Whichever applicable regulation (international, national, or defence) is most restrictive governs the action","Only the most recently published regulation applies","Regulations are applied in alphabetical order by publication title"], correct:1 },
    { id:"aalli-7", question:"Transport Index (TI) for Class 7 radioactive material determines:", options:["Dose rate at one metre from the package surface, used to calculate required separation distance","Package weight only","Whether the material requires special handling gloves","Packaging group (I, II, or III)"], correct:0 },
    { id:"aalli-8", question:"Physical tampering evidence on a SECRET cargo container requires the loadmaster to:", options:["Reseal with available materials and note on manifest","Report to the aircraft commander and unit Security Officer, cease further handling, and document the discrepancy","Continue the mission — post-flight reporting is sufficient","Jettison the container to prevent compromise"], correct:1 },
    { id:"aalli-9", question:"Load plan approval cannot be shortcut because:", options:["Shortcuts are permitted in genuine emergencies without documentation","Time pressure is the most common reason for shortcuts and the most common precursor to load-related accidents — it must not override the approval chain","Approval is an administrative formality with no safety significance","The aircraft commander can waive the approval chain on their own authority"], correct:1 },
    { id:"aalli-10", question:"W&B certification lapses when:", options:["The loadmaster transfers to a different base","The holder does not perform the minimum number of load planning tasks within the defined currency period","Certification auto-expires annually regardless of activity","An aircraft type conversion occurs"], correct:1 }
  ]},
  "all-advanced": { questions: [
    { id:"aalla-1", question:"For a mission with fuel in-flight refuelling, the loadmaster must calculate CG at which fuel states?", options:["At departure only","Pre-refuelling (lightest) and post-refuelling (heaviest) — aircraft must remain in envelope through the refuelling window","At max fuel and min fuel only","The fuel system auto-manages CG — no loadmaster action required"], correct:1 },
    { id:"aalla-2", question:"Multi-aircraft load optimisation begins with:", options:["Assigning cargo randomly to reduce planning time","Categorising all cargo by weight, dimensions, priority class, and destination before building a load manifesting matrix","Filling each aircraft to maximum payload regardless of destination","Prioritising the heaviest cargo in all cases"], correct:1 },
    { id:"aalla-3", question:"The primary goal of an Air Safety Occurrence Report (ASOR) is:", options:["To assign blame to responsible parties","To provide a factual record enabling investigation, trend analysis, and future accident prevention","To satisfy legal liability requirements only","To demonstrate the loadmaster followed all procedures correctly"], correct:1 },
    { id:"aalla-4", question:"The W&B quality assurance cross-check requires the checker to:", options:["Simply sign the form after the loadmaster's review","Independently verify operating weight currency, cargo weights against the manifest, arm values for each position, and arithmetic","Confirm the cargo type only","Verify fuel weight only — cargo is the loadmaster's sole responsibility"], correct:1 },
    { id:"aalla-5", question:"Emergency jettison of dangerous goods is:", options:["Standard procedure for any DG incident","Never permitted under any circumstances","Only carried out as a last resort when the alternative is aircraft loss — coordinated with ATC for hazard notification","At the loadmaster's discretion without aircraft commander involvement"], correct:2 },
    { id:"aalla-6", question:"For cargo jettison on the aircraft commander's order, the loadmaster's sequence is:", options:["Brief the commander, remove restraints, position cargo at ramp, confirm drop zone clear, release on order","Request ATC approval, remove restraints, release immediately","Confirm gross weight, jettison, document post-flight","Alert passengers, open door, push cargo out"], correct:0 },
    { id:"aalla-7", question:"On a multi-stop mission, removing a heavy aft pallet at an intermediate stop will shift CG:", options:["Aft — removing aft weight moves CG forward","Forward — removing aft weight removes a rearward moment, shifting CG forward","No change — other cargo compensates","Laterally, not longitudinally"], correct:1 },
    { id:"aalla-8", question:"For coalition airlift, the load planner must comply with:", options:["Only RAAF regulations — coalition partners accept Australian standards","Both the receiving nation's load plan requirements and RAAF safety standards — the most restrictive applies","Only the host nation's regulations for flights in their airspace","Coalition agreements exempt military flights from all DG regulations"], correct:1 },
    { id:"aalla-9", question:"Automated load planning tools (JMAPS, AALPS) have limitations including:", options:["They cannot calculate W&B for any aircraft type","They rely on accurate input data, may not account for physical compartment constraints, and outputs must be loadmaster-verified","They are only available for C-17 operations","They replace the need for loadmaster W&B qualification"], correct:1 },
    { id:"aalla-10", question:"In flight, when multiple restraint devices have failed on one load, the loadmaster's first priority is:", options:["Attempting to re-secure the cargo before notifying crew","Notifying the aircraft commander that the load is unrestrained, providing position and weight estimate, enabling crew to take appropriate flight action","Evacuating passengers from the cargo compartment","Reducing aircraft speed by interphone request to crew"], correct:1 }
  ]}
}

function getAssessmentData(module: any, contentKey: string): AssessmentData | null {
  if (moduleAssessmentData[contentKey]) return moduleAssessmentData[contentKey]
  const aircraft = module?.aircraft || "all"
  const difficulty = module?.difficulty || "beginner"
  const titleLower = (module?.title || "").toLowerCase()
  if (aircraft === "all") {
    if (difficulty === "beginner") return aircraftAssessmentData["all-beginner"] || null
    if (difficulty === "advanced" || difficulty === "expert") return aircraftAssessmentData["all-advanced"] || null
    return aircraftAssessmentData["all-intermediate"] || null
  }
  const key = `${aircraft}-${difficulty}`
  if (aircraftAssessmentData[key]) return aircraftAssessmentData[key]
  // fallback by aircraft
  if (aircraft === "c17") return aircraftAssessmentData["c17-intermediate"] || null
  if (aircraft === "c130") return aircraftAssessmentData["c130-intermediate"] || null
  if (aircraft === "kc30a") return aircraftAssessmentData["kc30a-intermediate"] || null
  if (aircraft === "c27j") return aircraftAssessmentData["c27j-intermediate"] || null
  return aircraftAssessmentData["all-intermediate"] || null
}

export default function ModuleDetailPage() {
  const [, params] = useRoute('/training-modules/:id')
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const { user } = useIsolatedAuth()
  const [currentTab, setCurrentTab] = useState('overview')
  const [moduleProgress, setModuleProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])

  // Auto-load squadron from the user's license — squadron is never user-editable on submissions
  const { data: userSquadronData } = useQuery<{ squadron: string | null }>({
    queryKey: ["/api/user/squadron"],
  })
  const userSquadron = (() => {
    const sq = (userSquadronData as any)?.squadron;
    return sq && sq !== 'AMG' ? sq : '33SQN';
  })()

  // Quiz tab state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizSquadron, setQuizSquadron] = useState('33SQN')
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState<number | null>(null)
  const [quizResults, setQuizResults] = useState<{ questionId: string; isCorrect: boolean; correctAnswer: string; yourAnswer: string; questionText: string }[]>([])
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const quizResultsRef = useRef<HTMLDivElement>(null)

  // Sync both submission squadron values from user's license when data loads
  useEffect(() => {
    if (userSquadron) {
      setQuizSquadron(userSquadron)
      setAssessmentSquadron(userSquadron)
    }
  }, [userSquadron])

  // Assessment tab state
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>({})
  const [assessmentSquadron, setAssessmentSquadron] = useState('33SQN')
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false)
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<{ questionId: string; isCorrect: boolean; correctAnswer: string; yourAnswer: string; questionText: string }[]>([])
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false)
  const assessmentResultsRef = useRef<HTMLDivElement>(null)

  // Expanded readings state
  const [expandedReadings, setExpandedReadings] = useState<string[]>([])
  
  // Force background color on component mount and prevent blue backgrounds
  useEffect(() => {
    // Apply to document elements
    const elements = [document.documentElement, document.body];
    elements.forEach(el => {
      el.style.setProperty('background-color', '#1e1e1e', 'important');
      el.style.setProperty('background-image', 'none', 'important');
      el.style.setProperty('background', '#1e1e1e', 'important');
    });
    
    // Clean up on unmount
    return () => {
      elements.forEach(el => {
        el.style.removeProperty('background-color');
        el.style.removeProperty('background-image');
        el.style.removeProperty('background');
      });
    };
  }, []);
  
  // Fetch training modules from API
  const { data: apiModules } = useQuery({
    queryKey: ['/api/training-modules'],
    queryFn: async () => {
      const response = await fetch('/api/training-modules')
      if (!response.ok) throw new Error('Failed to fetch training modules')
      return response.json()
    },
  })

  // Use API data if available, otherwise fallback to local data
  const modules = apiModules || trainingModules
  
  // Find the module that matches the ID parameter (convert to number if needed)
  const moduleId = params?.id || ''
  const numericId = parseInt(moduleId)
  const module = modules.find(m => m.id === numericId || m.id === moduleId)

  // Fetch uploaded videos for this specific module
  const { data: uploadedVideos } = useQuery({
    queryKey: ['/api/training-modules', module?.id, 'videos'],
    queryFn: async () => {
      if (!module?.id || typeof module.id !== 'number') return []
      const response = await fetch(`/api/training-modules/${module.id}/videos`)
      if (!response.ok) return []
      return response.json()
    },
    enabled: !!module?.id && typeof module.id === 'number',
  })

  // Fetch this module's DB content items (quiz/assessment/reading created in the instructor portal)
  const { data: singleModuleData } = useQuery({
    queryKey: ['/api/training-modules', numericId],
    queryFn: async () => {
      const response = await fetch(`/api/training-modules/${numericId}`)
      if (!response.ok) return null
      return response.json()
    },
    enabled: !isNaN(numericId),
  })

  // Fetch available quizzes for quiz/assessment buttons
  const { data: availableQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: async () => {
      const response = await fetch('/api/quizzes')
      if (!response.ok) return []
      return response.json()
    },
  })

  // Generate dynamic content from module topics when no hardcoded content exists
  const generateDynamicContent = (mod: any) => {
    if (!mod || !mod.topics || !Array.isArray(mod.topics)) return []
    
    const dynamicContent: any[] = []
    const topics = mod.topics as string[]
    
    // Generate reading content from topics
    topics.forEach((topic: string, index: number) => {
      dynamicContent.push({
        id: `${mod.id}-reading-${index}`,
        title: topic,
        type: 'reading',
        duration: `${10 + (index * 2)} min`,
        description: `Study materials covering ${topic.toLowerCase()}`,
        content: `This section covers ${topic}. The content includes detailed explanations, diagrams, and examples relevant to ${mod.title}.`,
        completed: false
      })
    })
    
    // Add a video lesson
    dynamicContent.push({
      id: `${mod.id}-video-intro`,
      title: `${mod.title} - Video Overview`,
      type: 'video',
      duration: '20 min',
      description: `Video introduction and demonstration for ${mod.title}`,
      content: 'Video content covering key concepts and practical demonstrations',
      completed: false
    })
    
    // Add quiz
    dynamicContent.push({
      id: `${mod.id}-quiz`,
      title: `${mod.title} Knowledge Quiz`,
      type: 'quiz',
      duration: '25 min',
      description: `Test your understanding of ${mod.title.toLowerCase()} concepts`,
      content: 'Quiz questions to assess your knowledge',
      completed: false
    })
    
    // Add assessment
    dynamicContent.push({
      id: `${mod.id}-assessment`,
      title: `${mod.title} Final Assessment`,
      type: 'assessment',
      duration: '45 min',
      description: `Comprehensive assessment for ${mod.title}`,
      content: 'Final assessment covering all module topics',
      completed: false
    })
    
    return dynamicContent
  }

  // Map API module IDs to content keys
  const getContentKey = (mod: any) => {
    if (!mod) return ''
    if (typeof mod.id === 'number') {
      const aircraft = mod.aircraft
      const difficulty = mod.difficulty
      if (aircraft === 'c17') {
        if (difficulty === 'beginner') return 'c17-basics'
        if (difficulty === 'intermediate') return 'c17-intermediate'
        if (difficulty === 'advanced') return 'c17-advanced'
        if (difficulty === 'expert') return 'c17-expert'
      }
      if (aircraft === 'c130') {
        if (difficulty === 'beginner') return 'c130-basics'
        if (difficulty === 'intermediate') return 'c130-intermediate'
        if (difficulty === 'advanced') return 'c130-advanced'
        if (difficulty === 'expert') return 'c130-expert'
      }
      if (aircraft === 'kc30a') {
        if (difficulty === 'beginner') return 'kc30a-basics'
        if (difficulty === 'intermediate') return 'kc30a-intermediate'
        if (difficulty === 'advanced') return 'kc30a-advanced'
        if (difficulty === 'expert') return 'kc30a-expert'
      }
      if (aircraft === 'c27j') {
        if (difficulty === 'beginner') return 'c27j-basics'
        if (difficulty === 'intermediate') return 'c27j-intermediate'
        if (difficulty === 'advanced') return 'c27j-advanced'
        if (difficulty === 'expert') return 'c27j-expert'
      }
      if (aircraft === 'all' || !aircraft) {
        if (difficulty === 'beginner') return 'all-beginner'
        if (difficulty === 'intermediate') return 'all-intermediate'
        if (difficulty === 'advanced') return 'all-advanced'
        if (difficulty === 'expert') return 'all-expert'
      }
    }
    return mod.id || ''
  }

  // Get lesson content - use hardcoded if available, otherwise generate from topics
  const contentKey = getContentKey(module)
  const hardcodedContent = moduleContents[contentKey] || []
  const content = hardcodedContent.length > 0 ? hardcodedContent : generateDynamicContent(module)

  // Parse DB-stored quiz/assessment/reading content items (created via instructor portal)
  const parseDbQuestion = (item: any) => {
    try {
      const raw = item.content
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!parsed?.question) return null
      return {
        id: `db-${item.id}`,
        question: parsed.question as string,
        options: Array.isArray(parsed.options) ? parsed.options as string[] : ['', '', '', ''],
        correct: typeof parsed.correct === 'number' ? parsed.correct : 0,
        explanation: (parsed.explanation as string) || ''
      }
    } catch {
      return null
    }
  }
  const dbContent: any[] = singleModuleData?.content || []
  const dbQuizQuestions = dbContent.filter((i: any) => i.type === 'quiz').map(parseDbQuestion).filter(Boolean) as NonNullable<ReturnType<typeof parseDbQuestion>>[]
  const dbAssessmentQuestions = dbContent.filter((i: any) => i.type === 'assessment').map(parseDbQuestion).filter(Boolean) as NonNullable<ReturnType<typeof parseDbQuestion>>[]
  const dbReadingItems = dbContent.filter((i: any) => i.type === 'reading')

  const completeLesson = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      const newCompleted = [...completedLessons, lessonId]
      setCompletedLessons(newCompleted)
      
      // Calculate progress
      const progress = (newCompleted.length / content.length) * 100
      setModuleProgress(progress)

      toast({
        title: "Lesson completed!",
        description: "Your progress has been saved.",
      })
    }
  }

  // Quiz handlers
  const handleQuizSubmit = () => {
    const questions = dbQuizQuestions.length > 0 ? dbQuizQuestions : (moduleQuizData[contentKey]?.questions || [])
    if (questions.length === 0) return

    if (Object.keys(quizAnswers).length < questions.length) {
      toast({
        title: "Incomplete quiz",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      })
      return
    }

    setQuizSubmitting(true)
    setTimeout(() => {
      let correct = 0
      const results = questions.map(q => {
        const answeredIndex = parseInt(quizAnswers[q.id] || "-1")
        const isCorrect = answeredIndex === q.correct
        if (isCorrect) correct++
        return {
          questionId: q.id,
          questionText: q.question,
          isCorrect,
          yourAnswer: q.options[answeredIndex] || "No answer",
          correctAnswer: q.options[q.correct]
        }
      })
      const score = Math.round((correct / questions.length) * 100)
      setQuizScore(score)
      setQuizResults(results)
      setQuizSubmitted(true)
      setQuizSubmitting(false)
      toast({
        title: "Quiz Submitted!",
        description: `You scored ${score}% (${correct}/${questions.length} correct)`,
      })
      setTimeout(() => {
        quizResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 600)
  }

  const resetQuiz = () => {
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(null)
    setQuizResults([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Assessment handlers
  const handleAssessmentSubmit = async () => {
    const questions = dbAssessmentQuestions.length > 0 ? dbAssessmentQuestions : (getAssessmentData(module, contentKey)?.questions || [])
    if (questions.length === 0) return

    if (Object.keys(assessmentAnswers).length < questions.length) {
      toast({
        title: "Incomplete assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      })
      return
    }

    setAssessmentSubmitting(true)
    setTimeout(async () => {
      let correct = 0
      const results = questions.map(q => {
        const answeredIndex = parseInt(assessmentAnswers[q.id] || "-1")
        const isCorrect = answeredIndex === q.correct
        if (isCorrect) correct++
        return {
          questionId: q.id,
          questionText: q.question,
          isCorrect,
          yourAnswer: q.options[answeredIndex] || "No answer",
          correctAnswer: q.options[q.correct]
        }
      })
      const score = Math.round((correct / questions.length) * 100)
      const passed = score >= 80

      setAssessmentScore(score)
      setAssessmentResults(results)
      setAssessmentSubmitted(true)
      setAssessmentSubmitting(false)

      toast({
        title: passed ? "Assessment Passed!" : "Assessment Not Passed",
        description: `You scored ${score}% (${correct}/${questions.length} correct). ${passed ? "Result saved to your profile." : "You need 80% to pass. Try again after reviewing the material."}`,
      })

      // Post result to backend to update profile log
      try {
        await fetch('/api/training-assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            moduleId: String(module?.id || contentKey),
            moduleTitle: module?.title || 'Training Assessment',
            aircraft: module?.aircraft || 'all',
            difficulty: module?.difficulty || 'beginner',
            score,
            passed,
            totalQuestions: questions.length,
            correctCount: correct,
            squadron: assessmentSquadron,
            answers: results.map(r => ({ questionId: r.questionId, correct: r.isCorrect, yourAnswer: r.yourAnswer }))
          })
        })
      } catch {
        // Silent — score already shown locally
      }

      setTimeout(() => {
        assessmentResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }, 700)
  }

  const resetAssessment = () => {
    setAssessmentAnswers({})
    setAssessmentSubmitted(false)
    setAssessmentScore(null)
    setAssessmentResults([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Early return if module not found
  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e1e1e', backgroundImage: 'none', background: '#1e1e1e' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Module Not Found</h1>
          <p className="text-gray-300 mb-6">The training module you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/training-modules')} className="bg-primary text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Training Modules
          </Button>
        </div>
      </div>
    )
  }

  // Calculate available content types including uploaded videos
  const hasUploadedVideos = uploadedVideos && uploadedVideos.length > 0
  const staticContentTypes = [...new Set(content.map(item => item.type))]
  const contentTypes = hasUploadedVideos 
    ? [...new Set([...staticContentTypes, 'video'])] 
    : staticContentTypes

  const getAircraftName = (id: string) => {
    const config = aircraftConfigs[id]
    return config ? config.name : id
  }

  const getDifficultyStars = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 1
      case 'intermediate': return 2
      case 'advanced': return 3
      case 'expert': return 4
      default: return 1
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1e1e1e', backgroundImage: 'none', background: '#1e1e1e' }}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate('/training-modules')}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Modules
          </Button>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{module.title}</h1>
            <p className="text-gray-300 mt-1">
              {getAircraftName(module.id)} • {module.difficulty} Level
            </p>
          </div>

          <Button
            variant="outline"
            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 shrink-0"
            onClick={() => downloadModulePDF({
              title: module.title,
              description: module.description,
              aircraft: module.aircraft || module.id,
              difficulty: module.difficulty,
              duration: module.duration,
              topics: module.topics,
              objectives: module.objectives,
              content: content.map(c => ({
                title: c.title,
                type: c.type,
                duration: c.duration,
                description: c.description,
                content: c.content,
              })),
            })}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Module
          </Button>
        </div>

        {/* Progress Card */}
        <Card className="border-gray-800 mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Module Progress</CardTitle>
                <CardDescription>{Math.round(moduleProgress)}% Complete</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {completedLessons.length} / {content.length} Lessons
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={moduleProgress} className="w-full" />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Videos
            </TabsTrigger>
            <TabsTrigger value="readings" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Reading
            </TabsTrigger>
            <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Quiz
            </TabsTrigger>
            <TabsTrigger value="assessment" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Assessment
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Compact Visual Design */}
          <TabsContent value="overview">
            <div className="space-y-4">
              {/* Hero Banner Section - Compact */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
                
                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {/* Module Icon - Smaller */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                        <Plane className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    
                    {/* Module Info - Compact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2 py-0.5">
                          {getAircraftName(module.id)}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs px-2 py-0.5">
                          {module.difficulty}
                        </Badge>
                        <div className="flex items-center gap-0.5">
                          {[...Array(getDifficultyStars(module.difficulty))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                          ))}
                          {[...Array(4 - getDifficultyStars(module.difficulty))].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-gray-600" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats Row - Inline Compact */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs text-gray-300">{module.duration || '3 hours'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-gray-300">{content.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <Target className="w-3.5 h-3.5 text-orange-400" />
                      <span className="text-xs text-gray-300">80% pass</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-800/50 px-2.5 py-1 rounded border border-gray-700">
                      <Award className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-xs text-gray-300">Certificate</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Content Grid - Compact */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column - Learning Content */}
                <div className="lg:col-span-2 space-y-4">
                  {/* What You'll Learn - Compact Cards */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-800/50 to-transparent border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-orange-500/20 flex items-center justify-center">
                          <Target className="w-4 h-4 text-orange-400" />
                        </div>
                        <CardTitle className="text-white text-sm">What You'll Learn</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {module.objectives?.map((objective, index) => (
                          <div 
                            key={index} 
                            className="flex items-start gap-2 p-2.5 rounded bg-gray-800/30 border border-gray-700/50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 text-xs leading-relaxed">{objective}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Topics Preview - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-800/50 to-transparent border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-orange-500/20 flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-orange-400" />
                        </div>
                        <CardTitle className="text-white text-sm">Topics Covered</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {module.topics?.map((topic, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className="px-2 py-0.5 text-xs bg-gray-800/50 border-gray-600 text-gray-200 hover:bg-primary/20 hover:border-primary/30 hover:text-primary transition-colors cursor-default"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Course Structure - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardHeader className="py-3 px-4 bg-gradient-to-r from-gray-800/50 to-transparent border-b border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-orange-500/20 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-orange-400" />
                        </div>
                        <CardTitle className="text-white text-sm">Course Structure</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <PlayCircle className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="text-lg font-bold text-white">{content.filter(l => l.type === 'video').length || 2}</div>
                          <div className="text-xs text-gray-400">Videos</div>
                        </div>
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-gray-700/50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-gray-300" />
                          </div>
                          <div className="text-lg font-bold text-white">{content.filter(l => l.type === 'reading').length || (module.topics?.length || 5)}</div>
                          <div className="text-xs text-gray-400">Readings</div>
                        </div>
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-orange-500/20 flex items-center justify-center">
                            <FileCheck className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="text-lg font-bold text-white">{content.filter(l => l.type === 'quiz').length || 1}</div>
                          <div className="text-xs text-gray-400">Quizzes</div>
                        </div>
                        <div className="text-center p-2 rounded bg-gray-800/30 border border-gray-700/50">
                          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-yellow-500/20 flex items-center justify-center">
                            <GraduationCap className="w-4 h-4 text-yellow-400" />
                          </div>
                          <div className="text-lg font-bold text-white">1</div>
                          <div className="text-xs text-gray-400">Assessment</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Sidebar - Compact */}
                <div className="space-y-3">
                  {/* Instructor Card - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white text-sm font-medium truncate">{module.instructor || 'Squadron Instructor'}</h4>
                          <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <Star key={star} className="w-2.5 h-2.5 fill-primary text-primary" />
                            ))}
                            <span className="text-xs text-gray-400 ml-1">5.0</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="text-base font-bold text-white">150+</div>
                          <div className="text-xs text-gray-400">Students</div>
                        </div>
                        <div>
                          <div className="text-base font-bold text-white">12+</div>
                          <div className="text-xs text-gray-400">Years exp</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prerequisites & Last Updated - Combined Compact */}
                  <Card className="border-gray-800">
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-400">Prerequisites</div>
                          <p className="text-xs text-gray-300">{module.prerequisites || 'None required'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span className="text-xs text-gray-400">Updated</span>
                        <span className="text-xs text-white">{module.lastUpdated || 'Dec 2024'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Certificate Card - Compact */}
                  <Card className="border-gray-800 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-3 border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center border border-yellow-500/30">
                          <Award className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="text-white text-sm font-medium">Certificate</h4>
                          <p className="text-xs text-gray-400">Upon completion</p>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <CheckCircle2 className="w-3 h-3 text-orange-400" />
                          Complete all lessons
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <CheckCircle2 className="w-3 h-3 text-orange-400" />
                          Pass assessment (80%+)
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        className="w-full bg-primary text-white hover:bg-primary/90 text-xs"
                        disabled={moduleProgress < 100}
                        onClick={() => {
                          if (moduleProgress >= 100) {
                            toast({
                              title: "Certificate Generated!",
                              description: "Your completion certificate has been generated and saved.",
                            })
                          }
                        }}
                      >
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {moduleProgress >= 100 ? "Get Certificate" : "Complete First"}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Videos Tab Content - ALWAYS PRESENT */}
          <TabsContent value="videos">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Training Videos</CardTitle>
                <CardDescription>
                  Watch instructional videos for {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Show uploaded videos from instructor portal if available */}
                  {hasUploadedVideos ? (
                    uploadedVideos.map((video: any) => (
                      <div key={video.id} className="space-y-4">
                        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                          <h3 className="text-lg font-medium text-white mb-2">{video.videoTitle}</h3>
                          <p className="text-muted-foreground mb-4">{video.videoDescription}</p>
                          
                          {/* Video Player */}
                          <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-4">
                            <video 
                              controls 
                              className="w-full h-full rounded-lg"
                              src={`/api/training-modules/videos/stream/${video.id}`}
                            >
                              Your browser does not support video playback.
                            </video>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                              Video {video.videoOrder}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Video completed",
                                  description: "Your progress has been saved",
                                })
                              }}
                              className="bg-primary text-white hover:bg-primary/90"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Mark as Watched
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : content.filter(lesson => lesson.type === 'video').length > 0 ? (
                    /* Show existing video content if available */
                    content
                      .filter(lesson => lesson.type === 'video')
                      .map(lesson => (
                        <div key={lesson.id} className="space-y-4">
                          <TrainingVideoPlayer
                            title={lesson.title}
                            description={lesson.description}
                          />
                          
                          <div className="flex justify-between items-center">
                            <Badge variant="outline" className="bg-gray-800/20 border-gray-800/30">
                              {lesson.duration}
                            </Badge>
                            <Button 
                              size="sm"
                              onClick={() => completeLesson(lesson.id)}
                              disabled={completedLessons.includes(lesson.id)}
                              className={completedLessons.includes(lesson.id) ? "bg-orange-600 hover:bg-orange-700" : ""}
                            >
                              {completedLessons.includes(lesson.id) ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Watch Now
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    /* Default video content for all modules */
                    <div className="space-y-4">
                      <TrainingVideoPlayer 
                        title={`${module.title} - Introduction`}
                        description="Overview and introduction to the module concepts"
                      />
                      <TrainingVideoPlayer 
                        title={`${module.title} - Core Concepts`}
                        description="Detailed explanation of key principles and procedures"
                      />
                      <TrainingVideoPlayer 
                        title={`${module.title} - Practical Applications`}
                        description="Real-world scenarios and hands-on demonstrations"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Readings Tab Content — PDF page viewer */}
          <TabsContent value="readings">
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle>Reading Materials</CardTitle>
                <CardDescription>
                  Study the reading materials to deepen your understanding of {module.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* DB reading items authored by instructors (if any) */}
                  {dbReadingItems.length > 0 && dbReadingItems.map((dbLesson: any) => {
                    const lessonKey = `db-reading-${dbLesson.id}`
                    const isExpanded = expandedReadings.includes(lessonKey)
                    const isCompleted = completedLessons.includes(lessonKey)
                    const bodyText: string = typeof dbLesson.content === 'string'
                      ? dbLesson.content
                      : (dbLesson.content?.text || dbLesson.description || '')
                    return (
                      <div key={lessonKey} className="border border-gray-700 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-800/60">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded bg-orange-500/15 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{dbLesson.title}</p>
                              {dbLesson.description && <p className="text-xs text-gray-400 mt-0.5">{dbLesson.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {dbLesson.duration && (
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">{dbLesson.duration}</Badge>
                            )}
                            {isCompleted && (
                              <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Read
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                              onClick={() => setExpandedReadings(prev =>
                                prev.includes(lessonKey) ? prev.filter(id => id !== lessonKey) : [...prev, lessonKey]
                              )}
                            >
                              {isExpanded ? "Close Document" : "Read Document"}
                            </Button>
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="bg-gray-700/30 p-6">
                            <div className="mx-auto max-w-[780px] rounded-sm shadow-2xl" style={{ background: '#fafaf8', boxShadow: '0 4px 6px rgba(0,0,0,0.4), 0 10px 40px rgba(0,0,0,0.5)', border: '1px solid #d4d4d0' }}>
                              <div style={{ borderBottom: '2px solid #c2410c', background: '#1c1917', padding: '10px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#fb923c', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>LOADMworkflow — Training Module</span>
                                <span style={{ color: '#9ca3af', fontSize: '11px' }}>{module.title}</span>
                              </div>
                              <div style={{ padding: '48px 56px 56px', color: '#1c1917' }} className="reading-document">
                                <style>{`
                                  .reading-document { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.75; }
                                  .reading-document h1 { font-size: 1.5rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem; font-family: system-ui, sans-serif; border-bottom: 2px solid #c2410c; padding-bottom: 0.5rem; }
                                  .reading-document h2 { font-size: 1.15rem; font-weight: 700; color: #1c1917; margin-top: 2rem; margin-bottom: 0.6rem; font-family: system-ui, sans-serif; }
                                  .reading-document p { color: #374151; margin-bottom: 0.9rem; font-size: 0.925rem; }
                                `}</style>
                                <h1 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#1c1917', borderBottom: '2px solid #c2410c', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                                  {dbLesson.title}
                                </h1>
                                {bodyText ? bodyText.split('\n').map((para: string, pi: number) => para.trim() ? (
                                  <p key={pi} style={{ color: '#374151', marginBottom: '0.9rem', fontSize: '0.925rem', fontFamily: "'Georgia', serif", lineHeight: 1.75 }}>{para}</p>
                                ) : null) : (
                                  <p style={{ color: '#6b7280', fontStyle: 'italic', fontFamily: "'Georgia', serif" }}>No content provided for this reading material.</p>
                                )}
                              </div>
                              <div style={{ borderTop: '1px solid #e5e7eb', padding: '10px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9faf8' }}>
                                <span style={{ color: '#9ca3af', fontSize: '10px' }}>RESTRICTED — FOR TRAINING PURPOSES ONLY</span>
                                <span style={{ color: '#9ca3af', fontSize: '10px' }}>LOADMworkflow Training Platform</span>
                              </div>
                            </div>
                            <div className="flex justify-center mt-5">
                              <Button
                                onClick={() => { completeLesson(lessonKey); setExpandedReadings(prev => prev.filter(id => id !== lessonKey)) }}
                                disabled={isCompleted}
                                className={isCompleted ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}
                              >
                                {isCompleted ? <><CheckCircle2 className="h-4 w-4 mr-2" /> Already Completed</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Read</>}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Hardcoded/dynamic reading lessons (for legacy modules) */}
                  {(dbReadingItems.length === 0) && content
                    .filter(lesson => lesson.type === 'reading')
                    .map(lesson => {
                      const ReadingComponent = readingContentMap[lesson.id]
                      const isExpanded = expandedReadings.includes(lesson.id)
                      const isCompleted = completedLessons.includes(lesson.id)

                      return (
                        <div key={lesson.id} className="border border-gray-700 rounded-lg overflow-hidden">
                          {/* Document header bar */}
                          <div className="flex items-center justify-between px-5 py-4 bg-gray-800/60">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded bg-orange-500/15 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{lesson.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{lesson.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                                {lesson.duration}
                              </Badge>
                              {isCompleted && (
                                <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Read
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                                onClick={() => setExpandedReadings(prev =>
                                  prev.includes(lesson.id)
                                    ? prev.filter(id => id !== lesson.id)
                                    : [...prev, lesson.id]
                                )}
                              >
                                {isExpanded ? "Close Document" : "Read Document"}
                              </Button>
                            </div>
                          </div>

                          {/* PDF-style page viewer */}
                          {isExpanded && (
                            <div className="bg-gray-700/30 p-6">
                              {/* Page container — white paper look */}
                              <div
                                className="mx-auto max-w-[780px] rounded-sm shadow-2xl"
                                style={{
                                  background: '#fafaf8',
                                  boxShadow: '0 4px 6px rgba(0,0,0,0.4), 0 10px 40px rgba(0,0,0,0.5)',
                                  border: '1px solid #d4d4d0',
                                }}
                              >
                                {/* Page top margin with document metadata strip */}
                                <div
                                  style={{
                                    borderBottom: '2px solid #c2410c',
                                    background: '#1c1917',
                                    padding: '10px 48px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span style={{ color: '#fb923c', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    LOADMworkflow — Training Module
                                  </span>
                                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                                    {module.title}
                                  </span>
                                </div>

                                {/* Page body */}
                                <div style={{ padding: '48px 56px 56px', color: '#1c1917' }}>
                                  {ReadingComponent ? (
                                    <div
                                      style={{ color: '#1c1917' }}
                                      className="reading-document"
                                    >
                                      <style>{`
                                        .reading-document { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.75; }
                                        .reading-document h1 { font-size: 1.5rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem; font-family: system-ui, sans-serif; border-bottom: 2px solid #c2410c; padding-bottom: 0.5rem; }
                                        .reading-document h2 { font-size: 1.15rem; font-weight: 700; color: #1c1917; margin-top: 2rem; margin-bottom: 0.6rem; font-family: system-ui, sans-serif; }
                                        .reading-document h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-top: 1.25rem; margin-bottom: 0.4rem; font-family: system-ui, sans-serif; }
                                        .reading-document p { color: #374151; margin-bottom: 0.9rem; font-size: 0.925rem; }
                                        .reading-document ul, .reading-document ol { color: #374151; padding-left: 1.5rem; margin-bottom: 1rem; font-size: 0.925rem; }
                                        .reading-document li { margin-bottom: 0.35rem; }
                                        .reading-document strong { color: #1c1917; font-weight: 700; }
                                        .reading-document table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
                                        .reading-document th { background: #f3f4f6; color: #1c1917; font-weight: 700; padding: 8px 12px; border: 1px solid #d1d5db; text-align: left; }
                                        .reading-document td { padding: 7px 12px; border: 1px solid #d1d5db; color: #374151; }
                                        .reading-document tr:nth-child(even) td { background: #f9fafb; }
                                      `}</style>
                                      <ReadingComponent />
                                    </div>
                                  ) : (
                                    <div
                                      style={{ color: '#1c1917' }}
                                      className="reading-document"
                                    >
                                      <style>{`
                                        .reading-document { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.75; }
                                        .reading-document h1 { font-size: 1.5rem; font-weight: 700; color: #1c1917; margin-bottom: 0.75rem; font-family: system-ui, sans-serif; border-bottom: 2px solid #c2410c; padding-bottom: 0.5rem; }
                                        .reading-document h2 { font-size: 1.15rem; font-weight: 700; color: #1c1917; margin-top: 2rem; margin-bottom: 0.6rem; font-family: system-ui, sans-serif; }
                                        .reading-document h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-top: 1.25rem; margin-bottom: 0.4rem; font-family: system-ui, sans-serif; }
                                        .reading-document p { color: #374151; margin-bottom: 0.9rem; font-size: 0.925rem; }
                                        .reading-document ul, .reading-document ol { color: #374151; padding-left: 1.5rem; margin-bottom: 1rem; font-size: 0.925rem; }
                                        .reading-document li { margin-bottom: 0.35rem; }
                                        .reading-document strong { color: #1c1917; font-weight: 700; }
                                        .reading-document table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; }
                                        .reading-document th { background: #f3f4f6; color: #1c1917; font-weight: 700; padding: 8px 12px; border: 1px solid #d1d5db; text-align: left; }
                                        .reading-document td { padding: 7px 12px; border: 1px solid #d1d5db; color: #374151; }
                                        .reading-document tr:nth-child(even) td { background: #f9fafb; }
                                      `}</style>
                                      {getDynamicReadingJSX(
                                        module.aircraft || "all",
                                        module.difficulty || "beginner",
                                        Array.isArray(module.topics) ? module.topics : [],
                                        module.title || lesson.title
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Page footer */}
                                <div
                                  style={{
                                    borderTop: '1px solid #e5e7eb',
                                    padding: '10px 48px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#f9faf8',
                                  }}
                                >
                                  <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    RESTRICTED — FOR TRAINING PURPOSES ONLY
                                  </span>
                                  <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    LOADMworkflow Training Platform
                                  </span>
                                </div>
                              </div>

                              {/* Mark as read button below the document */}
                              <div className="flex justify-center mt-5">
                                <Button
                                  onClick={() => {
                                    completeLesson(lesson.id)
                                    setExpandedReadings(prev => prev.filter(id => id !== lesson.id))
                                  }}
                                  disabled={isCompleted}
                                  className={isCompleted ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}
                                >
                                  {isCompleted ? (
                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Already Completed</>
                                  ) : (
                                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Read</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab Content - Inline quiz matching scenarios quiz UI */}
          <TabsContent value="quiz">
            {(() => {
              const questions = dbQuizQuestions.length > 0 ? dbQuizQuestions : (moduleQuizData[contentKey]?.questions || [])

              if (questions.length === 0) {
                return (
                  <Card className="border-gray-800">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No quiz questions are available for this module yet.
                    </CardContent>
                  </Card>
                )
              }

              return (
                <>
                  <Card className="mb-8 border-gray-800">
                    <CardHeader className="bg-orange-500/10 border-b border-gray-800">
                      <CardTitle className="text-2xl font-bold text-white">Knowledge Quiz</CardTitle>
                      <CardDescription>
                        Test your understanding of {module.title} concepts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Quiz info bar */}
                      <div className="bg-card p-4 rounded-lg border border-gray-800 mb-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Quiz Information</p>
                            <ul className="text-sm text-muted-foreground">
                              <li>• {questions.length} questions</li>
                              <li>• Passing score: 70%</li>
                            </ul>
                          </div>
                          <div className="min-w-[160px]">
                            <p className="text-sm font-medium mb-1">Your Squadron</p>
                            <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/30">
                              <span className="text-sm font-semibold text-primary">{quizSquadron}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-6">
                        {questions.map((question, index) => (
                          <Card key={question.id} className="border-gray-800">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg text-white">
                                Question {index + 1}: {question.question}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <RadioGroup
                                value={quizAnswers[question.id] || ""}
                                onValueChange={(value) =>
                                  setQuizAnswers(prev => ({ ...prev, [question.id]: value }))
                                }
                              >
                                <div className="space-y-3">
                                  {question.options.map((option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                                      onClick={() =>
                                        setQuizAnswers(prev => ({ ...prev, [question.id]: optionIndex.toString() }))
                                      }
                                    >
                                      <RadioGroupItem
                                        value={optionIndex.toString()}
                                        id={`${question.id}-${optionIndex}`}
                                        className="pointer-events-none"
                                      />
                                      <Label
                                        htmlFor={`${question.id}-${optionIndex}`}
                                        className="text-base cursor-pointer flex-1 pointer-events-none"
                                      >
                                        {option}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </RadioGroup>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        {Object.keys(quizAnswers).length} of {questions.length} questions answered
                      </div>
                      <Button
                        className={`bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 ${
                          Object.keys(quizAnswers).length === questions.length ? 'opacity-100' : 'opacity-70'
                        }`}
                        disabled={quizSubmitting || Object.keys(quizAnswers).length < questions.length}
                        onClick={handleQuizSubmit}
                      >
                        {quizSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </div>
                        ) : "Submit Quiz"}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Results section */}
                  {quizSubmitted && quizScore !== null && (
                    <div ref={quizResultsRef} className="scroll-mt-8">
                      <Card className="mb-8 border-gray-800">
                        <CardHeader className={quizScore >= 70 ? "bg-orange-500/10" : "bg-red-500/10"}>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Quiz Results</CardTitle>
                            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              quizScore >= 70 ? "bg-orange-500/20 text-orange-500" : "bg-red-500/20 text-red-500"
                            }`}>
                              {quizScore >= 70 ? (
                                <><Check className="h-4 w-4 mr-1" /> Passed</>
                              ) : (
                                <><X className="h-4 w-4 mr-1" /> Failed</>
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            Quiz completed {new Date().toLocaleDateString()} · Squadron: {quizSquadron}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="mb-8 text-center">
                            <div className="text-6xl font-bold mb-2">{quizScore}%</div>
                            <p className="text-sm text-muted-foreground">
                              {quizScore >= 70
                                ? "Congratulations! You've passed this quiz."
                                : "You didn't pass this time. The passing score is 70%. Review the material and try again."}
                            </p>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold mb-2">Question Feedback</h3>
                            {quizResults.map((result, index) => (
                              <div
                                key={result.questionId}
                                className={`p-4 rounded-lg border ${
                                  result.isCorrect
                                    ? "border-orange-500/30 bg-orange-500/10"
                                    : "border-red-500/30 bg-red-500/10"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`mt-1 ${result.isCorrect ? "text-orange-500" : "text-red-500"}`}>
                                    {result.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium mb-2">Question {index + 1}: {result.questionText}</p>
                                    <p className="text-sm font-medium">Your answer: {result.yourAnswer}</p>
                                    {!result.isCorrect && (
                                      <p className="text-sm font-medium text-orange-500">
                                        Correct answer: {result.correctAnswer}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline" onClick={() => setCurrentTab('readings')}>
                            Review Material
                          </Button>
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={resetQuiz}
                          >
                            Retry Quiz
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>

          {/* Assessment Tab — inline MCQ, 80% pass, results logged to profile */}
          <TabsContent value="assessment">
            {(() => {
              const questions = dbAssessmentQuestions.length > 0 ? dbAssessmentQuestions : (getAssessmentData(module, contentKey)?.questions || [])

              if (questions.length === 0) {
                return (
                  <Card className="border-gray-800">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      No assessment questions are available for this module yet.
                    </CardContent>
                  </Card>
                )
              }

              return (
                <>
                  <Card className="mb-8 border-gray-800">
                    <CardHeader className="bg-orange-500/10 border-b border-gray-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <GraduationCap className="h-6 w-6 text-orange-400" />
                            Module Assessment
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Final assessment for {module.title}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-400">80%</div>
                          <div className="text-xs text-gray-400">Required to pass</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {/* Assessment info bar */}
                      <div className="bg-card p-4 rounded-lg border border-orange-500/20 mb-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Assessment Information</p>
                            <ul className="text-sm text-muted-foreground">
                              <li>• {questions.length} questions</li>
                              <li>• Passing score: 80% ({Math.ceil(questions.length * 0.8)}/{questions.length} correct)</li>
                              <li>• Results recorded to your profile log</li>
                              <li>• Multiple attempts permitted</li>
                            </ul>
                          </div>
                          <div className="min-w-[160px]">
                            <p className="text-sm font-medium mb-1">Your Squadron</p>
                            <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/30">
                              <span className="text-sm font-semibold text-primary">{assessmentSquadron}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-6">
                        {questions.map((question, index) => (
                          <Card key={question.id} className="border-gray-700">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base text-white">
                                <span className="text-orange-400 font-bold mr-2">Q{index + 1}.</span>
                                {question.question}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <RadioGroup
                                value={assessmentAnswers[question.id] || ""}
                                onValueChange={(value) =>
                                  setAssessmentAnswers(prev => ({ ...prev, [question.id]: value }))
                                }
                              >
                                <div className="space-y-3">
                                  {question.options.map((option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                                      onClick={() =>
                                        setAssessmentAnswers(prev => ({ ...prev, [question.id]: optionIndex.toString() }))
                                      }
                                    >
                                      <RadioGroupItem
                                        value={optionIndex.toString()}
                                        id={`assess-${question.id}-${optionIndex}`}
                                        className="pointer-events-none"
                                      />
                                      <Label
                                        htmlFor={`assess-${question.id}-${optionIndex}`}
                                        className="text-sm cursor-pointer flex-1 pointer-events-none"
                                      >
                                        {option}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </RadioGroup>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
                      <div className="text-sm text-muted-foreground">
                        {Object.keys(assessmentAnswers).length} of {questions.length} questions answered
                      </div>
                      <Button
                        className={`bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 ${
                          Object.keys(assessmentAnswers).length === questions.length ? 'opacity-100' : 'opacity-60'
                        }`}
                        disabled={assessmentSubmitting || Object.keys(assessmentAnswers).length < questions.length}
                        onClick={handleAssessmentSubmit}
                      >
                        {assessmentSubmitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Submitting...
                          </div>
                        ) : (
                          <><GraduationCap className="h-4 w-4 mr-2" /> Submit Assessment</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Results section */}
                  {assessmentSubmitted && assessmentScore !== null && (
                    <div ref={assessmentResultsRef} className="scroll-mt-8">
                      <Card className="mb-8 border-gray-800">
                        <CardHeader className={assessmentScore >= 80 ? "bg-orange-500/10 border-b border-orange-500/20" : "bg-red-500/10 border-b border-red-500/20"}>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold">Assessment Results</CardTitle>
                            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              assessmentScore >= 80 ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"
                            }`}>
                              {assessmentScore >= 80 ? (
                                <><Check className="h-4 w-4 mr-1" /> PASSED</>
                              ) : (
                                <><X className="h-4 w-4 mr-1" /> NOT PASSED</>
                              )}
                            </div>
                          </div>
                          <CardDescription>
                            Assessment completed {new Date().toLocaleDateString()} · Squadron: {assessmentSquadron} · Result saved to profile
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="mb-8 text-center">
                            <div className={`text-7xl font-bold mb-2 ${assessmentScore >= 80 ? 'text-orange-400' : 'text-red-400'}`}>
                              {assessmentScore}%
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {assessmentScore >= 80
                                ? `Congratulations! You've passed the ${module.title} assessment. This result has been recorded in your profile.`
                                : `You scored ${assessmentResults.filter(r => r.isCorrect).length}/${questions.length} correct. You need 80% (${Math.ceil(questions.length * 0.8)}/${questions.length}) to pass. Review the reading material and try again.`}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold mb-3">Question-by-Question Feedback</h3>
                            {assessmentResults.map((result, index) => (
                              <div
                                key={result.questionId}
                                className={`p-4 rounded-lg border ${
                                  result.isCorrect
                                    ? "border-orange-500/30 bg-orange-500/10"
                                    : "border-red-500/30 bg-red-500/10"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`mt-0.5 shrink-0 ${result.isCorrect ? "text-orange-400" : "text-red-400"}`}>
                                    {result.isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm mb-1">Q{index + 1}: {result.questionText}</p>
                                    <p className="text-sm text-gray-400">Your answer: <span className={result.isCorrect ? 'text-orange-400' : 'text-red-400'}>{result.yourAnswer}</span></p>
                                    {!result.isCorrect && (
                                      <p className="text-sm text-orange-400 mt-0.5">
                                        Correct answer: {result.correctAnswer}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-gray-800 pt-4">
                          <Button variant="outline" onClick={() => setCurrentTab('readings')}>
                            Review Material
                          </Button>
                          <Button
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={resetAssessment}
                          >
                            <GraduationCap className="h-4 w-4 mr-2" />
                            Retry Assessment
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  )}
                </>
              )
            })()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}