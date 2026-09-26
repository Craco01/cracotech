function getFechaActualISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatearFechaInput(dateString) {
  if (!dateString) return '';
  const valor = String(dateString).slice(0, 10);
  return valor;
}

async function obtenerSalarioEmpleado(identificador) {
  if (!identificador) return 0;
  try {
    const response = await API_FETCH(`/api/auth/empleados/${encodeURIComponent(identificador)}/salario`);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    const data = await response.json();
    return Number(data.salario || 0);
  } catch (error) {
    console.error('Error obteniendo salario:', error);
    return 0;
  }
}

async function calcularCostoManoObraMPP() {
  const horasInput = document.getElementById('horas');
  const horas = Number(horasInput?.value || 0);
  const costo = Number.isFinite(horas) ? Math.max(0, horas) : 0;

  const hiddenCostoMO = document.getElementById('costo_mano_obra');
  if (hiddenCostoMO) hiddenCostoMO.value = String(costo);
  return Number(costo);
}

function construirRepuestosUtilizadosMPP() {
  const rows = [...document.querySelectorAll('#tablaBody tr')];
  const partes = [];

  rows.forEach(fila => {
    const productoInput = fila.querySelector('td:nth-child(1) input');
    const cantidadInput = fila.querySelector('td:nth-child(2) input');
    const totalInput = fila.querySelector('td:nth-child(4) input');

    const productoValor = productoInput?.value?.trim() || '';
    const cantidad = cantidadInput?.value?.trim() || '';
    const total = totalInput?.value?.trim() || '';

    if (!productoValor && !cantidad && !total) return;

    const textoProducto = productoValor || 'Producto';
    const textoCantidad = cantidad || '0';
    const textoTotal = total || '0';

    partes.push(`${textoProducto} | cantidad: ${textoCantidad} | total: ${textoTotal}`);
  });

  return partes.join('; ');
}

function prepararSubmitMPP() {
  const form = document.querySelector('form[action="/api/mantenimientos-preventivos/cierre"]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Procesando...';
    }

    recalcularTotal();
    const costoMO = await calcularCostoManoObraMPP();
    const costoRepuestos = Number(document.getElementById('costo_repuestos')?.value || 0);
    const fechaInicio = document.getElementById('fecha_inicio')?.value;
    const fechaFinal = getFechaActualISO();

    const payload = {
      id: document.getElementById('maquina')?.value,
      fecha_ejecucion_inicio: fechaInicio,
      fecha_ejecucion_final: fechaFinal,
      costo_repuestos: costoRepuestos.toFixed(2),
      costo_mano_obra: costoMO.toFixed(2),
      repuestos_utilizados: construirRepuestosUtilizadosMPP(),
      notas: document.getElementById('observacion')?.value || ''
    };

    try {
      const response = await API_FETCH('/api/mantenimientos-preventivos/cierre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.detalle || 'No se pudo cerrar el mantenimiento');
      }

      window.mostrarMensajeMPP?.({
        titulo: 'Mantenimiento cerrado',
        texto: 'El mantenimiento preventivo se cerró correctamente.',
        redirigir: true,
        destino: './vista_mpp.html'
      });
    } catch (error) {
      console.error('Error en cierre de mantenimiento preventivo:', error);
      window.mostrarMensajeMPP?.({
        titulo: 'Error',
        texto: error.message || 'Error al cerrar el mantenimiento',
        redirigir: true,
        destino: './vista_mpp.html'
      });
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Cerrar Mantenimiento Preventivo';
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  prepararSubmitMPP();
});
