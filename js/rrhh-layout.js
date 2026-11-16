'use strict';

(() => {
  const pathParts = location.pathname.replace(/\/+$/, '').split('/');
  let page = pathParts.pop() || 'rrhh';
  if (page === 'index.html') page = pathParts.pop() || 'rrhh';
  const frontendRoot = new URL(page === 'rrhh' ? '../' : '../../', location.href);
  const moduleRoot = new URL('rrhh/', frontendRoot).href;
  const route = path => new URL(path, frontendRoot).href;
  const pageTitle = page === 'actualizacion'
    ? 'Actualización de datos del personal · FR-158'
    : page === 'ficha'
      ? 'Ficha imprimible · FR-158'
      : 'Consulta de fichas del personal';
  const links = [
    { label: 'Reportes', href: moduleRoot, active: page === 'rrhh' },
    { label: 'Actualizar ficha', href: route('rrhh/actualizacion/'), active: page === 'actualizacion' },
    { label: 'Autor', href: route('index.html') }
  ];

  document.body.classList.add('rrhh-layout');
  const header = document.createElement('header');
  header.className = 'rrhh-site-header';
  header.innerHTML = `
    <nav class="rrhh-nav" aria-label="Navegación de módulos">
      <button class="rrhh-nav-toggle" type="button" aria-expanded="false" aria-controls="rrhhNavLinks" aria-label="Abrir menú">☰</button>
      <div class="rrhh-nav-links" id="rrhhNavLinks">
        ${links.map(link => `<a href="${link.href}"${link.active ? ' aria-current="page"' : ''}>${link.label}</a>`).join('')}
      </div>
    </nav>
    <div class="rrhh-banner">
      <img src="${route('img/Logo MV Vertical SAE.png')}" alt="" width="68" height="68">
      <div><p>GESTIÓN DE PERSONAS · FR-158</p><h1>Recursos Humanos</h1><span>${pageTitle}</span></div>
    </div>`;
  document.body.insertBefore(header, document.body.firstChild);

  const toggle = header.querySelector('.rrhh-nav-toggle');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    header.querySelector('.rrhh-nav-links').classList.toggle('is-open', open);
  });

  const footer = document.createElement('footer');
  footer.className = 'rrhh-footer';
  footer.innerHTML = `<span>Recursos Humanos · Metalúrgica Vera S.A.E.</span><a href="${route('index.html')}">Volver al portal CracoTech</a>`;
  document.body.append(footer);
})();
