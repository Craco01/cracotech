function valorTabla(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === 'null') return '';
  return String(valor);
}

fetch('./mantenimientos.json')
  .then(res => res.json())
  .then(data => {
    const tabla = document.getElementById('tablaMantenimientos');
    const encabezados = [
      'ID', 'Máquina', 'Código', 'Fecha Inicio', 'Fecha Final',
      'Reprog. Inicio', 'Reprog. Final', '# Reprog.', 'Responsable',
      'Apoyos', 'Repuestos', 'Costo Repuestos', 'Costo Mano Obra',
      'Costo Total', 'Notas'
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
        m.id, m.maquina_equipo, m.codigo, m.fecha_inicio, m.fecha_final,
        m.reprogramacion_inicio, m.reprogramacion_final, m.contador_reprogramaciones,
        m.responsable, m.apoyos, m.repuestos_utilizados, m.costo_repuestos,
        m.costo_mano_obra, m.costo_total, m.notas
      ];
      valores.forEach(valor => {
        const td = document.createElement('td');
        td.textContent = valorTabla(valor);
        fila.appendChild(td);
      });
      tbody.appendChild(fila);
    });
    tabla.replaceChildren(thead, tbody);
  });
