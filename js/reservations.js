// Reservations CRUD script

document.addEventListener("DOMContentLoaded", () => {
    utils.authGuard();
    utils.setupNavigation();
    utils.setupSearch("searchInput", "reservationsTableBody");

    const reservationForm = document.getElementById("reservationForm");
    const reservationIdInput = document.getElementById("reservationId");
    const saveBtn = document.getElementById("saveBtn");
    const formTitle = document.getElementById("formTitle");
    const cancelBtn = document.getElementById("cancelBtn");
    const tableBody = document.getElementById("reservationsTableBody");
    const itinerarySelect = document.getElementById("itineraryId");
    const packageSelect = document.getElementById("travelPackageId");

    // Local lookups for display
    let itinerariesLookup = {};
    let packagesLookup = {};

    init();

    async function init() {
        await Promise.all([
            loadItineraries(),
            loadPackages()
        ]);
        loadReservations();
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
                    option.textContent = pkg.packageName;
                    packageSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error loading packages", error);
            utils.showToast("Failed to load travel packages for selections.", "error");
        }
    }

    // Form Submission
    reservationForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const reservationId = reservationIdInput.value;
        const payload = {
            bookingReference: document.getElementById("bookingReference").value.trim(),
            reservedAt: document.getElementById("reservedAt").value, // datetime-local string
            status: document.getElementById("status").value,
            totalPaid: parseFloat(document.getElementById("totalPaid").value),
            itineraryId: parseInt(itinerarySelect.value),
            travelPackageId: parseInt(packageSelect.value)
        };

        try {
            let response;
            if (reservationId) {
                payload.id = parseInt(reservationId);
                response = await api.put(`/reservations/update/${reservationId}`, payload);
                utils.showToast("Booking reservation updated successfully!", "success");
            } else {
                response = await api.post("/reservations/add", payload);
                utils.showToast("Booking reservation created successfully!", "success");
            }

            if (response) {
                resetForm();
                loadReservations();
            }
        } catch (error) {
            console.error(error);
            utils.showToast("Error processing reservation.", "error");
        }
    });

    cancelBtn.addEventListener("click", resetForm);

    // Fetch and populate list
    async function loadReservations() {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Loading reservations...</td></tr>`;

        try {
            const role = localStorage.getItem("user_role");
            if (role === "TRAVELER") {
                const formCard = document.querySelector(".form-card");
                if (formCard) formCard.style.display = "none";
            }

            const reservations = await api.get("/reservations/all");
            tableBody.innerHTML = "";

            if (!reservations || reservations.length === 0) {
                tableBody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="8" style="text-align:center;">
                            <div class="empty-state">
                                <h3>No Booking Reservations Found</h3>
                                <p>Book a reservation above to get started.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            reservations.forEach(res => {
                const tr = document.createElement("tr");
                
                let badgeClass = "badge-pending";
                if (res.status === "CONFIRMED") badgeClass = "badge-confirmed";
                if (res.status === "CANCELLED") badgeClass = "badge-cancelled";

                const itineraryName = itinerariesLookup[res.itineraryId] || `Itinerary #${res.itineraryId}`;
                const packageName = packagesLookup[res.travelPackageId] || `Package #${res.travelPackageId}`;

                let actionsHtml = "";
                if (role !== "TRAVELER") {
                    actionsHtml = `
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" data-id="${res.id}">Edit</button>
                            <button class="btn-action btn-delete" data-id="${res.id}">Delete</button>
                        </div>
                    `;
                }

                tr.innerHTML = `
                    <td>${res.id}</td>
                    <td><code>${res.bookingReference}</code></td>
                    <td>${utils.formatDate(res.reservedAt)}</td>
                    <td><span class="badge ${badgeClass}">${res.status}</span></td>
                    <td>${utils.formatCurrency(res.totalPaid)}</td>
                    <td>${itineraryName}</td>
                    <td>${packageName}</td>
                    <td>${actionsHtml}</td>
                `;

                // Add button listeners if they exist
                if (role !== "TRAVELER") {
                    tr.querySelector(".btn-edit").addEventListener("click", () => populateFormForEdit(res));
                    tr.querySelector(".btn-delete").addEventListener("click", () => handleDeleteReservation(res.id));
                }

                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--danger-color);">Error loading reservations.</td></tr>`;
        }
    }

    // Populate for editing
    function populateFormForEdit(res) {
        reservationIdInput.value = res.id;
        document.getElementById("bookingReference").value = res.bookingReference;
        
        // Format ISO date (e.g. 2026-07-07T10:00:00) to match datetime-local expected format (2026-07-07T10:00)
        if (res.reservedAt) {
            const dateVal = res.reservedAt.substring(0, 16);
            document.getElementById("reservedAt").value = dateVal;
        }

        document.getElementById("status").value = res.status;
        document.getElementById("totalPaid").value = res.totalPaid;
        itinerarySelect.value = res.itineraryId;
        packageSelect.value = res.travelPackageId;

        formTitle.textContent = "Edit Booking Reservation";
        saveBtn.textContent = "Update Reservation";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Delete request
    async function handleDeleteReservation(id) {
        const confirmed = await utils.showConfirm(`Are you sure you want to delete Booking Reservation #${id}?`);
        if (!confirmed) return;

        try {
            await api.delete(`/reservations/delete/${id}`);
            utils.showToast("Booking reservation deleted successfully.", "success");
            loadReservations();
        } catch (error) {
            console.error(error);
            utils.showToast("Failed to delete reservation.", "error");
        }
    }

    // Clear form
    function resetForm() {
        reservationForm.reset();
        reservationIdInput.value = "";
        formTitle.textContent = "Create Booking Reservation";
        saveBtn.textContent = "Save Reservation";
    }
});
