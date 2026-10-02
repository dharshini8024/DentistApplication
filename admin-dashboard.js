/* ==========================================================================
   ISSAI DENTAL CLINIC - RECEPTION DASHBOARD LOGIC
   ========================================================================== */

// Global Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Wait for the DOM content to fully load before initializing scripts
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
  loadDashboardStats();
  loadLiveDoctorAppointments(); // <--- Added: Initial load for live appointments

  // Refresh dynamic metrics and appointments automatically every 10 seconds
  setInterval(() => {
    loadDashboardStats();
    loadLiveDoctorAppointments(); // <--- Added: Real-time update loop
  }, 10000);
});

/**
 * Initializes dashboard event listeners and default settings
 */
function initializeDashboard() {
  // Setup logout button event listener if present in the DOM
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Set default language selection in dropdown if present
  const languageSelect = document.getElementById('languageSelect');
  if (languageSelect) {
    languageSelect.value = document.body.getAttribute('data-lang') || 'en';
  }
}

/**
 * Fetches and updates dynamic metric counters from MongoDB on a daily basis
 */
async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');

    const data = await response.json();

    // Update HTML element values using utility function
    updateStatCount('statNewUsers', data.newUsersToday ?? 0);
    updateStatCount('statTotalUsers', data.totalExistingUsers ?? 0);
    updateStatCount('statTodayAppointments', data.appointmentsToday ?? 0);
  } catch (error) {
    console.error('Error loading dashboard statistics:', error);
  }
}

/**
 * Fetches and renders live appointments grouped by doctor
 */
async function loadLiveDoctorAppointments() {
  const container = document.getElementById('doctorAppointmentsContainer');
  if (!container) return;

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/today-by-doctor`);
    if (!response.ok) throw new Error('Failed to fetch doctor appointments');

    const doctorsData = await response.json(); // Array: [{ doctorName, count, appointments: [...] }]

    if (!doctorsData || doctorsData.length === 0) {
      container.innerHTML = `
        <p style="text-align: center; color: #6b7280; padding: 15px;">
          <span class="lang-en">No appointments scheduled for today.</span>
          <span class="lang-ta">இன்று முன்பதிவுகள் எதுவும் இல்லை.</span>
        </p>`;
      return;
    }

    container.innerHTML = doctorsData.map(doc => `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #1e293b; font-size: 0.95rem;">👨‍⚕️ ${doc.doctorName}</strong>
          <span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
            ${doc.count} Booking(s)
          </span>
        </div>
        <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
          ${doc.appointments.length > 0 ? doc.appointments.map(app => `
            <li style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 8px; background: #fff; border-radius: 4px; border: 1px solid #f1f5f9;">
              <span><strong>${app.patientName}</strong> (${app.phone})</span>
              <span style="color: #64748b;">${app.timeSlot || 'Unscheduled'}</span>
            </li>
          `).join('') : '<li style="font-size: 0.8rem; color: #94a3b8;">No bookings for this doctor today.</li>'}
        </ul>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error loading live appointments by doctor:', error);
  }
}

/**
 * Navigates to a target URL/Page within the workspace
 * @param {string} pageUrl - Path to the destination HTML file
 */
function navigateTo(pageUrl) {
  if (!pageUrl) return;
  window.location.href = pageUrl;
}

/**
 * Changes the active language layout by updating the data-lang attribute on <body>
 * @param {string} mode - Language mode: 'en' (English), 'ta' (Tamil), or 'both'
 */
function changeLanguage(mode) {
  if (!['en', 'ta', 'both'].includes(mode)) return;
  
  document.body.setAttribute('data-lang', mode);
  
  // Optional: Persist user language preference in local storage
  try {
    localStorage.setItem('issai_app_lang', mode);
  } catch (e) {
    console.warn('Storage unavailable:', e);
  }
}

/**
 * Handles user logout confirmation and redirect
 */
function handleLogout() {
  const isTamil = document.body.getAttribute('data-lang') === 'ta';
  const confirmMsg = isTamil 
    ? 'கணக்கிலிருந்து வெளியேற வேண்டுமா?' 
    : 'Are you sure you want to logout?';

  if (confirm(confirmMsg)) {
    // Redirect to login page
    window.location.href = 'index.html';
  }
}

/**
 * Utility Function: Dynamically update metric card counters
 * @param {string} elementId - Target DOM element ID
 * @param {number|string} newValue - Value to be updated
 */
function updateStatCount(elementId, newValue) {
  const statElement = document.getElementById(elementId);
  if (statElement) {
    statElement.textContent = newValue;
  }
}