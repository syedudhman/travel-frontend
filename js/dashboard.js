// Dashboard Stats population script

document.addEventListener("DOMContentLoaded", async () => {
    // Authenticate guard
    utils.authGuard();
    
    // Set active link + user info
    utils.setupNavigation();

    // Fetch counts and populate UI
    try {
        const [packages, itineraries, reservations, activities] = await Promise.all([
            api.get("/packages/all").catch(() => []),
            api.get("/trip-itineraries/all").catch(() => []),
            api.get("/reservations/all").catch(() => []),
            api.get("/activities/all").catch(() => [])
        ]);

        document.getElementById("packagesCount").textContent = packages.length;
        document.getElementById("itinerariesCount").textContent = itineraries.length;
        document.getElementById("reservationsCount").textContent = reservations.length;
        document.getElementById("activitiesCount").textContent = activities.length;
    } catch (error) {
        console.error("Failed to load dashboard metrics", error);
        utils.showToast("Error retrieving system statistics.", "error");
    }
});
