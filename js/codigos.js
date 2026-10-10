let data = [];
const LIMITE_POR_PAGINA = 120;
let paginaActual = 0;
let resultados = [];

const cargaProductos = document.getElementById("codigos-admin-actions");
if (cargaProductos && localStorage.getItem("role") === "administrador") {
  cargaProductos.hidden = false;
}

async function cargarProductos() {
  try {
    const response = await API_FETCH('/api/productos');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    data = await response.json();
    actualizarVista();
  } catch (error) {
    console.error("Error cargando productos:", error);
    const tableBody = document.getElementById("codigos-body");
    tableBody.innerHTML = '<tr><td colspan="4">No se pudieron cargar los productos.</td></tr>';
  }
}

// Renderizar tabla
function renderTable(filteredData) {
  const tableBody = document.getElementById("codigos-body");
  tableBody.innerHTML = "";

  filteredData.forEach(item => {
    const row = document.createElement("tr");
    const descripcion = item["Descripción"] ?? item.descripcion;
    [item.codigo, descripcion, item.unidad_medida, item.precio_compra].forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor === null || valor === undefined ? '' : String(valor);
      row.appendChild(celda);
    });
    tableBody.appendChild(row);
  });
}

function actualizarVista() {
  const search = document.getElementById("codigos-search").value;
  resultados = data.filter(item => SEARCH_UTILS.matches(
    search,
    item.codigo,
    item["Descripción"] ?? item.descripcion,
    item.unidad_medida
  ));

  const totalPaginas = Math.ceil(resultados.length / LIMITE_POR_PAGINA);
  if (paginaActual >= totalPaginas) paginaActual = Math.max(0, totalPaginas - 1);
  const inicio = paginaActual * LIMITE_POR_PAGINA;
  renderTable(resultados.slice(inicio, inicio + LIMITE_POR_PAGINA));
  document.getElementById("codigos-table-wrap").scrollTop = 0;

  document.getElementById("codigos-page-status").textContent =
    `${totalPaginas === 0 ? 0 : paginaActual + 1}/${totalPaginas}`;
  document.getElementById("codigos-prev").disabled = paginaActual === 0;
  document.getElementById("codigos-next").disabled =
    (paginaActual + 1) * LIMITE_POR_PAGINA >= resultados.length;
}

document.getElementById("codigos-search").addEventListener("input", () => {
  paginaActual = 0;
  actualizarVista();
});
document.getElementById("codigos-prev").addEventListener("click", () => {
  if (paginaActual > 0) {
    paginaActual -= 1;
    actualizarVista();
  }
});
document.getElementById("codigos-next").addEventListener("click", () => {
  if ((paginaActual + 1) * LIMITE_POR_PAGINA < resultados.length) {
    paginaActual += 1;
    actualizarVista();
  }
});

cargarProductos();
