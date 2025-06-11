import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Cache busting for React component updates
console.log('App reload timestamp:', new Date().toISOString());

createRoot(document.getElementById("root")!).render(<App />);
