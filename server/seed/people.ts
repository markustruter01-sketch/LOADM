import type { InsertUser } from "@shared/schema";
import { FLYING_SQUADRONS, type Squadron, type Role, type Category } from "@shared/constants";
import { Rng } from "./rng";

const FIRST = [
  "Jack", "Olivia", "Liam", "Charlotte", "Noah", "Amelia", "Ethan", "Isla", "Lucas", "Mia",
  "Cooper", "Grace", "Hunter", "Chloe", "Mason", "Zoe", "Oliver", "Ruby", "Thomas", "Ella",
  "Harrison", "Sophie", "Lachlan", "Matilda", "Archie", "Evie", "Xavier", "Willow", "Riley", "Harper",
  "Flynn", "Ivy", "Jaxon", "Ava", "Levi", "Sienna", "Patrick", "Imogen", "Kai", "Lily",
  "Angus", "Hannah", "Darcy", "Georgia", "Hamish", "Maddison", "Toby", "Eliza", "Finn", "Layla",
];
const LAST = [
  "Nguyen", "Smith", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson",
  "Thompson", "Walker", "Harris", "Lee", "Ryan", "Robinson", "Kelly", "King", "Davis", "Wright",
  "Evans", "Roberts", "Green", "Hall", "Wood", "Jackson", "Clarke", "Patel", "Singh", "Mitchell",
  "Campbell", "Murphy", "Scott", "Cooper", "Baker", "Collins", "Morgan", "Stewart", "Hughes", "Bell",
  "Edwards", "Turner", "Russell", "Marshall", "Hamilton", "Graham", "Fraser", "Reid", "McDonald", "Kennedy",
];

export const RANKS_BY_ROLE: Record<Role, readonly string[]> = {
  student: ["AC", "LAC", "CPL"],
  loadmaster: ["CPL", "SGT", "FSGT"],
  instructor: ["FSGT", "WOFF"],
  command: ["SQNLDR", "WGCDR", "GPCAPT"],
};

export interface SeedPerson extends InsertUser {
  /** stable key used by other seed files to reference this person */
  key: string;
  isDemoPersona?: boolean;
}

/** The four visitor personas. Their keys are the role names. */
export const PERSONAS: SeedPerson[] = [
  {
    key: "student",
    email: "tom.ferguson@demo.loadm",
    firstName: "Tom",
    lastName: "Ferguson",
    rank: "LAC",
    role: "student",
    squadron: "36SQN",
    category: "D",
    isDemoPersona: true,
  },
  {
    key: "loadmaster",
    email: "sarah.mackenzie@demo.loadm",
    firstName: "Sarah",
    lastName: "Mackenzie",
    rank: "SGT",
    role: "loadmaster",
    squadron: "33SQN",
    category: "B",
    isDemoPersona: true,
  },
  {
    key: "instructor",
    email: "david.okafor@demo.loadm",
    firstName: "David",
    lastName: "Okafor",
    rank: "FSGT",
    role: "instructor",
    squadron: "AMG",
    category: "A",
    isDemoPersona: true,
  },
  {
    key: "command",
    email: "helen.cartwright@demo.loadm",
    firstName: "Helen",
    lastName: "Cartwright",
    rank: "WGCDR",
    role: "command",
    squadron: "AMG",
    category: "A",
    isDemoPersona: true,
  },
];

/**
 * Generates the wider workforce: a realistic mix per flying squadron plus a
 * few more instructors and one more command officer at AMG.
 */
export function buildPeople(rng: Rng): SeedPerson[] {
  const used = new Set(PERSONAS.map((p) => p.email));
  const people: SeedPerson[] = [...PERSONAS];
  let n = 0;

  const make = (role: Role, squadron: Squadron, category?: Category, isActive = true): SeedPerson => {
    let firstName = rng.pick(FIRST);
    let lastName = rng.pick(LAST);
    let email = `${firstName}.${lastName}@demo.loadm`.toLowerCase();
    while (used.has(email)) {
      firstName = rng.pick(FIRST);
      lastName = rng.pick(LAST);
      email = `${firstName}.${lastName}${rng.int(1, 99)}@demo.loadm`.toLowerCase();
    }
    used.add(email);
    n += 1;
    const cat: Category =
      category ??
      (role === "student" ? "D" : rng.pick(role === "loadmaster" ? (["C", "B", "A"] as const) : (["B", "A"] as const)));
    return {
      key: `${role}-${n}`,
      email,
      firstName,
      lastName,
      rank: rng.pick(RANKS_BY_ROLE[role]),
      role,
      squadron,
      category: cat,
      isActive,
    };
  };

  // Per-squadron sizes differ so the analytics have texture.
  const sizes: Record<(typeof FLYING_SQUADRONS)[number], { students: number; loadmasters: number }> = {
    "33SQN": { students: 4, loadmasters: 11 },
    "35SQN": { students: 3, loadmasters: 8 },
    "36SQN": { students: 5, loadmasters: 12 },
    "37SQN": { students: 4, loadmasters: 10 },
  };

  for (const sqn of FLYING_SQUADRONS) {
    const { students, loadmasters } = sizes[sqn];
    for (let i = 0; i < students; i++) people.push(make("student", sqn, "D"));
    for (let i = 0; i < loadmasters; i++) people.push(make("loadmaster", sqn));
    // One embedded instructor per squadron
    people.push(make("instructor", sqn, "A"));
  }
  // AMG staff
  people.push(make("instructor", "AMG", "A"));
  people.push(make("command", "AMG", "A"));
  // One inactive (posted out) loadmaster, to exercise the active filter.
  people.push(make("loadmaster", "37SQN", "B", false));

  return people;
}
