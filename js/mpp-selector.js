(() => {
  const vistas = {
    asignar: {
      template: 'mpp-asignar',
      scripts: ['mpp-alert.js', 'mantenimientos-preventivos-select.js', 'asignar-mpp.js'],
      title: 'Asignación de Mantenimiento Preventivo'
    },
    cierre: {
      template: 'mpp-cierre',
      scripts: ['mpp-alert.js', 'mantenimientos-preventivos-select.js', 'cierre_costos.js', 'mantenimiento-preventivo-formularios.js'],
      title: 'Cierre de Solicitud de Mantenimiento'
    },
    reprogramar: {
      template: 'mpp-reprogramar',
      scripts: ['mpp-alert.js', 'mantenimientos-preventivos-select.js', 'reprogramar-mpp.js'],
      title: 'Reprogramación de Mantenimiento Preventivo'
    }
  };

  const params = new URLSearchParams(window.location.search);
  const vista = params.get('vista') || 'asignar';
  const configuracion = vistas[vista] || vistas.asignar;
  const app = document.getElementById('mpp-app');
  const template = document.getElementById(configuracion.template);

  if (!app || !template) return;

  app.replaceChildren(template.content.cloneNode(true));
  document.title = `${configuracion.title} | Mantenimiento Metalúrgica Vera S.A.E.`;

  function cargarScript(indice) {
    if (indice >= configuracion.scripts.length) return;
    const script = document.createElement('script');
    script.src = `../js/${configuracion.scripts[indice]}`;
    script.onload = () => cargarScript(indice + 1);
    script.onerror = () => console.error(`No se pudo cargar ${configuracion.scripts[indice]}`);
    document.body.appendChild(script);
  }

  cargarScript(0);
})();
