(() => {
  const body = document.getElementById('habilitacionesBody');
  const state = document.getElementById('habilitacionesEstado');
  const searchInput = document.getElementById('habilitacionesBuscador');
  const pageState = document.getElementById('habilitacionesPaginaEstado');
  const previousButton = document.getElementById('habilitacionesPaginaAnterior');
  const nextButton = document.getElementById('habilitacionesPaginaSiguiente');
  if (!body || !state || !searchInput || !pageState || !previousButton || !nextButton) return;
  const PAGE_SIZE = 120;
  let currentPage = 0;
  let totalRows = 0;
  let activeSearch = '';
  let requestId = 0;
  let searchTimer = null;

  function formatoNumero(value) {
    const numero = Number(value);
    return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 })
      .format(Number.isFinite(numero) && numero > 0 ? numero : 0);
  }

  function crearCelda(value) {
    const cell = document.createElement('td');
    cell.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
    return cell;
  }

  function fechaCompra(value) {
    let year;
    let month;
    let day;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      year = value.getUTCFullYear();
      month = value.getUTCMonth() + 1;
      day = value.getUTCDate();
    } else if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        [, year, month, day] = match;
      }
    }
    if (!year || !month || !day) return '—';
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  function crearCeldaMaquina(orden) {
    const cell = document.createElement('td');
    cell.textContent = orden.maquina_equipo || '—';
    return cell;
  }

  function crearCeldaCosteo(raw, valorProductoActual, fechaAdquisicion) {
    const cell = document.createElement('td');
    try {
      const costeo = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!costeo || !Array.isArray(costeo.productos)) {
        throw new Error('Formato de costeo inválido');
      }

      const lista = document.createElement('div');
      lista.className = 'habilitaciones-repuestos';
      costeo.productos.forEach(producto => {
        const item = document.createElement('div');
        const nombre = document.createElement('strong');
        const importe = document.createElement('span');
        item.className = 'habilitaciones-repuesto';
        nombre.textContent = `${producto.codigo} - ${producto.descripcion}`;
        importe.textContent = `${producto.cantidad} × ${formatoNumero(producto.costo_unitario)} = ${formatoNumero(producto.total)}`;
        item.append(nombre, importe);
        lista.appendChild(item);
      });
      cell.appendChild(lista);

      const comparacion = costeo.comparacion || {};
      const valorGuardado = Number(comparacion.valor_producto);
      const valorActual = Number(valorProductoActual);
      const tieneValorGuardado = comparacion.valor_producto != null && Number.isFinite(valorGuardado);
      const tieneValorActual = valorProductoActual != null && Number.isFinite(valorActual);
      if (tieneValorGuardado || tieneValorActual) {
        const total = Number(costeo.total) || 0;
        const valorProducto = tieneValorGuardado ? valorGuardado : valorActual;
        const costo = Number(comparacion.costo_repuestos);
        const costoComparacion = Number.isFinite(costo) ? costo : total;
        const porcentajeDato = Number(comparacion.porcentaje_repuestos);
        const porcentaje = comparacion.porcentaje_repuestos != null && Number.isFinite(porcentajeDato)
          ? porcentajeDato
          : valorProducto > 0 ? costoComparacion / valorProducto * 100 : 0;
        const detalles = document.createElement('p');
        detalles.className = 'habilitaciones-comparacion';
        const tarjetas = [
          { label: 'Producto', value: formatoNumero(valorProducto), compra: fechaCompra(fechaAdquisicion) },
          { label: 'Repuesto', value: formatoNumero(costoComparacion) },
          {
            label: '% costo',
            value: `${formatoNumero(porcentaje)}%`,
            className: porcentaje < 50
              ? 'habilitaciones-porcentaje--bajo'
              : porcentaje < 66
                ? 'habilitaciones-porcentaje--medio'
                : 'habilitaciones-porcentaje--alto'
          }
        ];
        tarjetas.forEach(({ label, value, className = '', compra }) => {
          const tarjeta = document.createElement('span');
          const titulo = document.createElement('small');
          const resultado = document.createElement('strong');
          tarjeta.className = `habilitaciones-comparacion__tarjeta ${className}`.trim();
          titulo.textContent = label;
          resultado.textContent = value;
          tarjeta.append(titulo, resultado);
          if (compra !== undefined) {
            const fechaTitulo = document.createElement('small');
            const fechaValor = document.createElement('strong');
            fechaTitulo.textContent = 'F.compra';
            fechaValor.textContent = compra;
            tarjeta.append(fechaTitulo, fechaValor);
          }
          detalles.appendChild(tarjeta);
        });
        cell.appendChild(detalles);
      }
    } catch (error) {
      console.error('No se pudo interpretar el costeo guardado:', error);
      cell.textContent = 'Costeo no disponible en formato válido.';
    }
    return cell;
  }

  function crearFila(orden) {
    const row = document.createElement('tr');
    row.append(
      crearCelda(orden.id),
      crearCeldaMaquina(orden),
      crearCelda(orden.nombre_declarado),
      crearCelda(orden.averia),
      crearCelda(orden.responsable),
      crearCeldaCosteo(orden.repuestos, orden.valor_producto, orden.fecha_adquisicion)
    );

    const puedeActualizar = ['editor', 'administrador'].includes(localStorage.getItem('role'));
    const estaHabilitado = String(orden.habilitado || 'no').trim().toLowerCase() === 'si';
    const statusCell = crearCelda(estaHabilitado ? 'Sí' : 'No');
    const actionCell = document.createElement('td');
    const habilitarButton = document.createElement('button');
    habilitarButton.type = 'button';
    habilitarButton.className = 'habilitaciones-accion';
    habilitarButton.textContent = 'Habilitar';
    habilitarButton.disabled = !puedeActualizar || estaHabilitado;
    habilitarButton.addEventListener('click', async () => {
      if (!await window.siteDialog.confirm('¿Habilito este pedido?', { acceptText: 'Sí', cancelText: 'No' })) return;
      habilitarButton.disabled = true;
      try {
        const response = await API_FETCH(`/api/ordenes/habilitacion/${encodeURIComponent(orden.id)}`, {
          method: 'PATCH',
          headers: API_JSON_HEADERS,
          body: JSON.stringify({ habilitado: 'si' })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detalle || result.error || 'No se pudo actualizar el estado.');
        orden.habilitado = result.habilitado;
        statusCell.textContent = 'Sí';
        state.textContent = `Orden ${orden.id} habilitada.`;
        await window.siteDialog.alert(`El pedido ${orden.id} quedó habilitado.`);
      } catch (error) {
        state.textContent = error.message;
        console.error('Error al actualizar el estado de habilitación:', error);
        await window.siteDialog.alert(error.message);
        habilitarButton.disabled = !puedeActualizar || String(orden.habilitado || 'no').trim().toLowerCase() === 'si';
      }
    });
    actionCell.appendChild(habilitarButton);
    row.append(statusCell, actionCell);
    return row;
  }

  function renderPaginacion() {
    const totalPages = Math.ceil(totalRows / PAGE_SIZE);
    const start = totalRows === 0 ? 0 : currentPage * PAGE_SIZE + 1;
    const end = Math.min((currentPage + 1) * PAGE_SIZE, totalRows);
    pageState.textContent = `${totalPages === 0 ? 0 : currentPage + 1}/${totalPages}`;
    pageState.setAttribute('aria-label', `Página ${totalPages === 0 ? 0 : currentPage + 1} de ${totalPages}; mostrando ${start}-${end} de ${totalRows} solicitudes`);
    previousButton.disabled = currentPage === 0;
    nextButton.disabled = (currentPage + 1) * PAGE_SIZE >= totalRows;
  }

  async function cargarHabilitaciones({ search = activeSearch, page = currentPage } = {}) {
    const currentRequest = ++requestId;
    activeSearch = search.trim();
    currentPage = page;
    state.textContent = 'Cargando solicitudes...';
    body.replaceChildren();
    pageState.textContent = 'Cargando solicitudes...';
    previousButton.disabled = true;
    nextButton.disabled = true;
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(currentPage * PAGE_SIZE)
      });
      if (activeSearch) params.set('search', activeSearch);
      const response = await API_FETCH(`/api/ordenes/habilitaciones/paginadas?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detalle || data.error || 'No se pudieron cargar las solicitudes.');
      if (!Array.isArray(data.rows) || !Number.isFinite(Number(data.total))) {
        throw new Error('La respuesta de solicitudes no tiene el formato esperado.');
      }
      if (currentRequest !== requestId) return;
      totalRows = Number(data.total);
      body.append(...data.rows.map(crearFila));
      state.textContent = data.rows.length
        ? `${totalRows} solicitudes de habilitación.`
        : 'No hay solicitudes de habilitación registradas.';
      renderPaginacion();
      document.querySelector('#tablaHabilitaciones').closest('.table-scroll').scrollTop = 0;
    } catch (error) {
      if (currentRequest === requestId) {
        state.textContent = error.message;
        pageState.textContent = 'No se pudieron cargar las solicitudes.';
        console.error('Error cargando solicitudes de habilitación:', error);
      }
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => cargarHabilitaciones({ search: searchInput.value, page: 0 }), 300);
  });
  previousButton.addEventListener('click', () => {
    if (currentPage > 0) cargarHabilitaciones({ page: currentPage - 1 });
  });
  nextButton.addEventListener('click', () => {
    if ((currentPage + 1) * PAGE_SIZE < totalRows) {
      cargarHabilitaciones({ page: currentPage + 1 });
    }
  });

  cargarHabilitaciones();
})();
