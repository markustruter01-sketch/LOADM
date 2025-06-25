function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-orange-500">LOADMworkflow</h1>
          <h2 className="text-2xl font-semibold mb-8">Military Logistics Training Platform</h2>
          
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">C-17 Globemaster III</h3>
                <p className="text-gray-300 text-sm mb-3">Introduction to C-17 cargo loading fundamentals</p>
                <div className="text-xs text-gray-400">
                  <div>• Aircraft Overview & Specifications</div>
                  <div>• Cargo Compartment Dimensions</div>
                  <div>• Standard Pallet Configurations</div>
                  <div>• Weight and Balance Fundamentals</div>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">C-130 Hercules</h3>
                <p className="text-gray-300 text-sm mb-3">Complete C-130 loadmaster training</p>
                <div className="text-xs text-gray-400">
                  <div>• Tactical Operations</div>
                  <div>• Cargo Loading Procedures</div>
                  <div>• Emergency Protocols</div>
                  <div>• Performance Calculations</div>
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">KC30A Tanker</h3>
                <p className="text-gray-300 text-sm mb-3">KC30A specific cargo and fuel operations</p>
                <div className="text-xs text-gray-400">
                  <div>• Fuel System Operations</div>
                  <div>• Cargo Configuration</div>
                  <div>• Safety Procedures</div>
                  <div>• Mission Planning</div>
                </div>
              </div>
              
            </div>
            
            <div className="mt-8 p-4 bg-green-800 rounded-lg">
              <h3 className="text-lg font-semibold text-green-300 mb-2">✅ System Status</h3>
              <p className="text-green-100">Frontend successfully loaded and operational</p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;