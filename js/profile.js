// Profile Management script

document.addEventListener("DOMContentLoaded", () => {
    utils.authGuard();
    utils.setupNavigation();

    const profileForm = document.getElementById("profileForm");
    const profileIdInput = document.getElementById("profileId");
    const activeInput = document.getElementById("profileActive");
    const nameInput = document.getElementById("profileFullName");
    const emailInput = document.getElementById("profileEmail");
    const passwordInput = document.getElementById("profilePassword");
    const roleSelect = document.getElementById("profileRole");

    // Load logged in user details
    loadUserProfile();

    async function loadUserProfile() {
        const loggedInEmail = localStorage.getItem("user_email");
        if (!loggedInEmail) return;

        try {
            const accounts = await api.get("/accounts/all");
            if (accounts) {
                // Find matching user record by email
                const currentUser = accounts.find(acc => acc.email === loggedInEmail);
                
                if (currentUser) {
                    profileIdInput.value = currentUser.id;
                    activeInput.value = currentUser.active;
                    nameInput.value = currentUser.fullName;
                    emailInput.value = currentUser.email;
                    roleSelect.value = currentUser.role;
                } else {
                    utils.showToast("User details not found in system.", "error");
                }
            }
        } catch (error) {
            console.error("Failed to load user profile", error);
            utils.showToast("Failed to fetch user profile data.", "error");
        }
    }

    // Handle Profile Form submit
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = profileIdInput.value;
        const payload = {
            id: parseInt(id),
            fullName: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            role: roleSelect.value,
            active: activeInput.value === "true"
        };

        try {
            const response = await api.put(`/accounts/update/${id}`, payload);
            
            if (response) {
                // Update local storage email reference
                localStorage.setItem("user_email", response.email);
                
                // Update navigation text
                const headerUsername = document.getElementById("headerUsername");
                if (headerUsername) headerUsername.textContent = response.email;

                utils.showToast("Profile details updated successfully!", "success");
                passwordInput.value = ""; // Clear password field
            }
        } catch (error) {
            console.error(error);
            utils.showToast("Failed to update profile details.", "error");
        }
    });
});
