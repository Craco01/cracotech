/* Configuración centralizada de la API para el frontend */
const API_BASE_URL = 'https://api.cracotech.com';

const API_URL = (path) => {
  if (!path) return API_BASE_URL;
  let normalized = String(path).trim();

  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^file:\/\//i.test(normalized)) {
    try {
      const parsed = new URL(normalized);
      normalized = parsed.pathname + (parsed.search || '');
    } catch {
      return API_BASE_URL;
    }
  }
  if (normalized.startsWith('//')) {
    return `${window.location.protocol}${normalized}`;
  }
  if (normalized.startsWith('/')) {
    return `${API_BASE_URL}${normalized}`;
  }
  return `${API_BASE_URL}/${normalized}`;
};

const API_JSON_HEADERS = { 'Content-Type': 'application/json' };

function clearExpiredSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('role');
  if (new URLSearchParams(window.location.search).has('embed')) {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.innerHTML = '<div class="empty session-required">Debe iniciar sesión para visualizar el reporte.</div>';
    return;
  }
  if (!window.location.pathname.endsWith('/index.html') && window.location.pathname !== '/') {
    window.location.href = '../index.html';
  } else {
    window.location.reload();
  }
}

const API_FETCH = async (path, options = {}) => {
  const url = API_URL(path);
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, { ...options, headers });
  const isLoginRequest = String(path).includes('/api/auth/login');
  if (response.status === 401 && !isLoginRequest) clearExpiredSession();
  return response;
};
