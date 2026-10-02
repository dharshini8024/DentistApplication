/* ==========================================================================
   ISSAI DENTAL CLINIC - PATIENT CLINICAL RECORDS SEARCH PORTAL
   ========================================================================== */

const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Handles patient search submission and fetches profile + medical history
 */
async function handleSearchPatient(event) {
  event.preventDefault();

  const searchType = document.getElementById('searchType').value;
  const searchQuery = document.getElementById('searchQuery').value.trim();
  const resultsContainer = document.getElementById('resultsContainer');
  const noRecordMsg = document.getElementById('noRecordMsg');

  if (!searchQuery) return;

  try {
    const response = await fetch(`${API_BASE_URL}/patients/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`);
    const data = await response.json();

    if (response.ok && data.found) {
      noRecordMsg.classList.add('hidden');
      resultsContainer.style.display = 'block';

      // Populate Patient Info
      const profile = data.patient;
      document.getElementById('patientNameHeader').textContent = profile.name || 'Patient Profile';
      document.getElementById('pId').textContent = profile.patientId || profile._id || 'N/A';
      document.getElementById('pPhone').textContent = profile.phone || 'N/A';
      document.getElementById('pGenderAge').textContent = `${profile.gender || 'N/A'} / ${profile.age || 'N/A'}`;
      document.getElementById('pBloodGroup').textContent = profile.bloodGroup || 'N/A';
      document.getElementById('pDob').textContent = profile.dob || 'N/A';

      // Populate Clinical History Table
      renderHistoryTable(data.history || []);
    } else {
      resultsContainer.style.display = 'none';
      noRecordMsg.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error searching patient:', error);
    alert('Failed to fetch patient records from server.');
  }
}

/**
 * Renders the appointment and clinical history rows
 */
function renderHistoryTable(records) {
  const tbody = document.getElementById('historyTableBody');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="no-records">No past visit history found for this patient.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(item => {
    const isCompleted = item.paymentStatus === 'Completed' || item.paymentStatus === 'Paid';
    const statusClass = isCompleted ? 'status-completed' : 'status-pending';

    return `
      <tr>
        <td><strong>${item.date}</strong><br><small style="color: #2563eb;">${item.timeSlot || ''}</small></td>
        <td>${item.doctor || '-'}</td>
        <td>${item.department || '-'}</td>
        <td>${item.symptoms || 'General Checkup'}</td>
        <td>₹${item.doctorFee || 0}</td>
        <td><span class="${statusClass}">${item.paymentStatus || 'Pending'}</span></td>
        <td>${item.paymentMode || 'Cash'}</td>
      </tr>
    `;
  }).join('');
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