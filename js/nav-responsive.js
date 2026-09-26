document.addEventListener('DOMContentLoaded', () => {
  const navBar = document.querySelector('.nav-bar');
  const toggle = document.querySelector('.nav-toggle');
  const navMenuWrap = document.querySelector('.nav-menu-wrap');
  const listBar = document.querySelector('.list-bar');
  const navLogin = document.getElementById('nav-login');

  if (!navBar || !toggle) return;

  toggle.addEventListener('click', () => {
    const isOpen = navBar.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.list-bar a, .list-bar .nav-btn').forEach((link) => {
    link.addEventListener('click', () => {
      navBar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Fuerza el modo compacto (menú hamburguesa) cuando el contenido no entra
  // en una sola línea, incluso por encima del breakpoint de 1140px, para
  // evitar que las letras del menú se solapen con el módulo de login.
  const SINGLE_LINE_HEIGHT = 56;
  let checking = false;

  function checkOverflow() {
    if (!navMenuWrap || !listBar || checking) return;
    checking = true;
    navBar.classList.remove('is-compact');
    const wrapped = listBar.offsetHeight > SINGLE_LINE_HEIGHT;
    const overflowX = navMenuWrap.scrollWidth > navMenuWrap.clientWidth + 1;
    if (wrapped || overflowX) {
      navBar.classList.add('is-compact');
    }
    checking = false;
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkOverflow, 100);
  });

  if (navLogin && window.MutationObserver) {
    new MutationObserver(checkOverflow).observe(navLogin, { childList: true, subtree: true });
  }

  window.addEventListener('load', checkOverflow);
  checkOverflow();
});

