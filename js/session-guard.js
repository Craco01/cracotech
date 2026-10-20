(() => {
  const redirectStorageKey = 'postLoginRedirect';
  const protectedMaintenanceRoutes = new Set([
    'administrar-usuarios',
    'carga-xlsx',
    'formularios',
    'fr172-puente-grua-formulario',
    'fr172-puente-grua-imprimible',
    'horometros',
    'indicadores-mpp',
    'inventario',
    'mpp',
    'reportes',
    'reportes-horometros',
    'reportes-ordenes',
    'vista-mpp'
  ]);
  const editorMaintenanceRoutes = new Set([
    'fr172-puente-grua-formulario'
  ]);
  const currentPath = window.location.pathname;
  const loginModal = document.getElementById('loginModal');

  function maintenanceRouteName(pathname) {
    if (!pathname.startsWith('/mantenimiento/')) return null;
    return pathname.slice('/mantenimiento/'.length).split('/')[0];
  }

  function isProtectedPath(pathname) {
    const maintenanceRoute = maintenanceRouteName(pathname);
    return pathname === '/administrar-usuarios/' ||
      pathname === '/administrar-usuarios' ||
      Boolean(maintenanceRoute && protectedMaintenanceRoutes.has(maintenanceRoute));
  }

  function requiresEditor(pathname) {
    return editorMaintenanceRoutes.has(maintenanceRouteName(pathname));
  }

  function canEdit() {
    return ['editor', 'administrador'].includes(localStorage.getItem('role'));
  }

  function getProtectedTarget(value) {
    if (!value) return null;
    try {
      const target = new URL(value, window.location.href);
      if (target.origin !== window.location.origin ||
          !isProtectedPath(target.pathname)) return null;
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return null;
    }
  }

  function showLoginModal() {
    if (!loginModal) return;
    loginModal.classList.add('is-visible');
    // El login puede abrirse automáticamente al volver desde una ruta protegida.
    // Evita que el foco del campo aplique scroll a la página de fondo.
    document.getElementById('user')?.focus({ preventScroll: true });
  }

  function redirectToLogin(target) {
    window.__authRedirecting = true;
    const loginUrl = new URL('/mantenimiento/', window.location.origin);
    loginUrl.searchParams.set('loginRequired', '1');
    loginUrl.searchParams.set('returnTo', target);
    window.location.replace(loginUrl.href);
  }

  if (isProtectedPath(currentPath)) {
    if (!localStorage.getItem('token')) {
      redirectToLogin(`${currentPath}${window.location.search}${window.location.hash}`);
      return;
    }
    if (requiresEditor(currentPath) && !canEdit()) {
      window.location.replace('/mantenimiento/reportes/?vista=fr172&accessDenied=1');
      return;
    }
  }

  document.querySelectorAll('#fr172 a[href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = getProtectedTarget(link.href);
      if (!target) return;
      if (localStorage.getItem('token')) {
        if (!requiresEditor(new URL(target, window.location.href).pathname) || canEdit()) return;
        event.preventDefault();
        window.location.assign('/mantenimiento/reportes/?vista=fr172&accessDenied=1');
        return;
      }
      event.preventDefault();
      redirectToLogin(target);
    });
  });

  const isLoginPage = /^\/mantenimiento\/?$/.test(currentPath);
  if (isLoginPage) {
    const params = new URLSearchParams(window.location.search);
    const requestedTarget = getProtectedTarget(params.get('returnTo'));
    if (params.get('loginRequired') === '1' && requestedTarget) {
      if (localStorage.getItem('token')) {
        window.location.replace(requestedTarget);
        return;
      }
      sessionStorage.setItem(redirectStorageKey, requestedTarget);
      showLoginModal();
    }
  }

  const dashboardFrame = document.querySelector('#informaciones iframe[data-protected-src]');
  if (dashboardFrame) {
    if (localStorage.getItem('token')) {
      dashboardFrame.src = dashboardFrame.dataset.protectedSrc;
      dashboardFrame.removeAttribute('data-protected-src');
    } else {
      dashboardFrame.previousElementSibling?.removeAttribute('hidden');
    }
  }

  if (!isLoginPage) return;

  document.querySelectorAll('#solicitudes a[href], #mpp a[href], #informaciones a[href], #form-adds a[href]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (localStorage.getItem('token')) return;
      const target = getProtectedTarget(link.href);
      if (!target) return;
      event.preventDefault();
      sessionStorage.setItem(redirectStorageKey, target);
      showLoginModal();
    });
  });

})();
