const navLogin = document.getElementById('nav-login');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeLoginModal');
const form = document.getElementById('loginForm');
const mensaje = document.getElementById('loginMensaje');

function getPasswordModal() {
  let modal = document.getElementById('changePasswordModal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'changePasswordModal';
  modal.className = 'login-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'changePasswordTitle');
  modal.innerHTML = `
    <div class="login-modal-content">
      <span class="login-close" role="button" tabindex="0" aria-label="Cerrar">&times;</span>
      <h2 id="changePasswordTitle">Cambiar contraseña</h2>
      <form id="changePasswordForm">
        <label for="currentPassword">Contraseña actual:</label>
        <input type="password" id="currentPassword" name="currentPassword" autocomplete="current-password">
        <small class="password-help">Déjela vacía únicamente si su contraseña actual está vacía.</small>
        <label for="newPassword">Nueva contraseña:</label>
        <input type="password" id="newPassword" name="newPassword" autocomplete="new-password" minlength="3" maxlength="9" pattern="[A-Za-z0-9]+" title="Use de 3 a 9 caracteres alfanuméricos" required>
        <small class="password-help">Use entre 3 y 9 caracteres alfanuméricos.</small>
        <label for="confirmPassword">Repetir nueva contraseña:</label>
        <input type="password" id="confirmPassword" name="confirmPassword" autocomplete="new-password" minlength="3" maxlength="9" pattern="[A-Za-z0-9]+" required>
        <div class="password-actions">
          <button type="submit">Actualizar contraseña</button>
          <button type="button" class="password-cancel">Cancelar</button>
        </div>
      </form>
      <div id="changePasswordMessage" role="alert" aria-live="polite"></div>
    </div>`;
  document.body.appendChild(modal);

  const passwordForm = modal.querySelector('#changePasswordForm');
  const passwordMessage = modal.querySelector('#changePasswordMessage');
  const close = () => {
    modal.classList.remove('is-visible');
    passwordForm.reset();
    passwordMessage.textContent = '';
  };
  modal.querySelector('.login-close').addEventListener('click', close);
  modal.querySelector('.login-close').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') close();
  });
  modal.querySelector('.password-cancel').addEventListener('click', close);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) close();
  });
  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentPassword = passwordForm.currentPassword.value;
    const newPassword = passwordForm.newPassword.value;
    const confirmPassword = passwordForm.confirmPassword.value;
    if (newPassword !== confirmPassword) {
      passwordMessage.textContent = 'Las nuevas contraseñas no coinciden.';
      passwordMessage.style.color = 'red';
      return;
    }
    try {
      const res = await API_FETCH('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar la contraseña');
      passwordMessage.textContent = data.message;
      passwordMessage.style.color = 'green';
      passwordForm.reset();
      setTimeout(close, 1500);
    } catch (error) {
      passwordMessage.textContent = `Error: ${error.message}`;
      passwordMessage.style.color = 'red';
    }
  });
  return modal;
}

function openPasswordModal() {
  const modal = getPasswordModal();
  modal.classList.add('is-visible');
  modal.querySelector('#currentPassword').focus();
}

function closeLoginModal() {
  loginModal.classList.remove('is-visible');
  form.reset();
}
const fetchOriginal = window.fetch.bind(window);
window.fetch = (url, options = {}) => {
  const normalizedUrl = typeof url === 'string' && url.startsWith('/api/') ? API_URL(url) : url;
  const urlString = typeof normalizedUrl === 'string' ? normalizedUrl : String(normalizedUrl.url || '');
  if (urlString.includes('/api/')) {
    const token = localStorage.getItem('token');
    options.headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }
  return fetchOriginal(normalizedUrl, options);
};
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function closeUserMenu() {
  const dropdown = document.getElementById('navUserDropdown');
  const toggle = document.getElementById('navUserToggle');
  if (dropdown) dropdown.classList.remove('is-open');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function renderNav() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  if (token && username) {
    const changePasswordItem = role !== 'viewer'
      ? '<li role="none"><button type="button" id="changePasswordButton" class="nav-user-item" role="menuitem">Cambiar contrase\u00f1a</button></li>'
      : '';
    navLogin.innerHTML = `
      <div class="nav-user-menu">
        <button type="button" class="nav-user-toggle" id="navUserToggle" aria-haspopup="true" aria-expanded="false">
          <span class="nav-user-icon">&#128100;</span><span class="nav-user-name">${escapeHtml(username)}</span><span class="nav-user-caret">&#9662;</span>
        </button>
        <ul class="nav-user-dropdown" id="navUserDropdown" role="menu">
          <li role="none"><button type="button" id="logoutDiv" class="nav-user-item" role="menuitem">Cerrar sesi\u00f3n</button></li>
          ${changePasswordItem}
        </ul>
      </div>
    `;
    const toggle = document.getElementById('navUserToggle');
    const dropdown = document.getElementById('navUserDropdown');
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.getElementById('logoutDiv').addEventListener('click', () => {
      localStorage.removeItem('token'); localStorage.removeItem('username'); localStorage.removeItem('role');
      form.reset(); window.location.reload();
    });
    const changePasswordButton = document.getElementById('changePasswordButton');
    if (changePasswordButton) {
      changePasswordButton.addEventListener('click', () => {
        closeUserMenu();
        openPasswordModal();
      });
    }
  } else {
    navLogin.innerHTML = '<div id="loginDiv" class="nav-btn">Login</div>';
    document.getElementById('loginDiv').addEventListener('click', () => {
      loginModal.classList.add('is-visible');
      document.getElementById('user').focus();
    });
  }
}
closeModal.addEventListener('click', closeLoginModal);
loginModal.addEventListener('click', event => {
  if (event.target === loginModal) closeLoginModal();
});
document.addEventListener('click', () => closeUserMenu());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && loginModal.classList.contains('is-visible')) closeLoginModal();
  if (event.key === 'Escape') {
    const passwordModal = document.getElementById('changePasswordModal');
    if (passwordModal?.classList.contains('is-visible')) passwordModal.querySelector('.login-close').click();
  }
  if (event.key === 'Escape') closeUserMenu();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const res = await API_FETCH('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: document.getElementById('user').value, password: document.getElementById('password').value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo iniciar sesi\u00f3n');
    localStorage.setItem('token', data.token); localStorage.setItem('role', data.role); localStorage.setItem('username', document.getElementById('user').value);
    window.location.reload();
  } catch (error) { mensaje.textContent = `Error: ${error.message}`; mensaje.style.color = 'red'; }
});
renderNav();
