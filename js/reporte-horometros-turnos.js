/* Reporte: horas trabajadas por turno */
(function () {
  const ENDPOINT = "/api/reportes/horometros/turnos";

  const machines = [
    ["pantografo_gs4000","Pantógrafo GS4000"],["procesador_placas_kaltenbach","Procesador placas Kaltenbach"],
    ["pantografo_promax200","Pantógrafo Promax200"],["perforadora_calfran","Perforadora Calfran"],
    ["punteadora_hg1500","Punteadora HG1500"],["arco_sumergido_cabezal_1s","Arco sumergido cabezal 1S"],
    ["arco_sumergido_cabezal_2n","Arco sumergido cabezal 2N"],["calibradora_perfiles_h","Calibradora perfiles H"],
    ["sierra_taladro_kaltenbach","Sierra-taladro Kaltenbach"],["sierra_taladro_ficep","Sierra-taladro Ficep"],
    ["roscadora_rosquinel","Roscadora Rosquinel"],["granalladora_automatica_kaltenbach","Granalladora automática Kaltenbach"],
    ["granalladora_manual","Granalladora manual"],["cizalla_punzonadora_angulos_ficep","Cizalla-punzonadora ángulos Ficep"],
    ["cizalla_punzonadora_geka_hydracrop80","Geka Hydracrop 80"],["cizalla_punzonadora_geka_microcrop36","Geka Microcrop 36"],
    ["plegadora_newton","Plegadora Newton"],["plegadora_ermarksan","Plegadora Ermarksan"],
    ["guillotina_newton","Guillotina Newton"],["guillotina_ermarksan","Guillotina Ermarksan"],
    ["guillotina_feysama","Guillotina Feysama"],["plegadora_feysama","Plegadora Feysama"]
  ];

  const columns = [
    {key:"dia_registro",label:"Fecha",format:v=>ReportUtils.formatDateOnly(v)},
    {key:"turno",label:"Turno"},
    ...machines.map(([key, label]) => ({
      key,
      label,
      number: true,
      format: value => Number(value || 0).toFixed(2)
    }))
  ];

  function n(v) {
    if (v === null || v === undefined || v === "") return 0;
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function readingDate(row) {
    const value = String(row.dia_registro || "");
    const match = value.match(/^(\d{4})[-/](\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, "0")}`;
    const parsed = new Date(String(row.fecha_envio || "").replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return "";
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
  }

  function turnLabel(value) {
    const turn = String(value || "").toLowerCase();
    if (turn.includes("tarde")) return "Diurno";
    if (turn.includes("mañana") || turn.includes("manana")) return "Nocturno";
    return value || "Sin turno";
  }

  function transform(rows) {
    const sorted = [...rows].sort((a,b) => {
      const da = String(a.dia_registro || "") + " " + String(a.fecha_envio || "");
      const db = String(b.dia_registro || "") + " " + String(b.fecha_envio || "");
      return da.localeCompare(db) || n(a.id)-n(b.id);
    });

    const out = [];
    const previousReadings = {};
    for (const r of sorted) {
      const reportRow = {
        dia_registro: r.dia_registro,
        turno: turnLabel(r.turno_registro)
      };
      for (const [key] of machines) {
        const current = n(r[key]);
        const previous = previousReadings[key];
        reportRow[key] = (current === 0 || previous === undefined || previous === 0)
          ? 0
          : Math.max(0, current - previous);
        previousReadings[key] = current;
      }
      out.push(reportRow);
    }
    const month = document.getElementById("filtroMes").value;
    const year = document.getElementById("filtroAnio").value;
    return out.filter(row => readingDate(row) === `${year}-${month}`);
  }

  function setupFilters(refresh) {
    const monthSelect = document.getElementById("filtroMes");
    const yearSelect = document.getElementById("filtroAnio");
    const current = new Date();
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthSelect.innerHTML = months.map((month, index) => `<option value="${String(index + 1).padStart(2, "0")}">${month}</option>`).join("");
    for (let year = current.getFullYear() - 5; year <= current.getFullYear() + 1; year += 1) {
      yearSelect.add(new Option(String(year), String(year)));
    }
    monthSelect.value = String(current.getMonth() + 1).padStart(2, "0");
    yearSelect.value = String(current.getFullYear());
    monthSelect.addEventListener("change", refresh);
    yearSelect.addEventListener("change", refresh);
  }

  function filterRows(rows) {
    return rows;
  }

  const s=document.createElement("script"); s.src="../js/reporte-utils.js";
  s.onload=()=>ReportUtils.init({endpoint:ENDPOINT,columns,transform,filterRows,setupFilters,showTotals:true});
  document.head.appendChild(s);
})();
