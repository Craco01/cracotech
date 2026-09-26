document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formReprogramarMPP');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await API_FETCH('/api/mantenimientos-preventivos/reprogramacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.detalle || 'No se pudo reprogramar');

      window.mostrarMensajeMPP?.({
        titulo: 'Reprogramación exitosa',
        texto: 'La reprogramación del mantenimiento se guardó correctamente.',
        redirigir: true,
        destino: './vista_mpp.html'
      });
      form.reset();
    } catch (error) {
      console.error(error);
      window.mostrarMensajeMPP?.({
        titulo: 'Error',
        texto: error.message || 'Error al reprogramar el mantenimiento',
        redirigir: true,
        destino: './vista_mpp.html'
      });
    }
  });
});
