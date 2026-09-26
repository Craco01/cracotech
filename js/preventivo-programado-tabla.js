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
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>ID</th><th>Máquina</th><th>Código</th>
          <th>Fecha Inicio</th><th>Fecha Final</th>
          <th>Fecha Ejec. Inicio</th><th>Fecha Ejec. Final</th>
          <th>Reprog. Inicio</th><th>Reprog. Final</th>
          <th># Reprog.</th><th>Responsable</th>
          <th>Apoyos</th><th>Repuestos</th>
          <th>Costo Repuestos</th><th>Costo Mano Obra</th>
          <th>Costo Total</th><th>Notas</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(m => `
          <tr>
            <td>${valorTabla(m.id)}</td><td>${valorTabla(m.maquina_equipo)}</td><td>${valorTabla(m.codigo)}</td>
            <td>${formatearFechaAbsoluta(m.fecha_inicio)}</td><td>${formatearFechaAbsoluta(m.fecha_final)}</td>
            <td>${formatearFechaAbsoluta(m.fecha_ejecucion_inicio)}</td><td>${formatearFechaAbsoluta(m.fecha_ejecucion_final)}</td>
            <td>${formatearFechaAbsoluta(m.reprogramacion_inicio)}</td><td>${formatearFechaAbsoluta(m.reprogramacion_final)}</td>
            <td>${valorTabla(m.contador_reprogramaciones)}</td><td>${valorTabla(m.responsable)}</td>
            <td>${valorTabla(m.apoyos)}</td><td>${valorTabla(m.repuestos_utilizados)}</td>
            <td>${valorTabla(m.costo_repuestos)}</td><td>${valorTabla(m.costo_mano_obra)}</td>
            <td>${valorTabla(m.costo_total)}</td><td>${valorTabla(m.notas)}</td>
          </tr>`).join('')}
      </tbody>
    `;
  });
