import { users, type User, type InsertUser, documents, type Document, type InsertDocument, scenarios, type Scenario, type InsertScenario, documentSubmissions, type DocumentSubmission, type InsertDocumentSubmission, scenarioSubmissions, type ScenarioSubmission, type InsertScenarioSubmission } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document management
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Document submission management
  getDocumentSubmissions(documentId?: number, userId?: number): Promise<DocumentSubmission[]>;
  getDocumentSubmission(id: number): Promise<DocumentSubmission | undefined>;
  createDocumentSubmission(submission: InsertDocumentSubmission): Promise<DocumentSubmission>;
  
  // Scenario management
  getScenarios(): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: number, scenario: Partial<InsertScenario>): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<boolean>;
  
  // Scenario submission management
  getScenarioSubmissions(scenarioId?: number, userId?: number): Promise<ScenarioSubmission[]>;
  getScenarioSubmission(id: number): Promise<ScenarioSubmission | undefined>;
  createScenarioSubmission(submission: InsertScenarioSubmission): Promise<ScenarioSubmission>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private scenarios: Map<number, Scenario>;
  private documentSubmissions: Map<number, DocumentSubmission>;
  private scenarioSubmissions: Map<number, ScenarioSubmission>;
  
  currentUserId: number;
  currentDocumentId: number;
  currentScenarioId: number;
  currentDocumentSubmissionId: number;
  currentScenarioSubmissionId: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.scenarios = new Map();
    this.documentSubmissions = new Map();
    this.scenarioSubmissions = new Map();
    
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentScenarioId = 1;
    this.currentDocumentSubmissionId = 1;
    this.currentScenarioSubmissionId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every 24h
    });
    
    // Create an admin user - store directly with pre-hashed password
    const adminId = this.currentUserId++;
    const adminUser: User = {
      id: adminId,
      username: "admin",
      // Pre-hashed version of "adminpassword" using our hash algorithm
      password: "c9a296801d0dbb46fda407f3e66b0dc4bd2a1710ae25679a5a3aee380c2d720b8b5eb26d69b962a8df0887544ed530edd5cf104ef175845b64ee3f9a158d16ad.e4be0aba9c1c64eb9ba018c11f3ad0e2",
      isAdmin: true,
    };
    this.users.set(adminId, adminUser);
    
    // Seed some initial documents
    this.createDocument({
      title: "Load Planning Form",
      description: "Complete detailed load planning documentation for cargo aircraft operations.",
      type: "Form",
      fields: [
        {
          id: "flightNumber",
          label: "Flight Number",
          type: "text",
          placeholder: "e.g. VD1234",
          required: true
        },
        {
          id: "date",
          label: "Date",
          type: "date",
          required: true
        },
        {
          id: "aircraftType",
          label: "Aircraft Type",
          type: "select",
          options: ["C-130 Hercules", "C-17 Globemaster III", "Boeing 747 Freighter", "Airbus A400M"],
          required: true
        },
        {
          id: "registration",
          label: "Registration",
          type: "text",
          placeholder: "e.g. N12345",
          required: true
        },
        {
          id: "totalWeight",
          label: "Total Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "loadDistribution",
          label: "Load Distribution",
          type: "select",
          options: ["Forward Heavy", "Aft Heavy", "Balanced"],
          required: true
        },
        {
          id: "hasDangerousGoods",
          label: "Contains DG items",
          type: "checkbox",
          required: false
        },
        {
          id: "tieDownEquipment",
          label: "Tie-down Equipment Condition",
          type: "select",
          options: ["Serviceable", "Unserviceable", "Needs Inspection"],
          required: true
        },
        {
          id: "restraintRating",
          label: "Restraint Rating",
          type: "select",
          options: ["Sufficient", "Insufficient", "Requires Review"],
          required: true
        },
        {
          id: "restraintNotes",
          label: "Additional Notes",
          type: "textarea",
          placeholder: "Enter any additional notes about restraint equipment",
          required: false
        },
        {
          id: "loadmasterName",
          label: "Loadmaster Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true
        },
        {
          id: "idNumber",
          label: "ID/Employee Number",
          type: "text",
          placeholder: "Enter your ID number",
          required: true
        },
        {
          id: "dateCompleted",
          label: "Date Completed",
          type: "date",
          required: true
        }
      ]
    });
    
    this.createDocument({
      title: "Cargo Manifest",
      description: "Generate and complete detailed cargo manifests for all shipments.",
      type: "Form",
      fields: [
        {
          id: "manifestNumber",
          label: "Manifest Number",
          type: "text",
          placeholder: "Enter manifest number",
          required: true
        },
        {
          id: "origin",
          label: "Origin",
          type: "text",
          placeholder: "Enter origin airport code",
          required: true
        },
        {
          id: "destination",
          label: "Destination",
          type: "text",
          placeholder: "Enter destination airport code",
          required: true
        },
        {
          id: "carrier",
          label: "Carrier",
          type: "text",
          placeholder: "Enter carrier name",
          required: true
        },
        {
          id: "flightNumber",
          label: "Flight Number",
          type: "text",
          placeholder: "Enter flight number",
          required: true
        },
        {
          id: "departureDate",
          label: "Departure Date",
          type: "date",
          required: true
        },
        {
          id: "totalPieces",
          label: "Total Pieces",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "totalWeight",
          label: "Total Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "specialHandlingNotes",
          label: "Special Handling Notes",
          type: "textarea",
          placeholder: "Enter any special handling instructions",
          required: false
        }
      ]
    });
    
    this.createDocument({
      title: "Dangerous Goods Declaration",
      description: "Complete DG documentation for hazardous materials transportation.",
      type: "Form",
      fields: [
        {
          id: "shipperName",
          label: "Shipper Name",
          type: "text",
          placeholder: "Enter shipper name",
          required: true
        },
        {
          id: "shipperAddress",
          label: "Shipper Address",
          type: "textarea",
          placeholder: "Enter shipper address",
          required: true
        },
        {
          id: "consigneeName",
          label: "Consignee Name",
          type: "text",
          placeholder: "Enter consignee name",
          required: true
        },
        {
          id: "consigneeAddress",
          label: "Consignee Address",
          type: "textarea",
          placeholder: "Enter consignee address",
          required: true
        },
        {
          id: "transportDetails",
          label: "Transport Details",
          type: "text",
          placeholder: "Enter transport details",
          required: true
        },
        {
          id: "shipmentType",
          label: "Shipment Type",
          type: "select",
          options: ["Non-Radioactive", "Radioactive"],
          required: true
        },
        {
          id: "unNumber",
          label: "UN Number",
          type: "text",
          placeholder: "Enter UN number",
          required: true
        },
        {
          id: "properShippingName",
          label: "Proper Shipping Name",
          type: "text",
          placeholder: "Enter proper shipping name",
          required: true
        },
        {
          id: "class",
          label: "Class or Division",
          type: "text",
          placeholder: "Enter class/division",
          required: true
        },
        {
          id: "packingGroup",
          label: "Packing Group",
          type: "select",
          options: ["I", "II", "III"],
          required: true
        },
        {
          id: "quantity",
          label: "Quantity and Type of Packaging",
          type: "text",
          placeholder: "Enter quantity and packaging",
          required: true
        },
        {
          id: "packingInstruction",
          label: "Packing Instruction",
          type: "text",
          placeholder: "Enter packing instruction",
          required: true
        },
        {
          id: "additionalHandling",
          label: "Additional Handling Information",
          type: "textarea",
          placeholder: "Enter additional handling information",
          required: false
        },
        {
          id: "declarationDate",
          label: "Declaration Date",
          type: "date",
          required: true
        },
        {
          id: "declarantName",
          label: "Name of Signatory",
          type: "text",
          placeholder: "Enter your full name",
          required: true
        }
      ]
    });
    
    this.createDocument({
      title: "Weight & Balance Sheet",
      description: "Calculate and document aircraft weight distribution and balance.",
      type: "Form",
      fields: [
        {
          id: "aircraftType",
          label: "Aircraft Type",
          type: "select",
          options: ["C-130 Hercules", "C-17 Globemaster III", "C-27J Spartan", "KC-30A"],
          required: true
        },
        {
          id: "missionNumber",
          label: "Mission Number",
          type: "text",
          placeholder: "e.g. M4321",
          required: true
        },
        {
          id: "registration",
          label: "Registration",
          type: "text",
          placeholder: "e.g. A97-123",
          required: true
        },
        {
          id: "date",
          label: "Date",
          type: "date",
          required: true
        },
        {
          id: "emptyWeight",
          label: "Aircraft Empty Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "emptyMoment",
          label: "Empty Weight Moment (kg-in)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "crewNumber",
          label: "Number of Crew",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "crewWeight",
          label: "Crew Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "crewMoment",
          label: "Crew Moment (kg-in)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "fuel",
          label: "Fuel Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "fuelMoment",
          label: "Fuel Moment (kg-in)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "cargoWeight",
          label: "Cargo Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "cargoMoment",
          label: "Cargo Moment (kg-in)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "totalWeight",
          label: "Total Aircraft Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "maximumAllowedWeight",
          label: "Maximum Allowed Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "centerOfGravity",
          label: "Center of Gravity (inches)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "forwardLimit",
          label: "Forward CG Limit (inches)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "aftLimit",
          label: "Aft CG Limit (inches)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "withinLimits",
          label: "Within Weight & Balance Limits",
          type: "checkbox",
          required: true
        },
        {
          id: "loadmasterName",
          label: "Loadmaster Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true
        },
        {
          id: "loadmasterSignature",
          label: "Loadmaster Signature Required",
          type: "checkbox",
          required: true
        },
        {
          id: "notes",
          label: "Notes",
          type: "textarea",
          placeholder: "Enter any additional notes",
          required: false
        }
      ]
    });
    
    this.createDocument({
      title: "Cargo Floor Loading Plan",
      description: "Detailed diagram and specifications for floor-loaded cargo.",
      type: "Form",
      fields: [
        {
          id: "missionNumber",
          label: "Mission Number",
          type: "text",
          placeholder: "e.g. M4321",
          required: true
        },
        {
          id: "aircraftType",
          label: "Aircraft Type",
          type: "select",
          options: ["C-130 Hercules", "C-17 Globemaster III", "C-27J Spartan", "KC-30A"],
          required: true
        },
        {
          id: "date",
          label: "Date",
          type: "date",
          required: true
        },
        {
          id: "totalItems",
          label: "Total Number of Items",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "totalWeight",
          label: "Total Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "item1Description",
          label: "Item 1 Description",
          type: "text",
          placeholder: "Enter cargo description",
          required: true
        },
        {
          id: "item1Length",
          label: "Item 1 Length (cm)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "item1Width",
          label: "Item 1 Width (cm)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "item1Height",
          label: "Item 1 Height (cm)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "item1Weight",
          label: "Item 1 Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "item1Position",
          label: "Item 1 Position",
          type: "text",
          placeholder: "FS #### to FS ####",
          required: true
        },
        {
          id: "item1TiedownMethod",
          label: "Item 1 Tiedown Method",
          type: "select",
          options: ["CGU-1/B Straps", "Chains", "MB-1 Chains", "MB-2 Chains", "Combined Methods"],
          required: true
        },
        {
          id: "item1RestraintRequired",
          label: "Item 1 Required Restraint (G forces)",
          type: "text",
          placeholder: "e.g. 3G FWD, 1.5G AFT, 1.5G LAT",
          required: true
        },
        {
          id: "item2Description",
          label: "Item 2 Description",
          type: "text",
          placeholder: "Enter cargo description",
          required: false
        },
        {
          id: "item2Length",
          label: "Item 2 Length (cm)",
          type: "number",
          placeholder: "0",
          required: false
        },
        {
          id: "item2Width",
          label: "Item 2 Width (cm)",
          type: "number",
          placeholder: "0",
          required: false
        },
        {
          id: "item2Height",
          label: "Item 2 Height (cm)",
          type: "number",
          placeholder: "0",
          required: false
        },
        {
          id: "item2Weight",
          label: "Item 2 Weight (kg)",
          type: "number",
          placeholder: "0",
          required: false
        },
        {
          id: "item2Position",
          label: "Item 2 Position",
          type: "text",
          placeholder: "FS #### to FS ####",
          required: false
        },
        {
          id: "item2TiedownMethod",
          label: "Item 2 Tiedown Method",
          type: "select",
          options: ["CGU-1/B Straps", "Chains", "MB-1 Chains", "MB-2 Chains", "Combined Methods"],
          required: false
        },
        {
          id: "item2RestraintRequired",
          label: "Item 2 Required Restraint (G forces)",
          type: "text",
          placeholder: "e.g. 3G FWD, 1.5G AFT, 1.5G LAT",
          required: false
        },
        {
          id: "specialInstructions",
          label: "Special Instructions",
          type: "textarea",
          placeholder: "Enter any special handling or loading instructions",
          required: false
        },
        {
          id: "loadmasterName",
          label: "Loadmaster Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true
        },
        {
          id: "loadmasterSignature",
          label: "Loadmaster Signature Required",
          type: "checkbox",
          required: true
        }
      ]
    });
    
    this.createDocument({
      title: "Pallet Build-Up Form",
      description: "Documentation for the configuration and build-up of air cargo pallets.",
      type: "Form",
      fields: [
        {
          id: "palletSerialNumber",
          label: "Pallet Serial Number",
          type: "text",
          placeholder: "Enter pallet serial number",
          required: true
        },
        {
          id: "date",
          label: "Build-up Date",
          type: "date",
          required: true
        },
        {
          id: "aircraftType",
          label: "Target Aircraft Type",
          type: "select",
          options: ["C-130 Hercules", "C-17 Globemaster III", "C-27J Spartan", "KC-30A"],
          required: true
        },
        {
          id: "palletType",
          label: "Pallet Type",
          type: "select",
          options: ["463L", "HCU-6/E", "ISU 60", "ISU 90", "Special"],
          required: true
        },
        {
          id: "palletPosition",
          label: "Target Pallet Position",
          type: "text",
          placeholder: "e.g. P1, P2, etc.",
          required: true
        },
        {
          id: "tareWeight",
          label: "Pallet Tare Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "netWeight",
          label: "Net Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "totalWeight",
          label: "Total Weight (kg)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "cg",
          label: "Center of Gravity (inches from forward edge)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "hasDangerousGoods",
          label: "Contains Dangerous Goods",
          type: "checkbox",
          required: false
        },
        {
          id: "dgDetails",
          label: "Dangerous Goods Details",
          type: "textarea",
          placeholder: "Enter UN numbers and proper shipping names if applicable",
          required: false
        },
        {
          id: "cargoHeight",
          label: "Total Cargo Height (cm)",
          type: "number",
          placeholder: "0",
          required: true
        },
        {
          id: "cargoSecurityCheck",
          label: "Cargo Security Check Complete",
          type: "checkbox",
          required: true
        },
        {
          id: "loadingPriority",
          label: "Loading Priority",
          type: "select",
          options: ["Priority 1 - Mission Essential", "Priority 2 - Critical", "Priority 3 - Standard", "Priority 4 - Space Available"],
          required: true
        },
        {
          id: "contentsDescription",
          label: "Contents Description",
          type: "textarea",
          placeholder: "List major contents and any special handling requirements",
          required: true
        },
        {
          id: "netType",
          label: "Restraint Net Type",
          type: "select",
          options: ["Standard 463L", "Heavy Duty", "Special Purpose", "None"],
          required: true
        },
        {
          id: "restraintMethod",
          label: "Additional Restraint Method",
          type: "text",
          placeholder: "Enter additional restraint methods if used",
          required: false
        },
        {
          id: "buildupLocation",
          label: "Build-up Location",
          type: "text",
          placeholder: "Enter location where pallet was built",
          required: true
        },
        {
          id: "inspectionNotes",
          label: "Inspection Notes",
          type: "textarea",
          placeholder: "Enter any inspection findings or notes",
          required: false
        },
        {
          id: "inspectorName",
          label: "Inspector Name",
          type: "text",
          placeholder: "Enter inspector's full name",
          required: true
        },
        {
          id: "loadmasterName",
          label: "Loadmaster Name",
          type: "text",
          placeholder: "Enter loadmaster's full name",
          required: true
        },
        {
          id: "loadmasterSignature",
          label: "Loadmaster Signature Required",
          type: "checkbox",
          required: true
        }
      ]
    });
    
    // Seed some initial scenarios
    this.createScenario({
      title: "Heavy Equipment Loading",
      description: "Practice scenario for securing and transporting heavy equipment on cargo aircraft.",
      numberOfQuestions: 10,
      questions: [
        {
          id: "q1",
          question: "What is the minimum number of tie-downs required for a 10-ton vehicle?",
          options: ["6", "8", "10", "12"],
          correctAnswer: "12"
        },
        {
          id: "q2",
          question: "Which load category does a bulldozer typically fall into?",
          options: ["Category A", "Category B", "Category C", "Category D"],
          correctAnswer: "Category C"
        },
        {
          id: "q3",
          question: "Is the restraint provided sufficient for the load considering the aircraft's maximum g-force during turbulence?",
          options: [
            "Yes, the current restraint setup is adequate for all possible flight conditions",
            "No, additional tie-downs are required for forward and lateral restraint",
            "Unable to determine without g-force calculations",
            "Restraint is only sufficient for normal flight operations"
          ],
          correctAnswer: "No, additional tie-downs are required for forward and lateral restraint"
        }
      ]
    });
    
    this.createScenario({
      title: "Dangerous Goods Handling",
      description: "Assess knowledge of proper dangerous goods handling procedures and documentation.",
      numberOfQuestions: 15,
      questions: [
        {
          id: "q1",
          question: "Which of the following is NOT required on a dangerous goods declaration?",
          options: [
            "UN Number",
            "Proper Shipping Name",
            "Shipper's Zodiac Sign",
            "Packing Group"
          ],
          correctAnswer: "Shipper's Zodiac Sign"
        },
        {
          id: "q2",
          question: "What is the maximum amount of Class 3 flammable liquid allowed in limited quantities?",
          options: ["1L", "5L", "30L", "Depends on the specific substance"],
          correctAnswer: "Depends on the specific substance"
        },
        {
          id: "q3",
          question: "Are all the DG consignment requirements met if the declaration is missing the emergency contact number?",
          options: [
            "Yes, emergency contact is optional",
            "No, emergency contact information is mandatory",
            "Yes, if it's a domestic flight",
            "Only if the goods are in excepted quantities"
          ],
          correctAnswer: "No, emergency contact information is mandatory"
        }
      ]
    });
    
    this.createScenario({
      title: "Load Restraint Assessment",
      description: "Evaluate proper load restraint methods and calculations for various cargo types.",
      numberOfQuestions: 8,
      questions: [
        {
          id: "q1",
          question: "What is the correct formula for calculating the required restraint for a forward load?",
          options: [
            "Weight × 1.5g",
            "Weight × 3.0g",
            "Weight × 1.5g + Safety Factor",
            "Weight × 9.8 m/s²"
          ],
          correctAnswer: "Weight × 1.5g"
        },
        {
          id: "q2",
          question: "When calculating lateral restraint, which g-force value should be used?",
          options: ["0.5g", "1.0g", "1.5g", "2.0g"],
          correctAnswer: "1.0g"
        },
        {
          id: "q3",
          question: "Is the restraint provided enough for the load considering all flight conditions?",
          options: [
            "Yes, the current restraint setup is adequate for all possible flight conditions",
            "No, additional tie-downs are required for forward and lateral restraint",
            "Unable to determine without g-force calculations",
            "Restraint is only sufficient for normal flight operations"
          ],
          correctAnswer: "No, additional tie-downs are required for forward and lateral restraint"
        },
        {
          id: "q4",
          question: "Are all the tie-down equipment items serviceable according to maintenance standards?",
          options: [
            "Yes, all equipment meets or exceeds standards",
            "No, some straps show signs of wear beyond acceptable limits",
            "Equipment requires inspection before determination",
            "Some equipment is serviceable, but insufficient quantities are available"
          ],
          correctAnswer: "No, some straps show signs of wear beyond acceptable limits"
        }
      ]
    });
    
    this.createScenario({
      title: "Limited Quantities Assessment",
      description: "Test knowledge of limited quantities criteria and documentation requirements.",
      numberOfQuestions: 12,
      questions: [
        {
          id: "q1",
          question: "What marking should be displayed on packages containing limited quantities?",
          options: [
            "LTD QTY",
            "Limited Quantity Diamond Mark",
            "Class Hazard Label",
            "No marking is required"
          ],
          correctAnswer: "Limited Quantity Diamond Mark"
        },
        {
          id: "q2",
          question: "Is the Limited Quantities criteria being met if individual packages exceed the per-package limits?",
          options: [
            "Yes, as long as the total shipment weight is within limits",
            "No, individual packages must not exceed specified limits",
            "Yes, if they are properly marked",
            "Yes, if they are consolidated into an overpack"
          ],
          correctAnswer: "No, individual packages must not exceed specified limits"
        },
        {
          id: "q3",
          question: "Which of the following dangerous goods can NEVER be shipped as limited quantities?",
          options: [
            "Class 3, Packing Group II",
            "Class 4.1, Packing Group III",
            "Class 6.2, Category A",
            "Class 9, Packing Group III"
          ],
          correctAnswer: "Class 6.2, Category A"
        }
      ]
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document Management
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date();
    const document: Document = { ...insertDocument, id, lastUpdated: now };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updateDocument: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const now = new Date();
    const updatedDocument: Document = { ...document, ...updateDocument, lastUpdated: now };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Document Submission Management
  async getDocumentSubmissions(documentId?: number, userId?: number): Promise<DocumentSubmission[]> {
    return Array.from(this.documentSubmissions.values()).filter(
      (submission) => 
        (documentId === undefined || submission.documentId === documentId) &&
        (userId === undefined || submission.userId === userId)
    );
  }

  async getDocumentSubmission(id: number): Promise<DocumentSubmission | undefined> {
    return this.documentSubmissions.get(id);
  }

  async createDocumentSubmission(insertSubmission: InsertDocumentSubmission): Promise<DocumentSubmission> {
    const id = this.currentDocumentSubmissionId++;
    const now = new Date();
    const submission: DocumentSubmission = { ...insertSubmission, id, submissionDate: now };
    this.documentSubmissions.set(id, submission);
    return submission;
  }

  // Scenario Management
  async getScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values());
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }

  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const id = this.currentScenarioId++;
    const scenario: Scenario = { ...insertScenario, id };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  async updateScenario(id: number, updateScenario: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;
    
    const updatedScenario: Scenario = { ...scenario, ...updateScenario };
    this.scenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  async deleteScenario(id: number): Promise<boolean> {
    return this.scenarios.delete(id);
  }

  // Scenario Submission Management
  async getScenarioSubmissions(scenarioId?: number, userId?: number): Promise<ScenarioSubmission[]> {
    return Array.from(this.scenarioSubmissions.values()).filter(
      (submission) => 
        (scenarioId === undefined || submission.scenarioId === scenarioId) &&
        (userId === undefined || submission.userId === userId)
    );
  }

  async getScenarioSubmission(id: number): Promise<ScenarioSubmission | undefined> {
    return this.scenarioSubmissions.get(id);
  }

  async createScenarioSubmission(insertSubmission: InsertScenarioSubmission): Promise<ScenarioSubmission> {
    const id = this.currentScenarioSubmissionId++;
    const now = new Date();
    const submission: ScenarioSubmission = { ...insertSubmission, id, submissionDate: now };
    this.scenarioSubmissions.set(id, submission);
    return submission;
  }
}

export const storage = new MemStorage();
