/* Configuración independiente de la API de herramientas */
const API_BASE_URL = window.HERRAMIENTAS_API_BASE_URL ||
  'https://api.cracotech.com/api/herramientas';
const AUTH_TOKEN_KEY = 'herramientas_token';
const AUTH_NAME_KEY = 'herramientas_nombre';
const AUTH_ROLE_KEY = 'herramientas_rol';

const API_URL = (path) => {
  if (!path) return API_BASE_URL;
  const normalized = String(path).trim();

  if (/^https?:\/\//i.test(normalized)) return normalized;
  const apiPath = normalized.startsWith('/api/') ? normalized.slice(4) : normalized;
  return `${API_BASE_URL}${apiPath.startsWith('/') ? '' : '/'}${apiPath}`;
};

const API_JSON_HEADERS = { 'Content-Type': 'application/json' };

function cerrarSesionHerramientas() {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_NAME_KEY);
  sessionStorage.removeItem(AUTH_ROLE_KEY);
}

async function API_FETCH(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(API_URL(path), { ...options, headers });
  if (response.status === 401 && token && !String(path).includes('/api/auth/login')) {
    cerrarSesionHerramientas();
    document.dispatchEvent(new Event('herramientas:session-expirada'));
  }
  return response;
}
