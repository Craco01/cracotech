(() => {
  if (window.__authRedirecting) return;

  const currentScriptUrl = document.currentScript.src;
  const controladores = {
    formularios: {
      solicitud: ['codigo_maquina.js', 'formularios.js'],
      asignar: ['cierre_ordenes.js?v=20261016-2', 'formularios.js'],
      cierre: ['cierre_ordenes.js?v=20261016-2', 'formularios.js', 'cierre_costos.js'],
      habilitacion: ['cierre_ordenes.js?v=20261016-2', 'cierre_costos.js'],
      reprogramar: ['cierre_ordenes.js?v=20261016-2', 'formularios.js'],
      modificar: ['cierre_ordenes.js?v=20261016-2', 'codigo_maquina.js', 'modificar.js', 'formularios.js'],
      baja: ['cierre_ordenes.js?v=20261016-2', 'baja_ordenes.js']
    },
    reportes: {
      codigos: ['codigos.js'],
      solicitudes: ['firmas-entrega.js?v=20261020-2', 'lista_solicitudes.js?v=20261017-1'],
      habilitaciones: ['seguimiento-habilitaciones.js'],
      informes: ['firmas-entrega.js?v=20261020-2', 'modulo_solicitudes.js?v=20261017-1'],
      fr172: ['reportes-fr172.js']
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
    window.location.replace('/mantenimiento/#solicitudes');
    return;
  }

  const hojasEstilo = {
    codigos: ['codigos.css'],
    solicitudes: ['lista_solicitudes.css', 'firmas-entrega.css'],
    habilitaciones: ['lista_solicitudes.css', 'habilitaciones.css'],
    informes: ['modulo_solicitudes.css', 'firmas-entrega.css'],
    fr172: ['lista_solicitudes.css', 'reportes-fr172.css']
  };
  function cargarHojaEstilo(nombre) {
    return new Promise((resolve, reject) => {
      const hojaEstilo = document.createElement('link');
      hojaEstilo.rel = 'stylesheet';
      hojaEstilo.href = new URL(`../css/${nombre}`, currentScriptUrl).href;
      hojaEstilo.onload = resolve;
      hojaEstilo.onerror = () => reject(new Error(`No se pudo cargar la hoja de estilo ${nombre}`));
      document.head.appendChild(hojaEstilo);
    });
  }

  async function cargarControladores() {
    for (const archivo of vistas[vista]) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL(archivo, currentScriptUrl).href;
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
      const hojas = hojasEstilo[vista]
        ? (Array.isArray(hojasEstilo[vista]) ? hojasEstilo[vista] : [hojasEstilo[vista]])
        : [];
      for (const hoja of hojas) await cargarHojaEstilo(hoja);
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
