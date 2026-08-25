import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Endpoints where a failed auth attempt must not trigger a token refresh. */
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/verify-email",
];

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || "";

    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) =>
      url.endsWith(endpoint),
    );
    const hasSession =
      typeof window !== "undefined" &&
      Boolean(localStorage.getItem("refreshToken"));

    // The gateway returns 403 for an invalid/expired access token; retry once
    // with a refreshed pair before giving up.
    if (
      error.response?.status === 403 &&
      !isAuthEndpoint &&
      hasSession &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return instance(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.replace("/sign-in");
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
