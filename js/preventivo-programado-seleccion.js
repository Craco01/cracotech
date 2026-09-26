function activarSeleccion(contenedorSelector, objetivoSelector) {
  const contenedor = document.querySelector(contenedorSelector);
  if (!contenedor) return;

  contenedor.addEventListener('click', event => {
    const objetivo = event.target.closest(objetivoSelector);
    if (objetivo && contenedor.contains(objetivo)) {
      const estabaSeleccionada = objetivo.classList.contains('seleccionado');
      document.querySelectorAll('.mpp-page td.seleccionado').forEach(seleccionada => {
        seleccionada.classList.remove('seleccionado');
      });
      document.querySelectorAll('.mpp-page tr.seleccionado').forEach(fila => {
        fila.classList.remove('seleccionado');
      });
      if (!estabaSeleccionada) objetivo.classList.add('seleccionado');
    }
  });
}

activarSeleccion('#tablaMantenimientos', 'tbody tr');
activarSeleccion('#calendarioMensual', 'td');
activarSeleccion('#calendarioAnual', 'tbody tr');