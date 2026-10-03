function crearSelectConBusqueda(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Seleccione una solicitud</option>';
  select.classList.add('select-buscador-original');

  const contenedor = document.createElement('div');
  contenedor.className = 'select-buscador';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'select-buscador-input';
  input.placeholder = 'Buscar solicitud...';
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-autocomplete', 'list');

  const lista = document.createElement('ul');
  lista.className = 'select-buscador-lista';
  lista.setAttribute('role', 'listbox');

  // Párrafo dinámico para mostrar la avería
  const infoAveria = document.createElement('p');
  infoAveria.id = 'info-averia';
  infoAveria.className = 'info-averia';

  contenedor.appendChild(input);
  contenedor.appendChild(lista);
  select.insertAdjacentElement('afterend', contenedor);
  contenedor.insertAdjacentElement('afterend', infoAveria);

  let resultadosActuales = [];
  let indiceActivo = -1;
  let solicitudBusqueda = 0;
  let temporizadorBusqueda = null;
  const parametrosIniciales = new URLSearchParams(window.location.search);
  const solicitudInicialId = parametrosIniciales.get('id');
  const detalleInicial = parametrosIniciales.get('detalle') || '';
  const incluirInactivas = Boolean(document.querySelector('form[data-modificacion="true"]'));

  function abrirLista() {
    lista.classList.add('is-visible');
    input.setAttribute('aria-expanded', 'true');
  }

  function cerrarLista() {
    lista.classList.remove('is-visible');
    input.setAttribute('aria-expanded', 'false');
    indiceActivo = -1;
    marcarActivo();
  }

  function marcarActivo() {
    const opciones = lista.querySelectorAll('.select-buscador-opcion');
    opciones.forEach((opcion, index) => {
      opcion.classList.toggle('is-active', index === indiceActivo);
    });
    if (indiceActivo >= 0 && opciones[indiceActivo]) {
      opciones[indiceActivo].scrollIntoView({ block: 'nearest' });
    }
  }

  function etiquetaSolicitud(item) {
    const datosSolicitud = [
      item.maquina_equipo,
      item.nombre_declarado
    ].filter(Boolean);
    return datosSolicitud.join(' - ') || 'Sin nombre';
  }

  function seleccionar(item) {
    select.innerHTML = "";
    const etiqueta = etiquetaSolicitud(item);
    select.add(new Option(etiqueta, String(item.id), true, true));
    input.value = etiqueta;

    const hiddenId = document.getElementById('ordenId');
    if (hiddenId) {
      hiddenId.value = item.id;
    }

    infoAveria.textContent = item.averia === undefined
      ? 'Cargando detalles de la solicitud...'
      : `Avería: ${item.averia || "No especificada"}`;
    cerrarLista();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function mostrarResultados(busqueda = '') {
    const texto = busqueda.trim();
    if (!texto) {
      resultadosActuales = [];
      cerrarLista();
      return;
    }

    const solicitudActual = ++solicitudBusqueda;
    lista.replaceChildren();
    const cargando = document.createElement('li');
    cargando.className = 'select-buscador-vacio';
    cargando.textContent = 'Buscando solicitudes...';
    lista.appendChild(cargando);
    abrirLista();

    try {
      const query = new URLSearchParams({
        search: texto,
        includeInactive: String(incluirInactivas)
      });
      const res = await API_FETCH(`/api/ordenes/buscar?${query.toString()}`);
      if (!res.ok) throw new Error(`No se pudieron buscar las solicitudes (${res.status})`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('La respuesta de búsqueda no tiene el formato esperado.');
      if (solicitudActual !== solicitudBusqueda) return;

      resultadosActuales = data;
      lista.replaceChildren();

      if (resultadosActuales.length === 0) {
        const vacio = document.createElement('li');
        vacio.className = 'select-buscador-vacio';
        vacio.textContent = 'Sin resultados';
        lista.appendChild(vacio);
        abrirLista();
        return;
      }

      resultadosActuales.forEach(item => {
        const opcion = document.createElement('li');
        const descripcion = document.createElement('span');
        const codigo = document.createElement('small');

        opcion.className = 'select-buscador-opcion';
        opcion.setAttribute('role', 'option');
        opcion.tabIndex = -1;
        descripcion.textContent = etiquetaSolicitud(item);
        codigo.textContent = `ID: ${item.id} · Estado: ${item.progreso}`;
        opcion.appendChild(descripcion);
        opcion.appendChild(codigo);

        opcion.addEventListener('mousedown', event => {
          event.preventDefault();
          seleccionar(item);
        });

        lista.appendChild(opcion);
      });

      indiceActivo = resultadosActuales.length > 0 ? 0 : -1;
      abrirLista();
      marcarActivo();
    } catch (err) {
      console.error('Error al buscar solicitudes:', err);
      if (solicitudActual !== solicitudBusqueda) return;
      lista.replaceChildren();
      const error = document.createElement('li');
      const reintentar = document.createElement('button');
      error.className = 'select-buscador-vacio';
      error.textContent = 'No se pudo completar la búsqueda.';
      reintentar.type = 'button';
      reintentar.textContent = 'Reintentar';
      reintentar.addEventListener('click', () => mostrarResultados(texto));
      lista.append(error, reintentar);
      abrirLista();
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(temporizadorBusqueda);
    solicitudBusqueda++;
    resultadosActuales = [];
    lista.replaceChildren();
    cerrarLista();
    select.value = '';
    const hiddenId = document.getElementById('ordenId');
    if (hiddenId) {
      hiddenId.value = '';
    }
    infoAveria.textContent = '';
    temporizadorBusqueda = setTimeout(() => mostrarResultados(input.value), 250);
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) mostrarResultados(input.value);
  });

  input.addEventListener('keydown', event => {
    if (!lista.classList.contains('is-visible') && event.key !== 'Tab') {
      mostrarResultados(input.value);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      indiceActivo = Math.min(indiceActivo + 1, resultadosActuales.length - 1);
      marcarActivo();
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      indiceActivo = Math.max(indiceActivo - 1, 0);
      marcarActivo();
    }

    if (event.key === 'Enter' && indiceActivo >= 0) {
      event.preventDefault();
      seleccionar(resultadosActuales[indiceActivo]);
    }

    if (event.key === 'Escape') {
      cerrarLista();
    }
  });

  document.addEventListener('click', event => {
    if (!contenedor.contains(event.target)) {
      cerrarLista();
    }
  });

  if (solicitudInicialId) {
    const seleccionInicial = {
      id: solicitudInicialId,
      maquina_equipo: detalleInicial
    };
    seleccionar(seleccionInicial);
    if (!incluirInactivas) API_FETCH(`/api/ordenes/${encodeURIComponent(solicitudInicialId)}`)
      .then(async res => {
        if (!res.ok) throw new Error(`No se pudieron cargar los detalles de la solicitud (${res.status})`);
        const item = await res.json();
        if (String(document.getElementById('ordenId')?.value) === String(solicitudInicialId)) {
          seleccionar(item);
        }
      })
      .catch(err => {
        console.error('Error cargando la solicitud seleccionada:', err);
        if (String(document.getElementById('ordenId')?.value) === String(solicitudInicialId)) {
          infoAveria.textContent = 'No se pudieron cargar los detalles. Puede continuar e intentarlo al enviar.';
        }
      });
  }
}

// Inicializar buscador
const selectInicial = document.getElementById('ordenSeleccionada') ? 'ordenSeleccionada' : 'maquina';
crearSelectConBusqueda(selectInicial);
