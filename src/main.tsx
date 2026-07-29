import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";

import App from "./App";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/globals.css";

// ⭐ GLOBALNY INTERCEPTOR DLA FETCH ⭐
const API_URL = "https://sm-backend-po9k.onrender.com";
const originalFetch = window.fetch;
window.fetch = function (...args) {
  const [url, options] = args;
  if (typeof url === 'string' && url.startsWith('/api/')) {
    const newUrl = `${API_URL}${url}`;
    console.log(`🔄 [fetch] ${url} -> ${newUrl}`);
    return originalFetch(newUrl, options);
  }
  return originalFetch(url, options);
};

// ⭐ GLOBALNA FUNKCJA NAVIGACJI ⭐
(window as any).goTo = (path: string) => {
  const isGhPages = window.location.pathname.includes('/sm/');
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  console.log(`🔄 [goTo] path: ${path}, isGhPages: ${isGhPages}, isLocal: ${isLocal}`);

  // Lokalnie - użyj React Router navigate
  if (isLocal) {
    const nav = (window as any).__navigate;
    if (nav) {
      console.log(`🔄 [goTo] lokalnie -> navigate(${path})`);
      nav(path);
      return;
    }
    // Fallback
    window.location.href = path;
    return;
  }

  // GitHub Pages
  if (isGhPages && path.startsWith('/') && !path.startsWith('/sm/') && !path.startsWith('#')) {
    const newPath = `/sm/#${path}`;
    console.log(`🔄 [goTo] GitHub Pages: ${path} -> ${newPath}`);
    window.location.href = newPath;
  } else {
    window.location.href = path;
  }
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);