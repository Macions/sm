// frontend/src/main.tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  // ← ZMIEŃ NA BrowserRouter
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

// console.log('🔍 === SPRAWDZAM ENV ===');
// console.log('🔍 VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
// console.log('🔍 GOOGLE_CLIENT_ID:', import.meta.env.GOOGLE_CLIENT_ID);
// console.log('🔍 Czy jest undefined?', import.meta.env.VITE_GOOGLE_CLIENT_ID === undefined);
// console.log('🔍 Całe import.meta.env:', import.meta.env);

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
	console.error('❌ BRAKUJE VITE_GOOGLE_CLIENT_ID w env!');
}

// console.log('🔍 Używam clientId:', clientId);

createRoot(document.getElementById("root")!).render(
	<GoogleOAuthProvider
		clientId={clientId}
		onScriptLoadError={() => console.error('❌ Google script error')}
	>
		<UserProvider>
			<BrowserRouter>  {/* ← ZMIEŃ HashRouter NA BrowserRouter */}
				<App />
			</BrowserRouter>
		</UserProvider>
	</GoogleOAuthProvider>,
);