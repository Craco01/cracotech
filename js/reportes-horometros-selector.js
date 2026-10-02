(() => {
  const vistas = {
    compresores: {
      template: 'reporte-compresores',
      script: 'reporte-compresores.js',
      title: 'Mantenimiento crítico - Compresores'
    },
    generadores: {
      template: 'reporte-generadores',
      script: 'reporte-generadores.js',
      title: 'Mantenimiento crítico - Grupos generadores'
    },
    datos: {
      template: 'reporte-datos',
      script: 'reporte-horometros.js',
      title: 'Reporte de Horómetros - Datos brutos'
    },
    turnos: {
      template: 'reporte-turnos',
      script: 'reporte-horometros-turnos.js',
      title: 'Reporte de Horómetros - Horas por turno'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const vista = params.get('vista') || 'compresores';
  const configuracion = vistas[vista] || vistas.compresores;
  const app = document.getElementById('reportes-horometros-app');
  const template = document.getElementById(configuracion.template);

  if (!app || !template) return;

  app.replaceChildren(template.content.cloneNode(true));
  document.title = `${configuracion.title} | Mantenimiento Metalúrgica Vera S.A.E.`;

  const script = document.createElement('script');
  script.src = `../js/${configuracion.script}`;
  document.body.appendChild(script);
})();
