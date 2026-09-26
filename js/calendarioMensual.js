function generarCalendarioMensual(mantenimientos, mes, anio) {
  const diasMes = new Date(anio, mes, 0).getDate();

  let html = '<table><caption>Calendario ' + mes + '/' + anio + '</caption><tr>';
  const diasSemana = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  diasSemana.forEach(d => html += `<th>${d}</th>`);
  html += '</tr><tr>';

  let diaSemana = new Date(anio, mes-1, 1).getDay();
  if(diaSemana === 0) diaSemana = 7;

  for(let i=1; i<diaSemana; i++) html += '<td></td>';

  for(let d=1; d<=diasMes; d++) {
    const fecha = `${anio}-${String(mes).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const eventos = mantenimientos.filter(m => {
      const inicio = m.fecha_inicio ? String(m.fecha_inicio).slice(0, 10) : '';
      const fin = m.fecha_final ? String(m.fecha_final).slice(0, 10) : '';
      const reprogInicio = m.reprogramacion_inicio
        ? String(m.reprogramacion_inicio).slice(0, 10)
        : '';
      const reprogFin = m.reprogramacion_final
        ? String(m.reprogramacion_final).slice(0, 10)
        : '';
      return inicio === fecha || fin === fecha ||
        reprogInicio === fecha || reprogFin === fecha;
    });

    let clase = eventos.length > 0 ? 'evento' : '';
    html += `<td class="${clase}"><div class="dia-num">${d}</div>`;

    eventos.forEach(e => {
      html += `<div class="evento-item">${e.maquina_equipo}<br><small>${e.codigo}</small></div>`;
    });

    html += '</td>';

    if((d+diaSemana-1)%7===0) html += '</tr><tr>';
  }

  html += '</tr></table>';
  document.getElementById('calendarioMensual').innerHTML = html;
}

// cargar datos y permitir cambiar mes
let datosCalendarioMensual = [];

fetch('./mantenimientos.json')
  .then(res => res.json())
  .then(data => {
    datosCalendarioMensual = data;
    generarCalendarioMensual(datosCalendarioMensual, 1, 2026); // por defecto enero
  })
  .catch(err => console.error("Error cargando JSON:", err));

// función para cambiar mes desde botones o select
function cambiarMes(mes, anio) {
  generarCalendarioMensual(datosCalendarioMensual, Number(mes), Number(anio));
}
