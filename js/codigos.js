let data = [];

// Usa la copia local cuando la página se abre con file://; por HTTP conserva el JSON como fuente.
const dataPromise = Array.isArray(window.codigosData)
  ? Promise.resolve(window.codigosData)
  : fetch("../data/codigos.json").then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    });

dataPromise
  .then(jsonData => {
    data = jsonData;
    renderTable(data);
  })
  .catch(error => console.error("Error cargando JSON:", error));

// Renderizar tabla
function renderTable(filteredData) {
  const tableBody = document.getElementById("codigos-body");
  tableBody.innerHTML = "";

  filteredData.forEach(item => {
    const row = document.createElement("tr");
    const descripcion = item["Descripción"] ?? item.descripcion;
    row.innerHTML = `
      <td>${item.codigo}</td>
      <td>${descripcion}</td>
    `;
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

    return terms.every(term =>
      codigo.includes(term) || descripcion.includes(term)
    );
  });

  renderTable(filtered);
});
