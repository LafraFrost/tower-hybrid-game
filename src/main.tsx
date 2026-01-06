import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Modalità preview mobile: aggiungi ?mobilePreview=1 all'URL per simulare uno smartphone
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mobilePreview') === '1') {
    document.body.classList.add('mobile-preview');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
