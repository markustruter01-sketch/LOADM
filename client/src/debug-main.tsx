console.log("Debug: main.tsx starting");

try {
  console.log("Debug: Importing createRoot");
  import { createRoot } from "react-dom/client";
  
  console.log("Debug: Creating basic component");
  function DebugApp() {
    console.log("Debug: DebugApp rendering");
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '2rem',
        zIndex: 9999
      }}>
        <h1>DEBUG: Frontend is working!</h1>
        <p>If you see this, React is loading properly.</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    );
  }
  
  console.log("Debug: Getting root element");
  const rootElement = document.getElementById("root");
  console.log("Debug: Root element:", rootElement);
  
  if (rootElement) {
    console.log("Debug: Creating React root");
    const root = createRoot(rootElement);
    console.log("Debug: Rendering app");
    root.render(<DebugApp />);
    console.log("Debug: Render complete");
  } else {
    console.error("Debug: Root element not found");
    document.body.innerHTML = '<div style="background: red; color: white; padding: 20px;">ERROR: Root element not found</div>';
  }
} catch (error) {
  console.error("Debug: Error in main.tsx:", error);
  document.body.innerHTML = `<div style="background: red; color: white; padding: 20px;">ERROR: ${error.message}</div>`;
}