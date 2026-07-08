// Packages CRUD script

document.addEventListener("DOMContentLoaded", () => {
    utils.authGuard();
    utils.setupNavigation();
    utils.setupSearch("searchInput", "packagesTableBody");

    const packageForm = document.getElementById("packageForm");
    const packageIdInput = document.getElementById("packageId");
    const saveBtn = document.getElementById("saveBtn");
    const formTitle = document.getElementById("formTitle");
    const cancelBtn = document.getElementById("cancelBtn");
    const tableBody = document.getElementById("packagesTableBody");

    // Load initial package list
    loadPackages();

    // Form submission (Add or Update)
    packageForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const packageId = packageIdInput.value;
        const payload = {
            packageName: document.getElementById("packageName").value.trim(),
            destination: document.getElementById("destination").value.trim(),
            price: parseFloat(document.getElementById("price").value),
            durationDays: parseInt(document.getElementById("durationDays").value),
            description: document.getElementById("description").value.trim()
        };

        try {
            let response;
            if (packageId) {
                // Update
                payload.id = parseInt(packageId);
                response = await api.put(`/packages/update/${packageId}`, payload);
                utils.showToast("Travel package updated successfully!", "success");
            } else {
                // Add
                response = await api.post("/packages/add", payload);
                utils.showToast("Travel package added successfully!", "success");
            }

            if (response) {
                resetForm();
                loadPackages();
            }
        } catch (error) {
            console.error(error);
            utils.showToast("Error processing request.", "error");
        }
    });

    // Reset button click
    cancelBtn.addEventListener("click", resetForm);

    // Fetch and populate package list
    async function loadPackages() {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Loading packages...</td></tr>`;

        try {
            const packages = await api.get("/packages/all");
            tableBody.innerHTML = "";

            if (!packages || packages.length === 0) {
                tableBody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="6" style="text-align:center;">
                            <div class="empty-state">
                                <h3>No Packages Found</h3>
                                <p>Create a package above to get started.</p>
                            </div>
                        </td>
                    </tr>`;
                return;
            }

            packages.forEach(pkg => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${pkg.id}</td>
                    <td><strong>${pkg.packageName}</strong></td>
                    <td>${pkg.destination}</td>
                    <td>${utils.formatCurrency(pkg.price)}</td>
                    <td>${pkg.durationDays} Days</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-edit" data-id="${pkg.id}">Edit</button>
                            <button class="btn-action btn-delete" data-id="${pkg.id}">Delete</button>
                        </div>
                    </td>
                `;

                // Add button listeners
                tr.querySelector(".btn-edit").addEventListener("click", () => populateFormForEdit(pkg));
                tr.querySelector(".btn-delete").addEventListener("click", () => handleDeletePackage(pkg.id));

                tableBody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger-color);">Error loading packages.</td></tr>`;
        }
    }

    // Populate form inputs for editing
    function populateFormForEdit(pkg) {
        packageIdInput.value = pkg.id;
        document.getElementById("packageName").value = pkg.packageName;
        document.getElementById("destination").value = pkg.destination;
        document.getElementById("price").value = pkg.price;
        document.getElementById("durationDays").value = pkg.durationDays;
        document.getElementById("description").value = pkg.description || "";

        formTitle.textContent = "Edit Travel Package";
        saveBtn.textContent = "Update Package";
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Process Delete package
    async function handleDeletePackage(id) {
        const confirmed = await utils.showConfirm(`Are you sure you want to delete Travel Package #${id}? This will also delete any linked bookings/itineraries.`);
        if (!confirmed) return;

        try {
            await api.delete(`/packages/delete/${id}`);
            utils.showToast("Travel package deleted successfully.", "success");
            loadPackages();
        } catch (error) {
            console.error(error);
            utils.showToast("Failed to delete package.", "error");
        }
    }

    // Clear form
    function resetForm() {
        packageForm.reset();
        packageIdInput.value = "";
        formTitle.textContent = "Add New Travel Package";
        saveBtn.textContent = "Save Package";
    }
});
