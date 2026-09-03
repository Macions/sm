import axios from "axios";

const API_URL = "";
const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

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

let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: any) => void;
	reject: (reason?: any) => void;
	config: any;
}> = [];

const processQueue = (error: any | null, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error);
		} else {
			prom.config.headers.Authorization = `Bearer ${token}`;
			prom.resolve(api(prom.config));
		}
	});
	failedQueue = [];
};

const handleLogout = () => {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	localStorage.removeItem("user");

	document.cookie =
		"accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	document.cookie =
		"refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

	if (
		window.location.pathname !== "/login" &&
		window.location.pathname !== "/"
	) {
		window.location.href = "/login";
	}
};

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject, config: originalRequest });
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
					{
						refreshToken,
					},
					{
						withCredentials: true,
					},
				);

				const { accessToken } = response.data;

				if (!accessToken) {
					throw new Error("Brak nowego access token");
				}

				localStorage.setItem("accessToken", accessToken);
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				processQueue(null, accessToken);

				return api(originalRequest);
			} catch (refreshError) {
				processQueue(refreshError, null);
				handleLogout();
				return Promise.reject(refreshError);
			} finally {
				isRefreshing = false;
			}
		}

		if (error.response?.status === 403 || error.response?.status === 401) {
			handleLogout();
		}

		return Promise.reject(error);
	},
);

let logoutTimer: ReturnType<typeof setTimeout> | null = null;

export const startAutoLogoutTimer = () => {
	if (logoutTimer) {
		clearTimeout(logoutTimer);
	}

	logoutTimer = setTimeout(
		() => {
			handleLogout();
		},
		60 * 60 * 1000,
	);
};

export const resetAutoLogoutTimer = () => {
	if (logoutTimer) {
		clearTimeout(logoutTimer);
		startAutoLogoutTimer();
	}
};

if (typeof window !== "undefined") {
	const resetTimer = () => resetAutoLogoutTimer();
	window.addEventListener("click", resetTimer);
	window.addEventListener("keydown", resetTimer);
	window.addEventListener("mousemove", resetTimer);
	window.addEventListener("scroll", resetTimer);
}

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
		if (response.status === 401 || response.status === 403) {
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
							const headers = options.headers as Record<string, string>;
							if (headers) {
								headers.Authorization = `Bearer ${data.accessToken}`;
							} else {
								options.headers = {
									Authorization: `Bearer ${data.accessToken}`,
								};
							}
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
		return response;
	});
};

export default api;
