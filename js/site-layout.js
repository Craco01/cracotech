(function () {
  if (document.body && document.body.hasAttribute('data-no-global-layout')) return;

  // Resuelve las rutas desde la ubicación de este script, sin depender de la raíz del servidor.
  const scriptUrl = document.currentScript?.src ||
    Array.from(document.scripts).map((script) => script.src).find((src) => /\/js\/site-layout\.js(\?|#|$)/.test(src));
  const siteRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('/', window.location.origin);
  const maintenanceRoot = new URL('mantenimiento/', siteRoot).pathname;
  const assetRoot = siteRoot.pathname;
  const mapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3601.6318628140593!2d-57.49297322382588!3d-25.48396533503066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x945c525ca4d7e83b%3A0xa27d522bed160530!2sMetal%C3%BArgica%20Vera%20S.R.L!5e0!3m2!1ses!2spy!4v1781532505861!5m2!1ses!2spy';

  function ensureContactStyles() {
    const stylesheetUrl = new URL('css/footer-estilo.css', siteRoot);
    const alreadyLoaded = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .some(link => link.href === stylesheetUrl.href);
    if (alreadyLoaded) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = stylesheetUrl.href;
    document.head.appendChild(stylesheet);
  }

  function ensureWhatsApp() {
    if (document.getElementById('waButton') || document.getElementById('waModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <button type="button" class="maintenance-whatsapp-button" id="waButton"
        aria-label="Elegir contacto por WhatsApp" aria-haspopup="dialog"
        aria-controls="waModal" aria-expanded="false">
        <img src="${assetRoot}img/WhatsApp.png" alt="" aria-hidden="true">
      </button>
      <div id="waModal" class="maintenance-whatsapp-overlay" role="dialog" aria-modal="true"
        aria-labelledby="waModalTitle" aria-hidden="true">
        <section class="maintenance-whatsapp-card">
          <h2 id="waModalTitle">Elegir contacto de WhatsApp</h2>
          <a href="https://wa.me/595986221400" target="_blank" rel="noopener noreferrer">Cristhian Redes</a>
          <a href="https://wa.me/595982156163" target="_blank" rel="noopener noreferrer">Gustavo González</a>
          <a href="https://wa.me/595991986712" target="_blank" rel="noopener noreferrer">Blas Giménez</a>
          <button type="button" id="closeBtn">Cerrar</button>
        </section>
      </div>
    `;
    document.body.appendChild(wrapper);

    const button = wrapper.querySelector('#waButton');
    const modal = wrapper.querySelector('#waModal');
    const closeModal = () => {
      modal.classList.remove('is-visible');
      modal.setAttribute('aria-hidden', 'true');
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    };
    button.addEventListener('click', () => {
      modal.classList.add('is-visible');
      modal.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      modal.querySelector('a')?.focus();
    });
    wrapper.querySelector('#closeBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
    modal.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = [...modal.querySelectorAll('a[href], button:not(:disabled)')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && modal.classList.contains('is-visible')) closeModal();
    });
  }

  function ensureContactFooter() {
    if (document.querySelector('.footer-contacto')) return;
    const footer = document.createElement('footer');
    footer.className = 'footer-contacto';
    footer.id = 'contacto';
    footer.innerHTML = `
      <address>
        <h2>Contacto</h2>
        <ul>
          <li><p>Informaciones</p><i class="fa-solid fa-phone" aria-hidden="true"></i> <a href="tel:+595213283240">(+595) 21 3283240/2/3</a></li>
          <li><p>Gustavo González</p><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> <a href="tel:+595982156163">(+595) 982 156163</a></li>
          <li><p>Cristhian Redes</p><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> <a href="tel:+595986221400">(+595) 986 221400</a></li>
          <li><p>Gustavo González</p><i class="fa-solid fa-envelope" aria-hidden="true"></i> <a href="mailto:mantenimiento2@metalurgicavera.com.py">mantenimiento2@metalurgicavera.com.py</a></li>
          <li><p>Cristhian Redes</p><i class="fa-solid fa-envelope" aria-hidden="true"></i> <a href="mailto:reparaciones@metalurgicavera.com.py">reparaciones@metalurgicavera.com.py</a></li>
          <li><p>Blas Giménez</p><i class="fa-solid fa-envelope" aria-hidden="true"></i> <a href="mailto:reparaciones2@metalurgicavera.com.py">reparaciones2@metalurgicavera.com.py</a></li>
          <li><i class="fa-brands fa-facebook" aria-hidden="true"></i> <span>Metalúrgica Vera S.A.E.</span></li>
          <li><i class="fa-solid fa-globe" aria-hidden="true"></i> <a href="https://www.metalurgicavera.com.py" target="_blank" rel="noopener noreferrer">www.metalurgicavera.com.py</a></li>
          <li><i class="fa-solid fa-location-dot" aria-hidden="true"></i> <span>Ruta PY 01, Km 28,6 (Acceso Sur), Ypané</span></li>
        </ul>
      </address>
      <section class="mapa">
        <div class="mapa-description"><span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>Metalúrgica Vera S.A.E.</span></div>
        <iframe title="Mapa de ubicación de Metalúrgica Vera" src="${mapUrl}" width="480" height="300"
          allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe>
      </section>
    `;
    document.body.appendChild(footer);
  }

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
              <li id="adminUsersNavItem" hidden><a href="${maintenanceRoot}administrar-usuarios/">Usuarios</a></li>
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
              <label class="remember-user" for="rememberUser"><input type="checkbox" id="rememberUser" name="rememberUser"> Recordar usuario</label>
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
    const syncAdminUsersLink = () => {
      const item = document.getElementById('adminUsersNavItem');
      if (item) item.hidden = localStorage.getItem('role') !== 'administrador';
    };
    syncAdminUsersLink();
    window.addEventListener('storage', event => {
      if (event.key === 'role' || event.key === null) syncAdminUsersLink();
    });
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
  ensureContactStyles();
  ensureWhatsApp();
  ensureContactFooter();
})();
