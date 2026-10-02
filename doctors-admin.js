// ==========================================
// 1. GLOBAL UTILITIES & AUTHENTICATION
// ==========================================

// Global Logout function (attached to window for inline onclick handlers)
window.logout = function () {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('doctorName');
  localStorage.removeItem('currentUser');
  sessionStorage.clear();
  window.location.href = 'index.html';
};

// Dynamically display the logged-in doctor's name in the header badge
function loadLoggedInDoctorProfile() {
  let doctorName = '';

  const savedDoctorName = localStorage.getItem('doctorName');
  const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser');

  if (savedDoctorName && savedDoctorName !== 'undefined' && savedDoctorName !== 'null') {
    doctorName = savedDoctorName;
  } else if (userJson) {
    try {
      const user = JSON.parse(userJson);
      doctorName = user.doctorName || user.name || user.username || '';
    } catch (e) {
      console.error('Error parsing stored user data:', e);
    }
  }

  if (!doctorName) {
    doctorName = 'Dr. S. Manimozhi'; // Default fallback
  }

  // Format with "Dr." prefix
  if (!doctorName.toLowerCase().startsWith('dr.')) {
    doctorName = `Dr. ${doctorName}`;
  }

  const doctorDisplayEl = document.getElementById('doctorNameDisplay');
  if (doctorDisplayEl) {
    doctorDisplayEl.textContent = doctorName;
  }
}

// ==========================================
// 2. QUEUE & DASHBOARD DATA FETCHING
// ==========================================

async function fetchAndRenderDoctorDashboard() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    // Get logged in doctor name from storage
    let doctorName = localStorage.getItem('doctorName');
    if (!doctorName || doctorName === 'undefined' || doctorName === 'null') {
      const userJson = localStorage.getItem('user') || localStorage.getItem('currentUser');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          doctorName = user.doctorName || user.name || user.username || '';
        } catch (e) {}
      }
    }

    if (!doctorName) doctorName = '';

    // Pass doctor parameters dynamically to the backend endpoint
    const encodedDoctor = encodeURIComponent(doctorName);
    const fetchUrl = `/api/patients/queue/my-queue?doctor=${encodedDoctor}&doctorName=${encodedDoctor}&name=${encodedDoctor}`;

    const response = await fetch(fetchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const queueData = await response.json();

    // Summary calculations based on returned items
    if (Array.isArray(queueData)) {
      const totalAppointments = queueData.length;
      const waitingCount = queueData.filter(
        item => (item.status || '').toLowerCase() === 'waiting'
      ).length;

      const totalCollection = queueData.reduce((acc, item) => {
        return acc + (Number(item.doctorFee || item.fee || item.amount) || 0);
      }, 0);

      const statTodayEl = document.getElementById('statTodayAppointments');
      const statWaitingEl = document.getElementById('statWaitingQueue');
      const statCollectionEl = document.getElementById('statTodayCollection');

      if (statTodayEl) statTodayEl.textContent = totalAppointments;
      if (statWaitingEl) statWaitingEl.textContent = waitingCount;
      if (statCollectionEl) statCollectionEl.textContent = `₹${totalCollection.toLocaleString('en-IN')}`;
    }

    // Fetch total unique patient count for this doctor
    fetchTotalPatientsCount(token, doctorName);

    // Render Table Rows
    const tableBody = document.getElementById('patientQueue') || document.getElementById('queueTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!Array.isArray(queueData) || queueData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No patients in queue today.</td></tr>`;
      return;
    }

    queueData.forEach((item, index) => {
      const patientName = item.patientName || item.name || 'Unknown Patient';
      const patientPhone = item.phone || item.mobile || 'N/A';
      const timeSlot = item.timeSlot || 'Unscheduled';
      const status = item.status || 'Waiting';
      const patientId = item.patientId || item._id;

      const rowHtml = `
        <tr data-id="${item._id}">
          <td>${index + 1}</td>
          <td><strong>${patientName}</strong></td>
          <td>${patientPhone}</td>
          <td>${timeSlot}</td>
          <td>
            <span class="badge ${status.toLowerCase() === 'waiting' ? 'badge-waiting' : 'badge-completed'}">
              ${status}
            </span>
          </td>
          <td>
            <a href="doctors-dashboard.html?id=${patientId}" class="btn-sm btn-action">Examine</a>
          </td>
        </tr>
      `;
      
      tableBody.insertAdjacentHTML('beforeend', rowHtml);
    });

  } catch (error) {
    console.error('Error loading doctor queue dashboard:', error);
  }
}

// Fetch total unique patient count for this doctor
async function fetchTotalPatientsCount(token, doctorName) {
  try {
    const res = await fetch(`/api/patients/total-count?doctorName=${encodeURIComponent(doctorName)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const statTotalEl = document.getElementById('statTotalPatients');
      if (statTotalEl && data.total !== undefined) {
        statTotalEl.textContent = data.total;
      }
    }
  } catch (err) {
    console.error('Failed to fetch total count:', err);
  }
}

// ==========================================
// 3. SEARCH & QUICK ADD PATIENT FUNCTIONS
// ==========================================

function filterPatients() {
  const input = document.getElementById('patientSearch');
  if (!input) return;
  const filter = input.value.toLowerCase();
  const table = document.getElementById('patientQueue') || document.getElementById('queueTableBody');
  if (!table) return;
  const rows = table.getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].textContent || rows[i].innerText;
    rows[i].style.display = text.toLowerCase().indexOf(filter) > -1 ? '' : 'none';
  }
}

async function addPatient(event) {
  event.preventDefault();
  
  const name = document.getElementById('newPatientName')?.value;
  const age = document.getElementById('newPatientAge')?.value;
  const gender = document.getElementById('newPatientGender')?.value;
  const phone = document.getElementById('newPatientPhone')?.value;
  const reason = document.getElementById('newPatientReason')?.value;

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const response = await fetch('/api/patients/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, age, gender, phone, reason })
    });

    if (response.ok) {
      alert('Patient added successfully!');
      document.getElementById('addPatientForm')?.reset();
      fetchAndRenderDoctorDashboard();
    } else {
      const errData = await response.json();
      alert(errData.message || 'Failed to add patient.');
    }
  } catch (err) {
    console.error('Error adding patient:', err);
    alert('Server error adding patient.');
  }
}

function viewHistory(patientId) {
  window.location.href = `doctors-dashboard.html?id=${patientId}&view=history`;
}

// ==========================================
// 4. INITIALIZATION ON DOM READY
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadLoggedInDoctorProfile();
  fetchAndRenderDoctorDashboard();
});