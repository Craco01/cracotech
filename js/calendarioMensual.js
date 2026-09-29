function generarCalendarioMensual(mantenimientos, mes, anio) {
  const diasMes = new Date(anio, mes, 0).getDate();
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

  let diaSemana = new Date(anio, mes-1, 1).getDay();
  if(diaSemana === 0) diaSemana = 7;

  const filas = Math.ceil((diaSemana - 1 + diasMes) / 7);
  for (let semana = 0; semana < filas; semana++) {
    const fila = document.createElement('tr');
    for (let columna = 0; columna < 7; columna++) {
      const dia = semana * 7 + columna - (diaSemana - 1) + 1;
      const celda = document.createElement('td');
      if (dia < 1 || dia > diasMes) {
        fila.appendChild(celda);
        continue;
      }

      const fecha = `${anio}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
      const eventos = mantenimientos.filter(m => {
        const inicio = m.fecha_inicio ? String(m.fecha_inicio).slice(0, 10) : '';
        const fin = m.fecha_final ? String(m.fecha_final).slice(0, 10) : '';
        const reprogInicio = m.reprogramacion_inicio ? String(m.reprogramacion_inicio).slice(0, 10) : '';
        const reprogFin = m.reprogramacion_final ? String(m.reprogramacion_final).slice(0, 10) : '';
        return inicio === fecha || fin === fecha || reprogInicio === fecha || reprogFin === fecha;
      });

      celda.className = eventos.length > 0 ? 'evento' : '';
      const numero = document.createElement('div');
      numero.className = 'dia-num';
      numero.textContent = String(dia);
      celda.appendChild(numero);
      eventos.forEach(evento => {
        const item = document.createElement('div');
        const codigo = document.createElement('small');
        item.className = 'evento-item';
        item.append(document.createTextNode(String(evento.maquina_equipo ?? '')),
          document.createElement('br'));
        codigo.textContent = String(evento.codigo ?? '');
        item.appendChild(codigo);
        celda.appendChild(item);
      });
      fila.appendChild(celda);
    }
    tabla.appendChild(fila);
  }
  document.getElementById('calendarioMensual').replaceChildren(tabla);
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
