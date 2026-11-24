(() => {
  'use strict';

  const recepcionTokenInicial = new URLSearchParams(location.search).get('recepcion');
  if (!recepcionTokenInicial && window.FR172_LOGIN_ENABLED === true && !sessionStorage.getItem('token')) {
    const loginUrl = new URL('/mantenimiento/', location.origin);
    const formRoute = new URL('../fr172-puente-grua-formulario/', location.href);
    loginUrl.searchParams.set('loginRequired', '1');
    loginUrl.searchParams.set('returnTo', `${formRoute.pathname}${location.search}${location.hash}`);
    location.replace(loginUrl.href);
    return;
  }

  const STORAGE_KEY = 'fr172-publica-datos-2';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const form = $('#ficha');
  const aviso = $('#guardado');
  const idSolicitado = new URLSearchParams(location.search).get('id');
  const recepcionToken = new URLSearchParams(location.search).get('recepcion');
  const requestedId = idSolicitado ? Number(idSolicitado) : null;
  let idFicha = requestedId;
  let estadoFicha = 'borrador';
  let colaGuardado = Promise.resolve();
  const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const opciones = lista =>
    '<option value="">Seleccione una opción</option>' + lista.map(value => `<option>${esc(value)}</option>`).join('');

  let est = {};
  try {
    est = FR172.normalizarDatos(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    est = {};
  }

  const filaTrabajo = i => `
    <div class="fila fila-trab">
      <span class="n">${i}</span>
      <input name="t${i}_act" placeholder="Actividad / trabajo realizado" aria-label="Trabajo ${i}: actividad">
      <select name="t${i}_estado" aria-label="Trabajo ${i}: estado">${opciones(FR172.estadosTrabajo)}</select>
      <input name="t${i}_obs" placeholder="Observaciones / mediciones / piezas" aria-label="Trabajo ${i}: observaciones">
    </div>`;

  const filaMaterial = i => `
    <tr>
      <th scope="row" class="n">${i}</th>
      <td data-label="Descripción"><input name="m${i}_desc" placeholder="Descripción" aria-label="Material ${i}: descripción"></td>
      <td data-label="Cantidad"><input name="m${i}_cant" placeholder="Cantidad" inputmode="decimal" aria-label="Material ${i}: cantidad"></td>
      <td data-label="Unidad"><input name="m${i}_unidad" placeholder="Unidad" aria-label="Material ${i}: unidad"></td>
      <td data-label="N° de parte / referencia"><input name="m${i}_parte" placeholder="N° de parte / referencia" aria-label="Material ${i}: número de parte"></td>
      <td data-label="Observaciones"><input name="m${i}_obs" placeholder="Observaciones" aria-label="Material ${i}: observaciones"></td>
    </tr>`;

  const filaVerificacion = (texto, i) => `
    <tr>
      <th scope="row">${esc(texto)}</th>
      ${[
        { valor: 'Conforme', etiqueta: 'Conforme' },
        { valor: 'No conforme', etiqueta: 'No conforme' },
        { valor: 'Observado', etiqueta: 'Observado' },
        { valor: 'N/A', etiqueta: 'No aplica' }
      ].map(opcion => `
        <td class="estado-radio">
          <input type="radio" name="v${i}_estado" value="${esc(opcion.valor)}"
            aria-label="${esc(texto)}: ${esc(opcion.etiqueta)}"${opcion.valor === 'N/A' ? ' checked' : ''}>
        </td>`).join('')}
      <td><input name="v${i}_obs" placeholder="Observaciones" aria-label="${esc(texto)}: observaciones"></td>
    </tr>`;

  const filaDocumento = (texto, i) => `
    <div class="fila fila-doc">
      <label class="chk"><input type="checkbox" name="d${i}_chk"><span>${esc(texto)}</span></label>
      <input name="d${i}_txt" placeholder="Detalle (opcional)" aria-label="${esc(texto)}: detalle">
    </div>`;

  function contar(tipo) {
    return Number(est[tipo === 'trabajos' ? 'n_trab' : 'n_mat']) || (tipo === 'trabajos' ? 3 : 3);
  }

  function ajustar(tipo, delta) {
    const base = 1;
    let cantidad = contar(tipo);
    if (delta > 0 && cantidad < FR172.filasMax) cantidad++;
    if (delta < 0 && cantidad > base) {
      const contenedor = tipo === 'trabajos'
        ? $('#filas-trabajos')
        : $('#filas-materiales');
      const patron = tipo === 'trabajos' ? /^t(\d+)_/ : /^m(\d+)_/;
      Object.keys(est).forEach(nombre => {
        const coincidencia = patron.exec(nombre);
        if (coincidencia && Number(coincidencia[1]) === cantidad) delete est[nombre];
      });
      contenedor.lastElementChild?.remove();
      cantidad--;
    } else if (delta > 0) {
      const contenedor = tipo === 'trabajos'
        ? $('#filas-trabajos')
        : $('#filas-materiales');
      contenedor.insertAdjacentHTML('beforeend',
        tipo === 'trabajos' ? filaTrabajo(cantidad) : filaMaterial(cantidad));
      rellenar();
    }
    est[tipo === 'trabajos' ? 'n_trab' : 'n_mat'] = cantidad;
    guardarTemporal();
  }

  function construir() {
    $('#filas-trabajos').innerHTML = Array.from({ length: contar('trabajos') }, (_, i) => filaTrabajo(i + 1)).join('');
    $('#filas-materiales').innerHTML = Array.from({ length: contar('materiales') }, (_, i) => filaMaterial(i + 1)).join('');
    est.n_trab = contar('trabajos');
    est.n_mat = contar('materiales');
    $('#filas-verif').innerHTML = FR172.verificaciones.map((texto, i) => filaVerificacion(texto, i + 1)).join('');
    $('#filas-docs').innerHTML = FR172.documentos.map((texto, i) => filaDocumento(texto, i + 1)).join('') +
      `<div class="fila fila-doc">
        <label class="chk"><input type="checkbox" name="d8_chk"><span>Otro:</span></label>
        <div class="doble"><input name="d8_label" placeholder="Especificar"><input name="d8_txt" placeholder="Detalle (opcional)"></div>
      </div>`;

    if ($('#sel-polipasto')) $('#sel-polipasto').innerHTML = opciones(FR172.tiposPolipasto);
    if ($('#sel-trabajo')) $('#sel-trabajo').innerHTML = opciones(FR172.tiposTrabajo);
    if ($('#sel-operativo')) $('#sel-operativo').innerHTML = opciones(FR172.operativo);
    if ($('#sel-conformidad')) $('#sel-conformidad').innerHTML = opciones(FR172.conformidad);
  }

  function rellenar() {
    $$('[name]', form).forEach(elemento => {
      if (elemento.type === 'checkbox' || elemento.type === 'radio') elemento.checked = false;
      else elemento.value = '';
      const valor = est[elemento.name];
      if (valor === undefined || valor === null) return;
      if (elemento.type === 'checkbox') elemento.checked = Boolean(valor);
      else if (elemento.type === 'radio') elemento.checked = String(valor) === elemento.value;
      else {
        if (elemento instanceof HTMLSelectElement &&
            !Array.from(elemento.options).some(option => option.value === String(valor))) {
          elemento.add(new Option(String(valor), String(valor)));
        }
        elemento.value = valor;
      }
    });
  }

  function guardarTemporal() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(est));
      aviso.textContent = 'Datos conservados temporalmente';
    } catch {
      aviso.textContent = 'No se pudo conservar temporalmente en este navegador';
    }
  }

  construir();
  FR172.verificaciones.forEach((_, i) => {
    if (!est[`v${i + 1}_estado`]) est[`v${i + 1}_estado`] = 'N/A';
  });
  if (!est.fecha) {
    const hoy = new Date();
    est.fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  }
  rellenar();

  const firmaCliente = $('#cv-cliente');
  const firmaTecnico = $('#cv-tecnico');
  const pads = {
    firma_cliente: window.createSignaturePad(firmaCliente, {
      width: 600, height: 220, maxStrokes: 100, maxPathLength: 40000, lineWidth: 2.4,
      onChange: paths => { est.firma_cliente = paths; guardarTemporal(); }
    }),
    firma_tecnico: window.createSignaturePad(firmaTecnico, {
      width: 600, height: 220, maxStrokes: 100, maxPathLength: 40000, lineWidth: 2.4,
      onChange: paths => { est.firma_tecnico = paths; guardarTemporal(); }
    })
  };
  pads.firma_cliente.setPaths(est.firma_cliente);
  pads.firma_tecnico.setPaths(est.firma_tecnico);

  function contenidoParaGuardar() {
    est.n_trab = contar('trabajos');
    est.n_mat = contar('materiales');
    const datos = { ...est };
    const firma_cliente = datos.firma_cliente || null;
    const firma_tecnico = datos.firma_tecnico || null;
    delete datos.firma_cliente;
    delete datos.firma_tecnico;
    return { datos, firma_cliente, firma_tecnico };
  }

  function validarRecepcion() {
    const requeridos = [
      ['conformidad', 'conformidad del cliente'],
      ['fecha_recepcion', 'fecha de recepción'],
      ['nombre', 'nombre y apellido'],
      ['cargo', 'cargo']
    ];
    const faltan = requeridos
      .filter(([nombre]) => !String(est[nombre] || '').trim())
      .map(([, etiqueta]) => etiqueta);
    if (!pads.firma_cliente.hasSignature()) faltan.push('firma del cliente');
    return faltan;
  }

  function actualizarModoEdicion() {
    const bloqueada = estadoFicha === 'finalizada';
    $$('input, select, textarea', form).forEach(elemento => { elemento.disabled = bloqueada; });
    $$('button[data-fila], button[data-borrar-firma]', form)
      .forEach(elemento => { elemento.disabled = bloqueada; });
    ['#guardar-borrador', '#finalizar-ficha'].forEach(selector => {
      $(selector).disabled = bloqueada;
    });
    $$('.firma-path').forEach(svg => {
      svg.style.pointerEvents = bloqueada ? 'none' : '';
      svg.setAttribute('aria-disabled', String(bloqueada));
    });
    const solicitar = $('#solicitar-datos-cliente');
    if (solicitar) {
      solicitar.hidden = bloqueada || pads.firma_cliente.hasSignature();
      solicitar.disabled = solicitar.hidden;
    }
  }

  async function cargarRecepcionPublica() {
    if (!recepcionToken) return false;
    $$('.paso', form).forEach(seccion => {
      seccion.classList.toggle('activo', Number(seccion.dataset.paso) === 6);
    });
    $$('.paso-cabecera').forEach(cabecera => {
      cabecera.closest('.paso')?.classList.toggle('recepcion-publica', true);
    });
    $$('.paso:not([data-paso="6"])', form).forEach(seccion => { seccion.hidden = true; });
    $$('.pasos, .navegacion-pasos, #guardar-borrador').forEach(el => { el.hidden = true; });
    $('#finalizar-ficha').textContent = 'Guardar recepción';

    const response = await API_FETCH(`/api/fr172-puente-grua/recepcion/${encodeURIComponent(recepcionToken)}`, { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'El enlace de recepción no existe o ha vencido.');
    idFicha = Number(result.id);
    est = FR172.normalizarDatos(result.datos);
    construir();
    rellenar();
    pads.firma_tecnico.setPaths(result.firma_tecnico);
    if (result.estado === 'finalizada') {
      $$('input, select, textarea, button', form).forEach(el => { el.disabled = true; });
      aviso.textContent = 'Recepción completada.';
    }
    mostrarPaso(6);
    aviso.textContent = result.estado === 'finalizada'
      ? 'Recepción completada.'
      : 'Complete los datos y firme para finalizar la ficha.';
    return true;
  }

  async function guardarRecepcionPublica() {
    const faltan = ['conformidad', 'fecha_recepcion', 'nombre', 'cargo']
      .filter(nombre => !String(est[nombre] || '').trim());
    if (faltan.length || !pads.firma_cliente.hasSignature()) {
      aviso.textContent = 'Complete todos los datos y la firma del cliente antes de guardar.';
      return;
    }
    const boton = $('#finalizar-ficha');
    boton.disabled = true;
    aviso.textContent = 'Guardando recepción...';
    try {
      const response = await API_FETCH(`/api/fr172-puente-grua/recepcion/${encodeURIComponent(recepcionToken)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conformidad: est.conformidad,
          fecha_recepcion: est.fecha_recepcion,
          nombre: est.nombre,
          cargo: est.cargo,
          firma_cliente: pads.firma_cliente.getPaths()
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la recepción.');
      estadoFicha = 'finalizada';
      $$('input, select, textarea, button', form).forEach(el => { el.disabled = true; });
      aviso.textContent = 'Recepción guardada y ficha finalizada.';
      const descarga = document.createElement('button');
      descarga.type = 'button';
      descarga.className = 'btn principal';
      descarga.textContent = 'Descargar PDF';
      descarga.addEventListener('click', () => {
        descarga.disabled = true;
        location.href = `/api/fr172-puente-grua/recepcion/${encodeURIComponent(recepcionToken)}/pdf`;
      });
      boton.replaceWith(descarga);
    } catch (error) {
      aviso.textContent = error.message;
      boton.disabled = false;
    }
  }

  function guardarEnServidor() {
    const payload = contenidoParaGuardar();
    const method = idFicha ? 'PUT' : 'POST';
    const path = idFicha
      ? `/api/fr172-puente-grua/${encodeURIComponent(idFicha)}`
      : '/api/fr172-puente-grua';

    colaGuardado = colaGuardado.catch(() => {}).then(async () => {
      const response = await API_FETCH(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la ficha.');
      if (!Number.isSafeInteger(Number(result.id)) || Number(result.id) < 1) {
        throw new Error('La API no devolvió un identificador de ficha válido.');
      }
      idFicha = Number(result.id);
      estadoFicha = result.estado || estadoFicha;
      history.replaceState(null, '', `${location.pathname}?id=${idFicha}`);
      guardarTemporal();
      return idFicha;
    });
    return colaGuardado;
  }

  async function abrirFicha(id) {
    aviso.textContent = 'Cargando ficha desde el servidor...';
    const response = await API_FETCH(`/api/fr172-puente-grua/${encodeURIComponent(id)}`, { cache: 'no-store' });
    const record = await response.json();
    if (!response.ok) throw new Error(record.error || 'No se pudo cargar la ficha.');
    if (!record.datos || typeof record.datos !== 'object') {
      throw new Error('La ficha recibida no contiene datos válidos.');
    }
    idFicha = Number(record.id);
    estadoFicha = record.estado;
    est = FR172.normalizarDatos({
      ...record.datos,
      firma_cliente: record.firma_cliente,
      firma_tecnico: record.firma_tecnico
    });
    construir();
    rellenar();
    pads.firma_cliente.setPaths(est.firma_cliente);
    pads.firma_tecnico.setPaths(est.firma_tecnico);
    actualizarModoEdicion();
    guardarTemporal();
    aviso.textContent = estadoFicha === 'finalizada' ? 'Ficha finalizada' : 'Borrador cargado desde el servidor';
  }

  async function guardarBorradorEnServidor() {
    const boton = $('#guardar-borrador');
    boton.disabled = true;
    aviso.textContent = 'Guardando borrador en el servidor...';
    try {
      const id = await guardarEnServidor();
      aviso.textContent = `Borrador ${id} guardado en el servidor`;
    } catch (error) {
      aviso.textContent = `Error al guardar el borrador: ${error.message}`;
    } finally {
      boton.disabled = estadoFicha === 'finalizada';
    }
  }

  async function finalizarFichaEnServidor() {
    const faltan = validarRecepcion();
    if (faltan.length) {
      aviso.textContent = 'Complete los datos de recepción antes de finalizar.';
      await window.siteDialog.alert(`Para finalizar la ficha complete la recepción: ${faltan.join(', ')}.`);
      return;
    }

    const boton = $('#finalizar-ficha');
    const botonBorrador = $('#guardar-borrador');
    boton.disabled = true;
    botonBorrador.disabled = true;
    aviso.textContent = 'Guardando y finalizando la ficha...';
    try {
      const id = await guardarEnServidor();
      const response = await API_FETCH(`/api/fr172-puente-grua/${id}/finalizar`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo finalizar la ficha.');
      estadoFicha = result.estado;
      guardarTemporal();
      location.href = `../fr172-puente-grua-imprimible/?public=2&blanco=1&id=${encodeURIComponent(id)}`;
    } catch (error) {
      aviso.textContent = `Error al finalizar la ficha: ${error.message}`;
      boton.disabled = false;
      botonBorrador.disabled = false;
    }
  }

  form.addEventListener('input', event => {
    const elemento = event.target;
    if (!elemento.name) return;
    est[elemento.name] = elemento.type === 'checkbox' ? elemento.checked : elemento.value;
    guardarTemporal();
  });
  form.addEventListener('change', event => {
    const elemento = event.target;
    if (!elemento.name) return;
    est[elemento.name] = elemento.type === 'checkbox' ? elemento.checked : elemento.value;
    guardarTemporal();
  });
  form.addEventListener('click', event => {
    const fila = event.target.closest('[data-fila]');
    if (fila) ajustar(fila.dataset.fila, Number(fila.dataset.delta));
    const borrar = event.target.closest('[data-borrar-firma]');
    if (borrar) pads[borrar.dataset.borrarFirma].clear();
  });

  let pasoActual = 1;
  const totalPasos = 6;
  const anterior = $('#paso-anterior');
  const siguiente = $('#paso-siguiente');
  const progreso = $('#progreso-paso');

  function mostrarPaso(numero) {
    pasoActual = Math.min(totalPasos, Math.max(1, numero));
    $$('.paso', form).forEach(seccion => {
      seccion.classList.toggle('activo', Number(seccion.dataset.paso) === pasoActual);
    });
    $$('[data-paso-nav]').forEach(item => {
      const paso = Number(item.dataset.pasoNav);
      item.classList.toggle('activo', paso === pasoActual);
      item.classList.toggle('completo', paso < pasoActual);
      if (paso === pasoActual) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    anterior.hidden = pasoActual === 1;
    siguiente.hidden = pasoActual === totalPasos;
    progreso.textContent = `Paso ${pasoActual} de ${totalPasos}`;
    const navegacion = $('.navegacion-pasos');
    navegacion?.classList.toggle('inicio', pasoActual === 1);
    const activa = $(`.paso[data-paso="${pasoActual}"]`);
    activa?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  anterior.addEventListener('click', () => mostrarPaso(pasoActual - 1));
  siguiente.addEventListener('click', () => mostrarPaso(pasoActual + 1));
  $('#guardar-borrador').addEventListener('click', guardarBorradorEnServidor);
  $('#finalizar-ficha').addEventListener('click', finalizarFichaEnServidor);
  $$('[data-paso-nav]').forEach(item => {
    const abrir = () => mostrarPaso(Number(item.dataset.pasoNav));
    item.addEventListener('click', abrir);
    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        abrir();
      }
    });
  });
  mostrarPaso(1);

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (recepcionToken) guardarRecepcionPublica();
    else finalizarFichaEnServidor();
  });

  if (idSolicitado && (!Number.isSafeInteger(requestedId) || requestedId < 1)) {
    aviso.textContent = 'El identificador de ficha no es válido.';
  } else if (requestedId) {
    abrirFicha(requestedId).catch(error => {
      aviso.textContent = `No se pudo cargar la ficha: ${error.message}`;
    });
  }
  if (recepcionToken) {
    cargarRecepcionPublica().catch(error => {
      aviso.textContent = error.message;
      form.hidden = true;
    });
  }
})();
