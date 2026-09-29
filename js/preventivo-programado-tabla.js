function formatearFechaAbsoluta(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === 'null') return '';
  if (!valor) return '';

  const texto = String(valor).trim();
  const fechaCorta = texto.slice(0, 10);
  const matchIso = /^\d{4}-\d{2}-\d{2}$/.exec(fechaCorta);
  const matchLocal = /^\d{2}\/\d{2}\/\d{4}$/.exec(texto);

  if (matchIso) {
    const [anio, mes, dia] = fechaCorta.split('-').map(Number);
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  }

  if (matchLocal) {
    return texto;
  }

  const fechaParseada = new Date(texto);
  if (Number.isNaN(fechaParseada.getTime())) return texto;

  return `${String(fechaParseada.getDate()).padStart(2, '0')}/${String(fechaParseada.getMonth() + 1).padStart(2, '0')}/${fechaParseada.getFullYear()}`;
}

function valorTabla(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === 'null') return '';
  return String(valor);
}

API_FETCH('/api/mantenimientos-preventivos')
  .then(res => {
    if (!res.ok) return [];
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data)) return;
    const tabla = document.getElementById('tablaMantenimientos');
    const encabezados = [
      'ID', 'Máquina', 'Código', 'Fecha Inicio', 'Fecha Final',
      'Fecha Ejec. Inicio', 'Fecha Ejec. Final', 'Reprog. Inicio',
      'Reprog. Final', '# Reprog.', 'Responsable', 'Apoyos', 'Repuestos',
      'Costo Repuestos', 'Costo Mano Obra', 'Costo Total', 'Notas'
    ];
    const thead = document.createElement('thead');
    const filaEncabezado = document.createElement('tr');
    encabezados.forEach(texto => {
      const th = document.createElement('th');
      th.textContent = texto;
      filaEncabezado.appendChild(th);
    });
    thead.appendChild(filaEncabezado);

    const tbody = document.createElement('tbody');
    data.forEach(m => {
      const fila = document.createElement('tr');
      const valores = [
        valorTabla(m.id), valorTabla(m.maquina_equipo), valorTabla(m.codigo),
        formatearFechaAbsoluta(m.fecha_inicio), formatearFechaAbsoluta(m.fecha_final),
        formatearFechaAbsoluta(m.fecha_ejecucion_inicio), formatearFechaAbsoluta(m.fecha_ejecucion_final),
        formatearFechaAbsoluta(m.reprogramacion_inicio), formatearFechaAbsoluta(m.reprogramacion_final),
        valorTabla(m.contador_reprogramaciones), valorTabla(m.responsable),
        valorTabla(m.apoyos), valorTabla(m.repuestos_utilizados),
        valorTabla(m.costo_repuestos), valorTabla(m.costo_mano_obra),
        valorTabla(m.costo_total), valorTabla(m.notas)
      ];
      valores.forEach(valor => {
        const td = document.createElement('td');
        td.textContent = valor;
        fila.appendChild(td);
      });
      tbody.appendChild(fila);
    });
    tabla.replaceChildren(thead, tbody);
  });
