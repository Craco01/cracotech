'use strict';

(() => {
  const scriptUrl = document.currentScript?.src || Array.from(document.scripts)
    .map(script => script.src)
    .find(src => /\/js\/herramientas-layout\.js(?:\?|#|$)/.test(src));
  const frontendRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('/', location.origin);
  const toolsRoot = new URL('herramientas/', frontendRoot).pathname;
  const authorRoot = frontendRoot.pathname;
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const pages = [
    { label: 'Panel', path: toolsRoot },
    { label: 'Pedidos', path: `${toolsRoot}solicitud-herramientas/index.html` },
    { label: 'Reportes', path: `${toolsRoot}reporte-herramientas/index.html` },
    { label: 'Autor', path: authorRoot }
  ];
  const usuariosPath = `${toolsRoot}usuarios/index.html`;
  const renderNavItems = () => pages.map(({ label, path }) => {
    const active = currentPath === path.replace(/\/+$/, '');
    return `<li><a href="${path}"${active ? ' aria-current="page"' : ''}>${label}</a></li>`;
  }).join('');

  const shell = document.createElement('header');
  shell.className = 'tools-site-header';
  shell.innerHTML = `
    <nav class="tools-nav" aria-label="Navegación principal">
      <div class="tools-nav-inner">
        <a class="tools-nav-brand" href="${toolsRoot}">Herramientas</a>
        <button class="tools-nav-toggle" type="button" aria-label="Abrir menú"
          aria-controls="toolsMainNav" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <div class="tools-nav-menu" id="toolsMainNav">
          <ul id="toolsNavItems">${renderNavItems()}</ul>
          <div class="tools-nav-auth" id="toolsNavAuth"></div>
        </div>
      </div>
    </nav>
    <div class="tools-banner">
      <div class="tools-banner-inner">
        <div class="tools-brand-mark" aria-hidden="true">MV</div>
        <div class="tools-banner-copy">
          <p>GESTIÓN OPERATIVA</p>
          <h1>Herramientas · Metalúrgica Vera S.A.E.</h1>
          <span>Solicitudes, seguimiento y reportes en un solo lugar.</span>
        </div>
      </div>
    </div>
    <div class="tools-auth-modal" id="toolsAuthModal" role="dialog" aria-modal="true"
      aria-labelledby="toolsLoginTitle" aria-hidden="true">
      <section class="tools-auth-card">
        <button class="tools-auth-close" id="toolsAuthClose" type="button"
          aria-label="Cerrar inicio de sesión">&times;</button>
        <p class="tools-auth-eyebrow">ACCESO A HERRAMIENTAS</p>
        <h2 id="toolsLoginTitle">Iniciar sesión</h2>
        <p class="tools-auth-intro">Ingresa con tu cuenta de herramientas.</p>
        <form id="formLogin">
          <label for="username">Usuario</label>
          <input type="text" id="username" name="username" autocomplete="username"
            placeholder="Usuario" maxlength="30" required>
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" autocomplete="current-password" required>
          <p id="mensajeLogin" role="alert" aria-live="polite"></p>
          <button type="submit" id="btnIngresar">Ingresar</button>
        </form>
      </section>
    </div>
  `;

  document.body.classList.add('tools-layout');
  document.body.insertBefore(shell, document.body.firstChild);

  const nav = shell.querySelector('.tools-nav');
  const navItems = shell.querySelector('#toolsNavItems');
  const toggle = shell.querySelector('.tools-nav-toggle');
  const modal = shell.querySelector('#toolsAuthModal');
  const authContainer = shell.querySelector('#toolsNavAuth');
  const closeNav = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
  };
  const closeAccountMenu = (restoreFocus = false) => {
    const menu = authContainer.querySelector('#toolsAccountMenu');
    const accountToggle = authContainer.querySelector('#toolsAccountToggle');
    menu?.classList.remove('is-open');
    accountToggle?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) accountToggle?.focus();
  };
  const renderAuth = () => {
    navItems.innerHTML = renderNavItems();
    const token = sessionStorage.getItem('herramientas_token');
    const username = sessionStorage.getItem('herramientas_nombre') || 'Mi cuenta';
    if (!token) {
      authContainer.innerHTML = '<button class="tools-auth-trigger" id="toolsLoginTrigger" type="button" aria-haspopup="dialog" aria-controls="toolsAuthModal" aria-expanded="false">Iniciar sesión</button>';
      authContainer.querySelector('#toolsLoginTrigger').addEventListener('click', openLoginModal);
      return;
    }

    authContainer.innerHTML = `
      <div class="tools-user-menu">
        <button class="tools-user-toggle" id="toolsAccountToggle" type="button"
          aria-haspopup="true" aria-controls="toolsAccountMenu" aria-expanded="false">
          <span class="tools-user-icon" aria-hidden="true">●</span>
          <span class="tools-user-name"></span>
          <span class="tools-user-chevron" aria-hidden="true"></span>
        </button>
        <div class="tools-account-menu" id="toolsAccountMenu">
          <button class="tools-account-action" id="toolsLogout" type="button">Cerrar sesión</button>
        </div>
      </div>
    `;
    authContainer.querySelector('.tools-user-name').textContent = username;
    const accountToggle = authContainer.querySelector('#toolsAccountToggle');
    const accountMenu = authContainer.querySelector('#toolsAccountMenu');
    accountToggle.setAttribute('aria-label', `Cuenta de ${username}`);
    accountToggle.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = accountMenu.classList.toggle('is-open');
      accountToggle.setAttribute('aria-expanded', String(isOpen));
    });
    authContainer.querySelector('#toolsLogout').addEventListener('click', () => {
      closeAccountMenu();
      closeNav();
      if (typeof cerrarSesionHerramientas === 'function') cerrarSesionHerramientas();
      else {
        sessionStorage.removeItem('herramientas_token');
        sessionStorage.removeItem('herramientas_nombre');
        sessionStorage.removeItem('herramientas_rol');
      }
      document.dispatchEvent(new Event('herramientas:auth-change'));
      authContainer.querySelector('#toolsLoginTrigger')?.focus();
    });
  };
  const openLoginModal = () => {
    closeNav();
    modal.classList.add('is-visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tools-modal-open');
    modal.querySelector('#username').focus({ preventScroll: true });
  };
  const closeLoginModal = (restoreFocus = true) => {
    modal.classList.remove('is-visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tools-modal-open');
    modal.querySelector('#formLogin').reset();
    modal.querySelector('#mensajeLogin').textContent = '';
    const trigger = authContainer.querySelector('#toolsLoginTrigger');
    trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && trigger) trigger.focus();
  };

  window.abrirLoginHerramientas = openLoginModal;
  window.cerrarLoginHerramientas = closeLoginModal;
  renderAuth();
  document.addEventListener('herramientas:auth-change', renderAuth);
  document.addEventListener('herramientas:session-expirada', () => {
    renderAuth();
    modal.querySelector('#mensajeLogin').textContent = 'Tu sesión venció. Inicia sesión nuevamente para continuar.';
    openLoginModal();
  });

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
  navItems.addEventListener('click', event => {
    if (event.target.closest('a')) closeNav();
  });
  document.addEventListener('click', event => {
    if (!authContainer.contains(event.target)) closeAccountMenu();
    if (!shell.contains(event.target)) closeNav();
  });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'u') {
      event.preventDefault();
      if (currentPath !== usuariosPath.replace(/\/+$/, '')) location.assign(usuariosPath);
      return;
    }
    if (event.key === 'Escape' && modal.classList.contains('is-visible')) {
      closeLoginModal();
      return;
    }
    if (event.key === 'Escape') {
      if (authContainer.querySelector('#toolsAccountMenu.is-open')) {
        closeAccountMenu(true);
        return;
      }
      if (nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    }
    if (event.key !== 'Tab' || !modal.classList.contains('is-visible')) return;
    const focusable = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
  modal.querySelector('#toolsAuthClose').addEventListener('click', () => closeLoginModal());
  modal.addEventListener('click', event => {
    if (event.target === modal) closeLoginModal();
  });
  modal.addEventListener('click', event => event.stopPropagation());

  if (new URLSearchParams(location.search).has('login')) {
    openLoginModal();
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
  }
})();
