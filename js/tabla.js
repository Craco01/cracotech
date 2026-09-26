function valorTabla(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === 'null') return '';
  return String(valor);
}

fetch('./mantenimientos.json')
  .then(res => res.json())
  .then(data => {
    const tabla = document.getElementById('tablaMantenimientos');
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>ID</th><th>Máquina</th><th>Código</th>
          <th>Fecha Inicio</th><th>Fecha Final</th>
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
            <td>${valorTabla(m.fecha_inicio)}</td><td>${valorTabla(m.fecha_final)}</td>
            <td>${valorTabla(m.reprogramacion_inicio)}</td><td>${valorTabla(m.reprogramacion_final)}</td>
            <td>${valorTabla(m.contador_reprogramaciones)}</td><td>${valorTabla(m.responsable)}</td>
            <td>${valorTabla(m.apoyos)}</td><td>${valorTabla(m.repuestos_utilizados)}</td>
            <td>${valorTabla(m.costo_repuestos)}</td><td>${valorTabla(m.costo_mano_obra)}</td>
            <td>${valorTabla(m.costo_total)}</td><td>${valorTabla(m.notas)}</td>
          </tr>`).join('')}
      </tbody>
    `;
  });
