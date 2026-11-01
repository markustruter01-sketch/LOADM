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
  command: ["WGCDR"],
};

/** Rank follows seniority category for qualified loadmasters. */
const LOADMASTER_RANK_BY_CATEGORY: Record<Category, string> = { D: "CPL", C: "CPL", B: "SGT", A: "FSGT" };

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
    // Loadmaster seniority skews junior: most are C/B, a few A.
    const cat: Category =
      category ??
      (role === "student" ? "D" : role === "loadmaster" ? rng.pick(["C", "C", "C", "B", "B", "A"] as const) : "A");
    return {
      key: `${role}-${n}`,
      email,
      firstName,
      lastName,
      rank: role === "loadmaster" ? LOADMASTER_RANK_BY_CATEGORY[cat] : rng.pick(RANKS_BY_ROLE[role]),
      role,
      squadron,
      category: cat,
      isActive,
    };
  };

  // About 54 people. Per-squadron sizes differ so the analytics have texture.
  // Each flying squadron has a commanding officer, an embedded instructor,
  // trainees and qualified loadmasters. AMG holds wing staff.
  const sizes: Record<(typeof FLYING_SQUADRONS)[number], { students: number; loadmasters: number }> = {
    "33SQN": { students: 3, loadmasters: 7 },
    "35SQN": { students: 2, loadmasters: 6 },
    "36SQN": { students: 4, loadmasters: 8 },
    "37SQN": { students: 3, loadmasters: 6 },
  };

  for (const sqn of FLYING_SQUADRONS) {
    const { students, loadmasters } = sizes[sqn];
    people.push({ ...make("command", sqn, "A"), rank: "WGCDR" });
    people.push(make("instructor", sqn, "A"));
    for (let i = 0; i < students; i++) people.push(make("student", sqn, "D"));
    for (let i = 0; i < loadmasters; i++) people.push(make("loadmaster", sqn));
  }
  people.push(make("instructor", "AMG", "A"));
  people.push({ ...make("command", "AMG", "A"), rank: "GPCAPT" });
  // One posted-out loadmaster, to exercise the active filter.
  people.push(make("loadmaster", "37SQN", "B", false));

  return people;
}
