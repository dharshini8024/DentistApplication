// Hardcoded Demo Credentials
const CHIEF_CREDENTIALS = { username: "chiefdoc", password: "123" };
const DOCTOR_CREDENTIALS = { username: "doc", password: "123" };
const RECEPTION_CREDENTIALS = { username: "reception", password: "123" };

let currentTargetRole = "";

/**
 * Handles login submitted through Doctor Portal column.
 * Directs Chief Doctor credentials to chiefdoctor-dashboard.html,
 * and Regular Doctor credentials to doctors-dashboard.html.
 */
function handleDoctorLogin(e) {
  if (e) e.preventDefault();

  const usernameInput = document.getElementById('docUsername').value.trim();
  const passwordInput = document.getElementById('docPassword').value;
  const alertBox = document.getElementById('doctorAlert');

  // Check Chief Doctor Credentials
  if (usernameInput === CHIEF_CREDENTIALS.username && passwordInput === CHIEF_CREDENTIALS.password) {
    if (alertBox) alertBox.classList.add('hidden');
    // Redirect to Chief Doctor Dashboard URL
    window.location.href = 'chiefdoctor-dashboard.html';
    return false;
  } 
  // Check Regular Doctor Credentials
  else if (usernameInput === DOCTOR_CREDENTIALS.username && passwordInput === DOCTOR_CREDENTIALS.password) {
    if (alertBox) alertBox.classList.add('hidden');
    // Redirect to Doctor Dashboard URL
    window.location.href = 'doctor-admin.html';
    return false;
  } 
  // Invalid Credentials
  else {
    showAlert(alertBox, "Invalid username or password for Doctor Portal.");
    return false;
  }
}

/**
 * Handles login submitted through Reception Portal column.
 */
function handleReceptionLogin(e) {
  if (e) e.preventDefault();

  const usernameInput = document.getElementById('recUsername').value.trim();
  const passwordInput = document.getElementById('recPassword').value;
  const alertBox = document.getElementById('receptionAlert');

  if (usernameInput === RECEPTION_CREDENTIALS.username && passwordInput === RECEPTION_CREDENTIALS.password) {
    if (alertBox) alertBox.classList.add('hidden');
    window.location.href = 'admin-dashboard.html';
    return false;
  } else {
    showAlert(alertBox, "Invalid username or password for Reception Portal.");
    return false;
  }
}

// Display alert helper
function showAlert(element, message) {
  if (element) {
    element.textContent = message;
    element.classList.remove('hidden');
  }
}

// Language Switcher
function changeLanguage(mode) {
  document.body.setAttribute('data-lang', mode);
}

// Forgot Password Modal Handlers
function openForgotModal(role) {
  currentTargetRole = role;
  const modal = document.getElementById('forgotModal');
  if (modal) modal.classList.remove('hidden');
}

function closeForgotModal() {
  const modal = document.getElementById('forgotModal');
  if (modal) modal.classList.add('hidden');
  const form = document.getElementById('forgotForm');
  if (form) form.reset();
}

function sendResetEmail(e) {
  if (e) e.preventDefault();
  const emailInput = document.getElementById('resetEmailInput');
  const email = emailInput ? emailInput.value : '';
  alert(`Password reset link sent to ${email} for ${currentTargetRole} Portal.`);
  closeForgotModal();
  return false;
}