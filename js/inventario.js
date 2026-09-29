let inventarioData = [];
let filaEnEdicion = null;
let campoEnEdicion = null;
let columnaOrden = null;
let direccionOrden = "asc";
const columnasNumericas = new Set(["StockF9", "CantidadFisica", "Diferencia"]);
const collatorInventario = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

async function cargarInventario() {
  try {
    const res = await API_FETCH("/api/inventario");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    inventarioData = await res.json();
    actualizarVistaInventario();
  } catch (error) {
    console.error("Error cargando inventario:", error);
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
    tableBody.appendChild(row);
  });
}

// Filtrar datos dinámicamente
function obtenerInventarioVisible() {
  const searchValue = document.getElementById("inventario-search").value.toLowerCase().trim();
  const terms = searchValue.replace(/%/g, " ").split(/\s+/).filter(Boolean);

  const filtered = inventarioData.filter(item => {
    const codigo = String(item.Codigo).toLowerCase();
    const producto = String(item.Producto).toLowerCase();

    return terms.every(term =>
      codigo.includes(term) || producto.includes(term)
    );
  });

  if (!columnaOrden) return filtered;
  return [...filtered].sort((a, b) => {
    const valorA = a[columnaOrden];
    const valorB = b[columnaOrden];
    if (valorA == null && valorB == null) return 0;
    if (valorA == null) return 1;
    if (valorB == null) return -1;
    const comparacion = columnasNumericas.has(columnaOrden)
      ? Number(valorA) - Number(valorB)
      : collatorInventario.compare(String(valorA), String(valorB));
    return direccionOrden === "asc" ? comparacion : -comparacion;
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
  renderInventarioTable(obtenerInventarioVisible());
  document.querySelectorAll(".inventario-sort").forEach(button => {
    const activa = button.dataset.sort === columnaOrden;
    button.closest("th").setAttribute("aria-sort", activa ? (direccionOrden === "asc" ? "ascending" : "descending") : "none");
    button.querySelector("span").textContent = activa ? (direccionOrden === "asc" ? "▲" : "▼") : "";
  });
}

function configurarEncabezadosOrdenables() {
  const columnas = ["Codigo", "Producto", "UM", "StockF9", "Diferencia", "CantidadFisica", "Ubicacion", "Observacion"];
  document.querySelectorAll("#inventario-table th").forEach((th, indice) => {
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
      actualizarVistaInventario();
    });
    th.replaceChildren(button);
    th.setAttribute("scope", "col");
    th.setAttribute("aria-sort", "none");
  });
}

document.getElementById("inventario-search").addEventListener("input", actualizarVistaInventario);

// Todos los campos editables se actualizan desde su modal.
document.getElementById("inventario-body").addEventListener("click", function (event) {
  const input = event.target.closest(".inventario-input--modal");
  if (!input) return;

  const row = input.closest("tr");
  const codigo = row.dataset.codigo;
  const campo = input.dataset.campo;
  const item = inventarioData.find(i => String(i.Codigo) === String(codigo));
  if (!item) return;

  filaEnEdicion = item;
  campoEnEdicion = campo;

  const etiqueta = input.dataset.etiqueta || campo;
  document.getElementById("inventario-modal-title").textContent = `Actualizar ${etiqueta}`;
  document.getElementById("inventario-modal-info").textContent = `${item.Codigo} - ${item.Producto}`;
  document.getElementById("inventario-modal-input").value = item[campo] ?? "";
  document.getElementById("inventario-modal-input").type = campo === "CantidadFisica" ? "number" : "text";
  document.getElementById("inventario-modal-input").step = campo === "CantidadFisica" ? "any" : "";

  document.getElementById("inventario-modal").style.display = "flex";
  document.getElementById("inventario-modal-input").focus();
});

async function guardarCampo(codigo, campo, valor) {
  const res = await API_FETCH(`/api/inventario/${encodeURIComponent(codigo)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [campo]: valor })
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
    const actualizado = await guardarCampo(filaEnEdicion.Codigo, campoEnEdicion, nuevoValor);
    Object.assign(filaEnEdicion, actualizado);
    actualizarVistaInventario();

    cerrarInventarioModal();
  } catch (error) {
    console.error("Error guardando inventario:", error);
    alert(error.message || "No se pudo actualizar el dato");
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

function cerrarInventarioModal() {
  document.getElementById("inventario-modal").style.display = "none";
  filaEnEdicion = null;
  campoEnEdicion = null;
}
