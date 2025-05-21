import { SVGProps } from "react";

export function CargoPlane(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Main body of the cargo plane */}
      <path d="M3,12 L21,12 L19,16 L5,16 L3,12 Z" />
      
      {/* Tail section */}
      <path d="M16,16 L16,18 L19,18 L19,16" />
      
      {/* Cockpit/nose */}
      <path d="M3,12 L6,8 L9,8 L9,12" />
      
      {/* Wings */}
      <path d="M7,12 L9,7 L15,7 L17,12" />
    </svg>
  );
}