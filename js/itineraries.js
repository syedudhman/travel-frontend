// Itineraries CRUD script

document.addEventListener("DOMContentLoaded", () => {
    utils.authGuard();
    utils.setupNavigation();
    utils.setupSearch("searchInput", "itinerariesTableBody");

    const itineraryForm = document.getElementById("itineraryForm");
    const itineraryIdInput = document.getElementById("itineraryId");
    const saveBtn = document.getElementById("saveBtn");
    const formTitle = document.getElementById("formTitle");
    const cancelBtn = document.getElementById("cancelBtn");
    const tableBody = document.getElementById("itinerariesTableBody");
    const accountSelect = document.getElementById("accountId");
    const packageSelect = document.getElementById("travelPackageId");

    // Local lookups to display names in table instead of plain IDs
    let accountsLookup = {};
    let packagesLookup = {};

    // Initial load
    init();

    async function init() {
        await Promise.all([
            loadAccounts(),
            loadPackages()
        ]);
        loadItineraries();
    }

    // Load active system accounts into dropdown
    async function loadAccounts() {
        try {
            const accounts = await api.get("/accounts/all");
            accountSelect.innerHTML = `<option value="">-- Select Account --</option>`;
            
            if (accounts) {
                accounts.forEach(acc => {
                    accountsLookup[acc.id] = acc.email;
                    const option = document.createElement("option");
                    option.value = acc.id;
                    option.textContent = `${acc.fullName} (${acc.email})`;
                    accountSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading accounts", error);
            utils.showToast("Failed to load user accounts for selections.", "error");
        }
    }

    // Load active packages into dropdown
    async function loadPackages() {
        try {
            const packages = await api.get("/packages/all");
            packageSelect.innerHTML = `<option value="">-- Select Package --</option>`;
            
            if (packages) {
                packages.forEach(pkg => {
                    packagesLookup[pkg.id] = pkg.packageName;
                    const option = document.createElement("option");
                    option.value = pkg.id;
                    option.textContent = `${pkg.packageName} (${pkg.destination})`;
                    packageSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading packages", error);
            utils.showToast("Failed to load travel packages for selections.", "error");
        }
    }

    // Submit Handler
    itineraryForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const itineraryId = itineraryIdInput.value;
        const payload = {
            tripName: document.getElementById("tripName").value.trim(),
            status: document.getElementById("status").value,
            aiGenerated: document.getElementById("aiGenerated").checked,
            accountId: parseInt(accountSelect.value),
            travelPackageId: parseInt(packageSelect.value)
        };

        try {
            let response;
            if (itineraryId) {
                payload.id = parseInt(itineraryId);
                response = await api.put(`/trip-itineraries/update/${itineraryId}`, payload);
                utils.showToast("Trip itinerary updated successfully!", "success");
            } else {
                response = await api.post("/trip-itineraries/add", payload);
                utils.showToast("Trip itinerary added successfully!", "success");
            }

            if (response) {
                resetForm();
                loadItineraries();
            }
        } catch (error) {
            console.error(error);
            utils.showToast("Error processing request. Ensure IDs are correct.", "error");
        }
    });

    cancelBtn.addEventListener("click", resetForm);

    // Fetch and populate table list
    async function loadItineraries() {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Loading itineraries...</td></tr>`;

        try {
            const role = localStorage.getItem("user_role");
            if (role === "TRAVELER") {
                const formCard = document.querySelector(".form-card");
                if (formCard) formCard.style.display = "none";
            }

            const itineraries = await api.get("/trip-itineraries/all");
            tableBody.innerHTML = "";

            if (!itineraries || itineraries.length === 0) {
                tableBody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="7" style="text-align:center;">
                            <div class="empty-state">
                                <h3>No Itineraries Found</h3>
                                <p>Create a trip itinerary above to get started.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            itineraries.forEach(iti => {
                const tr = document.createElement("tr");
                
                const statusBadgeClass = iti.status === "FINALIZED" ? "badge-finalized" : "badge-draft";
                const aiIndicator = iti.aiGenerated ? "🟢 Yes" : "❌ No";
                
                const accountName = accountsLookup[iti.accountId] || `Account #${iti.accountId}`;
                const packageName = packagesLookup[iti.travelPackageId] || `Package #${iti.travelPackageId}`;

                let actionsHtml = "";
                if (role !== "TRAVELER") {
                    actionsHtml = `
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" data-id="${iti.id}">Edit</button>
                            <button class="btn-action btn-delete" data-id="${iti.id}">Delete</button>
                        </div>
                    `;
                }

                tr.innerHTML = `
                    <td>${iti.id}</td>
                    <td><strong>${iti.tripName}</strong></td>
                    <td><span class="badge ${statusBadgeClass}">${iti.status}</span></td>
                    <td>${aiIndicator}</td>
                    <td>${accountName}</td>
                    <td>${packageName}</td>
                    <td>${actionsHtml}</td>
                `;

                // Add button listeners if they exist
                if (role !== "TRAVELER") {
                    tr.querySelector(".btn-edit").addEventListener("click", () => populateFormForEdit(iti));
                    tr.querySelector(".btn-delete").addEventListener("click", () => handleDeleteItinerary(iti.id));
                }

                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger-color);">Error loading itineraries.</td></tr>`;
        }
    }

    // Populate form inputs for editing
    function populateFormForEdit(iti) {
        itineraryIdInput.value = iti.id;
        document.getElementById("tripName").value = iti.tripName;
        document.getElementById("status").value = iti.status;
        document.getElementById("aiGenerated").checked = iti.aiGenerated;
        accountSelect.value = iti.accountId;
        packageSelect.value = iti.travelPackageId;

        formTitle.textContent = "Edit Trip Itinerary";
        saveBtn.textContent = "Update Itinerary";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Delete request
    async function handleDeleteItinerary(id) {
        const confirmed = await utils.showConfirm(`Are you sure you want to delete Trip Itinerary #${id}? This will also delete any linked bookings/activities.`);
        if (!confirmed) return;

        try {
            await api.delete(`/trip-itineraries/delete/${id}`);
            utils.showToast("Trip itinerary deleted successfully.", "success");
            loadItineraries();
        } catch (error) {
            console.error(error);
            utils.showToast("Failed to delete itinerary.", "error");
        }
    }

    // Reset/clear
    function resetForm() {
        itineraryForm.reset();
        itineraryIdInput.value = "";
        formTitle.textContent = "Create New Trip Itinerary";
        saveBtn.textContent = "Save Itinerary";
    }
});
