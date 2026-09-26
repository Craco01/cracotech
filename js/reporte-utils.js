
/* Utilidades comunes de reportes */
(function () {
  window.ReportUtils = {
    getApiBase: function () {
      return (window.API_BASE || (typeof API_BASE_URL !== "undefined" ? API_BASE_URL : "")).replace(/\/$/, "");
    },
    async getJson(url) {
      const token = localStorage.getItem("token");
      const headers = { "Accept": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    },
    normalizeRows(data) {
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.rows)) return data.rows;
      if (Array.isArray(data.result)) return data.result;
      return [];
    },
    setStatus(text, error=false) {
      const el = document.getElementById("estado");
      el.textContent = text;
      el.classList.toggle("error", error);
    },
    formatDate(value) {
      if (!value) return "";
      const d = new Date(String(value).replace(" ", "T"));
      if (Number.isNaN(d.getTime())) return value;
      return d.toLocaleString("es-PY");
    },
    formatDateOnly(value) {
      if (!value) return "";
      const text = String(value);
      const match = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
      if (match) return `${match[3].padStart(2, "0")}/${match[2].padStart(2, "0")}/${match[1]}`;
      const d = new Date(text.replace(" ", "T"));
      if (Number.isNaN(d.getTime())) return value;
      return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    },
    renderTable(rows, columns, sortState, showTotals = false) {
      const table = document.getElementById("tablaReporte");
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");
      const empty = document.getElementById("vacio");
      table.querySelector("tfoot")?.remove();
      thead.innerHTML = "<tr>" + columns.map(c => {
        const active = sortState.key === c.key;
        const direction = active && sortState.direction === "asc" ? "desc" : "asc";
        const indicator = active ? (sortState.direction === "asc" ? " ▲" : " ▼") : "";
        return `<th scope="col"><button type="button" data-sort-key="${c.key}" aria-label="Ordenar por ${c.label} en orden ${direction === "asc" ? "ascendente" : "descendente"}">${c.label}${indicator}</button></th>`;
      }).join("") + "</tr>";
      tbody.innerHTML = "";
      if (!rows.length) { empty.hidden = false; return; }
      empty.hidden = true;
      for (const row of rows) {
        const tr = document.createElement("tr");
        for (const c of columns) {
          const td = document.createElement("td");
          if (c.number) td.className = "number";
          const value = c.format ? c.format(row[c.key], row) : (row[c.key] ?? "");
          td.textContent = value;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      if (showTotals) {
        const totals = columns.map((column, index) => {
          if (!column.number) return index === 0 ? "Total" : "";
          return rows.reduce((sum, row) => sum + (Number(row[column.key]) || 0), 0).toFixed(2);
        });
        const tfoot = document.createElement("tfoot");
        const totalRow = document.createElement("tr");
        for (const [index, value] of totals.entries()) {
          const td = document.createElement("td");
          if (columns[index].number) td.className = "number";
          td.textContent = value;
          totalRow.appendChild(td);
        }
        tfoot.appendChild(totalRow);
        table.appendChild(tfoot);
      }
    },
    async init({endpoint, columns, transform, filterRows, setupFilters, showTotals = false}) {
      const sortState = { key: columns[0]?.key || "", direction: "asc" };
      let rows = [];
      let sourceRows = [];
      const sortRows = () => [...rows].sort((left, right) => {
        const a = left[sortState.key];
        const b = right[sortState.key];
        if (a === b) return 0;
        if (a === null || a === undefined || a === "") return 1;
        if (b === null || b === undefined || b === "") return -1;
        const comparison = typeof a === "number" && typeof b === "number"
          ? a - b
          : String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
        return sortState.direction === "asc" ? comparison : -comparison;
      });
      const load = async () => {
        try {
          this.setStatus("Cargando...");
          const base = this.getApiBase();
          const data = await this.getJson(`${base}${endpoint}`);
          sourceRows = this.normalizeRows(data);
          const filteredRows = filterRows ? filterRows(sourceRows) : sourceRows;
          rows = transform ? transform(filteredRows) : filteredRows;
          this.renderTable(sortRows(), columns, sortState, showTotals);
          this.setStatus(`${rows.length} registro(s)`);
        } catch (err) {
          console.error(err);
          this.setStatus(`No se pudieron cargar los datos: ${err.message}`, true);
        }
      };
      document.getElementById("tablaReporte").addEventListener("click", (event) => {
        const button = event.target.closest("button[data-sort-key]");
        if (!button) return;
        const key = button.dataset.sortKey;
        if (sortState.key === key) sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
        else { sortState.key = key; sortState.direction = "asc"; }
        this.renderTable(sortRows(), columns, sortState, showTotals);
      });
      if (setupFilters) setupFilters(() => {
        const filteredRows = filterRows ? filterRows(sourceRows) : sourceRows;
        rows = transform ? transform(filteredRows) : filteredRows;
        this.renderTable(sortRows(), columns, sortState, showTotals);
        this.setStatus(`${rows.length} registro(s)`);
      });
      await load();
    }
  };
})();
