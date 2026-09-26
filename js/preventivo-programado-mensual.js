function parseFechaLocal(valor) {
  if (!valor) return null;

  const texto = String(valor).trim();
  const fechaCorta = texto.slice(0, 10);
  const matchIso = /^\d{4}-\d{2}-\d{2}$/.exec(fechaCorta);
  const matchLocal = /^\d{2}\/\d{2}\/\d{4}$/.exec(texto);

  if (matchIso) {
    const [anio, mes, dia] = fechaCorta.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  if (matchLocal) {
    const [dia, mes, anio] = texto.split('/').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  const fechaParseada = new Date(texto);
  if (Number.isNaN(fechaParseada.getTime())) return null;
  return new Date(fechaParseada.getFullYear(), fechaParseada.getMonth(), fechaParseada.getDate());
}

function formatearFechaISO(date) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function agregarRangoDeFechas(fechaInicial, fechaFinal, conjunto) {
  const inicio = parseFechaLocal(fechaInicial);
  if (!inicio) return;

  const fin = parseFechaLocal(fechaFinal) || inicio;
  const cursor = new Date(inicio);

  while (cursor <= fin) {
    conjunto.add(formatearFechaISO(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
}

function obtenerEstadoMantenimientoMensual(mantenimiento, fechaISO) {
  const fecha = fechaISO ? parseFechaLocal(fechaISO) : null;
  const inicio = parseFechaLocal(mantenimiento.fecha_inicio);
  const fin = parseFechaLocal(mantenimiento.fecha_final) || inicio;
  const reprogInicio = parseFechaLocal(mantenimiento.reprogramacion_inicio);
  const reprogFin = parseFechaLocal(mantenimiento.reprogramacion_final) || reprogInicio;
  const ejecInicio = parseFechaLocal(mantenimiento.fecha_ejecucion_inicio);
  const ejecFin = parseFechaLocal(mantenimiento.fecha_ejecucion_final) || ejecInicio;
  const hoy = new Date();

  if (!inicio) return '';

  // La fecha original queda gris cuando el mantenimiento fue reprogramado.
  const enRangoOriginal = fecha && fecha >= inicio && fecha <= fin;
  if (reprogInicio && enRangoOriginal) return 'reemplazado';

  // Reprogramado: pendiente de ejecución siempre amarillo, sin esperar a que llegue la fecha.
  if (reprogInicio) {
    if (ejecInicio || ejecFin) return 'reprogramadoEjecucion';
    if (reprogFin && hoy > reprogFin) return 'vencidoReprog';
    return 'reprogramado';
  }

  if (ejecInicio || ejecFin) return 'completado';
  if (fin && hoy > fin) return 'vencido';
  return 'programado';
}

function prioridadEstado(estado) {
  const prioridades = {
    vencidoReprog: 8,
    vencido: 7,
    reprogramadoEjecucion: 6,
    reprogramado: 5,
    reemplazado: 4,
    completado: 3,
    programado: 2,
    '': 0
  };
  return prioridades[estado] || 0;
}

function generarCalendarioMensual(mantenimientos, mes, anio) {
  const diasMes = new Date(anio, mes, 0).getDate();
  const primerDia = new Date(anio, mes - 1, 1);
  const primerDiaSemana = (primerDia.getDay() + 6) % 7;

  let html = '<table><caption>Calendario ' + mes + '/' + anio + '</caption><tr>';
  const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  diasSemana.forEach(d => html += `<th>${d}</th>`);
  html += '</tr><tr>';

  for (let i = 0; i < primerDiaSemana; i++) {
    html += '<td></td>';
  }

  const fechasConEventos = new Map();

  mantenimientos.forEach(m => {
    const fechas = new Set();
    agregarRangoDeFechas(m.fecha_inicio, m.fecha_final, fechas);
    agregarRangoDeFechas(m.reprogramacion_inicio, m.reprogramacion_final, fechas);

    fechas.forEach(fecha => {
      if (!fechasConEventos.has(fecha)) {
        fechasConEventos.set(fecha, []);
      }
      fechasConEventos.get(fecha).push(m);
    });
  });

  for (let d = 1; d <= diasMes; d++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const eventos = fechasConEventos.get(fecha) || [];
    const estadoDominante = eventos.reduce((estadoMasFuerte, evento) => {
      const estadoActual = obtenerEstadoMantenimientoMensual(evento, fecha);
      return prioridadEstado(estadoActual) > prioridadEstado(estadoMasFuerte) ? estadoActual : estadoMasFuerte;
    }, '');
    const clase = eventos.length > 0 ? `evento ${estadoDominante}`.trim() : '';

    html += `<td class="${clase}"><div class="dia-contenido"><div class="dia-num">${d}</div>`;

    eventos.forEach(e => {
      const estado = obtenerEstadoMantenimientoMensual(e, fecha);
      html += `<div class="evento-item ${estado}">${e.maquina_equipo}<br><small>${e.codigo}</small></div>`;
    });

    html += '</div></td>';

    if ((d + primerDiaSemana) % 7 === 0 && d < diasMes) {
      html += '</tr><tr>';
    }
  }

  const celdasActuales = primerDiaSemana + diasMes;
  const celdasFaltantes = (7 - (celdasActuales % 7)) % 7;
  for (let i = 0; i < celdasFaltantes; i++) {
    html += '<td></td>';
  }

  html += '</tr></table>';
  document.getElementById('calendarioMensual').innerHTML = html;
}

// cargar datos y permitir cambiar mes
let datosCalendarioMensual = [];
const fechaActual = new Date();
const mesActual = fechaActual.getMonth() + 1;
const anioActual = fechaActual.getFullYear();
document.getElementById('mes').value = String(mesActual);
document.getElementById('anio').textContent = String(anioActual);

API_FETCH('/api/mantenimientos-preventivos')
  .then(res => {
    if (!res.ok) return [];
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data)) return;
    datosCalendarioMensual = data;
    generarCalendarioMensual(datosCalendarioMensual, mesActual, anioActual);
  })
  .catch(err => console.error("Error cargando JSON:", err));

// función para cambiar mes desde botones o select
function cambiarMes(mes) {
  generarCalendarioMensual(datosCalendarioMensual, Number(mes), anioActual);
}
