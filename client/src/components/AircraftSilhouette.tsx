import { cn } from "@/lib/utils";

type AircraftType = 'c27j' | 'c17' | 'c130' | 'kc30a';

interface AircraftSilhouetteProps {
  aircraftType: AircraftType;
  className?: string;
}

export function AircraftSilhouette({ aircraftType, className }: AircraftSilhouetteProps) {
  // SVG paths for each aircraft type
  const silhouettes = {
    c27j: (
      <svg className={cn("text-white", className)} viewBox="0 0 100 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M92,15 L88,11 L70,11 C69,7 66,6 60,6 L35,6 C30,6 15,6.5 10,7 L2,10.5 L2,18.5 L10,22 C15,22.5 30,23 35,23 L60,23 C66,23 69,22 70,18 L88,18 L92,14 Z M22,15 A3,3 0 1,0 22,9 A3,3 0 1,0 22,15 Z M60,15 A3,3 0 1,0 60,9 A3,3 0 1,0 60,15 Z" />
      </svg>
    ),
    c17: (
      <svg className={cn("text-white", className)} viewBox="0 0 100 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M98,17 L95,12 L88,12 L80,8 L75,6 C70,4 60,3 50,3 L30,3 C20,3 15,4 10,7 L2,11 L2,18 L10,22 C15,25 20,26 30,26 L50,26 C60,26 70,25 75,23 L80,21 L88,17 L95,17 L98,17 Z M20,15 A4,3 0 1,0 20,9 A4,3 0 1,0 20,15 Z M65,15 A5,4 0 1,0 65,7 A5,4 0 1,0 65,15 Z" />
      </svg>
    ),
    c130: (
      <svg className={cn("text-white", className)} viewBox="0 0 100 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M92,15 L88,10 L75,10 L70,7 C65,5 55,4 45,4 L30,4 C22,4 15,5 10,7 L5,10 L2,13 L2,16 L5,19 L10,22 C15,24 22,25 30,25 L45,25 C55,25 65,24 70,22 L75,19 L88,19 L92,15 Z M20,15 A3,3 0 1,0 20,9 A3,3 0 1,0 20,15 Z M65,15 A4,3 0 1,0 65,9 A4,3 0 1,0 65,15 Z" />
      </svg>
    ),
    kc30a: (
      <svg className={cn("text-white", className)} viewBox="0 0 100 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M95,15 L90,8 L75,8 L65,5 C60,3 50,2 40,2 L25,2 C15,2 10,3 5,7 L2,10 L2,19 L5,22 C10,26 15,27 25,27 L40,27 C50,27 60,26 65,24 L75,21 L90,21 L95,15 Z M20,16 A4,4 0 1,0 20,8 A4,4 0 1,0 20,16 Z M72,16 A6,5 0 1,0 72,6 A6,5 0 1,0 72,16 Z" />
      </svg>
    )
  };

  return (
    <div className={cn("relative", className)}>
      {silhouettes[aircraftType]}
    </div>
  );
}