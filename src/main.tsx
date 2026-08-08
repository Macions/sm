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

// ✅ DODAJ LOGI:
console.log('🔍 === SPRAWDZAM ENV ===');
console.log('🔍 VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('🔍 GOOGLE_CLIENT_ID:', import.meta.env.GOOGLE_CLIENT_ID);
console.log('🔍 Czy jest undefined?', import.meta.env.VITE_GOOGLE_CLIENT_ID === undefined);
console.log('🔍 Całe import.meta.env:', import.meta.env);

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ✅ DODAJ FALLBACK DLA TESTOWANIA:
if (!clientId) {
	console.error('❌ BRAKUJE VITE_GOOGLE_CLIENT_ID w env! Używam fallbacka...');
	// Użyj sztywnego ID tylko do testów!
	// clientId = '848834850023-l0e4gobn16tfqhhletocuab6t0356qo8.apps.googleusercontent.com';
}

console.log('🔍 Używam clientId:', clientId);

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider
		clientId={clientId}
		onScriptLoadError={() => console.error('❌ Google script error')}
	>
		<UserProvider>
			<HashRouter>
				<App />
			</HashRouter>
		</UserProvider>
	</GoogleOAuthProvider>,
);