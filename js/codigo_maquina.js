function crearSelectConBusqueda(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Seleccione una maquina/equipo</option>';
  select.classList.add('select-buscador-original');

  const contenedor = document.createElement('div');
  contenedor.className = 'select-buscador';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'select-buscador-input';
  input.placeholder = 'Buscar maquina/equipo...';
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');

  const lista = document.createElement('ul');
  lista.className = 'select-buscador-lista';
  lista.setAttribute('role', 'listbox');

  contenedor.appendChild(input);
  contenedor.appendChild(lista);
  select.insertAdjacentElement('afterend', contenedor);

  let resultadosActuales = [];
  let indiceActivo = -1;

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

  function seleccionar(item) {
    select.innerHTML = "";
    select.add(new Option(item.descripcion, item.codigo, true, true));
    select.dataset.codigo = item.codigo;
    select.dataset.descripcion = item.descripcion;
    input.value = item.descripcion;
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
      const res = await API_FETCH(`/api/productos/search?search=${encodeURIComponent(busqueda)}`);
      const datos = await res.json();

      if (!res.ok) {
        throw new Error(datos.error || 'No se pudieron buscar las máquinas/equipos.');
      }

      resultadosActuales = Array.isArray(datos) ? datos.slice(0, 60) : [];
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
        descripcion.textContent = item.descripcion;
        codigo.textContent = item.codigo;
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
      console.error('Error al buscar productos:', err);
    }
  }

  input.addEventListener('input', () => {
    select.value = '';
    delete select.dataset.codigo;
    delete select.dataset.descripcion;
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
}

// Inicializar buscador
const selectMaquina = document.getElementById('maquinaEquipo') ? 'maquinaEquipo' : 'maquina';
crearSelectConBusqueda(selectMaquina);


