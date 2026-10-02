/* ==========================================================================
   ISSAI DENTAL CLINIC - APPOINTMENT & RECEPTION MANAGEMENT
   ========================================================================== */

// Base API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Global State & Initializers
let currentUserType = 'existing'; // Default selected tab: 'existing' or 'new'

document.addEventListener('DOMContentLoaded', () => {
  // Set default appointment date to Today
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Initial load of appointments table & today's doctor queue
  loadScheduledAppointments();
  loadTodayQueue();

  // Polling (every 10 seconds) to auto-fetch fee updates from Doctor Dashboard
  setInterval(loadScheduledAppointments, 10000);
});

/* ==========================================================================
   1. UI CONTROLS & TOGGLES
   ========================================================================== */

/**
 * Switch between Existing User and New User forms
 * @param {string} type - 'existing' | 'new'
 */
function setUserType(type) {
  currentUserType = type;
  const existingFields = document.getElementById('existingUserFields');
  const newFields = document.getElementById('newUserFields');
  const btnExisting = document.getElementById('btnExisting');
  const btnNew = document.getElementById('btnNew');

  if (type === 'existing') {
    existingFields?.classList.remove('hidden');
    newFields?.classList.add('hidden');
    btnExisting?.classList.add('active');
    btnNew?.classList.remove('active');

    // Toggle required fields
    document.getElementById('existingPhone')?.setAttribute('required', 'true');
    document.getElementById('newName')?.removeAttribute('required');
    document.getElementById('newPhone')?.removeAttribute('required');
    document.getElementById('newGender')?.removeAttribute('required');
    document.getElementById('newBloodGroup')?.removeAttribute('required');
    document.getElementById('newDob')?.removeAttribute('required');
  } else {
    existingFields?.classList.add('hidden');
    newFields?.classList.remove('hidden');
    btnExisting?.classList.remove('active');
    btnNew?.classList.add('active');

    // Toggle required fields
    document.getElementById('existingPhone')?.removeAttribute('required');
    document.getElementById('newName')?.setAttribute('required', 'true');
    document.getElementById('newPhone')?.setAttribute('required', 'true');
    document.getElementById('newGender')?.setAttribute('required', 'true');
    document.getElementById('newBloodGroup')?.setAttribute('required', 'true');
    document.getElementById('newDob')?.setAttribute('required', 'true');
  }
}

/**
 * Switch language UI dynamically
 * @param {string} lang - 'both' | 'ta' | 'en'
 */
function changeLanguage(lang) {
  document.body.setAttribute('data-lang', lang);
}

/**
 * Handles logout action
 */
function logout() {
  if (confirm('Are you sure you want to log out?')) {
    window.location.href = 'index.html';
  }
}

/**
 * Navigates to target dashboard page
 * @param {string} page - Target URL
 */
function navigateTo(page) {
  window.location.href = page;
}

/**
 * Auto-calculates Age from Selected Date of Birth
 * @param {string} dobValue 
 */
function calculateAgeFromDOB(dobValue) {
  if (!dobValue) {
    const ageInput = document.getElementById('newAge');
    if (ageInput) ageInput.value = '';
    return;
  }

  const birthDate = new Date(dobValue);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  const ageInput = document.getElementById('newAge');
  if (ageInput) {
    ageInput.value = age >= 0 ? `${age} Yrs` : '';
  }
}

/* ==========================================================================
   2. AUTO-FETCH PATIENT NAME FROM CLINICAL RECORDS
   ========================================================================== */
const phoneInput = document.getElementById('phoneInput') || document.getElementById('existingPhone');
const patientNameInput = document.getElementById('patientNameInput') || document.getElementById('existingName');

if (phoneInput) {
  phoneInput.addEventListener('input', async (e) => {
    const phone = e.target.value.trim();

    // Auto-search only when a valid 10-digit number is typed
    if (phone.length === 10) {
      if (patientNameInput) patientNameInput.value = 'Searching...';
      
      try {
        const res = await fetch(`/api/patients/search-by-phone?phone=${encodeURIComponent(phone)}`);
        
        if (res.ok) {
          const data = await res.json();
          if (patientNameInput) patientNameInput.value = data.patientName || '';
        } else if (res.status === 404) {
          if (patientNameInput) {
            patientNameInput.value = '';
            patientNameInput.placeholder = 'New patient - enter name';
          }
        } else {
          if (patientNameInput) {
            patientNameInput.value = '';
            patientNameInput.placeholder = 'Enter patient name';
          }
        }
      } catch (err) {
        console.error('Lookup request failed:', err);
        if (patientNameInput) {
          patientNameInput.value = '';
          patientNameInput.placeholder = 'Enter patient name manually';
        }
      }
    } else if (patientNameInput) {
      if (patientNameInput.value === 'Searching...' || patientNameInput.value === 'Error connecting to server') {
        patientNameInput.value = '';
      }
    }
  });
}

/* ==========================================================================
   3. BOOK APPOINTMENT & REGISTER NEW PATIENT
   ========================================================================== */

/**
 * Form Submit Handler for Booking Appointments
 * @param {Event} event 
 */
async function handleBookAppointment(event) {
  event.preventDefault();

  let payload = {
    userType: currentUserType,
    doctor: document.getElementById('doctorSelect')?.value || '',
    department: document.getElementById('departmentSelect')?.value || '',
    date: document.getElementById('appointmentDate')?.value || '',
    timeSlot: document.getElementById('timeSlot')?.value || 'Unscheduled',
    symptoms: document.getElementById('symptoms')?.value || ''
  };

  if (currentUserType === 'existing') {
    payload.phone = document.getElementById('existingPhone')?.value || '';
    payload.name = document.getElementById('existingName')?.value || '';

    if (!payload.name || payload.name.includes('not found')) {
      alert('Please enter a valid existing phone number or register as a New User.');
      return;
    }
  } else {
    payload.name = document.getElementById('newName')?.value || '';
    payload.phone = document.getElementById('newPhone')?.value || '';
    payload.gender = document.getElementById('newGender')?.value || '';
    payload.bloodGroup = document.getElementById('newBloodGroup')?.value || '';
    payload.dob = document.getElementById('newDob')?.value || '';
    payload.age = document.getElementById('newAge')?.value || '';

    if (!payload.name || !payload.phone || !payload.gender || !payload.bloodGroup || !payload.dob) {
      alert('Please fill out all required new patient fields.');
      return;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      alert('Appointment booked successfully!');
      document.getElementById('appointmentForm')?.reset();
      
      // Reset defaults
      const dateInput = document.getElementById('appointmentDate');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      setUserType('existing');
      
      // Refresh scheduled appointments table
      loadScheduledAppointments();
    } else {
      alert(`Booking Failed: ${result.error || result.message || 'Server Error'}`);
    }
  } catch (error) {
    console.error('Error submitting appointment:', error);
    alert('Failed to connect to the backend server.');
  }
}

/* ==========================================================================
   4. FETCH APPOINTMENTS & RENDER TABLE WITH QUEUE SORTING
   ========================================================================== */

/**
 * Fetches today's doctor queue breakdown
 */
async function loadTodayQueue() {
  try {
    const res = await fetch('/api/appointments/today-by-doctor');
    if (res.ok) {
      const doctorData = await res.json();
      console.log("Today's Doctor Queue Data:", doctorData);
    }
  } catch (err) {
    console.error("Error loading doctor queue:", err);
  }
}

/**
 * Fetches all scheduled appointments from MongoDB and triggers rendering
 */
async function loadScheduledAppointments() {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`);
    if (!response.ok) throw new Error('Failed to load appointments');
    
    let appointments = await response.json();

    // QUEUE SORTING:
    // Registered patients with "Pending" stay at the TOP (in order of registration).
    // Patients with "Completed" or "Paid" status move down to the BOTTOM.
    appointments.sort((a, b) => {
      const isCompletedA = a.paymentStatus === 'Completed' || a.paymentStatus === 'Paid';
      const isCompletedB = b.paymentStatus === 'Completed' || b.paymentStatus === 'Paid';

      if (isCompletedA && !isCompletedB) return 1;   // Move A to bottom
      if (!isCompletedA && isCompletedB) return -1;  // Keep B at bottom, A on top
      return 0; // Keep original insertion/registration order
    });

    renderAppointmentsTable(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }
}

/**
 * Renders HTML dynamic rows into table body
 * @param {Array} data - List of appointment records from MongoDB
 */
function renderAppointmentsTable(data) {
  const tbody = document.getElementById('appointmentsTableBody');
  const countBadge = document.getElementById('bookingCount');

  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `${data.length} Bookings`;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: #6b7280; padding: 20px;">
          No appointments scheduled for today.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map((item, index) => {
    const isCompleted = item.paymentStatus === 'Completed' || item.paymentStatus === 'Paid';
    const doctorFeeDisplay = item.doctorFee ? `₹${item.doctorFee}` : `<span style="color:#f59e0b; font-weight:500;">Pending Doctor</span>`;

    const currentMode = item.paymentMode || 'Cash';
    const currentStatus = isCompleted ? 'Completed' : 'Pending';

    return `
      <tr style="${isCompleted ? 'background-color: #f8fafc; opacity: 0.8;' : ''}">
        <td><strong>#${index + 1}</strong></td>
        <td>${item.patientName || item.name || 'N/A'}</td>
        <td>${item.phone || 'N/A'}</td>
        <td>
          <div style="font-weight: 500;">${item.doctor || 'Unassigned'}</div>
          <small style="color: #64748b;">${item.department || 'General'}</small>
        </td>
        <td>
          <div>${item.date || ''}</div>
          <small style="color: #2563eb;">${item.timeSlot || 'Unscheduled'}</small>
        </td>
        <td><strong>${doctorFeeDisplay}</strong></td>

        <!-- Payment Status Dropdown -->
        <td>
          <select onchange="updateAppointmentStatus('${item._id}', this.value)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-weight: 600; color: ${isCompleted ? '#16a34a' : '#d97706'}; font-size: 0.85rem; cursor: pointer;">
            <option value="Pending" ${currentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Completed" ${currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>

        <td>₹${item.remainingBalance ?? (item.doctorFee || 0)}</td>

        <!-- Payment Mode Dropdown -->
        <td>
          <select onchange="updateAppointmentMode('${item._id}', this.value)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.85rem; cursor: pointer;">
            <option value="Cash" ${currentMode === 'Cash' ? 'selected' : ''}>Cash</option>
            <option value="GPay/PhonePe" ${currentMode === 'GPay/PhonePe' ? 'selected' : ''}>GPay / PhonePe</option>
            <option value="Card" ${currentMode === 'Card' ? 'selected' : ''}>Card</option>
          </select>
        </td>

        <!-- Action Buttons -->
        <td style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="action-btn view-btn" onclick="openModal('${item._id}')" title="View Details" style="padding: 6px 10px; cursor: pointer;">
            👁️
          </button>
          
          <button type="button" class="action-btn delete-btn" onclick="deleteAppointment('${item._id}')" title="Cancel Appointment" style="background-color: #2563eb; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
            🗑️ <span class="lang-en">Cancel</span><span class="lang-ta">ரத்து</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   5. RECEPTION PAYMENT UPDATES, DELETE & MODAL ACTIONS
   ========================================================================== */

/**
 * Updates payment status directly from dropdown selection and re-sorts table
 * @param {string} appointmentId 
 * @param {string} statusValue 
 */
async function updateAppointmentStatus(appointmentId, statusValue) {
  try {
    const remainingBalance = statusValue === 'Completed' ? 0 : undefined;
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentStatus: statusValue,
        remainingBalance: remainingBalance
      })
    });

    if (response.ok) {
      loadScheduledAppointments(); // Refresh table to move completed patient to bottom
    } else {
      alert('Failed to update payment status.');
    }
  } catch (error) {
    console.error('Error updating payment status:', error);
  }
}

/**
 * Updates payment mode directly from dropdown selection
 * @param {string} appointmentId 
 * @param {string} modeValue 
 */
async function updateAppointmentMode(appointmentId, modeValue) {
  try {
    await fetch(`${API_BASE_URL}/appointments/${appointmentId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMode: modeValue
      })
    });
  } catch (error) {
    console.error('Error updating payment mode:', error);
  }
}

/**
 * Legacy updatePayment retained for backward compatibility
 */
async function updatePayment(appointmentId, totalFee) {
  const paymentMode = prompt('Enter Payment Method (Cash / GPay/PhonePe / Card):', 'Cash');
  if (!paymentMode) return;

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/pay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentStatus: 'Completed',
        remainingBalance: 0,
        paymentMode: paymentMode
      })
    });

    if (response.ok) {
      alert('Payment status updated successfully!');
      loadScheduledAppointments();
    } else {
      alert('Failed to update payment details.');
    }
  } catch (error) {
    console.error('Payment update error:', error);
  }
}

/**
 * Cancels and removes an appointment from MongoDB
 * @param {string} appointmentId - The MongoDB _id of the appointment
 */
async function deleteAppointment(appointmentId) {
  const isTamil = document.body.getAttribute('data-lang') === 'ta';
  const confirmMsg = isTamil 
    ? 'இந்த முன்பதிவை நிச்சயமாக ரத்து செய்ய விரும்புகிறீர்களா?' 
    : 'Are you sure you want to cancel and delete this appointment?';

  if (!confirm(confirmMsg)) return;

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
      method: 'DELETE'
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.error || result?.message || `HTTP Error ${response.status}`);
    }

    const successMsg = isTamil 
      ? 'முன்பதிவு வெற்றிகரமாக ரத்து செய்யப்பட்டது.' 
      : 'Appointment cancelled successfully.';
    
    alert(successMsg);
    loadScheduledAppointments();
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    alert(`Error cancelling appointment: ${error.message}`);
  }
}

/**
 * Open Appointment Summary Modal
 * @param {string} appointmentId 
 */
async function openModal(appointmentId) {
  const modal = document.getElementById('viewModal');
  const modalDetails = document.getElementById('modalDetails');
  if (!modal || !modalDetails) return;

  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`);
    const data = await response.json();

    if (response.ok) {
      modalDetails.innerHTML = `
        <div style="line-height: 1.8;">
          <p><strong>Patient Name:</strong> ${data.patientName || data.name || 'N/A'}</p>
          <p><strong>Phone Number:</strong> ${data.phone || 'N/A'}</p>
          <p><strong>Assigned Doctor:</strong> ${data.doctor || 'Unassigned'}</p>
          <p><strong>Department:</strong> ${data.department || 'General'}</p>
          <p><strong>Date & Time:</strong> ${data.date || ''} | ${data.timeSlot || 'Unscheduled'}</p>
          <p><strong>Symptoms / Reason:</strong> ${data.symptoms || 'N/A'}</p>
          <hr style="margin: 10px 0; border: 0; border-top: 1px solid #e2e8f0;" />
          <p><strong>Doctor Consultation Fee:</strong> ₹${data.doctorFee || '0 (Pending)'}</p>
          <p><strong>Payment Status:</strong> ${data.paymentStatus || 'Pending'}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMode || 'Cash'}</p>
        </div>
      `;
      modal.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading modal details:', error);
  }
}

/**
 * Close Appointment Summary Modal
 */
function closeModal() {
  const modal = document.getElementById('viewModal');
  if (modal) modal.classList.add('hidden');
}