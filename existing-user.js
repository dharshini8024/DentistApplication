const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Triggered by onsubmit="handlePatientSearch(event)" in existing-user.html
 */
async function handlePatientSearch(event) {
    if (event) {
        event.preventDefault(); // Prevents page refresh
    }

    const inputField = document.getElementById('patientSearchInput');
    if (!inputField) return;

    const searchTerm = inputField.value.trim();

    if (!searchTerm) {
        alert("Please enter a Patient ID, Phone Number, or Name.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/patient-search?query=${encodeURIComponent(searchTerm)}`);

        if (!response.ok) {
            if (response.status === 404) {
                alert("No patient found with the given details.");
            } else {
                alert(`Server error status: ${response.status}`);
            }
            return;
        }

        const data = await response.json();
        renderPatientData(data);

    } catch (err) {
        console.error("Error fetching patient data:", err);
        alert("Unable to connect to backend server. Ensure node server.js is running on port 3000.");
    }
}

/**
 * Injects patient information and clinical history inside <div id="searchResults">
 */
function renderPatientData(data) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    // Unhide the main results container
    resultsContainer.classList.remove('hidden');

    // Build History Rows
    let historyRowsHtml = '';
    if (!data.serviceHistory || data.serviceHistory.length === 0) {
        historyRowsHtml = `<tr><td colspan="5" style="text-align:center; padding: 12px;">No visit history found.</td></tr>`;
    } else {
        data.serviceHistory.forEach(record => {
            const formattedDate = record.visitDate ? new Date(record.visitDate).toLocaleDateString() : 'N/A';
            historyRowsHtml += `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${formattedDate}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${record.visitTime || 'N/A'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${record.paymentAmount || 0}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${record.paymentMode || 'N/A'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${record.paymentStatus || 'N/A'}</td>
                </tr>
            `;
        });
    }

    // Dynamic HTML Structure injected into searchResults
    resultsContainer.innerHTML = `
        <!-- Patient Profile Card -->
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0; margin-top: 20px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1a365d;">Patient Information / நோயாளி விவரம்</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <p><strong>Patient ID:</strong> <span>${data.patientId || 'N/A'}</span></p>
                <p><strong>Name:</strong> <span>${data.name || 'N/A'}</span></p>
                <p><strong>Phone:</strong> <span>${data.phone || 'N/A'}</span></p>
                <p><strong>Gender:</strong> <span>${data.gender || 'N/A'}</span></p>
                <p><strong>Blood Group:</strong> <span>${data.bloodGroup || 'N/A'}</span></p>
            </div>
        </div>

        <!-- Service & Payment History Table -->
        <div style="background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
            <h3 style="margin-top: 0; color: #1a365d;">Service & Payment History / சேவை மற்றும் கட்டண வரலாறு</h3>
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background-color: #f7fafc; border-bottom: 2px solid #edf2f7;">
                        <th style="padding: 10px;">Visit Date</th>
                        <th style="padding: 10px;">Visit Time</th>
                        <th style="padding: 10px;">Amount Paid</th>
                        <th style="padding: 10px;">Payment Mode</th>
                        <th style="padding: 10px;">Payment Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyRowsHtml}
                </tbody>
            </table>
        </div>
    `;
}

// Language Toggle & Navigation Helper Functions
function changeLanguage(lang) {
    document.body.setAttribute('data-lang', lang);
}

function navigateTo(page) {
    window.location.href = page;
}

function handleLogout() {
    window.location.href = 'index.html';
}