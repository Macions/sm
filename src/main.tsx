
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  
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







const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
	console.error('❌ BRAKUJE VITE_GOOGLE_CLIENT_ID w env!');
}



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