(() => {
  if (window.__authRedirecting) return;

  const controladores = {
    formularios: {
      solicitud: ['codigo_maquina.js', 'formularios.js'],
      asignar: ['cierre_ordenes.js', 'formularios.js'],
      cierre: ['cierre_ordenes.js', 'formularios.js', 'cierre_costos.js'],
      habilitacion: ['cierre_ordenes.js', 'cierre_costos.js'],
      reprogramar: ['cierre_ordenes.js', 'formularios.js'],
      modificar: ['cierre_ordenes.js', 'codigo_maquina.js', 'modificar.js', 'formularios.js'],
      baja: ['cierre_ordenes.js', 'baja_ordenes.js']
    },
    reportes: {
      codigos: ['codigos.js'],
      solicitudes: ['lista_solicitudes.js'],
      informes: ['modulo_solicitudes.js'],
      habilitaciones: ['seguimiento-habilitaciones.js']
    }
  };

  const app = document.getElementById('solicitudes-app');
  if (!app) return;

  const seccion = app.dataset.seccion;
  const parametros = new URLSearchParams(window.location.search);
  const vistas = controladores[seccion];
  const predeterminada = seccion === 'formularios' ? 'solicitud' : 'codigos';
  const vista = parametros.get('vista') || predeterminada;
  const plantilla = document.getElementById(`${seccion}-${vista}`);

  if (!vistas || !vistas[vista] || !plantilla) {
    window.location.replace('./upkeepmv.html#solicitudes');
    return;
  }

  const hojasEstilo = {
    codigos: '../css/codigos.css',
    solicitudes: '../css/lista_solicitudes.css',
    informes: '../css/modulo_solicitudes.css',
    habilitaciones: '../css/habilitaciones.css'
  };
  function cargarHojaEstilo(ruta) {
    return new Promise((resolve, reject) => {
      const hojaEstilo = document.createElement('link');
      hojaEstilo.rel = 'stylesheet';
      hojaEstilo.href = ruta;
      hojaEstilo.onload = resolve;
      hojaEstilo.onerror = () => reject(new Error(`No se pudo cargar la hoja de estilo ${ruta}`));
      document.head.appendChild(hojaEstilo);
    });
  }

  async function cargarControladores() {
    for (const archivo of vistas[vista]) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `../js/${archivo}`;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`No se pudo cargar ${archivo}`));
        document.body.appendChild(script);
      });
    }
  }

  async function iniciarVista() {
    app.setAttribute('aria-busy', 'true');
    const cargando = document.createElement('p');
    cargando.setAttribute('role', 'status');
    cargando.textContent = 'Cargando vista...';
    app.replaceChildren(cargando);

    try {
      if (hojasEstilo[vista]) await cargarHojaEstilo(hojasEstilo[vista]);
    } catch (error) {
      console.error(error);
      const mensaje = document.createElement('p');
      mensaje.className = 'error-carga-vista';
      mensaje.textContent = 'No se pudo cargar esta vista. Recargue la página e inténtelo de nuevo.';
      app.replaceChildren(mensaje);
      app.removeAttribute('aria-busy');
      return;
    }

    app.replaceChildren(plantilla.content.cloneNode(true));
    document.title = `${vista[0].toUpperCase()}${vista.slice(1)} | Solicitudes de Mantenimiento`;
    try {
      await cargarControladores();
    } catch (error) {
      console.error(error);
      const mensaje = document.createElement('p');
      mensaje.className = 'error-carga-vista';
      mensaje.textContent = 'No se pudo cargar esta vista. Recargue la página e inténtelo de nuevo.';
      app.appendChild(mensaje);
    } finally {
      app.removeAttribute('aria-busy');
    }
  }

  iniciarVista();
})();