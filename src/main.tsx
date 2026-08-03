// frontend/src/main.tsx

import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserProvider } from "./context/UserContext";
import App from "./App";
import "./styles/reset.css";
import "./styles/variables.css";
import "./styles/globals.css";
import "@fontsource/ubuntu";
import "@fontsource/ubuntu/300.css";
import "@fontsource/ubuntu/500.css";
import "@fontsource/ubuntu/700.css";

// ❌ USUŃ TO:
// const API_URL = "http://localhost:3000";
// console.log(`🔗 [main.tsx] API_URL: ${API_URL}`);

// ❌ USUŃ CAŁY TEN BLOK:
// const originalFetch = window.fetch;
// window.fetch = function (...args) {
// 	const [url, options] = args;
// 	if (typeof url === "string" && url.startsWith("/api/")) {
// 		const newUrl = `${API_URL}${url}`;
// 		logger.debug(`🔄 [fetch] ${url} -> ${newUrl}`);
// 		return originalFetch(newUrl, options);
// 	}
// 	return originalFetch(url, options);
// };

// (window as any).goTo = (path: string) => {
// 	logger.debug(`🔄 [goTo] -> ${path}`);
// 	const hash = path.startsWith("#") ? path : `#${path}`;
// 	window.location.hash = hash;
// };

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
		<UserProvider>
			<HashRouter>
				<App />
			</HashRouter>
		</UserProvider>
	</GoogleOAuthProvider>,
);
