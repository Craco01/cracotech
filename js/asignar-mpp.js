function initAsignarMPP() {
  const form = document.getElementById('formAsignarMPP');
  if (!form) return;
  if (form.dataset.initialized === 'true') return;
  form.dataset.initialized = 'true';

  window.cargarOpcionesEmpleados([
    { id: 'responsable', placeholder: 'Asignar técnico' },
    { id: 'apoyo', placeholder: 'Sin apoyo' }
  ]).catch(error => console.error('Error cargando empleados para MPP:', error));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await API_FETCH('/api/mantenimientos-preventivos/asignacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.detalle || 'No se pudo asignar');

      window.mostrarMensajeMPP?.({
        titulo: 'Asignación exitosa',
        texto: 'El mantenimiento preventivo fue asignado correctamente.',
        redirigir: true,
        destino: './vista_mpp.html'
      });
      form.reset();
    } catch (error) {
      console.error(error);
      window.mostrarMensajeMPP?.({
        titulo: 'Error',
        texto: error.message || 'Error al asignar el mantenimiento',
        redirigir: true,
        destino: './vista_mpp.html'
      });
    }
  });
}

window.initAsignarMPP = initAsignarMPP;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAsignarMPP);
} else {
  initAsignarMPP();
}
