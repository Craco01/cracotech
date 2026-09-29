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
  const tabla = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = `Calendario ${mes}/${anio}`;
  tabla.appendChild(caption);
  const encabezado = document.createElement('tr');
  const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  diasSemana.forEach(dia => {
    const th = document.createElement('th');
    th.textContent = dia;
    encabezado.appendChild(th);
  });
  tabla.appendChild(encabezado);

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

  const filas = Math.ceil((primerDiaSemana + diasMes) / 7);
  for (let semana = 0; semana < filas; semana++) {
    const fila = document.createElement('tr');
    for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
      const dia = semana * 7 + diaSemana - primerDiaSemana + 1;
      const celda = document.createElement('td');
      if (dia < 1 || dia > diasMes) {
        fila.appendChild(celda);
        continue;
      }

      const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      const eventos = fechasConEventos.get(fecha) || [];
      const estadoDominante = eventos.reduce((estadoMasFuerte, evento) => {
        const estadoActual = obtenerEstadoMantenimientoMensual(evento, fecha);
        return prioridadEstado(estadoActual) > prioridadEstado(estadoMasFuerte) ? estadoActual : estadoMasFuerte;
      }, '');
      celda.className = eventos.length > 0 ? `evento ${estadoDominante}`.trim() : '';

      const contenido = document.createElement('div');
      const numero = document.createElement('div');
      contenido.className = 'dia-contenido';
      numero.className = 'dia-num';
      numero.textContent = String(dia);
      contenido.appendChild(numero);

      eventos.forEach(evento => {
        const estado = obtenerEstadoMantenimientoMensual(evento, fecha);
        const item = document.createElement('div');
        const codigo = document.createElement('small');
        item.className = `evento-item ${estado}`;
        item.append(document.createTextNode(String(evento.maquina_equipo ?? '')),
          document.createElement('br'));
        codigo.textContent = String(evento.codigo ?? '');
        item.appendChild(codigo);
        contenido.appendChild(item);
      });

      celda.appendChild(contenido);
      fila.appendChild(celda);
    }
    tabla.appendChild(fila);
  }
  document.getElementById('calendarioMensual').replaceChildren(tabla);
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
