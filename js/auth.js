// Auth Form Submission Event Handlers

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Login logic
    if (loginForm) {
        // If user already logged in, send them to dashboard
        if (localStorage.getItem("jwt_token")) {
            window.location.href = "/frontend/dashboard.html";
            return;
        }

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            try {
                const response = await api.post("/auth/login", { email, password });
                
                if (response && response.token) {
                    api.setToken(response.token);
                    localStorage.setItem("user_email", email);
                    localStorage.setItem("user_role", response.role);
                    localStorage.setItem("user_id", response.id);
                    window.location.href = "/frontend/dashboard.html";
                } else {
                    utils.showToast("Failed to retrieve authentication token.", "error");
                }
            } catch (error) {
                console.error(error);
                utils.showToast("Invalid credentials or server error.", "error");
            }
        });
    }

    // Registration logic
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const fullName = document.getElementById("fullName").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const role = document.getElementById("role").value;
            const active = document.getElementById("active").checked;

            try {
                const payload = { fullName, email, password, role, active };
                const response = await api.post("/accounts/add", payload);
                
                if (response && response.id) {
                    utils.showToast("Account created successfully! Please login.", "success");
                    // Wait a bit for toast to show before redirecting
                    setTimeout(() => {
                        window.location.href = "/frontend/index.html";
                    }, 1500);
                } else {
                    utils.showToast("Failed to register account.", "error");
                }
            } catch (error) {
                console.error(error);
                utils.showToast("Email already exists or registration failed.", "error");
            }
        });
    }
});
