(() => {
  const redirectStorageKey = 'postLoginRedirect';
  const protectedPages = new Set([
    'formularios.html',
    'reportes.html',
    'carga-xlsx.html',
    'vista_mpp.html',
    'mpp.html',
    'indicador_mpp.html',
    'reporte-ordenes.html',
    'reportes_horometros.html'
  ]);
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop();
  const loginModal = document.getElementById('loginModal');

  function getProtectedTarget(value) {
    if (!value) return null;
    try {
      const target = new URL(value, window.location.href);
      const page = target.pathname.split('/').pop();
      if (target.origin !== window.location.origin ||
          !target.pathname.includes('/pages/') ||
          !protectedPages.has(page)) return null;
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return null;
    }
  }

  function showLoginModal() {
    if (!loginModal) return;
    loginModal.classList.add('is-visible');
    document.getElementById('user')?.focus();
  }

  function redirectToLogin(target) {
    window.__authRedirecting = true;
    const loginUrl = new URL('./upkeepmv.html', window.location.href);
    loginUrl.searchParams.set('loginRequired', '1');
    loginUrl.searchParams.set('returnTo', target);
    window.location.replace(loginUrl.href);
  }

  if (protectedPages.has(currentPage) && currentPath.includes('/pages/')) {
    if (!localStorage.getItem('token')) {
      redirectToLogin(`${currentPath}${window.location.search}${window.location.hash}`);
      return;
    }
  }

  if (!currentPath.endsWith('/upkeepmv.html')) return;

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

  const dashboardFrame = document.querySelector('#informaciones iframe[data-protected-src]');
  if (dashboardFrame) {
    if (localStorage.getItem('token')) {
      dashboardFrame.src = dashboardFrame.dataset.protectedSrc;
      dashboardFrame.removeAttribute('data-protected-src');
    } else {
      dashboardFrame.previousElementSibling?.removeAttribute('hidden');
    }
  }

  document.querySelectorAll('#solicitudes a[href], #mpp a[href], #informaciones a[href]').forEach((link) => {
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
