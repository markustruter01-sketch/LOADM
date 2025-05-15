import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Save, ArrowLeft, Calendar } from "lucide-react";
import { Helmet } from "react-helmet";

export function CargoManifestForm() {
  const [formData, setFormData] = useState({
    manifestNumber: "",
    origin: "",
    destination: "",
    carrier: "",
    flightNumber: "",
    departureDate: "",
    totalPieces: "",
    totalWeight: "",
    remarks: ""
  });

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save functionality would go here
    console.log("Form submitted:", formData);
  };

  return (
    <>
      <Helmet>
        <title>Cargo Manifest - LOADMdocs</title>
        <meta name="description" content="Complete cargo manifest information for military load planning" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => window.history.back()} 
            className="text-orange-500 hover:text-orange-600 mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-white">Cargo Manifest</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="manifestNumber" className="block text-white mb-2">
                Manifest Number
              </label>
              <Input
                id="manifestNumber"
                placeholder="Enter manifest number"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.manifestNumber}
                onChange={(e) => handleChange("manifestNumber", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="origin" className="block text-white mb-2">
                Origin
              </label>
              <Input
                id="origin"
                placeholder="Enter origin airport code"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.origin}
                onChange={(e) => handleChange("origin", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="destination" className="block text-white mb-2">
                Destination
              </label>
              <Input
                id="destination"
                placeholder="Enter destination airport code"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.destination}
                onChange={(e) => handleChange("destination", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="carrier" className="block text-white mb-2">
                Carrier
              </label>
              <Input
                id="carrier"
                placeholder="Enter carrier name"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.carrier}
                onChange={(e) => handleChange("carrier", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="flightNumber" className="block text-white mb-2">
                Flight Number
              </label>
              <Input
                id="flightNumber"
                placeholder="Enter flight number"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.flightNumber}
                onChange={(e) => handleChange("flightNumber", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="departureDate" className="block text-white mb-2">
                Departure Date
              </label>
              <div className="relative">
                <Input
                  id="departureDate"
                  placeholder="dd/mm/yyyy"
                  className="bg-gray-900 border-gray-700 text-white pr-10"
                  value={formData.departureDate}
                  onChange={(e) => handleChange("departureDate", e.target.value)}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label htmlFor="totalPieces" className="block text-white mb-2">
                Total Pieces
              </label>
              <Input
                id="totalPieces"
                placeholder="Enter total pieces"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.totalPieces}
                onChange={(e) => handleChange("totalPieces", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="totalWeight" className="block text-white mb-2">
                Total Weight (kg)
              </label>
              <Input
                id="totalWeight"
                placeholder="Enter total weight"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.totalWeight}
                onChange={(e) => handleChange("totalWeight", e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="remarks" className="block text-white mb-2">
                Remarks
              </label>
              <Input
                id="remarks"
                placeholder="Enter remarks"
                className="bg-gray-900 border-gray-700 text-white"
                value={formData.remarks}
                onChange={(e) => handleChange("remarks", e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                <Save className="mr-2 h-4 w-4" />
                Save Manifest
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}