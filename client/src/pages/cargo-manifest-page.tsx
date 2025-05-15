import { CargoManifestForm } from "@/components/CargoManifestForm";
import { Helmet } from "react-helmet";

export default function CargoManifestPage() {
  return (
    <>
      <Helmet>
        <title>Cargo Manifest - LOADMdocs</title>
        <meta name="description" content="Cargo Manifest form for military cargo load planning" />
      </Helmet>
      
      <CargoManifestForm />
    </>
  );
}