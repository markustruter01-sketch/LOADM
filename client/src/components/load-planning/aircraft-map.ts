import { AIRCRAFT_LABELS, type AircraftType } from "@shared/constants";
import { aircraftConfigs, type AircraftConfig } from "@/utils/aircraft-config";
import c130Image from "@/assets/c130j.png";
import c17Image from "@/assets/c17a.png";
import c27jImage from "@/assets/c27j.png";
import kc30aImage from "@/assets/kc30a.png";

/** Engine ids as used by `aircraftConfigs` and the grid/balance utilities. */
export const ENGINE_AIRCRAFT_IDS = ["c130", "c17", "c27j", "kc30a"] as const;
export type EngineAircraftId = (typeof ENGINE_AIRCRAFT_IDS)[number];

export function isEngineAircraftId(s: string | undefined): s is EngineAircraftId {
  return (ENGINE_AIRCRAFT_IDS as readonly string[]).includes(s ?? "");
}

/** Route id → fleet aircraft type from @shared/constants. */
export const ENGINE_TO_FLEET: Record<EngineAircraftId, AircraftType> = {
  c130: "C130J",
  c17: "C17",
  c27j: "C27J",
  kc30a: "KC30A",
};

export const FLEET_TO_ENGINE: Record<AircraftType, EngineAircraftId> = {
  C130J: "c130",
  C17: "c17",
  C27J: "c27j",
  KC30A: "kc30a",
};

export const AIRCRAFT_IMAGES: Record<EngineAircraftId, string> = {
  c130: c130Image,
  c17: c17Image,
  c27j: c27jImage,
  kc30a: kc30aImage,
};

export const AIRCRAFT_BLURBS: Record<EngineAircraftId, string> = {
  c130: "Medium tactical airlift. Eight 463L pallet positions in two rows.",
  c17: "Strategic heavy lift. Eighteen pallet positions across two rows.",
  c27j: "Light tactical airlift. Three in-line pallet positions.",
  kc30a: "Multi-role tanker transport. Twenty-six lower-deck container positions.",
};

export interface AircraftCard {
  id: EngineAircraftId;
  fleet: AircraftType;
  label: string;
  blurb: string;
  image: string;
  config: AircraftConfig;
}

export const AIRCRAFT_CARDS: AircraftCard[] = ENGINE_AIRCRAFT_IDS.map((id) => ({
  id,
  fleet: ENGINE_TO_FLEET[id],
  label: AIRCRAFT_LABELS[ENGINE_TO_FLEET[id]],
  blurb: AIRCRAFT_BLURBS[id],
  image: AIRCRAFT_IMAGES[id],
  config: aircraftConfigs[id],
}));

/** Native weight unit the engine stores for an aircraft. */
export function nativeUnit(config: AircraftConfig): "kg" | "lb" {
  return config.useKg ? "kg" : "lb";
}
