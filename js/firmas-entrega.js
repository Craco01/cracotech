(() => {
  'use strict';

  const tokenApi = id => `/api/ordenes/${encodeURIComponent(id)}/firmas`;
  let modal;
  let qrLibrary;
  let modalAttempt = 0;
  function cargarQrLibrary() {
    if (window.QRCode) return Promise.resolve();
    if (qrLibrary) return qrLibrary;
    qrLibrary = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = () => window.QRCode ? resolve() : reject(new Error('No se pudo iniciar el generador de QR.'));
      script.onerror = () => reject(new Error('No se pudo cargar el generador de QR.'));
      document.head.appendChild(script);
    });
    return qrLibrary;
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'firmas-entrega-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'firmasEntregaTitulo');

    const panel = document.createElement('section');
    panel.className = 'firmas-entrega-modal__panel';
    const title = document.createElement('h2');
    title.id = 'firmasEntregaTitulo';
    title.textContent = 'Firmas de entrega';
    const detail = document.createElement('p');
    detail.className = 'firmas-entrega-modal__detalle';
    const status = document.createElement('p');
    status.className = 'firmas-entrega-modal__estado';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const qr = document.createElement('div');
    qr.className = 'firmas-entrega-modal__qr';
    qr.setAttribute('aria-label', 'Código QR para abrir el formulario de firmas');
    const link = document.createElement('a');
    link.className = 'firmas-entrega-modal__firmar';
    link.textContent = 'Firmar en este dispositivo';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const actions = document.createElement('div');
    actions.className = 'firmas-entrega-modal__acciones';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'Cancelar';
    cancel.className = 'firmas-entrega-modal__secundario';
    const verify = document.createElement('button');
    verify.type = 'button';
    verify.textContent = 'Verificar firma';
    verify.className = 'firmas-entrega-modal__secundario';
    const proceed = document.createElement('button');
    proceed.type = 'button';
    proceed.textContent = 'Continuar a imprimir';
    proceed.className = 'firmas-entrega-modal__principal';
    proceed.hidden = true;
    actions.append(cancel, verify, proceed);
    panel.append(title, detail, status, qr, link, actions);
    modal.appendChild(panel);
    document.body.appendChild(modal);

    cancel.addEventListener('click', () => {
      modalAttempt++;
      modal.hidden = true;
      modal.onCancel?.();
      modal.onCancel = null;
    });
    modal.addEventListener('click', event => {
      if (event.target === modal) cancel.click();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) cancel.click();
    });
    verify.addEventListener('click', () => actualizarEstado(modal.orderId));
    proceed.addEventListener('click', () => {
      const route = '../entrega/';
      location.href = `${route}?id=${encodeURIComponent(modal.orderId)}`;
    });

    modal.parts = { detail, status, qr, link, verify, proceed };
    return modal;
  }

  async function jsonResponse(response, defaultMessage) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || defaultMessage);
    return body;
  }

  function mostrarFirmasCompletas() {
    const { status, verify, proceed, qr, link } = modal.parts;
    status.textContent = 'Las firmas del operador y de mantenimiento están completas.';
    qr.hidden = true;
    link.hidden = true;
    verify.hidden = true;
    proceed.hidden = false;
    proceed.focus();
  }

  async function generarQr(id, attempt) {
    const { status, verify, proceed, qr, link } = modal.parts;
    status.textContent = 'Generando un nuevo acceso de firma...';
    const response = await API_FETCH(`${tokenApi(id)}/sesion`, { method: 'POST' });
    const session = await jsonResponse(response, 'No se pudo generar el acceso al formulario de firmas.');
    if (attempt !== modalAttempt) return;
    if (session.firmado) {
      mostrarFirmasCompletas();
      return;
    }

    const formRoute = '../firmar-entrega/';
    const formUrl = new URL(formRoute, location.href);
    formUrl.searchParams.set('token', session.token);
    const deviceFormUrl = new URL(formUrl.href);
    deviceFormUrl.searchParams.set('origen', 'equipo');
    link.href = deviceFormUrl.href;
    qr.replaceChildren();
    qr.hidden = false;
    link.hidden = false;
    verify.hidden = false;
    proceed.hidden = true;
    status.textContent = 'Falta al menos una firma. Este QR vence en 30 minutos. Escanéelo o abra el formulario en este dispositivo.';

    try {
      await cargarQrLibrary();
      if (attempt !== modalAttempt) return;
      new window.QRCode(qr, { text: formUrl.href, width: 220, height: 220 });
    } catch (error) {
      if (attempt !== modalAttempt) return;
      status.textContent += ` ${error.message} Use el botón para abrir el formulario.`;
    }
    link.focus();
  }

  async function actualizarEstado(id) {
    const attempt = modalAttempt;
    const { status, verify } = modal.parts;
    verify.disabled = true;
    status.textContent = 'Verificando firmas...';
    try {
      const response = await API_FETCH(tokenApi(id), { cache: 'no-store' });
      const result = await jsonResponse(response, 'No se pudieron consultar las firmas.');
      if (attempt !== modalAttempt) return;
      if (result.operador_firmado && result.mantenimiento_firmado) {
        mostrarFirmasCompletas();
        return;
      }
      status.textContent = 'Las firmas siguen pendientes. El QR sigue activo.';
    } catch (error) {
      if (attempt === modalAttempt) status.textContent = error.message;
    } finally {
      if (attempt === modalAttempt) verify.disabled = false;
    }
  }

  async function abrirModalFirmasEntrega(id, onCancel) {
    const current = ensureModal();
    const attempt = ++modalAttempt;
    const { detail, status, qr, link, verify, proceed } = current.parts;
    current.orderId = id;
    current.onCancel = onCancel;
    current.hidden = false;
    detail.textContent = `Orden N.º ${id}.`;
    status.textContent = 'Comprobando firmas...';
    qr.replaceChildren();
    qr.hidden = true;
    link.hidden = true;
    verify.hidden = true;
    verify.disabled = true;
    proceed.hidden = true;

    try {
      const statusResponse = await API_FETCH(tokenApi(id));
      const signatures = await jsonResponse(statusResponse, 'No se pudieron consultar las firmas.');
      if (attempt !== modalAttempt) return;
      if (signatures.operador_firmado && signatures.mantenimiento_firmado) {
        status.textContent = 'Las firmas del operador y de mantenimiento están completas.';
        proceed.hidden = false;
        proceed.focus();
        return;
      }

      await generarQr(id, attempt);
    } catch (error) {
      if (attempt === modalAttempt) status.textContent = error.message;
    }
  }

  window.abrirModalFirmasEntrega = abrirModalFirmasEntrega;
})();
