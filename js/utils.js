// Shared Frontend Utilities

const utils = {
    // Check if token exists, otherwise redirect to login page
    authGuard() {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            window.location.href = "index.html";
            return;
        }

        // Role based route guards
        const role = localStorage.getItem("user_role");
        const path = window.location.pathname;

        if (role === "TRAVELER" && path.includes("packages.html")) {
            utils.showToast("Access Denied: Travelers cannot manage packages", "error");
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1000);
        }
    },

    // Show dynamic toast alert notifications
    showToast(message, type = "success") {
        let container = document.querySelector(".toast-container");
        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        
        const textSpan = document.createElement("span");
        textSpan.textContent = message;
        toast.appendChild(textSpan);

        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.fontSize = "1.2rem";
        closeBtn.onclick = () => toast.remove();
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        // Auto remove after 3.5 seconds
        setTimeout(() => {
            toast.style.animation = "slideOut 0.3s ease-in forwards";
            toast.addEventListener("animationend", () => toast.remove());
        }, 3500);
    },

    // Show clean "Are you sure?" confirmation dialog using custom Promise-based modal
    showConfirm(message) {
        return new Promise((resolve) => {
            let overlay = document.querySelector(".modal-overlay");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "modal-overlay";
                overlay.innerHTML = `
                    <div class="modal">
                        <h3>Confirm Action</h3>
                        <p id="confirmMessage"></p>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" id="confirmCancelBtn">Cancel</button>
                            <button class="btn btn-danger" id="confirmOkBtn">Confirm</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
            }

            document.getElementById("confirmMessage").textContent = message;
            overlay.classList.add("active");

            const handleCancel = () => {
                overlay.classList.remove("active");
                cleanup();
                resolve(false);
            };

            const handleOk = () => {
                overlay.classList.remove("active");
                cleanup();
                resolve(true);
            };

            const cleanup = () => {
                document.getElementById("confirmCancelBtn").removeEventListener("click", handleCancel);
                document.getElementById("confirmOkBtn").removeEventListener("click", handleOk);
            };

            document.getElementById("confirmCancelBtn").addEventListener("click", handleCancel);
            document.getElementById("confirmOkBtn").addEventListener("click", handleOk);
        });
    },

    // Client-side real-time table search/filter
    setupSearch(inputId, tableBodyId) {
        const searchInput = document.getElementById(inputId);
        const tableBody = document.getElementById(tableBodyId);
        
        if (!searchInput || !tableBody) return;

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const rows = tableBody.getElementsByTagName("tr");

            for (const row of rows) {
                // Skip empty states
                if (row.classList.contains("empty-row")) continue;
                
                let text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = "";
                } else {
                    row.style.display = "none";
                }
            }
        });
    },

    // Format ISO Datetime to readable locale string
    formatDate(dateString) {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    },

    // Format numbers to currency representation
    formatCurrency(amount) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);
    },

    // Add navigation active status dynamically
    setupNavigation() {
        const path = window.location.pathname;
        const links = document.querySelectorAll(".nav-links li");
        const role = localStorage.getItem("user_role");
        
        links.forEach(li => {
            const a = li.querySelector("a");
            if (a) {
                // Hide packages link for TRAVELER
                if (role === "TRAVELER" && a.getAttribute("href") === "packages.html") {
                    li.style.display = "none";
                    return;
                }

                if (path.includes(a.getAttribute("href"))) {
                    li.classList.add("active");
                } else {
                    li.classList.remove("active");
                }
            }
        });

        // Set username in header if available in token/storage
        const usernameSpan = document.getElementById("headerUsername");
        if (usernameSpan) {
            const email = localStorage.getItem("user_email") || "User";
            usernameSpan.textContent = email;
        }

        // Attach logout listener
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                localStorage.clear();
                window.location.href = "index.html";
            };
        }
    }
};

