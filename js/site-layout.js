(function () {
  if (document.body && document.body.hasAttribute('data-no-global-layout')) return;

  const isPagesDir = window.location.pathname.includes('/pages/');
  const root = isPagesDir ? '../' : './';

  function buildLayoutHtml() {
    return `
      <header class="global-shell-header">
        <nav class="nav-bar" aria-label="Navegación principal">
          <button class="nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="nav-menu-wrap">
            <ul class="list-bar">
              <li><a href="${root}index.html">Inicio</a></li>
              <li><a href="${root}index.html#solicitudes">Solicitudes</a></li>
              <li><a href="${root}index.html#mpp">MPP</a></li>
              <li><a href="${root}index.html#informaciones">Informaciones</a></li>
              <li><a href="${root}index.html#form-adds">Formularios</a></li>
              <li><a href="${root}index.html#otros">Otros</a></li>
              <li><a href="${root}index.html#contacto">Contacto</a></li>
            </ul>
            <div id="nav-login"></div>
          </div>
        </nav>

        <div class="banner">
          <div class="logo"><img height="150" width="150" src="${root}img/Logo.png" alt="logo metalurgica vera"></div>
          <div class="hero">
            <h1>Mantenimiento Metalúrgica Vera S.A.E.</h1>
            <p>Garantizamos la confiabilidad, disponibilidad y eficiencia de los equipos e instalaciones industriales.</p>
          </div>
        </div>

        <div id="loginModal" class="login-modal">
          <div class="login-modal-content">
            <span id="closeLoginModal" class="login-close">&times;</span>
            <h2>Inicio de Sesión</h2>
            <form id="loginForm">
              <label for="user">Usuario:</label>
              <input type="text" id="user" name="user" required>
              <label for="password">Contraseña:</label>
              <input type="password" id="password" name="password" required>
              <button type="submit">Enviar</button>
            </form>
            <div id="loginMensaje"></div>
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
  }

  ensureLayout();
})();
