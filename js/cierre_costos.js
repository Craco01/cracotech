let productos = [];
const maxFilas = 15;
let costoGuardado = 0;
let existeCosteoGuardado = false;
let valorProductoOrden = null;
let valorProductoOrdenConsultado = false;
let ordenCosteoConsultada = '';
let solicitudCosteo = 0;
let ordenSeleccionadaCosteo = '';
let etiquetaOrdenCosteo = '';
let codigoOrdenCosteo = '';
let averiaOrdenCosteo = '';

// Función para formatear números como enteros con separadores de mil
function formatearNumero(num) {
  return new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(Number(num) || 0);
}

// Función para parsear número formateado
function parseNumeroFormateado(texto) {
  return parseFloat(texto.replace(/\./g, '').replace(/,/g, '.')) || 0;
}

function redondearDinero(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

async function cargarProductos() {
  try {
    const response = await API_FETCH('/api/productos');
    if (!response.ok) throw new Error(`No se pudieron cargar los productos (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('La respuesta de productos no tiene el formato esperado.');
    productos = data;

    const tablaBody = document.getElementById('tablaBody');
    if (tablaBody && tablaBody.querySelectorAll('tr').length === 0) agregarFila();
    recalcularTotal();

    const submitButton = document.querySelector('form[data-habilitacion="true"] button[type="submit"]');
    if (submitButton) {
      const ordenId = document.getElementById('maquina')?.value || '';
      submitButton.disabled = Boolean(ordenId && ordenCosteoConsultada !== ordenId);
      submitButton.textContent = 'Solicitar habilitación';
    }
  } catch (err) {
    console.error("Error cargando productos:", err);
    if (document.querySelector('form[data-habilitacion="true"]')) {
      await window.siteDialog.alert('No se pudieron cargar los productos. Recargue la página e inténtelo de nuevo.');
    }
  }
}

let idBuscadorProducto = 0;

function crearBuscador(onSelect) {
  const contenedor = document.createElement('div');
  contenedor.className = 'select-buscador producto-buscador';
  const buscador = document.createElement('input');
  buscador.type = 'text';
  buscador.className = 'select-buscador-input';
  buscador.placeholder = 'Buscar términos de producto...';
  buscador.autocomplete = 'off';
  buscador.setAttribute('role', 'combobox');
  buscador.setAttribute('aria-autocomplete', 'list');
  buscador.setAttribute('aria-expanded', 'false');
  buscador.setAttribute('aria-controls', `lista-productos-${++idBuscadorProducto}`);

  const lista = document.createElement('ul');
  lista.id = buscador.getAttribute('aria-controls');
  lista.className = 'select-buscador-lista';
  lista.setAttribute('role', 'listbox');
  contenedor.append(buscador, lista);

  let resultados = [];
  let indiceActivo = -1;

  function cerrarLista() {
    lista.classList.remove('is-visible');
    buscador.setAttribute('aria-expanded', 'false');
    indiceActivo = -1;
  }

  function marcarActivo() {
    const opciones = lista.querySelectorAll('.select-buscador-opcion');
    opciones.forEach((opcion, index) => {
      opcion.classList.toggle('is-active', index === indiceActivo);
      opcion.setAttribute('aria-selected', String(index === indiceActivo));
    });
    opciones[indiceActivo]?.scrollIntoView({ block: 'nearest' });
  }

  function seleccionar(producto) {
    buscador.value = `${producto.codigo} - ${producto.descripcion}`;
    cerrarLista();
    onSelect(producto);
  }

  function mostrarResultados() {
    const busqueda = buscador.value.trim();
    resultados = busqueda
      ? productos.filter(producto => SEARCH_UTILS.matches(busqueda, producto.codigo, producto.descripcion)).slice(0, 60)
      : [];
    lista.replaceChildren();

    if (!resultados.length) {
      cerrarLista();
      return;
    }

    resultados.forEach((producto, index) => {
      const opcion = document.createElement('li');
      const descripcion = document.createElement('span');
      const codigo = document.createElement('small');
      opcion.className = 'select-buscador-opcion';
      opcion.setAttribute('role', 'option');
      opcion.setAttribute('aria-selected', 'false');
      opcion.id = `${lista.id}-opcion-${index}`;
      opcion.tabIndex = -1;
      descripcion.textContent = producto.descripcion;
      codigo.textContent = producto.codigo;
      opcion.append(descripcion, codigo);
      opcion.addEventListener('mousedown', event => {
        event.preventDefault();
        seleccionar(producto);
      });
      lista.appendChild(opcion);
    });

    indiceActivo = 0;
    lista.classList.add('is-visible');
    buscador.setAttribute('aria-expanded', 'true');
    marcarActivo();
  }

  buscador.addEventListener('input', mostrarResultados);
  buscador.addEventListener('focus', mostrarResultados);
  buscador.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && resultados.length) {
      event.preventDefault();
      indiceActivo = Math.min(indiceActivo + 1, resultados.length - 1);
      marcarActivo();
    } else if (event.key === 'ArrowUp' && resultados.length) {
      event.preventDefault();
      indiceActivo = Math.max(indiceActivo - 1, 0);
      marcarActivo();
    } else if (event.key === 'Enter' && lista.classList.contains('is-visible') && indiceActivo >= 0) {
      event.preventDefault();
      seleccionar(resultados[indiceActivo]);
    } else if (event.key === 'Escape') {
      cerrarLista();
    }
  });
  contenedor.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!contenedor.contains(document.activeElement)) cerrarLista();
    }, 0);
  });

  return { contenedor, buscador };
}

function agregarFila() {
  const tablaBody = document.getElementById('tablaBody');
  if (!tablaBody) return;
  const filasActuales = tablaBody.querySelectorAll('tr').length;
  if (filasActuales >= maxFilas) return;

  const fila = document.createElement('tr');

  const { contenedor, buscador } = crearBuscador(producto => {
    fila.dataset.productoCodigo = producto.codigo;
    const precio = Number(producto.precio_compra) || 0;
    costoUnitario.value = formatearNumero(precio);
    const cantidad = Number(inputCantidad.value) || 0;
    total.value = formatearNumero(cantidad * precio);
    recalcularTotal();
    actualizarComparacionProducto();
    agregarFilaSiNecesaria();
  });
  const inputCantidad = document.createElement('input');
  inputCantidad.type = 'number';
  inputCantidad.min = '0';
  inputCantidad.step = 'any';

  const costoUnitario = document.createElement('input');
  costoUnitario.type = 'text';
  costoUnitario.readOnly = true;

  const total = document.createElement('input');
  total.type = 'text';
  total.readOnly = true;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'X';
  removeBtn.classList.add('remove-btn');
  removeBtn.addEventListener('click', () => {
    fila.remove();
    const filasRestantes = document.getElementById('tablaBody').querySelectorAll('tr').length;
    if (filasRestantes === 0) {
      agregarFila();
    }
    recalcularTotal();
    actualizarComparacionProducto();
  });

  buscador.addEventListener('input', () => {
    delete fila.dataset.productoCodigo;
    costoUnitario.value = '';
    total.value = '';
    recalcularTotal();
    actualizarComparacionProducto();
    agregarFilaSiNecesaria();
  });

  inputCantidad.addEventListener('input', () => {
    const cantidad = Math.max(Number(inputCantidad.value) || 0, 0);
    const precio = parseNumeroFormateado(costoUnitario.value);
    const totalVal = cantidad * precio;
    total.value = formatearNumero(totalVal);
    recalcularTotal();
    actualizarComparacionProducto();
    agregarFilaSiNecesaria();
  });

  fila.appendChild(document.createElement('td')).appendChild(contenedor);
  fila.appendChild(document.createElement('td')).appendChild(inputCantidad);
  fila.appendChild(document.createElement('td')).appendChild(costoUnitario);
  fila.appendChild(document.createElement('td')).appendChild(total);
  fila.appendChild(document.createElement('td')).appendChild(removeBtn);

  tablaBody.appendChild(fila);
}

function agregarFilaSiNecesaria() {
  const tablaBody = document.getElementById('tablaBody');
  if (!tablaBody) return;
  const filasActuales = tablaBody.querySelectorAll('tr').length;
  
  if (filasActuales >= maxFilas) return;

  // Verificar si la última fila tiene algún dato
  if (filasActuales > 0) {
    const ultimaFila = tablaBody.lastElementChild;
    const buscador = ultimaFila.querySelector('td:nth-child(1) input').value;
    const cantidad = ultimaFila.querySelector('td:nth-child(2) input').value;
    
    // Si la última fila tiene algo, agregar una nueva
    if (buscador || cantidad) {
      agregarFila();
    }
  }
}

function recalcularTotal() {
  let costoTotal = costoGuardado;
  document.querySelectorAll('#tablaBody tr').forEach(fila => {
    const totalText = fila.querySelector('td:nth-child(4) input')?.value || '0';
    const total = parseNumeroFormateado(totalText);
    costoTotal += total;
  });
  costoTotal = redondearDinero(costoTotal);
  const totalEl = document.getElementById('costoTotal');
  const costoEl = document.getElementById('costo_repuestos');
  if (totalEl) totalEl.textContent = formatearNumero(costoTotal);
  if (costoEl) costoEl.value = costoTotal.toFixed(2);
}

function construirNotas() {
  const repuestos = [];

  document.querySelectorAll('#tablaBody tr').forEach(fila => {
    const cantidad = fila.querySelector('td:nth-child(2) input')?.value.trim() || '';
    const producto = productos.find(item => String(item.codigo) === String(fila.dataset.productoCodigo));

    if (producto && cantidad) {
      repuestos.push(`${producto.codigo} | ${producto.descripcion} | ${cantidad}`);
    }
  });

  const observacion = document.getElementById('observacion')?.value.trim() || '';
  const partes = [];

  if (repuestos.length > 0) {
    partes.push(`Repuestos:\n${repuestos.map(item => `- ${item}`).join('\n')}`);
  }
  if (observacion) {
    partes.push(`Observación:\n${observacion}`);
  }

  return partes.join('\n\n');
}

function actualizarComparacionProducto() {
  const selectMaquina = document.getElementById('maquina');
  const producto = productos.find(item => String(item.codigo) === String(selectMaquina?.dataset.codigo));
  const valor = valorProductoOrdenConsultado
    ? Number(valorProductoOrden) || 0
    : Number(producto?.precio_compra) || 0;
  const costo = Number(document.getElementById('costo_repuestos')?.value) || 0;
  const porcentaje = valor > 0 ? (costo / valor) * 100 : 0;
  const valorEl = document.getElementById('valorProductoSolicitud');
  const costoEl = document.getElementById('costoRepuestosComparacion');
  const porcentajeEl = document.getElementById('porcentajeProductoRepuestos');

  if (valorEl) valorEl.textContent = formatearNumero(valor);
  if (costoEl) costoEl.textContent = formatearNumero(costo);
  if (porcentajeEl) {
    porcentajeEl.textContent = `${formatearNumero(porcentaje)}%`;
    porcentajeEl.classList.remove(
      'habilitaciones-porcentaje--bajo',
      'habilitaciones-porcentaje--medio',
      'habilitaciones-porcentaje--alto'
    );
    porcentajeEl.classList.add(
      porcentaje < 50
        ? 'habilitaciones-porcentaje--bajo'
        : porcentaje < 66
          ? 'habilitaciones-porcentaje--medio'
          : 'habilitaciones-porcentaje--alto'
    );
  }
}

async function cargarCosteoGuardado() {
  const selectMaquina = document.getElementById('maquina');
  const ordenId = selectMaquina?.value || '';
  const solicitudActual = ++solicitudCosteo;
  const submitButton = formularioHabilitacion?.querySelector('button[type="submit"]');

  costoGuardado = 0;
  existeCosteoGuardado = false;
  valorProductoOrden = null;
  valorProductoOrdenConsultado = false;
  ordenCosteoConsultada = '';
  actualizarComparacionProducto();
  recalcularTotal();

  if (!ordenId) {
    const estado = document.getElementById('habilitacionCosteoEstado');
    if (estado) estado.textContent = 'Seleccione una solicitud para comprobar si ya tiene un costeo.';
    if (submitButton && productos.length) submitButton.disabled = false;
    return;
  }
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Consultando costeo...';
  }

  try {
    const response = await API_FETCH(`/api/ordenes/habilitacion/${encodeURIComponent(ordenId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detalle || data.error || 'No se pudo consultar el costeo guardado.');
    if (solicitudActual !== solicitudCosteo) return;

    valorProductoOrden = data.valor_producto;
    valorProductoOrdenConsultado = true;
    if (data.tiene_costeo) {
      if (!data.costeo_valido || data.total_guardado === null ||
          !Number.isFinite(Number(data.total_guardado)) || Number(data.total_guardado) < 0) {
        throw new Error('El costeo guardado tiene un formato inválido; no se modificará.');
      }
      costoGuardado = Number(data.total_guardado);
      existeCosteoGuardado = true;
    }
    ordenCosteoConsultada = ordenId;
    const estado = document.getElementById('habilitacionCosteoEstado');
    if (estado) {
      estado.textContent = existeCosteoGuardado
        ? `Costeo ya guardado: ${formatearNumero(costoGuardado)}. Los nuevos productos se agregarán sin reemplazar los anteriores.`
        : 'Esta solicitud aún no tiene un costeo guardado.';
    }
    recalcularTotal();
    actualizarComparacionProducto();
  } catch (error) {
    if (solicitudActual !== solicitudCosteo) return;
    console.error('Error al consultar el costeo de habilitación:', error);
    const estado = document.getElementById('habilitacionCosteoEstado');
    if (estado) estado.textContent = 'No se pudo comprobar el costeo guardado. No se enviará la solicitud.';
    await window.siteDialog.alert(error.message);
  } finally {
    if (solicitudActual === solicitudCosteo && submitButton) {
      submitButton.disabled = !ordenCosteoConsultada || !productos.length;
      submitButton.textContent = 'Solicitar habilitación';
    }
  }
}

async function manejarCambioOrdenCosteo() {
  const selectMaquina = document.getElementById('maquina');
  const nuevaOrdenId = selectMaquina?.value || '';
  const tablaBody = document.getElementById('tablaBody');
  const hayProductosNuevos = Array.from(tablaBody?.querySelectorAll('tr') || []).some(fila =>
    Boolean(
      fila.dataset.productoCodigo ||
      fila.querySelector('td:nth-child(1) input')?.value.trim() ||
      fila.querySelector('td:nth-child(2) input')?.value
    )
  );

  if (ordenSeleccionadaCosteo && nuevaOrdenId !== ordenSeleccionadaCosteo && hayProductosNuevos) {
    const continuar = await window.siteDialog.confirm(
      'Cambiar la solicitud descartará los productos nuevos ingresados en este formulario. ¿Continuar?'
    );
    if (!continuar) {
      selectMaquina.innerHTML = '';
      selectMaquina.add(new Option(etiquetaOrdenCosteo, ordenSeleccionadaCosteo, true, true));
      selectMaquina.dataset.codigo = codigoOrdenCosteo;
      const buscador = selectMaquina.nextElementSibling?.querySelector('.select-buscador-input');
      if (buscador) buscador.value = etiquetaOrdenCosteo;
      const infoAveria = document.getElementById('info-averia');
      if (infoAveria) infoAveria.textContent = averiaOrdenCosteo;
      return;
    }

    tablaBody.replaceChildren();
    agregarFila();
    recalcularTotal();
    actualizarComparacionProducto();
  }

  ordenSeleccionadaCosteo = nuevaOrdenId;
  etiquetaOrdenCosteo = selectMaquina?.selectedOptions[0]?.textContent || '';
  codigoOrdenCosteo = selectMaquina?.dataset.codigo || '';
  averiaOrdenCosteo = document.getElementById('info-averia')?.textContent || '';
  await cargarCosteoGuardado();
}

function construirCosteo() {
  const tablaBody = document.getElementById('tablaBody');
  const repuestos = [];
  let hayFilaIncompleta = false;

  tablaBody.querySelectorAll('tr').forEach(fila => {
    const buscador = fila.querySelector('td:nth-child(1) input');
    const cantidadInput = fila.querySelector('td:nth-child(2) input');
    const productoCodigo = fila.dataset.productoCodigo;
    const cantidad = Number(cantidadInput?.value);
    const tieneDatos = Boolean(buscador?.value.trim() || cantidadInput?.value);

    if (!tieneDatos) return;
    const producto = productos.find(item => String(item.codigo) === String(productoCodigo));
    if (!producto || !Number.isFinite(cantidad) || cantidad <= 0) {
      hayFilaIncompleta = true;
      return;
    }

    const costoUnitario = Number(producto.precio_compra) || 0;
    if (costoUnitario < 0) {
      hayFilaIncompleta = true;
      return;
    }
    repuestos.push({
      codigo: String(producto.codigo),
      descripcion: String(producto.descripcion),
      cantidad,
      costo_unitario: redondearDinero(costoUnitario)
    });
  });

  if (hayFilaIncompleta) {
    throw new Error('Complete cada producto seleccionado con una cantidad mayor a cero.');
  }
  if (!repuestos.length) {
    throw new Error('Agregue al menos un producto al costeo.');
  }
  if (repuestos.length > maxFilas) {
    throw new Error(`El costeo no puede superar ${maxFilas} productos.`);
  }
  return { productos: repuestos };
}

const formularioHabilitacion = document.querySelector('form[data-habilitacion="true"]');
if (formularioHabilitacion) {
  document.getElementById('maquina')?.addEventListener('change', manejarCambioOrdenCosteo);
  formularioHabilitacion.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = formularioHabilitacion.querySelector('button[type="submit"]');
    if (!submitButton || submitButton.disabled) return;
    const ordenId = formularioHabilitacion.elements.id.value;
    if (!ordenId || ordenCosteoConsultada !== ordenId) {
      await window.siteDialog.alert('Espere a que se compruebe si la solicitud ya tiene un costeo.');
      return;
    }

    let repuestos;
    try {
      repuestos = construirCosteo();
    } catch (error) {
      await window.siteDialog.alert(error.message);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = existeCosteoGuardado ? 'Agregando productos...' : 'Enviando solicitud...';
    try {
      const response = await API_FETCH(
        existeCosteoGuardado
          ? `/api/ordenes/habilitacion/${encodeURIComponent(ordenId)}`
          : '/api/ordenes/habilitacion',
        {
        method: existeCosteoGuardado ? 'PUT' : 'POST',
        headers: API_JSON_HEADERS,
        body: JSON.stringify({
          id: ordenId,
          repuestos
        })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detalle || data.error || 'No se pudo solicitar la habilitación.');
      }
      await window.siteDialog.alert(
        existeCosteoGuardado
          ? 'Los nuevos productos se agregaron al costeo. El total se recalculó y el estado volvió a No habilitado.'
          : 'Solicitud de habilitación registrada exitosamente.'
      );
      window.top.location.href = '/mantenimiento/reportes/?vista=habilitaciones';
    } catch (error) {
      console.error('Error al solicitar habilitación:', error);
      await window.siteDialog.alert(`Error al solicitar habilitación: ${error.message}`);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Solicitar habilitación';
    }
  });
}

// Cuando se envía el formulario principal
const formularioCierre = document.querySelector('form[action="/api/mantenimientos-preventivos/cierre"], form[action="/api/ordenes/cierre"]');
if (formularioCierre) {
  const action = (formularioCierre.getAttribute('action') || '').trim();

  // MPP usa su propio flujo de cierre y no debe recalcular unidad de MO ni enviar el cálculo genérico.
  if (!action.includes('/mantenimientos-preventivos/cierre')) {
    formularioCierre.addEventListener('submit', async (e) => {
      e.preventDefault();
      recalcularTotal();
      const submitButton = e.target.querySelector('button[type="submit"]');
      if (submitButton?.disabled) return;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Cerrando...';
      }

      // Enviar formulario por AJAX
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData);
      payload.notas = construirNotas();
      const selectApoyo = document.getElementById('apoyo');

      payload.apoyo = selectApoyo?.value || '';

      const endpoint = action || '/api/ordenes/cierre';

      try {
        const response = await API_FETCH(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data = {};
        
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Error al parsear JSON:', e);
        }

        if (!response.ok) {
          const errorMsg = data.detalle || data.error || 'No se pudo cerrar la orden';
          await window.siteDialog.alert('Error: ' + errorMsg);
          return;
        }

        await window.siteDialog.alert('Orden cerrada exitosamente');
        if (endpoint.includes('/mantenimientos-preventivos/')) {
          window.location.reload();
        } else {
          window.top.location.href = '/mantenimiento/reportes/?vista=solicitudes';
        }
      } catch (error) {
        console.error('Error al cerrar orden:', error);
        await window.siteDialog.alert('Error al cerrar la orden: ' + error.message);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Cerrar solicitud';
        }
      }
    });
  }
}

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cargarProductos);
} else {
  cargarProductos();
}
