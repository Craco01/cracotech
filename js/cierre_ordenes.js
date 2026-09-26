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
  let datos = [];
  const solicitudInicialId = new URLSearchParams(window.location.search).get('id');

  async function cargarOrdenes() {
    try {
      const res = await API_FETCH('/api/ordenes');
      let data = await res.json();

      // Excluir los progresos que no deben mostrarse y ordenar descendente por id
      const excluidos = ['Completado'];
      if (!document.querySelector('form[data-modificacion="true"]')) excluidos.push('De baja');
      datos = data
        .filter(row => row.progreso && !excluidos.includes(row.progreso))
        .sort((a, b) => b.id - a.id);
      if (!document.querySelector('form[data-modificacion="true"]')) datos = datos.slice(0, 1500);

      const solicitudInicial = datos.find(row => String(row.id) === String(solicitudInicialId));
      if (solicitudInicial) seleccionar(solicitudInicial);
    } catch (err) {
      console.error("Error cargando ordenes:", err);
    }
  }

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

    infoAveria.textContent = `Avería: ${item.averia || "No especificada"}`;
    cerrarLista();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function mostrarResultados(busqueda = '') {
    if (!busqueda) {
      lista.innerHTML = '';
      cerrarLista();
      return;
    }

    try {
      if (datos.length === 0) {
        await cargarOrdenes();
      }

      resultadosActuales = datos.filter(item =>
        (item.maquina_equipo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.nombre_declarado || "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(item.id).includes(busqueda.trim())
      ).slice(0, 60);

      lista.innerHTML = '';

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
    }
  }

  input.addEventListener('input', () => {
    select.value = '';
    const hiddenId = document.getElementById('ordenId');
    if (hiddenId) {
      hiddenId.value = '';
    }
    mostrarResultados(input.value);
  });

  input.addEventListener('focus', () => {
    mostrarResultados(input.value);
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

  cargarOrdenes();
}

// Inicializar buscador
const selectInicial = document.getElementById('ordenSeleccionada') ? 'ordenSeleccionada' : 'maquina';
crearSelectConBusqueda(selectInicial);


