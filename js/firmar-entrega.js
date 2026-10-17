(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  const origenEquipo = params.get('origen') === 'equipo';
  const endpoint = `/api/ordenes/firmas/${encodeURIComponent(token || '')}`;
  const form = document.getElementById('formFirmas');
  const estado = document.getElementById('firmaEstado');
  const detalle = document.getElementById('firmaDetalle');
  const finalizar = document.getElementById('firmaFinalizada');
  const context = {};

  const pads = {
    operador: window.createSignaturePad(document.getElementById('canvasOperador'), {
      width: 600,
      height: 220,
      lineWidth: 2.4
    }),
    mantenimiento: window.createSignaturePad(document.getElementById('canvasMantenimiento'), {
      width: 600,
      height: 220,
      lineWidth: 2.4
    })
  };

  function mostrarError(error) {
    estado.textContent = error.message;
    form.hidden = true;
  }

  async function parseResponse(response, fallback) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || fallback);
    return result;
  }

  async function cargarSesion() {
    if (!token) throw new Error('El enlace no contiene un código de firma.');
    const response = await API_FETCH(endpoint, { cache: 'no-store' });
    const session = await parseResponse(response, 'El enlace de firma no existe o ha vencido.');
    context.orderId = session.id;
    context.operador = !session.operador_firmado;
    context.mantenimiento = !session.mantenimiento_firmado;
    detalle.textContent = `Orden N.º ${session.id}: ${session.maquina_equipo || session.nombre_declarado || 'sin equipo declarado'}.`;
    document.getElementById('campoOperador').hidden = !context.operador;
    document.getElementById('campoMantenimiento').hidden = !context.mantenimiento;
    ['operadorNombre', 'operadorCi'].forEach(id => {
      document.getElementById(id).disabled = !context.operador;
    });
    form.hidden = false;
    estado.textContent = 'Firme dentro de cada recuadro y guarde para registrar las firmas.';
  }

  document.querySelectorAll('[data-limpiar]').forEach(button => {
    button.addEventListener('click', () => pads[button.dataset.limpiar].clear());
  });

  document.getElementById('cerrarPestana').addEventListener('click', () => window.close());

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('guardarFirmas');
    const needsSignature = ['operador', 'mantenimiento'].filter(role => context[role]);
    if (needsSignature.some(role => !pads[role].hasSignature())) {
      estado.textContent = 'Complete todas las firmas pendientes antes de guardar.';
      return;
    }
    if (!form.reportValidity()) return;

    button.disabled = true;
    estado.textContent = 'Guardando firmas...';
    try {
      const payload = {
        operador_firma: context.operador ? pads.operador.getPaths() : null,
        mantenimiento_firma: context.mantenimiento ? pads.mantenimiento.getPaths() : null,
        operador_nombre: context.operador ? document.getElementById('operadorNombre').value : null,
        operador_ci: context.operador ? document.getElementById('operadorCi').value : null
      };
      const response = await API_FETCH(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      await parseResponse(response, 'No se pudieron guardar las firmas.');
      form.hidden = true;
      if (origenEquipo) {
        estado.textContent = 'Firmas guardadas. Abriendo el comprobante...';
        const deliveryRoute = '../entrega/';
        const printable = new URL(deliveryRoute, location.href);
        printable.searchParams.set('id', context.orderId);
        location.assign(printable.href);
        return;
      }
      finalizar.hidden = false;
      estado.textContent = 'Firmas guardadas. Cerrando esta pestaña...';
      window.close();
    } catch (error) {
      estado.textContent = error.message;
      button.disabled = false;
    }
  });

  cargarSesion().catch(mostrarError);
})();
