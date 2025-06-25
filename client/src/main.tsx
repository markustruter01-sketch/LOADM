import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
}
