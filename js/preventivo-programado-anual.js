const semanasAnuales = 52;
const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

function obtenerFechaSemana(anio, semana) {
  return new Date(anio, 0, 1 + (semana - 1) * 7);
}

function rangoSemana(fechaInicio) {
  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaFin.getDate() + 6);
  return `${fechaInicio.toLocaleDateString('es-AR')} - ${fechaFin.toLocaleDateString('es-AR')}`;
}

function generarEncabezadoAnual(anio) {
  const thead = document.querySelector("#calendarioAnual thead");
  let gruposMeses = [];

  for (let semana = 1; semana <= semanasAnuales; semana++) {
    const fechaSemana = obtenerFechaSemana(anio, semana);
    fechaSemana.setDate(fechaSemana.getDate() + 3);
    const mes = fechaSemana.getMonth();
    const grupoActual = gruposMeses[gruposMeses.length - 1];

    if (grupoActual && grupoActual.mes === mes) {
      grupoActual.semanas++;
    } else {
      gruposMeses.push({ mes, semanas: 1 });
    }
  }

  const encabezadoMeses = gruposMeses
    .map(grupo => `<th colspan="${grupo.semanas}">${nombresMeses[grupo.mes]}</th>`)
    .join('');
  const encabezadoSemanas = Array.from(
    { length: semanasAnuales },
    (_, indice) => {
      const fechaSemana = obtenerFechaSemana(anio, indice + 1);
      return `<th title="${rangoSemana(fechaSemana)}">${indice + 1}</th>`;
    }
  ).join('');

  thead.innerHTML = `<tr>
    <th rowspan="2">Ítem</th>
    <th rowspan="2">Máquina</th>
    <th rowspan="2">Sector</th>
    ${encabezadoMeses}
  </tr><tr>${encabezadoSemanas}</tr>`;
}

function obtenerFecha(fecha) {
  if (!fecha) return null;

  const texto = String(fecha).trim();
  const iso = texto.slice(0, 10);
  const matchIso = /^\d{4}-\d{2}-\d{2}$/.exec(iso);
  const matchLocal = /^\d{2}\/\d{2}\/\d{4}$/.exec(texto);

  let anio, mes, dia;

  if (matchIso) {
    [anio, mes, dia] = iso.split('-').map(Number);
  } else if (matchLocal) {
    [dia, mes, anio] = texto.split('/').map(Number);
  } else {
    const fechaParseada = new Date(texto);
    if (Number.isNaN(fechaParseada.getTime())) return null;
    return new Date(fechaParseada.getFullYear(), fechaParseada.getMonth(), fechaParseada.getDate());
  }

  if (!anio || !mes || !dia) return null;
  const fechaParseada = new Date(anio, mes - 1, dia);
  return Number.isNaN(fechaParseada.getTime()) ? null : fechaParseada;
}

function obtenerSemana(fecha, anio) {
  const inicioAnio = new Date(anio, 0, 1);
  return Math.floor((fecha - inicioAnio) / 86400000 / 7) + 1;
}

function obtenerEstadoMantenimiento(mantenimiento) {
  const inicio = obtenerFecha(mantenimiento.fecha_inicio);
  const fin = obtenerFecha(mantenimiento.fecha_final);
  const reprogInicio = obtenerFecha(mantenimiento.reprogramacion_inicio);
  const reprogFin = obtenerFecha(mantenimiento.reprogramacion_final);
  const ejecInicio = obtenerFecha(mantenimiento.fecha_ejecucion_inicio);
  const ejecFin = obtenerFecha(mantenimiento.fecha_ejecucion_final);
  const hoy = new Date();

  if (!inicio) return "";

  // Reprogramado: pendiente de ejecución siempre amarillo, sin esperar a que llegue la fecha.
  if (reprogInicio) {
    if (ejecInicio || ejecFin) return "reprogramadoEjecucion";
    if (reprogFin && hoy > reprogFin) return "vencidoReprog";
    return "reprogramado";
  }

  if (ejecInicio || ejecFin) return "completado";
  if (fin && hoy > fin) return "vencido";
  return "programado";
}

function obtenerClaseSemana(mantenimiento, semana, anio) {
  const inicio = obtenerFecha(mantenimiento.fecha_inicio);
  const fin = obtenerFecha(mantenimiento.fecha_final);
  const reprogInicio = obtenerFecha(mantenimiento.reprogramacion_inicio);
  const reprogFin = obtenerFecha(mantenimiento.reprogramacion_final);

  if (!inicio) return "";

  const semanaInicio = obtenerSemana(inicio, anio);
  const semanaReprogInicio = reprogInicio ? obtenerSemana(reprogInicio, anio) : null;
  const semanaReprogFin = reprogFin ? obtenerSemana(reprogFin, anio) : semanaReprogInicio;

  if (semana === semanaInicio) {
    if (reprogInicio) return 'reemplazado';
  }

  if (semanaReprogInicio !== null && semana === semanaReprogInicio) {
    const estado = obtenerEstadoMantenimiento(mantenimiento);
    if (estado === 'vencidoReprog') return 'vencidoReprog';
    if (estado === 'reprogramado') return 'reprogramado';
    if (estado === 'reprogramadoEjecucion') return 'reprogramadoEjecucion';
  }

  if (semana !== semanaInicio) return "";

  const estado = obtenerEstadoMantenimiento(mantenimiento);
  if (estado === 'vencido') return 'vencido';
  if (estado === 'completado') return 'completado';
  if (estado === 'programado') return 'programado';
  return "";
}

function generarCalendarioAnual(mantenimientos, anio) {
  generarEncabezadoAnual(anio);
  const tbody = document.querySelector("#calendarioAnual tbody");
  tbody.innerHTML = "";

  mantenimientos.forEach((m, index) => {
    let fila = `<tr>
      <td>${index + 1}</td>
      <td>${m.maquina_equipo}</td>
      <td>${m.sector || "-"}</td>`;

    for (let semana = 1; semana <= semanasAnuales; semana++) {
      const clase = obtenerClaseSemana(m, semana, anio);
      fila += `<td class="${clase}" title="Semana ${semana}"></td>`;
    }

    fila += "</tr>";
    tbody.innerHTML += fila;
  });
}

API_FETCH('/api/mantenimientos-preventivos')
  .then(res => {
    if (!res.ok) return [];
    return res.json();
  })
  .then(data => generarCalendarioAnual(data, new Date().getFullYear()))
  .catch(err => console.error("Error cargando JSON:", err));
