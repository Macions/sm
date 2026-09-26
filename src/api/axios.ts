import axios from "axios";

const API_URL = "";
const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("accessToken");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// ============================================================
// LOGOUT
// ============================================================
const handleLogout = () => {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("user");

	document.cookie =
		"accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	document.cookie =
		"refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

	if (logoutTimer) {
		clearTimeout(logoutTimer);
		logoutTimer = null;
	}

	if (
		window.location.pathname !== "/login" &&
		window.location.pathname !== "/"
	) {
		window.location.href = "/login";
	}
};

// ============================================================
// REFRESH TOKEN QUEUE
// ============================================================
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (token: string) => void;
	reject: (reason?: any) => void;
	config: any;
}> = [];

const processQueue = (error: any | null, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.resolve(token!);
		}
	});
	failedQueue = [];
};

const isRefreshUrl = (url?: string) =>
	typeof url === "string" && url.includes("/api/auth/refresh-token");

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		const status = error.response?.status;

		// Brak configu (np. błąd sieci) - przepuść dalej
		if (!originalRequest) {
			return Promise.reject(error);
		}

		// ---- 401: próba odświeżenia tokenu (tylko raz na żądanie) ----
		if (status === 401 && !originalRequest._retry) {
			// 401 na samym refreshu -> twardy logout, koniec zabawy
			if (isRefreshUrl(originalRequest.url)) {
				handleLogout();
				return Promise.reject(error);
			}

			// Ktoś już odświeża -> czekamy w kolejce
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject, config: originalRequest });
				}).then((newToken: string) => {
					originalRequest.headers = originalRequest.headers || {};
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
					return api(originalRequest);
				});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				const refreshToken = localStorage.getItem("refreshToken");
				if (!refreshToken) {
					throw new Error("Brak refresh token");
				}

				const response = await axios.post(
					`${API_URL}/api/auth/refresh-token`,
					{ refreshToken },
					{ withCredentials: true },
				);

				const { accessToken } = response.data;
				if (!accessToken) {
					throw new Error("Brak nowego access token");
				}

				localStorage.setItem("accessToken", accessToken);
				api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

				// Odblokuj kolejkę z nowym tokenem
				processQueue(null, accessToken);

				// Ponów oryginalne żądanie
				originalRequest.headers = originalRequest.headers || {};
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;

				// Zrestartuj timer auto-logout z nowym czasem wygaśnięcia
				startAutoLogoutTimer(accessToken);

				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				handleLogout();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		// ---- 401 po nieudanej próbie retry -> twardy logout ----
		// UWAGA: 403 NIE wylogowuje. 403 = brak uprawnień, nie brak sesji.
		if (status === 401 && originalRequest._retry) {
			handleLogout();
		}

		return Promise.reject(error);
	},
);

// ============================================================
// AUTO LOGOUT TIMER (oparty na exp z JWT, nie na bezczynności)
// ============================================================
let logoutTimer: ReturnType<typeof setTimeout> | null = null;

const decodeJwtExp = (token: string): number | null => {
	try {
		const payload = JSON.parse(atob(token.split(".")[1]));
		if (typeof payload.exp !== "number") return null;
		return payload.exp * 1000; // ms
	} catch {
		return null;
	}
};

export const startAutoLogoutTimer = (accessToken?: string) => {
	if (logoutTimer) {
		clearTimeout(logoutTimer);
		logoutTimer = null;
	}

	const token = accessToken ?? localStorage.getItem("accessToken");
	if (!token) return;

	const exp = decodeJwtExp(token);
	if (!exp) return;

	// 30 sekund zapasu, żeby zdążyć odświeżyć przed wygaśnięciem
	const ms = exp - Date.now() - 30_000;

	if (ms <= 0) {
		// Token już wygasł - nie wylogowuj od razu na siłę,
		// pozwól interceptorowi obsłużyć 401 i odświeżyć.
		return;
	}

	logoutTimer = setTimeout(() => {
		// Timer minął, ale nie wylogowujemy na ślepo -
		// sprawdzamy czy token faktycznie wygasł.
		const current = localStorage.getItem("accessToken");
		const currentExp = current ? decodeJwtExp(current) : null;
		if (!currentExp || currentExp - 30_000 <= Date.now()) {
			handleLogout();
		} else {
			// Token został odświeżony w międzyczasie - restart
			startAutoLogoutTimer(current!);
		}
	}, ms);
};

// ============================================================
// FETCH WRAPPER
// ============================================================
const originalFetch = window.fetch;
window.fetch = function (...args) {
	const url = args[0];
	const options: RequestInit = args[1] || {};

	const publicPaths = [
		"/api/auth/login",
		"/api/auth/google",
		"/api/auth/register",
		"/api/health",
		"/api/auth/refresh-token",
	];
	const isPublic =
		typeof url === "string" && publicPaths.some((p) => url.includes(p));

	if (!isPublic) {
		const token = localStorage.getItem("accessToken");
		if (token) {
			options.headers = {
				...options.headers,
				Authorization: `Bearer ${token}`,
			};
		}
	}

	return originalFetch.call(this, url, options).then(async (response) => {
		// 401 -> próba refreshu (403 NIE - to brak uprawnień)
		if (response.status === 401) {
			// 401 na samym refreshu -> logout
			if (typeof url === "string" && url.includes("/api/auth/refresh-token")) {
				handleLogout();
				throw new Error("Unauthorized");
			}

			try {
				const refreshToken = localStorage.getItem("refreshToken");
				if (refreshToken) {
					const refreshResponse = await originalFetch.call(
						this,
						"/api/auth/refresh-token",
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ refreshToken }),
						},
					);

					if (refreshResponse.ok) {
						const data = await refreshResponse.json();
						if (data.accessToken) {
							localStorage.setItem("accessToken", data.accessToken);

							const headers = (options.headers as Record<string, string>) || {};
							headers.Authorization = `Bearer ${data.accessToken}`;
							options.headers = headers;

							startAutoLogoutTimer(data.accessToken);

							return originalFetch.call(this, url, options);
						}
					}
				}
			} catch (e) {
				console.error("Refresh failed:", e);
			}

			handleLogout();
			throw new Error("Unauthorized");
		}

		// 304 Not Modified -> wymuś ponowne pobranie
		if (response.status === 304) {
			const headers = options.headers as Record<string, string> | undefined;
			options.headers = {
				...(headers || {}),
				"Cache-Control": "no-cache",
			};
			options.cache = "no-store";
			return originalFetch.call(this, url, options);
		}

		return response;
	});
};

export default api;