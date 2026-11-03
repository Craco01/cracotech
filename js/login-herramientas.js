'use strict';

const formLogin = document.getElementById('formLogin');
const mensajeLogin = document.getElementById('mensajeLogin');
const btnIngresar = document.getElementById('btnIngresar');

formLogin.addEventListener('submit', async event => {
  event.preventDefault();
  mensajeLogin.textContent = '';
  btnIngresar.disabled = true;

  try {
    const response = await API_FETCH('/api/auth/login', {
      method: 'POST',
      headers: API_JSON_HEADERS,
      body: JSON.stringify({
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
      })
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'No se pudo iniciar sesión.');
    }

    if (document.body.dataset.requireAdmin === 'true' && result.rol !== 'administrador') {
      throw new Error('Esta página requiere iniciar sesión con una cuenta de administrador.');
    }

    sessionStorage.setItem(AUTH_TOKEN_KEY, result.token);
    sessionStorage.setItem(AUTH_NAME_KEY, result.nombre);
    sessionStorage.setItem(AUTH_ROLE_KEY, result.rol);
    document.dispatchEvent(new Event('herramientas:auth-change'));
    window.cerrarLoginHerramientas(false);
    document.getElementById('toolsAccountToggle')?.focus();
  } catch (error) {
    mensajeLogin.textContent = error instanceof TypeError
      ? 'No se pudo conectar con el servicio de herramientas. Verifica que la API esté iniciada y que CORS permita el origen de esta página.'
      : error.message || 'No se pudo iniciar sesión.';
  } finally {
    btnIngresar.disabled = false;
  }
});
