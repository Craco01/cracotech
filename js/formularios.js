(function () {
  const form = document.querySelector('main form');
  const action = form?.getAttribute('action') || '';
  if (!form || !action.startsWith('/api/ordenes')) return;
  if (action.endsWith('/cierre') && form.dataset.reprogramar !== 'true') return;
  if (form.dataset.submitHandlerBound === 'true') return;
  form.dataset.submitHandlerBound = 'true';
  let isSubmitting = false;
  const idempotencyKey = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  const token = () => localStorage.getItem('token');
  const value = id => document.getElementById(id)?.value || '';
  const selectedText = element => element?.selectedOptions?.[0]?.text?.trim() || '';
  const sectorNames = ['', 'Mantenimiento', 'Maquinado', 'Armado', 'Accesorios', 'Herrería', 'Pintura', 'Logística', 'Galvamax', 'Administración', 'Obras'];
  const categoryNames = ['', 'Correctivo', 'Preventivo', 'Predictivo'];

  function contactValue() {
    const input = document.getElementById('contacto');
    if (!input || !input.value) return undefined;
    const phone = input.value.replace(/\D/g, '');
    input.value = phone;
    if (!/^09[6789]\d{7}$/.test(phone)) {
      input.setCustomValidity('Ingrese 10 dígitos que comiencen con 096, 097, 098 o 099.');
      input.reportValidity();
      return null;
    }
    input.setCustomValidity('');
    return phone.slice(1);
  }

  document.getElementById('contacto')?.addEventListener('input', event => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
    event.target.setCustomValidity('');
  });

  function requestPayload() {
    const machine = document.getElementById('maquinaEquipo') || document.getElementById('maquina');
    const incluirDeclarado = document.getElementById('declarado-radio')?.checked;
    const data = {
      id: value('ordenId'),
      codigo: machine.dataset.codigo || machine.value,
      maquina_equipo: machine.dataset.descripcion || '',
      nombre_declarado: incluirDeclarado ? value('declarado') : null,
      averia: value('averia'),
      solicitado: value('solicitante'),
      sector: sectorNames[Number(value('sector'))],
      categoria: categoryNames[Number(value('categoria'))],
      prioridad: value('prioridad') || null
    };
    const contacto = contactValue();
    if (contacto === null) return null;
    if (contacto) data.contacto = contacto;
    return data;
  }

  function payload() {
    if (form.dataset.reprogramar === 'true') {
      return {
        id: value('maquina'),
        notas: value('observacion'),
        progreso: 'Reprogramado'
      };
    }
    if (action.endsWith('/cierre')) {
      const selects = form.querySelectorAll('select');
      return {
        id: selects[0].value,
        reparacion: form.querySelector('textarea')?.value || '',
        apoyo: selectedText(selects[1]),
        clasificacion: selectedText(selects[2]),
        notas: form.querySelectorAll('textarea')[1]?.value || '',
        horas: value('horas')
      };
    }
    if (action.endsWith('/asignacion')) {
      const selects = form.querySelectorAll('select');
      return { id: selects[0].value, responsable: selects[1].value || null, apoyo: selects[2].value || null };
    }
    return requestPayload();
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (isSubmitting) return;

    if (localStorage.getItem('role') !== 'editor' || !token()) return window.alert('Debe iniciar sesion como editor.');
    const data = payload();
    if (!data) return;
    if (action.endsWith('/asignacion') && !data.responsable) return window.alert('Seleccione un técnico responsable.');
    if ((action.endsWith('/ordenes') && (!data.codigo || !data.maquina_equipo)) || (!action.endsWith('/ordenes') && !data.id)) return window.alert('Seleccione primero una opcion de la lista.');

    isSubmitting = true;
    const originalButtonText = submitButton ? submitButton.textContent : '';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
    }

    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
      if (action.endsWith('/ordenes')) headers['X-Idempotency-Key'] = idempotencyKey;
      const response = await API_FETCH(action, { method: 'POST', headers, body: JSON.stringify(data) });
      const responseText = await response.text();
      let result = {};
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error(responseText || 'No se pudo interpretar la respuesta del servidor.');
      }
      if (!response.ok) throw new Error(result.detalle || result.error || 'No se pudo guardar');
      window.alert(result.message || 'Operacion completada.');
      if (action.endsWith('/ordenes') || action.endsWith('/cierre') || action.endsWith('/asignacion') || action.endsWith('/solicitud')) {
        form.reset();
        window.location.href = 'lista_solicitudes.html';
      }
    } catch (error) {
      window.alert(error.message);
    } finally {
      isSubmitting = false;
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
})();
