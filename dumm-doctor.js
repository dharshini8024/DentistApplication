 
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