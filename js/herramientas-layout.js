'use strict';

(() => {
  const scriptUrl = document.currentScript?.src || Array.from(document.scripts)
    .map(script => script.src)
    .find(src => /\/js\/herramientas-layout\.js(?:\?|#|$)/.test(src));
  const frontendRoot = scriptUrl ? new URL('../', scriptUrl) : new URL('/', location.origin);
  const toolsRoot = new URL('herramientas/', frontendRoot).pathname;
  const toolsRootPath = toolsRoot.replace(/\/+$/, '');
  const authorRoot = frontendRoot.pathname;
  const currentPath = location.pathname.replace(/\/+$/, '') || '/';
  const redirectStorageKey = 'herramientasPostLoginRedirect';
  const protectedToolsTarget = value => {
    if (!value) return null;
    try {
      const target = new URL(value, location.href);
      if (target.origin !== location.origin ||
          (target.pathname !== toolsRootPath && !target.pathname.startsWith(toolsRoot))) return null;
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return null;
    }
  };
  const pages = [
    { label: 'Panel', path: toolsRoot },
    { label: 'Pedidos', path: `${toolsRoot}solicitud-herramientas/index.html` },
    { label: 'Reportes', path: `${toolsRoot}reporte-herramientas/index.html` },
    { label: 'Autor', path: authorRoot }
  ];
  const usuariosPath = `${toolsRoot}usuarios/index.html`;
  const renderNavItems = () => {
    const role = sessionStorage.getItem('herramientas_rol');
    const visiblePages = pages.filter(({ label }) => label !== 'Pedidos' || role !== 'observador');
    if (role === 'administrador') visiblePages.push({ label: 'Usuarios', path: usuariosPath });
    return visiblePages.map(({ label, path }) => {
      const active = currentPath === path.replace(/\/+$/, '');
      return `<li><a href="${path}"${active ? ' aria-current="page"' : ''}>${label}</a></li>`;
    }).join('');
  };

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
        <img class="tools-brand-mark" src="${new URL('img/Logo_MV_obra.png', frontendRoot).pathname}"
          alt="Logotipo de Metalúrgica Vera S.A.E." width="76" height="76" decoding="async">
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
    <div class="tools-auth-modal tools-password-modal" id="toolsPasswordModal" role="dialog" aria-modal="true"
      aria-labelledby="toolsPasswordTitle" aria-hidden="true">
      <section class="tools-auth-card tools-password-card">
        <button class="tools-auth-close" id="toolsPasswordClose" type="button"
          aria-label="Cerrar cambio de contraseña">&times;</button>
        <p class="tools-auth-eyebrow">CUENTA DE HERRAMIENTAS</p>
        <h2 id="toolsPasswordTitle">Cambiar contraseña</h2>
        <p class="tools-auth-intro">Confirma tu contraseña actual y elige una nueva.</p>
        <form id="toolsPasswordForm">
          <label for="toolsCurrentPassword">Contraseña actual</label>
          <input type="password" id="toolsCurrentPassword" name="passwordActual" autocomplete="current-password" required>
          <label for="toolsNewPassword">Nueva contraseña</label>
          <input type="password" id="toolsNewPassword" name="passwordNueva" autocomplete="new-password" minlength="6" required>
          <small class="tools-password-help">Mínimo 6 caracteres y máximo 72 bytes.</small>
          <label for="toolsConfirmPassword">Repetir nueva contraseña</label>
          <input type="password" id="toolsConfirmPassword" name="confirmPassword" autocomplete="new-password" minlength="6" required>
          <p id="toolsPasswordMessage" class="tools-password-message" role="alert" aria-live="polite"></p>
          <div class="tools-password-actions">
            <button type="submit">Actualizar contraseña</button>
            <button type="button" id="toolsPasswordCancel">Cancelar</button>
          </div>
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
  const passwordModal = shell.querySelector('#toolsPasswordModal');
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
    const role = sessionStorage.getItem('herramientas_rol');
    document.querySelectorAll('a[href*="/solicitud-herramientas/"]').forEach(link => {
      link.hidden = role === 'observador';
    });
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
          ${role === 'observador' ? '' : '<button class="tools-account-action" id="toolsChangePassword" type="button">Cambiar contraseña</button>'}
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
    authContainer.querySelector('#toolsChangePassword')?.addEventListener('click', () => {
      closeAccountMenu();
      openPasswordModal();
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
  const passwordForm = passwordModal.querySelector('#toolsPasswordForm');
  const passwordMessage = passwordModal.querySelector('#toolsPasswordMessage');
  let passwordCloseTimer = 0;
  const closePasswordModal = (restoreFocus = true) => {
    window.clearTimeout(passwordCloseTimer);
    passwordCloseTimer = 0;
    passwordModal.classList.remove('is-visible');
    passwordModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('tools-modal-open');
    passwordForm.reset();
    passwordMessage.textContent = '';
    delete passwordMessage.dataset.state;
    if (restoreFocus) authContainer.querySelector('#toolsAccountToggle')?.focus();
  };
  const openPasswordModal = () => {
    window.clearTimeout(passwordCloseTimer);
    passwordCloseTimer = 0;
    closeNav();
    closeAccountMenu();
    passwordForm.reset();
    passwordMessage.textContent = '';
    delete passwordMessage.dataset.state;
    passwordModal.classList.add('is-visible');
    passwordModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('tools-modal-open');
    passwordForm.querySelector('#toolsCurrentPassword').focus({ preventScroll: true });
  };
  passwordForm.addEventListener('submit', async event => {
    event.preventDefault();
    const passwordActual = passwordForm.elements.passwordActual.value;
    const passwordNueva = passwordForm.elements.passwordNueva.value;
    const confirmPassword = passwordForm.elements.confirmPassword.value;
    const setMessage = (message, state = 'error') => {
      passwordMessage.textContent = message;
      passwordMessage.dataset.state = state;
    };

    if (passwordNueva !== confirmPassword) {
      setMessage('Las nuevas contraseñas no coinciden.');
      passwordForm.elements.confirmPassword.focus();
      return;
    }
    if (new TextEncoder().encode(passwordNueva).length > 72) {
      setMessage('La nueva contraseña no puede superar 72 bytes.');
      passwordForm.elements.passwordNueva.focus();
      return;
    }

    const submitButton = passwordForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    try {
      const response = await API_FETCH('/api/auth/password', {
        method: 'PUT',
        headers: API_JSON_HEADERS,
        body: JSON.stringify({ passwordActual, passwordNueva })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo actualizar la contraseña.');
      setMessage(data.mensaje || 'Contraseña actualizada correctamente.', 'success');
      passwordForm.reset();
      passwordCloseTimer = window.setTimeout(() => closePasswordModal(), 1500);
    } catch (error) {
      setMessage(error.message || 'No se pudo actualizar la contraseña.');
    } finally {
      submitButton.disabled = false;
    }
  });

  window.abrirLoginHerramientas = openLoginModal;
  window.cerrarLoginHerramientas = closeLoginModal;
  renderAuth();
  document.addEventListener('herramientas:auth-change', renderAuth);
  document.addEventListener('herramientas:session-expirada', () => {
    closePasswordModal(false);
    const currentTarget = protectedToolsTarget(`${location.pathname}${location.search}${location.hash}`);
    if (currentTarget) sessionStorage.setItem(redirectStorageKey, currentTarget);
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
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    const target = link ? protectedToolsTarget(link.href) : null;
    if (!target || sessionStorage.getItem('herramientas_token')) return;
    event.preventDefault();
    sessionStorage.setItem(redirectStorageKey, target);
    openLoginModal();
  }, true);
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
    if (event.key === 'Escape' && passwordModal.classList.contains('is-visible')) {
      closePasswordModal();
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
    const activeModal = passwordModal.classList.contains('is-visible') ? passwordModal :
      modal.classList.contains('is-visible') ? modal : null;
    if (event.key !== 'Tab' || !activeModal) return;
    const focusable = [...activeModal.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !activeModal.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !activeModal.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
  modal.querySelector('#toolsAuthClose').addEventListener('click', () => closeLoginModal());
  modal.addEventListener('click', event => {
    if (event.target === modal) closeLoginModal();
  });
  modal.addEventListener('click', event => event.stopPropagation());
  passwordModal.querySelector('#toolsPasswordClose').addEventListener('click', () => closePasswordModal());
  passwordModal.querySelector('#toolsPasswordCancel').addEventListener('click', () => closePasswordModal());
  passwordModal.addEventListener('click', event => {
    if (event.target === passwordModal) closePasswordModal();
  });
  passwordModal.addEventListener('click', event => event.stopPropagation());

  if (!sessionStorage.getItem('herramientas_token')) {
    const currentTarget = protectedToolsTarget(`${location.pathname}${location.search}${location.hash}`);
    if (currentTarget) sessionStorage.setItem(redirectStorageKey, currentTarget);
    openLoginModal();
  } else if (new URLSearchParams(location.search).has('login')) {
    openLoginModal();
    history.replaceState(null, '', `${location.pathname}${location.hash}`);
  }
})();
