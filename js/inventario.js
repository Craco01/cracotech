let inventarioData = [];
let filaEnEdicion = null;
let campoEnEdicion = null;
let columnaOrden = null;
let direccionOrden = "asc";
const LIMITE_POR_PAGINA = 120;
const CODIGO_PROVISIONAL_INICIAL = 33000;
let paginaActual = 0;
let totalInventario = 0;
let busquedaActiva = "";
let solicitudCarga = 0;
let temporizadorBusqueda = null;
let controlInventarioActivo = null;
let posicionModalInventario = null;
let codigoPropuestoAdicional = "";
const puedeEliminarInventario = localStorage.getItem('role') === 'administrador';
const columnasNumericas = new Set(["StockF9", "CantidadFisica", "Diferencia"]);
document.getElementById('inventario-actions-header').hidden = !puedeEliminarInventario;

async function cargarInventario({ busqueda = busquedaActiva, pagina = paginaActual, reiniciarScrollTabla = false } = {}) {
  const cargaActual = ++solicitudCarga;
  busquedaActiva = busqueda.trim();
  paginaActual = pagina;
  const estado = document.getElementById("inventario-page-status");
  const anterior = document.getElementById("inventario-prev");
  const siguiente = document.getElementById("inventario-next");
  estado.textContent = "…";
  anterior.disabled = true;
  siguiente.disabled = true;

  try {
    const parametros = new URLSearchParams({
      limit: String(LIMITE_POR_PAGINA),
      offset: String(paginaActual * LIMITE_POR_PAGINA),
      sortBy: columnaOrden || "Codigo",
      sortOrder: direccionOrden
    });
    if (busquedaActiva) parametros.set("search", busquedaActiva);
    const res = await API_FETCH(`/api/inventario/paginadas?${parametros.toString()}`);
    const result = await res.json();
    if (!res.ok) throw new Error(result.detalle || result.error || `HTTP ${res.status}`);
    if (!Array.isArray(result.rows) || !Number.isFinite(Number(result.total))) {
      throw new Error("La respuesta de paginación del inventario no tiene el formato esperado.");
    }
    if (cargaActual !== solicitudCarga) return;
    inventarioData = result.rows;
    totalInventario = Number(result.total);
    actualizarVistaInventario();
    renderPaginacionInventario();
    if (reiniciarScrollTabla) {
      document.getElementById("inventario-table-wrap").scrollTop = 0;
    }
  } catch (error) {
    if (cargaActual === solicitudCarga) {
      estado.textContent = "Error";
      console.error("Error cargando inventario:", error);
      window.siteDialog.alert(error.message || "No se pudo cargar el inventario");
    }
  }
}

configurarEncabezadosOrdenables();
cargarInventario();

function renderInventarioTable(items) {
  const tableBody = document.getElementById("inventario-body");
  tableBody.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("tr");
    row.dataset.codigo = String(item.Codigo ?? '');
    const agregarCelda = (valor, clase = '') => {
      const celda = document.createElement('td');
      celda.className = clase;
      celda.textContent = valor === null || valor === undefined ? '' : String(valor);
      row.appendChild(celda);
    };
    const agregarCampo = (campo, etiqueta, valor) => {
      const celda = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'inventario-input inventario-input--modal';
      input.dataset.campo = campo;
      input.dataset.etiqueta = etiqueta;
      input.value = valor === null || valor === undefined ? '' : String(valor);
      input.readOnly = true;
      input.setAttribute('role', 'button');
      input.setAttribute('aria-label', `Actualizar ${etiqueta} de ${item.Producto || item.Codigo}`);
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          input.click();
        }
      });
      celda.appendChild(input);
      row.appendChild(celda);
    };

    agregarCelda(item.Codigo);
    agregarCelda(item.Producto);
    agregarCelda(item.UM);
    agregarCelda(item.StockF9);
    agregarCelda(item.Diferencia, obtenerClaseDiferencia(item.Diferencia));
    agregarCampo('CantidadFisica', 'Cantidad Física', item.CantidadFisica);
    agregarCampo('Ubicacion', 'Ubicación', item.Ubicacion);
    agregarCampo('Observacion', 'Observación', item.Observacion);
    if (puedeEliminarInventario) {
      const celda = document.createElement('td');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'inventario-delete-button';
      button.dataset.codigo = String(item.Codigo ?? '');
      button.setAttribute('aria-label', `Eliminar ${item.Producto || item.Codigo}`);
      button.textContent = 'Eliminar';
      celda.appendChild(button);
      row.appendChild(celda);
    }
    tableBody.appendChild(row);
  });
}

function obtenerClaseDiferencia(diferencia) {
  if (diferencia === null || diferencia === undefined || diferencia === "") return "";
  const valor = Number(diferencia);
  if (Number.isNaN(valor)) return "";
  if (valor < 0) return "inventario-diferencia--negativa";
  if (valor === 0) return "inventario-diferencia--cero";
  return "inventario-diferencia--positiva";
}

function actualizarVistaInventario() {
  renderInventarioTable(inventarioData);
  document.querySelectorAll(".inventario-sort").forEach(button => {
    const activa = button.dataset.sort === columnaOrden;
    button.closest("th").setAttribute("aria-sort", activa ? (direccionOrden === "asc" ? "ascending" : "descending") : "none");
    button.querySelector("span").textContent = activa ? (direccionOrden === "asc" ? "▲" : "▼") : "";
  });
}

function renderPaginacionInventario() {
  const totalPaginas = Math.ceil(totalInventario / LIMITE_POR_PAGINA);
  const estado = document.getElementById("inventario-page-status");
  const anterior = document.getElementById("inventario-prev");
  const siguiente = document.getElementById("inventario-next");
  estado.textContent = `${totalPaginas === 0 ? 0 : paginaActual + 1}/${totalPaginas}`;
  anterior.disabled = paginaActual === 0;
  siguiente.disabled = (paginaActual + 1) * LIMITE_POR_PAGINA >= totalInventario;
}

function capturarPosicionInventario() {
  return {
    x: window.scrollX,
    y: window.scrollY,
    tabla: document.getElementById("inventario-table-wrap").scrollTop
  };
}

function restaurarPosicionInventario(posicion) {
  const root = document.documentElement;
  const comportamientoAnterior = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  window.scrollTo(posicion.x, posicion.y);
  root.style.scrollBehavior = comportamientoAnterior;
  document.getElementById("inventario-table-wrap").scrollTop = posicion.tabla;
}

function configurarEncabezadosOrdenables() {
  const columnas = ["Codigo", "Producto", "UM", "StockF9", "Diferencia", "CantidadFisica", "Ubicacion", "Observacion"];
  document.querySelectorAll("#inventario-table th").forEach((th, indice) => {
    if (!columnas[indice]) return;
    const etiqueta = th.textContent.trim();
    const button = document.createElement("button");
    const icono = document.createElement("span");
    button.type = "button";
    button.className = "inventario-sort";
    button.dataset.sort = columnas[indice];
    button.append(document.createTextNode(`${etiqueta} `), icono);
    button.addEventListener("click", () => {
      const nuevaColumna = button.dataset.sort;
      direccionOrden = columnaOrden === nuevaColumna && direccionOrden === "asc" ? "desc" : "asc";
      columnaOrden = nuevaColumna;
      cargarInventario({ pagina: 0, reiniciarScrollTabla: true });
    });
    th.replaceChildren(button);
    th.setAttribute("scope", "col");
    th.setAttribute("aria-sort", "none");
  });
}

document.getElementById("inventario-search").addEventListener("input", event => {
  clearTimeout(temporizadorBusqueda);
  const busqueda = event.target.value;
  temporizadorBusqueda = setTimeout(() => cargarInventario({ busqueda, pagina: 0, reiniciarScrollTabla: true }), 300);
});

document.getElementById("inventario-prev").addEventListener("click", () => {
  if (paginaActual > 0) {
    document.getElementById("inventario-table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    cargarInventario({ pagina: paginaActual - 1, reiniciarScrollTabla: true });
  }
});
document.getElementById("inventario-next").addEventListener("click", () => {
  if ((paginaActual + 1) * LIMITE_POR_PAGINA < totalInventario) {
    document.getElementById("inventario-table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    cargarInventario({ pagina: paginaActual + 1, reiniciarScrollTabla: true });
  }
});

// Todos los campos editables se actualizan desde su modal.
document.getElementById("inventario-body").addEventListener("click", function (event) {
  const input = event.target.closest(".inventario-input--modal");
  if (!input) return;

  const row = input.closest("tr");
  const codigo = row.dataset.codigo;
  const campo = input.dataset.campo;
  const item = inventarioData.find(i => String(i.Codigo) === String(codigo));
  if (!item) return;

  posicionModalInventario = capturarPosicionInventario();
  controlInventarioActivo = input;
  filaEnEdicion = item;
  campoEnEdicion = campo;

  const etiqueta = input.dataset.etiqueta || campo;
  const esAjusteCantidad = campo === "CantidadFisica";
  document.getElementById("inventario-modal-title").textContent = esAjusteCantidad
    ? `Ajustar Cantidad Física (actual: ${item.CantidadFisica ?? 0})`
    : `Actualizar ${etiqueta}`;
  document.getElementById("inventario-modal-info").textContent = `${item.Codigo} - ${item.Producto}`;
  document.getElementById("inventario-modal-label").textContent = esAjusteCantidad
    ? "Cantidad a sumar o restar"
    : "Nuevo valor";
  const ayuda = document.getElementById("inventario-modal-help");
  ayuda.hidden = !esAjusteCantidad;
  document.getElementById("inventario-modal-input").value = esAjusteCantidad ? "" : (item[campo] ?? "");
  document.getElementById("inventario-modal-input").type = campo === "CantidadFisica" ? "number" : "text";
  document.getElementById("inventario-modal-input").step = campo === "CantidadFisica" ? "any" : "";

  const modal = document.getElementById("inventario-modal");
  modal.style.display = "flex";
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById("inventario-modal-input").focus({ preventScroll: true });
  restaurarPosicionInventario(posicionModalInventario);
});

document.getElementById('inventario-body').addEventListener('click', event => {
  const button = event.target.closest('.inventario-delete-button');
  if (!button || !puedeEliminarInventario) return;
  eliminarInventario(button.dataset.codigo, button);
});

async function eliminarInventario(codigo, button) {
  const item = inventarioData.find(row => String(row.Codigo) === String(codigo));
  const detalle = item ? `${item.Codigo} - ${item.Producto}` : codigo;
  const posicion = capturarPosicionInventario();
  const confirmado = await window.siteDialog.confirm(`¿Eliminar el registro ${detalle}? Esta acción no se puede deshacer.`);
  restaurarPosicionInventario(posicion);
  if (!confirmado) return;

  let masterPassword = await solicitarClaveMaestraInventario(detalle);
  restaurarPosicionInventario(posicion);
  if (masterPassword === null) return;

  button.disabled = true;
  try {
    const response = await API_FETCH(`/api/inventario/${encodeURIComponent(codigo)}`, {
      method: 'DELETE',
      headers: { 'X-Master-Password': masterPassword }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);

    const pagina = inventarioData.length === 1 && paginaActual > 0 ? paginaActual - 1 : paginaActual;
    await cargarInventario({ pagina });
    await window.siteDialog.alert(`Se eliminó el código ${codigo}.`);
  } catch (error) {
    console.error('Error eliminando inventario:', error);
    await window.siteDialog.alert(error.message || 'No se pudo eliminar el registro.');
  } finally {
    masterPassword = '';
    button.disabled = false;
    restaurarPosicionInventario(posicion);
  }
}

function solicitarClaveMaestraInventario(detalle) {
  const modal = document.getElementById('inventario-masterkey-dialog');
  const form = document.getElementById('inventario-masterkey-form');
  const input = document.getElementById('inventario-masterkey-input');
  const descripcion = document.getElementById('inventario-masterkey-description');
  const cancel = document.getElementById('inventario-masterkey-cancel');

  return new Promise(resolve => {
    const finish = value => {
      form.removeEventListener('submit', onSubmit);
      cancel.removeEventListener('click', onCancel);
      modal.removeEventListener('cancel', onDialogCancel);
      input.value = '';
      if (modal.open) modal.close();
      resolve(value);
    };
    const onSubmit = event => {
      event.preventDefault();
      finish(input.value);
    };
    const onCancel = () => finish(null);
    const onDialogCancel = event => {
      event.preventDefault();
      finish(null);
    };

    descripcion.textContent = `Ingresa la clave maestra para eliminar ${detalle}.`;
    input.value = '';
    form.addEventListener('submit', onSubmit);
    cancel.addEventListener('click', onCancel);
    modal.addEventListener('cancel', onDialogCancel);
    modal.showModal();
    input.focus();
  });
}

async function guardarCampo(codigo, campo, valor) {
  const body = campo === "CantidadFisica"
    ? { CantidadFisicaIncremento: valor }
    : { [campo]: valor };
  const res = await API_FETCH(`/api/inventario/${encodeURIComponent(codigo)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// Guardar cambio del modal
document.getElementById("inventario-modal-form").addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!filaEnEdicion || !campoEnEdicion) return;

  const nuevoValor = document.getElementById("inventario-modal-input").value.trim();
  if (nuevoValor === "") return;

  const botonGuardar = document.getElementById("inventario-modal-save");
  botonGuardar.disabled = true;
  try {
    const posicion = posicionModalInventario || capturarPosicionInventario();
    await guardarCampo(filaEnEdicion.Codigo, campoEnEdicion, nuevoValor);
    cerrarInventarioModal(false);
    await cargarInventario();
    restaurarPosicionInventario(posicion);
  } catch (error) {
    console.error("Error guardando inventario:", error);
    await window.siteDialog.alert(error.message || "No se pudo actualizar el dato");
  } finally {
    botonGuardar.disabled = false;
  }
});

// Cerrar modal con botón o clic afuera
document.getElementById("inventario-modal-close").addEventListener("click", cerrarInventarioModal);
document.getElementById("inventario-modal-cancel").addEventListener("click", cerrarInventarioModal);
document.getElementById("inventario-modal").addEventListener("click", function (event) {
  if (event.target === this) cerrarInventarioModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (document.getElementById('inventario-modal').style.display === 'flex') cerrarInventarioModal();
    if (document.getElementById('inventario-add-modal').style.display === 'flex') cerrarModalAdicional();
  }
});

function cerrarInventarioModal(restaurarPosicion = true) {
  const modal = document.getElementById("inventario-modal");
  modal.style.display = "none";
  modal.setAttribute('aria-hidden', 'true');
  filaEnEdicion = null;
  campoEnEdicion = null;
  controlInventarioActivo?.focus({ preventScroll: true });
  controlInventarioActivo = null;
  const posicion = posicionModalInventario;
  posicionModalInventario = null;
  if (restaurarPosicion && posicion) restaurarPosicionInventario(posicion);
}

async function obtenerSiguienteCodigoProvisional() {
  const response = await API_FETCH('/api/inventario', { cache: 'no-store' });
  const rows = await response.json();
  if (!response.ok) throw new Error(rows.error || `HTTP ${response.status}`);
  if (!Array.isArray(rows)) throw new Error('La respuesta del inventario no tiene el formato esperado.');

  const occupiedCodes = new Set(rows
    .map(row => Number(String(row.Codigo ?? '').trim()))
    .filter(code => Number.isSafeInteger(code) && code >= CODIGO_PROVISIONAL_INICIAL));
  let nextCode = CODIGO_PROVISIONAL_INICIAL;
  while (occupiedCodes.has(nextCode)) nextCode += 1;
  return String(nextCode);
}

const inventarioAddButton = document.getElementById('inventario-add-button');
const inventarioAddModal = document.getElementById('inventario-add-modal');
const inventarioAddForm = document.getElementById('inventario-add-form');
const inventarioAddCode = document.getElementById('inventario-add-code');
const inventarioAddProduct = document.getElementById('inventario-add-product');
const inventarioAddStatus = document.getElementById('inventario-add-status');
const inventarioAddSave = document.getElementById('inventario-add-save');

inventarioAddButton.hidden = !['editor', 'supervisor', 'administrador'].includes(localStorage.getItem('role'));
inventarioAddButton.addEventListener('click', async () => {
  inventarioAddForm.reset();
  document.getElementById('inventario-add-um').value = 'Unid';
  document.getElementById('inventario-add-stock').value = '0';
  inventarioAddStatus.textContent = '';
  inventarioAddSave.disabled = true;
  inventarioAddModal.style.display = 'flex';
  inventarioAddModal.setAttribute('aria-hidden', 'false');

  try {
    codigoPropuestoAdicional = await obtenerSiguienteCodigoProvisional();
    inventarioAddCode.value = codigoPropuestoAdicional;
    inventarioAddSave.disabled = false;
    inventarioAddProduct.focus({ preventScroll: true });
  } catch (error) {
    cerrarModalAdicional();
    await window.siteDialog.alert(error.message || 'No se pudo obtener el siguiente código provisional.');
  }
});

document.getElementById('inventario-add-close').addEventListener('click', cerrarModalAdicional);
document.getElementById('inventario-add-cancel').addEventListener('click', cerrarModalAdicional);
inventarioAddModal.addEventListener('click', event => {
  if (event.target === inventarioAddModal) cerrarModalAdicional();
});
inventarioAddForm.addEventListener('submit', async event => {
  event.preventDefault();
  const codigo = inventarioAddCode.value.trim();
  const producto = inventarioAddProduct.value.trim();
  const cantidadFisica = Number(document.getElementById('inventario-add-physical').value);
  if (!/^\d+$/.test(codigo) || !Number.isSafeInteger(Number(codigo))) {
    inventarioAddStatus.textContent = 'El código debe ser un entero válido.';
    inventarioAddCode.focus();
    return;
  }
  if (!producto) {
    inventarioAddStatus.textContent = 'El producto es obligatorio.';
    inventarioAddProduct.focus();
    return;
  }
  if (!Number.isFinite(cantidadFisica) || cantidadFisica < 0.01) {
    inventarioAddStatus.textContent = 'La cantidad física debe ser mayor que cero.';
    document.getElementById('inventario-add-physical').focus();
    return;
  }

  inventarioAddSave.disabled = true;
  inventarioAddStatus.textContent = '';
  try {
    const response = await API_FETCH('/api/inventario/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rows: [{
          Codigo: codigo,
          Producto: producto,
          UM: document.getElementById('inventario-add-um').value.trim(),
          Unidades: null,
          StockF9: 0,
          CantidadFisica: cantidadFisica,
          Ubicacion: document.getElementById('inventario-add-location').value.trim(),
          Observacion: document.getElementById('inventario-add-observation').value.trim()
        }]
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 409 && codigo === codigoPropuestoAdicional) {
        codigoPropuestoAdicional = await obtenerSiguienteCodigoProvisional();
        inventarioAddCode.value = codigoPropuestoAdicional;
        inventarioAddStatus.textContent = `Ese código acaba de ocuparse. Se asignó ${codigoPropuestoAdicional}; revise y vuelva a guardar.`;
        inventarioAddCode.focus();
        return;
      }
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    cerrarModalAdicional();
    const search = document.getElementById('inventario-search');
    search.value = codigo;
    await cargarInventario({ busqueda: codigo, pagina: 0 });
    await window.siteDialog.alert(`Adicional agregado con el código ${codigo}.`);
  } catch (error) {
    console.error('Error agregando adicional al inventario:', error);
    inventarioAddStatus.textContent = error.message || 'No se pudo guardar el adicional.';
  } finally {
    inventarioAddSave.disabled = false;
  }
});

function cerrarModalAdicional() {
  inventarioAddModal.style.display = 'none';
  inventarioAddModal.setAttribute('aria-hidden', 'true');
  codigoPropuestoAdicional = '';
  inventarioAddButton.focus({ preventScroll: true });
}
