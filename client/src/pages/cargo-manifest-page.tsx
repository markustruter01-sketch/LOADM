import { CargoManifestForm } from "@/components/CargoManifestForm";
import { Helmet } from "react-helmet";

export default function CargoManifestPage() {
  return (
    <>
      <Helmet>
        <title>Passenger / Crew and Cargo Manifest - LOADMdocs</title>
        <meta name="description" content="Passenger / Crew and Cargo Manifest form for military cargo load planning" />
      </Helmet>
      
      <CargoManifestForm />
    </>
  );
}