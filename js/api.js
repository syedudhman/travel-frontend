// Centralized Fetch API Wrapper with JWT Injection and Error Interception

const API_BASE = "https://travel-backend-w7l4.onrender.com";

const api = {
    getToken() {
        return localStorage.getItem("jwt_token");
    },

    setToken(token) {
        localStorage.setItem("jwt_token", token);
    },

    clearToken() {
        localStorage.removeItem("jwt_token");
    },

    async request(url, options = {}) {
        // Set up headers
        options.headers = options.headers || {};
        
        const token = this.getToken();
        if (token) {
            options.headers["Authorization"] = `Bearer ${token}`;
        }

        if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(`${API_BASE}${url}`, options);

            // Handle session timeout / unauthorized
            if (response.status === 401 || response.status === 403) {
                // If we are not already on the login page, clear token and redirect
                if (!window.location.pathname.endsWith("index.html") && window.location.pathname !== "/frontend/") {
                    this.clearToken();
                    window.location.href = "/frontend/index.html";
                }
            }

            // Return response based on content type
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error("API request failed:", error);
            throw error;
        }
    },

    get(url) {
        return this.request(url, { method: "GET" });
    },

    post(url, body) {
        return this.request(url, { method: "POST", body });
    },

    put(url, body) {
        return this.request(url, { method: "PUT", body });
    },

    delete(url) {
        return this.request(url, { method: "DELETE" });
    }
};
