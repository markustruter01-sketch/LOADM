import { createRoot } from "react-dom/client";

function WorkingApp() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', color: '#f97316', marginBottom: '1rem' }}>
          LOADMworkflow
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Military Logistics Training Platform
        </h2>
        
        <div style={{
          backgroundColor: '#059669',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>✅ SYSTEM OPERATIONAL</h3>
          <p style={{ margin: 0 }}>Frontend successfully loaded and running</p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <div style={{
            backgroundColor: '#374151',
            padding: '1.5rem',
            borderRadius: '0.5rem'
          }}>
            <h3 style={{ color: '#f97316', marginBottom: '0.5rem' }}>C-17 Globemaster III</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#d1d5db' }}>
              Introduction to C-17 cargo loading fundamentals
            </p>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <div>• Aircraft Overview & Specifications</div>
              <div>• Cargo Compartment Dimensions</div>
              <div>• Standard Pallet Configurations</div>
              <div>• Weight and Balance Fundamentals</div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#374151',
            padding: '1.5rem',
            borderRadius: '0.5rem'
          }}>
            <h3 style={{ color: '#f97316', marginBottom: '0.5rem' }}>C-130 Hercules</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#d1d5db' }}>
              Complete C-130 loadmaster training
            </p>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <div>• Tactical Operations</div>
              <div>• Cargo Loading Procedures</div>
              <div>• Emergency Protocols</div>
              <div>• Performance Calculations</div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#374151',
            padding: '1.5rem',
            borderRadius: '0.5rem'
          }}>
            <h3 style={{ color: '#f97316', marginBottom: '0.5rem' }}>KC30A Tanker</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#d1d5db' }}>
              KC30A specific cargo and fuel operations
            </p>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
              <div>• Fuel System Operations</div>
              <div>• Cargo Configuration</div>
              <div>• Safety Procedures</div>
              <div>• Mission Planning</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<WorkingApp />);
} else {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
}
