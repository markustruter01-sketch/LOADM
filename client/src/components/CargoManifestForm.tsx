import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Save, ArrowLeft, Printer } from "lucide-react";
import { Helmet } from "react-helmet";

// Cargo manifest form that looks like the PDF template from 25229.pdf
export function CargoManifestForm() {
  // State to store form data
  const [formData, setFormData] = useState({
    crewName: "",
    flightManagerInfo: "",
    orderingUnit: "",
    incident: "",
    projectNumber: "",
    carrier: "",
    departure: "",
    etd: "",
    arrival: "",
    eta: "",
    reportTo: "",
    delayedContact: "",
    // Array of passenger/cargo rows (23 in the PDF)
    passengers: Array(23).fill("").map(() => ({
      name: "",
      gender: "",
      passengerWeight: "",
      cargoWeight: "",
      position: "", 
      homeUnit: ""
    })),
    passengerCount: "0",
    passengerWeight: "0",
    cargoWeight: "0",
    totalWeight: "0",
    signature: "",
    date: ""
  });

  // Handler for updating basic form fields
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for updating passenger data
  const handlePassengerChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newPassengers = [...prev.passengers];
      newPassengers[index] = { ...newPassengers[index], [field]: value };
      return {
        ...prev,
        passengers: newPassengers
      };
    });
  };

  // Calculate total weights when form changes
  const calculateTotals = () => {
    const passengerCount = formData.passengers.filter(p => p.name.trim() !== "").length;
    const passengerWeight = formData.passengers.reduce((sum, p) => {
      return sum + (parseFloat(p.passengerWeight) || 0);
    }, 0);
    const cargoWeight = formData.passengers.reduce((sum, p) => {
      return sum + (parseFloat(p.cargoWeight) || 0);
    }, 0);
    const totalWeight = passengerWeight + cargoWeight;

    handleFieldChange("passengerCount", passengerCount.toString());
    handleFieldChange("passengerWeight", passengerWeight.toString());
    handleFieldChange("cargoWeight", cargoWeight.toString());
    handleFieldChange("totalWeight", totalWeight.toString());
  };

  // Handler for the print button
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Helmet>
        <title>Cargo Manifest - LOADMdocs</title>
        <style>
          {`
            @media print {
              .no-print { display: none !important; }
              .print-document { 
                background-color: white !important;
                box-shadow: none !important;
                color: black !important;
              }
              .print-white {
                color: black !important;
              }
              .print-document input, .print-document select, .print-document textarea {
                border: none !important;
                background: transparent !important;
                color: black !important;
              }
              @page { margin: 0.5cm; }
            }
          `}
        </style>
      </Helmet>
      


      <div id="cargo-manifest-form" className="container mx-auto pb-20 pt-4">
        <div className="max-w-4xl mx-auto bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-6 no-print">
            <h2 className="text-2xl font-bold text-foreground">Passenger / Crew and Cargo Manifest</h2>
          </div>

          {/* A4-style paper container */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 print-document" style={{ minHeight: "297mm", width: "100%", maxWidth: "210mm" }}>
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-black">Passenger / Crew and Cargo Manifest – TEST FORM</h1>
            </div>

            {/* Top section */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col">
                <div className="mb-2">
                  <label className="text-sm text-black">Crew Name:</label>
                  <Input 
                    className="border-b border-gray-300 w-full text-black bg-transparent" 
                    value={formData.crewName}
                    onChange={(e) => handleFieldChange("crewName", e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label className="text-sm text-black">Ordering Unit:</label>
                  <Input 
                    className="border-b border-gray-300 w-full text-black bg-transparent" 
                    value={formData.orderingUnit}
                    onChange={(e) => handleFieldChange("orderingUnit", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="mb-2">
                  <label className="text-sm text-black">Flight Manager Name & Phone:</label>
                  <Input 
                    className="border-b border-gray-300 w-full text-black bg-transparent"
                    value={formData.flightManagerInfo}
                    onChange={(e) => handleFieldChange("flightManagerInfo", e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label className="text-sm text-black">Incident / Project Name:</label>
                  <Input 
                    className="border-b border-gray-300 w-full text-black bg-transparent"
                    value={formData.incident}
                    onChange={(e) => handleFieldChange("incident", e.target.value)}
                  />
                </div>
                <div className="mb-2">
                  <label className="text-sm text-black">Incident / Project Number:</label>
                  <Input 
                    className="border-b border-gray-300 w-full text-black bg-transparent"
                    value={formData.projectNumber}
                    onChange={(e) => handleFieldChange("projectNumber", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Carrier section */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-1">
                <label className="text-sm text-black">Carrier Name or Vehicle List</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.carrier}
                  onChange={(e) => handleFieldChange("carrier", e.target.value)}
                />
                <div className="text-xs text-gray-600 mt-1">Make / Model / License:</div>
              </div>
              <div className="col-span-1">
                <label className="text-sm text-black">Departure Location:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.departure}
                  onChange={(e) => handleFieldChange("departure", e.target.value)}
                />
                <label className="text-sm text-black mt-1">ETD:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.etd}
                  onChange={(e) => handleFieldChange("etd", e.target.value)}
                />
              </div>
              <div className="col-span-1">
                <label className="text-sm text-black">Arrival Location:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.arrival}
                  onChange={(e) => handleFieldChange("arrival", e.target.value)}
                />
                <label className="text-sm text-black mt-1">ETA:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.eta}
                  onChange={(e) => handleFieldChange("eta", e.target.value)}
                />
              </div>
            </div>

            {/* Report To and Delayed Contact */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-black">Report To:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.reportTo}
                  onChange={(e) => handleFieldChange("reportTo", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-black">If Delayed, Contact:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.delayedContact}
                  onChange={(e) => handleFieldChange("delayedContact", e.target.value)}
                />
              </div>
            </div>

            {/* Passenger Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse border border-gray-300 text-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-1 text-sm text-left" style={{ width: "25px" }}>No.</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm text-left">
                      Passenger / Cargo Name
                      <div className="text-xs">(Include contact numbers for leaders – CRWB, Asst. CRWB, CRWB-T, etc.)</div>
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-sm text-center" style={{ width: "40px" }}>M/F</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm text-center" style={{ width: "80px" }}>Passenger Weight</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm text-center" style={{ width: "80px" }}>Cargo Weight</th>
                    <th className="border border-gray-300 px-2 py-1 text-sm text-center" style={{ width: "100px" }}>
                      Position / AD Class
                      <div className="text-xs">(e.g. FFT2/AD-C)</div>
                    </th>
                    <th className="border border-gray-300 px-2 py-1 text-sm text-center">Home Unit / Jetport</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.passengers.map((passenger, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-2 py-1 text-sm text-center">{index + 1}</td>
                      <td className="border border-gray-300 px-0 py-0">
                        <Input 
                          className="w-full h-8 border-0 text-black bg-transparent" 
                          value={passenger.name}
                          onChange={(e) => handlePassengerChange(index, "name", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-300 px-0 py-0">
                        <Input 
                          className="w-full h-8 border-0 text-black bg-transparent text-center" 
                          value={passenger.gender}
                          onChange={(e) => handlePassengerChange(index, "gender", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-300 px-0 py-0">
                        <Input 
                          className="w-full h-8 border-0 text-black bg-transparent text-center" 
                          value={passenger.passengerWeight}
                          onChange={(e) => {
                            handlePassengerChange(index, "passengerWeight", e.target.value);
                            calculateTotals();
                          }}
                        />
                      </td>
                      <td className="border border-gray-300 px-0 py-0">
                        <Input 
                          className="w-full h-8 border-0 text-black bg-transparent text-center" 
                          value={passenger.cargoWeight}
                          onChange={(e) => {
                            handlePassengerChange(index, "cargoWeight", e.target.value);
                            calculateTotals();
                          }}
                        />
                      </td>
                      <td className="border border-gray-300 px-0 py-0">
                        <Input 
                          className="w-full h-8 border-0 text-black bg-transparent text-center" 
                          value={passenger.position}
                          onChange={(e) => handlePassengerChange(index, "position", e.target.value)}
                        />
                      </td>
                      <td className="border border-gray-300 px-0 py-0">
                        <Input 
                          className="w-full h-8 border-0 text-black bg-transparent" 
                          value={passenger.homeUnit}
                          onChange={(e) => handlePassengerChange(index, "homeUnit", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100">
                    <td colSpan={2} className="border border-gray-300 px-2 py-1 text-sm font-medium">
                      Number of Passengers on Page: 
                      <Input 
                        className="w-16 ml-2 inline-block border-b border-gray-300 text-black bg-transparent" 
                        value={formData.passengerCount}
                        onChange={(e) => handleFieldChange("passengerCount", e.target.value)}
                      />
                    </td>
                    <td colSpan={3} className="border border-gray-300 px-2 py-1 text-sm font-medium">
                      Passenger Weight: 
                      <Input 
                        className="w-16 ml-2 inline-block border-b border-gray-300 text-black bg-transparent" 
                        value={formData.passengerWeight}
                        onChange={(e) => handleFieldChange("passengerWeight", e.target.value)}
                      />
                      <span className="mx-2">/</span>
                      Cargo Weight: 
                      <Input 
                        className="w-16 ml-2 inline-block border-b border-gray-300 text-black bg-transparent" 
                        value={formData.cargoWeight}
                        onChange={(e) => handleFieldChange("cargoWeight", e.target.value)}
                      />
                    </td>
                    <td colSpan={2} className="border border-gray-300 px-2 py-1 text-sm font-medium">
                      Total Weight: 
                      <Input 
                        className="w-20 ml-2 inline-block border-b border-gray-300 text-black bg-transparent" 
                        value={formData.totalWeight}
                        onChange={(e) => handleFieldChange("totalWeight", e.target.value)}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
              <div>
                <label className="text-sm text-black">Signature of Authorized Representative:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  value={formData.signature}
                  onChange={(e) => handleFieldChange("signature", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-black">Date:</label>
                <Input 
                  className="border-b border-gray-300 w-full text-black bg-transparent"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleFieldChange("date", e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8">
              Send comments to wieacc@fs.fed.us by November 1, 2014 
              <span className="float-right">05/14</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between space-x-4 no-print">
            <Button 
              variant="outline" 
              onClick={() => {
                if (confirm("Are you sure you want to reset the form? This will clear all entered data.")) {
                  setFormData({
                    crewName: "",
                    flightManagerInfo: "",
                    orderingUnit: "",
                    incident: "",
                    projectNumber: "",
                    carrier: "",
                    departure: "",
                    etd: "",
                    arrival: "",
                    eta: "",
                    reportTo: "",
                    delayedContact: "",
                    passengers: Array(23).fill("").map(() => ({
                      name: "",
                      gender: "",
                      passengerWeight: "",
                      cargoWeight: "",
                      position: "",
                      homeUnit: ""
                    })),
                    passengerCount: "0",
                    passengerWeight: "0",
                    cargoWeight: "0",
                    totalWeight: "0",
                    signature: "",
                    date: ""
                  });
                }
              }}
            >
              Reset Form
            </Button>
            <div>
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Form
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Form
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}