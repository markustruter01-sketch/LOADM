import { createRoot } from "react-dom/client";

console.log("MAIN.TSX: Starting application");

function SimpleApp() {
  console.log("SIMPLE APP: Rendering");
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f97316' }}>
          LOADMworkflow
        </h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
          Military Logistics Training Platform
        </h2>
        <div style={{
          backgroundColor: '#374151',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          <h3>System Status: OPERATIONAL</h3>
          <p>Frontend successfully loaded and running</p>
        </div>
        <div style={{
          backgroundColor: '#374151',
          padding: '1.5rem',
          borderRadius: '0.5rem'
        }}>
          <h3>Training Modules Available</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.5rem', margin: '0.5rem 0', backgroundColor: '#4b5563', borderRadius: '0.25rem' }}>
              C-17 Globemaster III Fundamentals
            </li>
            <li style={{ padding: '0.5rem', margin: '0.5rem 0', backgroundColor: '#4b5563', borderRadius: '0.25rem' }}>
              C-130 Hercules Operations
            </li>
            <li style={{ padding: '0.5rem', margin: '0.5rem 0', backgroundColor: '#4b5563', borderRadius: '0.25rem' }}>
              KC30A Tanker Procedures
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

console.log("MAIN.TSX: Getting root element");
const rootElement = document.getElementById("root");
console.log("MAIN.TSX: Root element found:", !!rootElement);

if (rootElement) {
  console.log("MAIN.TSX: Creating React root");
  const root = createRoot(rootElement);
  console.log("MAIN.TSX: Rendering app");
  root.render(<SimpleApp />);
  console.log("MAIN.TSX: App rendered successfully");
} else {
  console.error("MAIN.TSX: Root element not found!");
}
