async function cargarSelectMantenimientosPreventivos(selectId = 'maquina') {
  const select = document.getElementById(selectId);
  if (!select) return;

  const contenedorExistente = select.parentElement?.querySelector('.select-buscador');
  if (contenedorExistente) {
    contenedorExistente.remove();
  }

  select.innerHTML = '<option value="">Seleccione un mantenimiento</option>';
  select.classList.add('select-buscador-original');

  const contenedor = document.createElement('div');
  contenedor.className = 'select-buscador';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'select-buscador-input';
  input.placeholder = 'Buscar mantenimiento...';
  input.autocomplete = 'off';
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-expanded', 'false');

  const lista = document.createElement('ul');
  lista.className = 'select-buscador-lista';
  lista.setAttribute('role', 'listbox');

  contenedor.appendChild(input);
  contenedor.appendChild(lista);
  select.insertAdjacentElement('afterend', contenedor);

  let items = [];

  try {
    const response = await API_FETCH('/api/mantenimientos-preventivos/pendientes');
    if (!response.ok) {
      throw new Error('No se pudo obtener la lista de mantenimientos');
    }

    const data = await response.json();
    items = Array.isArray(data) ? data.filter(item => {
      const fechaEjecInicio = item.fecha_ejecucion_inicio;
      const fechaEjecFinal = item.fecha_ejecucion_final;
      return !fechaEjecInicio && !fechaEjecFinal;
    }) : [];

    function etiqueta(item) {
      const texto = [
        `ID ${item.id}`,
        item.maquina_equipo || 'Sin máquina',
        item.codigo ? `(${item.codigo})` : ''
      ].filter(Boolean).join(' - ');
      return texto;
    }

    function cerrarLista() {
      lista.classList.remove('is-visible');
      input.setAttribute('aria-expanded', 'false');
    }

    function abrirLista() {
      lista.classList.add('is-visible');
      input.setAttribute('aria-expanded', 'true');
    }

    function mostrarResultados(busqueda = '') {
      const q = busqueda.trim().toLowerCase();
      const resultados = !q ? items : items.filter(item => {
        const texto = `${item.id} ${item.maquina_equipo || ''} ${item.codigo || ''}`.toLowerCase();
        return texto.includes(q);
      });

      lista.innerHTML = '';

      if (!resultados.length) {
        const vacio = document.createElement('li');
        vacio.className = 'select-buscador-vacio';
        vacio.textContent = 'Sin resultados';
        lista.appendChild(vacio);
        abrirLista();
        return;
      }

      resultados.forEach(item => {
        const option = document.createElement('li');
        option.className = 'select-buscador-opcion';
        option.setAttribute('role', 'option');
        option.tabIndex = -1;
        option.innerHTML = `<span>${etiqueta(item)}</span><small>${item.codigo || 'Sin código'}</small>`;

        option.addEventListener('mousedown', event => {
          event.preventDefault();
          select.innerHTML = '';
          const valor = String(item.id);
          const texto = etiqueta(item);
          select.add(new Option(texto, valor, true, true));
          input.value = texto;
          cerrarLista();
        });

        lista.appendChild(option);
      });

      abrirLista();
    }

    input.addEventListener('input', () => mostrarResultados(input.value));
    input.addEventListener('focus', () => mostrarResultados(input.value));
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') cerrarLista();
    });

    document.addEventListener('click', event => {
      if (!contenedor.contains(event.target)) {
        cerrarLista();
      }
    });

    if (!items.length) {
      const vacio = document.createElement('li');
      vacio.className = 'select-buscador-vacio';
      vacio.textContent = 'No hay mantenimientos pendientes';
      lista.appendChild(vacio);
    }
  } catch (error) {
    console.error('Error cargando mantenimientos preventivos:', error);
    select.innerHTML = '<option value="">Error al cargar mantenimientos</option>';
    input.value = 'Error al cargar mantenimientos';
    input.disabled = true;
  }
}

function inicializarSelectMantenimientosPreventivos() {
  const select = document.getElementById('maquina');
  if (select) {
    cargarSelectMantenimientosPreventivos('maquina');
  }
}

document.addEventListener('DOMContentLoaded', inicializarSelectMantenimientosPreventivos);
