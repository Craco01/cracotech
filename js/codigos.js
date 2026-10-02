let data = [];

async function cargarProductos() {
  try {
    const response = await API_FETCH('/api/productos');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    data = await response.json();
    renderTable(data);
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

// Filtrar datos dinámicamente
document.getElementById("codigos-search").addEventListener("input", function () {
  let searchValue = this.value.toLowerCase().trim();

  // Elimina % y divide en palabras
  let terms = searchValue.replace(/%/g, " ").split(/\s+/).filter(Boolean);

  const filtered = data.filter(item => {
    const codigo = String(item.codigo).toLowerCase();
    const descripcion = String(item["Descripción"] ?? item.descripcion).toLowerCase();
    const unidad = String(item.unidad_medida ?? '').toLowerCase();

    return terms.every(term =>
      codigo.includes(term) || descripcion.includes(term) || unidad.includes(term)
    );
  });

  renderTable(filtered);
});

cargarProductos();
