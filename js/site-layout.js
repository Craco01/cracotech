(function () {
  if (document.body && document.body.hasAttribute('data-no-global-layout')) return;

  // Resuelve las rutas desde la ubicación de este script, sin depender de la raíz del servidor.
  const scriptUrl = document.currentScript?.src ||
    Array.from(document.scripts).map((script) => script.src).find((src) => /\/js\/site-layout\.js(\?|#|$)/.test(src));
  const siteRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('/', window.location.origin);
  const maintenanceRoot = new URL('mantenimiento/', siteRoot).pathname;
  const assetRoot = siteRoot.pathname;

  function buildLayoutHtml() {
    return `
      <header class="global-shell-header">
        <nav class="nav-bar" aria-label="Navegación principal">
          <button class="nav-toggle" type="button" aria-label="Abrir menú" aria-controls="siteNavMenu" aria-expanded="false">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="nav-menu-wrap" id="siteNavMenu">
            <ul class="list-bar">
              <li><a href="${maintenanceRoot}">Inicio</a></li>
              <li><a href="${maintenanceRoot}#solicitudes">Solicitudes</a></li>
              <li><a href="${maintenanceRoot}#informacion-tecnica">Informaci&#243;n</a></li>
              <li><a href="${maintenanceRoot}#fr172">FR-172</a></li>
              <li><a href="${maintenanceRoot}#mpp">MPP</a></li>
              <li><a href="${maintenanceRoot}#informaciones">Panel</a></li>
              <li><a href="${maintenanceRoot}#form-adds">Formularios</a></li>
              <li><a href="${maintenanceRoot}proyectos/">Proyectos</a></li>
              <li><a href="${maintenanceRoot}#contacto">Contacto</a></li>
              <li><a href="/">Autor</a></li>
            </ul>
            <div id="nav-login"></div>
          </div>
        </nav>

        <div class="banner">
          <div class="logo"><img height="150" width="150" src="${assetRoot}img/Logo.png" alt="Logotipo de Metalúrgica Vera S.A.E." decoding="async" fetchpriority="low"></div>
          <div class="hero">
            <h1>Mantenimiento Metalúrgica Vera S.A.E.</h1>
            <p>Garantizamos la confiabilidad, disponibilidad y eficiencia de los equipos e instalaciones industriales.</p>
          </div>
        </div>

        <div id="loginModal" class="login-modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle" aria-hidden="true">
          <div class="login-modal-content">
            <button id="closeLoginModal" class="login-close" type="button" aria-label="Cerrar inicio de sesión">&times;</button>
            <h2 id="loginTitle">Inicio de sesión</h2>
            <form id="loginForm">
              <label for="user">Usuario:</label>
              <input type="text" id="user" name="user" autocomplete="username" required>
              <label for="password">Contraseña:</label>
              <input type="password" id="password" name="password" autocomplete="current-password" required>
              <button type="submit">Iniciar sesión</button>
            </form>
            <div id="loginMensaje" role="status" aria-live="polite"></div>
          </div>
        </div>
      </header>
    `;
  }

  function ensureLayout() {
    if (document.querySelector('header.global-shell-header')) return;

    const oldHeaders = document.querySelectorAll('header');
    oldHeaders.forEach((header) => {
      if (!header.classList.contains('global-shell-header')) {
        header.remove();
      }
    });

    const target = document.body.firstElementChild;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildLayoutHtml();
    const header = wrapper.firstElementChild;

    if (target) {
      document.body.insertBefore(header, target);
    } else {
      document.body.appendChild(header);
    }

    const loginDialog = document.getElementById('loginModal');
    if (loginDialog && window.MutationObserver) {
      const syncLoginDialogState = () => {
        const isOpen = loginDialog.classList.contains('is-visible');
        loginDialog.setAttribute('aria-hidden', String(!isOpen));
        document.getElementById('loginDiv')?.setAttribute('aria-expanded', String(isOpen));
      };
      syncLoginDialogState();
      new MutationObserver(syncLoginDialogState).observe(loginDialog, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  ensureLayout();
})();
