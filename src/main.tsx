import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/globals.css";


const API_URL = "https://sm-backend-po9k.onrender.com";
const originalFetch = window.fetch;
window.fetch = function (...args) {
	const [url, options] = args;
	if (typeof url === "string" && url.startsWith("/api/")) {
		const newUrl = `${API_URL}${url}`;
		logger.debug(`🔄 [fetch] ${url} -> ${newUrl}`);
		return originalFetch(newUrl, options);
	}
	return originalFetch(url, options);
};



(window as any).goTo = (path: string) => {
	logger.debug(`🔄 [goTo] -> ${path}`);

	const hash = path.startsWith("#") ? path : `#${path}`;
	window.location.hash = hash;
};

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
		<HashRouter>
			<App />
		</HashRouter>
	</GoogleOAuthProvider>,
);
