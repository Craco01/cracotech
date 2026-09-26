(() => {
  const form = document.querySelector('form[data-modificacion="true"]');
  if (!form) return;

  // Evita que formularios.js registre un segundo submit para esta página.
  form.dataset.submitHandlerBound = 'true';

  const ordenSelect = document.getElementById('ordenSeleccionada');
  const maquinaSelect = document.getElementById('maquinaEquipo');
  const ordenId = document.getElementById('ordenId');
  const modal = document.getElementById('confirmacionModificacion');
  const confirmar = document.getElementById('confirmarModificacion');
  const cancelar = document.getElementById('cancelarModificacion');
  const contador = document.getElementById('contadorConfirmacion');
  const sectorNames = ['', 'Mantenimiento', 'Maquinado', 'Armado', 'Accesorios', 'Herrería', 'Pintura', 'Logística', 'Galvamax', 'Administración', 'Obras'];
  const categoryNames = ['', 'Correctivo', 'Preventivo', 'Predictivo'];
  let ordenes = [];
  let timer;

  function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? '';
  }

  function cargarDetalle(order) {
    ordenId.value = order.id;
    if (maquinaSelect) {
      maquinaSelect.innerHTML = '';
      maquinaSelect.add(new Option(order.maquina_equipo || order.codigo || 'Sin máquina', order.codigo || '', true, true));
      maquinaSelect.dataset.codigo = order.codigo || '';
      maquinaSelect.dataset.descripcion = order.maquina_equipo || '';
      const maquinaBuscador = maquinaSelect.nextElementSibling?.querySelector('.select-buscador-input');
      if (maquinaBuscador) maquinaBuscador.value = order.maquina_equipo || order.codigo || '';
      maquinaSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    document.getElementById('declarado').value = order.nombre_declarado || '';
    document.getElementById('declarado-radio').checked = Boolean(order.nombre_declarado);
    document.getElementById('averia').value = order.averia || '';
    document.getElementById('solicitante').value = order.solicitado || '';
    setSelectValue('sector', sectorNames.indexOf(order.sector));
    setSelectValue('categoria', categoryNames.indexOf(order.categoria));
  }

  async function cargarOrden(id) {
    try {
      const response = await API_FETCH(`/api/ordenes/${encodeURIComponent(id)}`);
      const order = await response.json();
      if (!response.ok) throw new Error(order.error || 'No se pudo cargar la solicitud.');
      cargarDetalle(order);
    } catch (error) {
      window.alert(error.message);
      limpiarFormulario();
    }
  }

  function limpiarFormulario() {
    form.reset();
    ordenSelect.innerHTML = '<option value="">Seleccione una solicitud</option>';
    ordenId.value = '';
    if (maquinaSelect) {
      maquinaSelect.innerHTML = '<option value="">Seleccione una maquina/equipo</option>';
      delete maquinaSelect.dataset.codigo;
      delete maquinaSelect.dataset.descripcion;
    }
    document.querySelectorAll('.select-buscador-input').forEach(input => { input.value = ''; });
  }

  async function cargarOrdenes() {
    try {
      const response = await API_FETCH('/api/ordenes');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las solicitudes.');
      ordenes = data
        .filter(order => String(order.progreso || '').trim().toLowerCase() !== 'completado')
        .sort((a, b) => Number(b.id) - Number(a.id));
      ordenes.forEach(order => ordenSelect.add(new Option(
        `${order.maquina_equipo || 'Sin máquina'}${order.nombre_declarado ? ` - ${order.nombre_declarado}` : ''}`,
        order.id
      )));
      const initialId = new URLSearchParams(window.location.search).get('id');
      if (initialId && ordenes.some(order => String(order.id) === initialId)) {
        ordenSelect.value = initialId;
        await cargarOrden(initialId);
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    }
  }

  function abrirConfirmacion() {
    let segundos = 10;
    confirmar.disabled = true;
    contador.textContent = `Podrás confirmar en ${segundos} segundos.`;
    modal.hidden = false;
    modal.classList.add('is-visible');
    clearInterval(timer);
    timer = setInterval(() => {
      segundos -= 1;
      contador.textContent = segundos > 0 ? `Podrás confirmar en ${segundos} segundos.` : 'Ya puedes confirmar la modificación.';
      if (segundos <= 0) {
        clearInterval(timer);
        confirmar.disabled = false;
      }
    }, 1000);
  }

  function cerrarConfirmacion(limpiar = true) {
    clearInterval(timer);
    modal.hidden = true;
    modal.classList.remove('is-visible');
    if (limpiar) limpiarFormulario();
  }

  async function registrarModificacion() {
    confirmar.disabled = true;
    cancelar.disabled = true;
    const machine = maquinaSelect;
    const data = {
      id: ordenId.value,
      codigo: machine.dataset.codigo || machine.value,
      maquina_equipo: machine.dataset.descripcion || machine.selectedOptions[0]?.text || '',
      nombre_declarado: document.getElementById('declarado-radio').checked ? document.getElementById('declarado').value : null,
      averia: document.getElementById('averia').value,
      solicitado: document.getElementById('solicitante').value,
      sector: sectorNames[Number(document.getElementById('sector').value)],
      categoria: categoryNames[Number(document.getElementById('categoria').value)]
    };
    try {
      const response = await API_FETCH('/api/ordenes/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detalle || result.error || 'No se pudo registrar la modificación.');
      window.alert(result.message || 'Solicitud modificada.');
      window.location.href = 'lista_solicitudes.html';
    } catch (error) {
      window.alert(error.message);
      cerrarConfirmacion(false);
      confirmar.disabled = false;
      cancelar.disabled = false;
    }
  }

  ordenSelect.addEventListener('change', () => {
    if (ordenSelect.value) cargarOrden(ordenSelect.value);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!ordenId.value) return window.alert('Seleccione primero una solicitud.');
    abrirConfirmacion();
  });
  confirmar.addEventListener('click', registrarModificacion);
  cancelar.addEventListener('click', () => cerrarConfirmacion());
  modal.addEventListener('click', event => {
    if (event.target === modal) cerrarConfirmacion();
  });
  document.addEventListener('keydown', event => {
    if (!modal.hidden && event.key === 'Escape') cerrarConfirmacion();
  });

  cargarOrdenes();
})();
