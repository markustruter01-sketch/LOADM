import { createRoot } from "react-dom/client";

// Direct inline component to test React mounting
function TestApp() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', color: '#f97316', marginBottom: '1rem' }}>
        LOADMworkflow
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
        Military Logistics Training Platform
      </h2>
      <div style={{
        backgroundColor: '#059669',
        padding: '1rem',
        borderRadius: '0.5rem',
        textAlign: 'center'
      }}>
        <h3>✅ FRONTEND LOADED SUCCESSFULLY</h3>
        <p>React application is working correctly</p>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<TestApp />);
}