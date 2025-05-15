import { CargoManifestForm } from "@/components/CargoManifestForm";
import DocumentMenu from "@/components/DocumentMenu";
import { Helmet } from "react-helmet";

export default function CargoManifestPage() {
  return (
    <>
      <Helmet>
        <title>Cargo Manifest - LOADMdocs</title>
        <meta name="description" content="Cargo Manifest form for military cargo load planning" />
      </Helmet>
      
      {/* Document menu showing all available document forms */}
      <DocumentMenu />
      
      {/* The cargo manifest form */}
      <div className="container mx-auto pb-20">
        <CargoManifestForm />
      </div>
    </>
  );
}