import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom"; // ⬅️ ZMIEŃ NA HashRouter
import "@fortawesome/fontawesome-free/css/all.min.css";

import App from "./App";

import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>  {/* ⬅️ ZMIEŃ NA HashRouter */}
      <App />
    </HashRouter>
  </StrictMode>
);