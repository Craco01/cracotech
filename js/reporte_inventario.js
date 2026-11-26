/* ==========================================================
   Reporte de Inventario - Listado para Inventario
   Obtiene los datos mediante GET a un endpoint que expone
  la tabla "Inventario" (Codigo, Producto, UM, StockF9,
  CantidadFisica, Diferencia, Ubicacion, Observacion)
   y arma la tabla imprimible con el formato del PDF original.
   ========================================================== */

const DEFAULT_ENDPOINT = "/api/inventario";
const FILAS_POR_PAGINA = 35;
const CODIGO_PROVISIONAL_INICIAL = 33000;

document.addEventListener("DOMContentLoaded", () => {
  pintarFechaHora();

  const btnImprimir = document.getElementById("btnImprimir");

  btnImprimir.addEventListener("click", () => {
    window.print();
  });

  // Carga automática al abrir la página
  cargarInventario(DEFAULT_ENDPOINT);
});

function pintarFechaHora() {
  const ahora = new Date();
  document.getElementById("fechaHora").textContent = formatearFechaHora(ahora);
  document.getElementById("fechaCorta").textContent = formatearFecha(ahora);
}

function formatearFechaHora(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatearFecha(d) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/* ---------- Carga de datos vía GET ---------- */

async function cargarInventario(endpoint) {
  const estadoEl = document.getElementById("estado");
  estadoEl.textContent = "Cargando datos...";
  estadoEl.classList.remove("error");

  try {
    const respuesta = await API_FETCH(endpoint, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    const filas = ordenarAdicionalesAlFinal(normalizarFilas(datos));
    renderizarTabla(filas);
    actualizarContadorPaginas(filas.length);
    estadoEl.textContent = `Datos cargados: ${filas.length} línea(s).`;
  } catch (error) {
    estadoEl.textContent = `No se pudieron cargar los datos (${error.message}). Verifique el endpoint GET.`;
    estadoEl.classList.add("error");
    console.error("Error al cargar inventario:", error);
  }
}

function ordenarAdicionalesAlFinal(filas) {
  const inventarioCargado = [];
  const adicionales = [];

  filas.forEach(fila => {
    const codigo = Number(String(fila.codigo).trim());
    if (Number.isSafeInteger(codigo) && codigo >= CODIGO_PROVISIONAL_INICIAL) {
      adicionales.push(fila);
    } else {
      inventarioCargado.push(fila);
    }
  });

  return [...inventarioCargado, ...adicionales];
}

/**
 * Acepta tanto un array plano de filas como un objeto { data: [...] }
 * y normaliza los nombres de columna esperados desde la tabla SQL:
 * Codigo, Producto, UM, StockF9, CantidadFisica, Diferencia, Ubicacion
 */
function normalizarFilas(datos) {
  const lista = Array.isArray(datos) ? datos : (datos.data || datos.rows || []);

  return lista.map((item) => ({
    codigo: item.Codigo ?? item.codigo ?? "",
    producto: item.Producto ?? item.producto ?? item.Descripcion ?? "",
    um: item.UM ?? item.um ?? "",
    ubicacion: item.Ubicacion ?? item.ubicacion ?? "",
    stockF9: toNumeroOpcional(item.StockF9 ?? item.stockF9 ?? item.Stock ?? item.stock),
    cantidadFisica: item.CantidadFisica ?? item.cantidadFisica ?? null,
    diferencia: toNumeroOpcional(item.Diferencia ?? item.diferencia),
    observacion: item.Observacion ?? item.observacion ?? ""
  }));
}

function toNumero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function toNumeroOpcional(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/* ---------- Render de la tabla ---------- */

function renderizarTabla(filas) {
  const cuerpo = document.getElementById("cuerpoTabla");
  cuerpo.innerHTML = "";

  if (!filas.length) {
    cuerpo.innerHTML = `<tr><td colspan="8" class="sin-datos">No hay registros para mostrar.</td></tr>`;
    actualizarTotales(0, 0, 0, 0);
    return;
  }

  let totalStock = 0;
  let totalFisica = 0;
  let totalDiferencia = 0;

  const fragment = document.createDocumentFragment();

  filas.forEach((fila, indice) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(fila.codigo)}</td>
      <td>${escapeHtml(fila.producto)}</td>
      <td>${escapeHtml(fila.um)}</td>
      <td>${escapeHtml(fila.ubicacion)}</td>
      <td>${formatearNumero(fila.stockF9)}</td>
      <td class="celda-f9">${
        fila.cantidadFisica !== null && fila.cantidadFisica !== undefined
          ? formatearNumero(toNumero(fila.cantidadFisica))
          : ""
      }</td>
      <td>${formatearNumero(fila.diferencia)}</td>
      <td>${escapeHtml(fila.observacion)}</td>
    `;
    fragment.appendChild(tr);

    totalStock += fila.stockF9;
    if (fila.cantidadFisica !== null && fila.cantidadFisica !== undefined) {
      totalFisica += toNumero(fila.cantidadFisica);
    }
    if (fila.diferencia !== null) totalDiferencia += fila.diferencia;
  });

  cuerpo.appendChild(fragment);
  actualizarTotales(totalStock, totalFisica, totalDiferencia, filas.length);
}

function actualizarTotales(totalStock, totalFisica, totalDiferencia, lineas) {
  document.getElementById("totalStock").textContent = formatearNumero(totalStock);
  document.getElementById("totalFisica").textContent = formatearNumero(totalFisica);
  document.getElementById("totalDiferencia").textContent = formatearNumero(totalDiferencia);

  document.getElementById("totalStockResumen").textContent = formatearNumero(totalStock);
  document.getElementById("totalLineas").textContent = String(lineas);
}

function actualizarContadorPaginas(totalFilas) {
  const totalPaginas = Math.max(1, Math.ceil(totalFilas / FILAS_POR_PAGINA));
  document.getElementById("paginaActual").textContent = "1";
  document.getElementById("totalPaginas").textContent = String(totalPaginas);
}

/* ---------- Utilidades ---------- */

function formatearNumero(n) {
  if (n === null || n === undefined || n === "") return "";
  const numero = Number(n);
  if (!Number.isFinite(numero)) return "";
  return numero.toLocaleString("es-ES", { maximumFractionDigits: 3 });
}

function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}
