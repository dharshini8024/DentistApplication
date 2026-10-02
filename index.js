/* ==========================================================================
   MULTILINGUAL TRANSLATION DICTIONARY
   ========================================================================== */
const i18n = {
  en: {
    receptionPortal: "Reception Portal",
    doctorPortal: "Doctor Portal",
    loginIdLabel: "Username / ID",
    passwordLabel: "Password",
    loginIdPlaceholder: "Enter Username or ID",
    passwordPlaceholder: "••••••••",
    loginBtn: "Login",
    forgotPass: "Forgot Password?",
    serverError: "Server connection error",
    invalidCreds: "Invalid credentials"
  },
  ta: { // Tamil
    receptionPortal: "வரவேற்பறை பகுதி",
    doctorPortal: "மருத்துவர் நுழைவு",
    loginIdLabel: "பயனர் பெயர் / ஐடி",
    passwordLabel: "கடவுச்சொல்",
    loginIdPlaceholder: "பயனர் பெயர் அல்லது ஐடியை உள்ளிடவும்",
    passwordPlaceholder: "••••••••",
    loginBtn: "உள்நுழைக",
    forgotPass: "கடவுச்சொல் மறந்துவிட்டதா?",
    serverError: "சர்வர் இணைப்பு பிழை",
    invalidCreds: "தவறான கணக்கு விவரங்கள்"
  }
};

// Function to switch UI language dynamically across all data-i18n elements
function applyLanguage(lang) {
  const currentLang = i18n[lang] ? lang : 'en';
  localStorage.setItem('preferredLang', currentLang);
  document.body.setAttribute('data-lang', currentLang);
  
  const dict = i18n[currentLang];

  // Update elements with explicit data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (dict[key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = dict[key];
      } else {
        element.textContent = dict[key];
      }
    }
  });
}

/* ==========================================================================
   UI STATUS & HELPER FUNCTIONS
   ========================================================================== */
function showLoginStatus(elementId, message, type = 'error') {
  const statusBox = document.getElementById(elementId);
  if (!statusBox) return;

  statusBox.textContent = message;
  statusBox.classList.remove('login-error', 'login-success');
  statusBox.classList.add(type === 'success' ? 'login-success' : 'login-error');
  statusBox.hidden = false;
}

function clearLoginError(elementId) {
  const errorBox = document.getElementById(elementId);
  if (!errorBox) return;

  errorBox.textContent = '';
  errorBox.hidden = true;
}

function isChiefDoctorLogin(loginId) {
  const formatted = String(loginId || '').trim().toUpperCase();
  return formatted.startsWith('CHIEFDOC') || formatted.includes('CHIEF');
}

function isRoleAllowed(portalType, userRole) {
  const role = String(userRole || '').toLowerCase().trim();
  if (portalType === 'reception' || portalType === 'admin') {
    return role === 'admin' || role === 'reception';
  }
  if (portalType === 'doctor') {
    return role === 'doctor' || role === 'chief_doctor' || role === 'chiefdoctor';
  }
  return false;
}

/* ==========================================================================
   AUTHENTICATION API CALL
   ========================================================================== */
async function validateLogin({ loginId, password, role }) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        loginId: loginId,
        password: password, 
        role: role 
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return {
        valid: true,
        token: data.token,
        userRole: data.userRole || data.user?.role,
        doctorName: data.doctorName || data.user?.name || data.user?.doctorName,
        redirect: data.redirect || data.redirectUrl
      };
    } else {
      return { 
        valid: false, 
        message: data.message || 'Invalid login ID or password' 
      };
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return { valid: false, message: 'Server connection error' };
  }
}

/* ==========================================================================
   EVENT LISTENERS & FORM HANDLERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Dropdown Selector Initialization
  const savedLang = localStorage.getItem('preferredLang') || 'en';
  const langSelect = document.getElementById('languageSelect');
  
  if (langSelect) {
    langSelect.value = savedLang;
    langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));
  }
  
  // Apply initial language setting
  applyLanguage(savedLang);

  // 2. Doctor Login Form Handling
  const doctorLoginForm = document.getElementById('doctorLoginForm');
  if (doctorLoginForm) {
    doctorLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const loginIdElem = document.getElementById('doctorLoginId');
      const passwordElem = document.getElementById('doctorPassword');
      const errorBoxId = document.getElementById('doctorLoginError') ? 'doctorLoginError' : 'doctorAlert';

      clearLoginError(errorBoxId);

      if (!loginIdElem || !passwordElem) return;

      const loginId = loginIdElem.value.trim();
      const password = passwordElem.value;

      const result = await validateLogin({ loginId, password, role: 'doctor' });

      if (result.valid) {
        if (result.userRole && !isRoleAllowed('doctor', result.userRole)) {
          showLoginStatus(errorBoxId, 'Invalid credentials for Doctor Portal.', 'error');
          return;
        }

        const doctorNameFromDB = result.doctorName || loginId;

        // Save keys required across doctor dashboard and admin pages
        localStorage.setItem('doctorName', doctorNameFromDB);
        localStorage.setItem('user', JSON.stringify({
          name: doctorNameFromDB,
          doctorName: doctorNameFromDB,
          role: result.userRole || 'doctor'
        }));

        localStorage.setItem('currentUser', JSON.stringify({
          name: doctorNameFromDB,
          role: result.userRole || 'doctor'
        }));

        const redirectPage = result.redirect || (isChiefDoctorLogin(loginId) 
          ? 'chiefdoctor-dashboard.html' 
          : 'doctor-admin.html');
          
        window.location.href = redirectPage;
        return;
      }

      showLoginStatus(errorBoxId, result.message, 'error');
    });
  }

  // 3. Reception / Admin Login Form Handling
  const adminLoginForm = document.getElementById('adminLoginForm');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const loginIdElem = document.getElementById('adminLoginId');
      const passwordElem = document.getElementById('adminPassword');
      const errorBoxId = document.getElementById('adminLoginError') ? 'adminLoginError' : 'receptionAlert';

      clearLoginError(errorBoxId);

      if (!loginIdElem || !passwordElem) return;

      const loginId = loginIdElem.value.trim();
      const password = passwordElem.value;

      const result = await validateLogin({ loginId, password, role: 'admin' });

      if (result.valid) {
        if (result.userRole && !isRoleAllowed('reception', result.userRole)) {
          showLoginStatus(errorBoxId, 'Invalid credentials for Reception Portal.', 'error');
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify({
          name: loginId,
          role: result.userRole || 'admin'
        }));

        window.location.href = result.redirect || 'admin-dashboard.html';
        return;
      }

      showLoginStatus(errorBoxId, result.message, 'error');
    });
  }

  // 4. Forgot Password Modal Listeners
  const forgotModal = document.getElementById('forgotModal');
  const doctorForgotLink = document.getElementById('doctorForgotLink');
  const receptionForgotLink = document.getElementById('receptionForgotLink');
  const closeForgotBtn = document.getElementById('closeForgotBtn');

  const openModal = (e) => {
    e.preventDefault();
    if (forgotModal) forgotModal.classList.remove('hidden');
  };

  if (doctorForgotLink) doctorForgotLink.addEventListener('click', openModal);
  if (receptionForgotLink) receptionForgotLink.addEventListener('click', openModal);

  if (closeForgotBtn && forgotModal) {
    closeForgotBtn.addEventListener('click', () => {
      forgotModal.classList.add('hidden');
    });
  }
});