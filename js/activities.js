// Activities CRUD script

document.addEventListener("DOMContentLoaded", () => {
    utils.authGuard();
    utils.setupNavigation();
    utils.setupSearch("searchInput", "activitiesTableBody");

    const activityForm = document.getElementById("activityForm");
    const activityIdInput = document.getElementById("activityId");
    const saveBtn = document.getElementById("saveBtn");
    const formTitle = document.getElementById("formTitle");
    const cancelBtn = document.getElementById("cancelBtn");
    const tableBody = document.getElementById("activitiesTableBody");
    const itinerarySelect = document.getElementById("itineraryId");

    // Local lookups for display
    let itinerariesLookup = {};

    init();

    async function init() {
        await loadItineraries();
        loadActivities();
    }

    // Load active itineraries into dropdown
    async function loadItineraries() {
        try {
            const itineraries = await api.get("/trip-itineraries/all");
            itinerarySelect.innerHTML = `<option value="">-- Select Itinerary --</option>`;
            
            if (itineraries) {
                itineraries.forEach(iti => {
                    itinerariesLookup[iti.id] = iti.tripName;
                    const option = document.createElement("option");
                    option.value = iti.id;
                    option.textContent = iti.tripName;
                    itinerarySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading itineraries", error);
            utils.showToast("Failed to load itineraries for selections.", "error");
        }
    }

    // Form Submission
    activityForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const activityId = activityIdInput.value;
        const payload = {
            activityName: document.getElementById("activityName").value.trim(),
            location: document.getElementById("location").value.trim(),
            scheduledAt: document.getElementById("scheduledAt").value, // datetime-local string
            estimatedCost: parseFloat(document.getElementById("estimatedCost").value),
            requiresBooking: document.getElementById("requiresBooking").checked,
            itineraryId: parseInt(itinerarySelect.value)
        };

        try {
            let response;
            if (activityId) {
                payload.id = parseInt(activityId);
                response = await api.put(`/activities/update/${activityId}`, payload);
                utils.showToast("Planned activity updated successfully!", "success");
            } else {
                response = await api.post("/activities/add", payload);
                utils.showToast("Planned activity added successfully!", "success");
            }

            if (response) {
                resetForm();
                loadActivities();
            }
        } catch (error) {
            console.error(error);
            utils.showToast("Error processing activity details.", "error");
        }
    });

    cancelBtn.addEventListener("click", resetForm);

    // Fetch and populate list
    async function loadActivities() {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading activities...</td></tr>`;

        try {
            const role = localStorage.getItem("user_role");
            if (role === "TRAVELER") {
                const formCard = document.querySelector(".form-card");
                if (formCard) formCard.style.display = "none";
            }

            const activities = await api.get("/activities/all");
            tableBody.innerHTML = "";

            if (!activities || activities.length === 0) {
                tableBody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="8" style="text-align:center;">
                            <div class="empty-state">
                                <h3>No Planned Activities Found</h3>
                                <p>Create a planned activity above to get started.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            activities.forEach(act => {
                const tr = document.createElement("tr");
                
                const bookingIndicator = act.requiresBooking ? "🟢 Yes" : "❌ No";
                const itineraryName = itinerariesLookup[act.itineraryId] || `Itinerary #${act.itineraryId}`;

                let actionsHtml = "";
                if (role !== "TRAVELER") {
                    actionsHtml = `
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" data-id="${act.id}">Edit</button>
                            <button class="btn-action btn-delete" data-id="${act.id}">Delete</button>
                        </div>
                    `;
                }

                tr.innerHTML = `
                    <td>${act.id}</td>
                    <td><strong>${act.activityName}</strong></td>
                    <td>${act.location}</td>
                    <td>${utils.formatDate(act.scheduledAt)}</td>
                    <td>${utils.formatCurrency(act.estimatedCost)}</td>
                    <td>${bookingIndicator}</td>
                    <td>${itineraryName}</td>
                    <td>${actionsHtml}</td>
                `;

                // Add button listeners if they exist
                if (role !== "TRAVELER") {
                    tr.querySelector(".btn-edit").addEventListener("click", () => populateFormForEdit(act));
                    tr.querySelector(".btn-delete").addEventListener("click", () => handleDeleteActivity(act.id));
                }

                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger-color);">Error loading activities.</td></tr>`;
        }
    }

    // Populate for editing
    function populateFormForEdit(act) {
        activityIdInput.value = act.id;
        document.getElementById("activityName").value = act.activityName;
        document.getElementById("location").value = act.location;
        
        if (act.scheduledAt) {
            const dateVal = act.scheduledAt.substring(0, 16);
            document.getElementById("scheduledAt").value = dateVal;
        }

        document.getElementById("estimatedCost").value = act.estimatedCost;
        document.getElementById("requiresBooking").checked = act.requiresBooking;
        itinerarySelect.value = act.itineraryId;

        formTitle.textContent = "Edit Planned Activity";
        saveBtn.textContent = "Update Activity";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Delete request
    async function handleDeleteActivity(id) {
        const confirmed = await utils.showConfirm(`Are you sure you want to delete Planned Activity #${id}?`);
        if (!confirmed) return;

        try {
            await api.delete(`/activities/delete/${id}`);
            utils.showToast("Planned activity deleted successfully.", "success");
            loadActivities();
        } catch (error) {
            console.error(error);
            utils.showToast("Failed to delete activity.", "error");
        }
    }

    // Clear form
    function resetForm() {
        activityForm.reset();
        activityIdInput.value = "";
        formTitle.textContent = "Plan New Activity";
        saveBtn.textContent = "Save Activity";
    }
});
