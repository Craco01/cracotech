(() => {
  const vistas = {
    maquinado: {
      template: 'horometros-maquinado',
      script: 'hora-maquinado.js',
      title: 'Registro de horas de máquinas'
    },
    criticos: {
      template: 'horometros-criticos',
      script: 'mantenimiento-criticos.js',
      title: 'Registro de mantenimientos críticos'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const vista = params.get('vista') || 'maquinado';
  const configuracion = vistas[vista] || vistas.maquinado;
  const app = document.getElementById('horometros-app');
  const template = document.getElementById(configuracion.template);

  if (!app || !template) return;

  app.className = `horas-maquinado horas-maquinado--${vista}`;
  app.replaceChildren(template.content.cloneNode(true));
  document.title = `${configuracion.title} | Mantenimiento Metalúrgica Vera S.A.E.`;

  const script = document.createElement('script');
  script.src = `../js/${configuracion.script}`;
  document.body.appendChild(script);
})();
