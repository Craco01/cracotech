(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  let rol = localStorage.getItem('role');
  let puedeEditar = ['editor', 'administrador'].includes(rol);
  let tieneSesion = Boolean(localStorage.getItem('token'));
  const form = $('#ficha');
  const aviso = $('#guardado');
  let est = {};
  let temporizador = null;
  const requestedId = Number(new URLSearchParams(location.search).get('id')) || null;
  let cargandoFicha = Boolean(requestedId);
  let idFicha = requestedId;
  let estadoFicha = 'borrador';
  let colaGuardado = Promise.resolve();
  const firmaCliente = $('#cv-cliente');
  const firmaTecnico = $('#cv-tecnico');

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const opciones = lista => '<option value=""></option>' + lista.map(o => `<option>${esc(o)}</option>`).join('');

  /* ---------- Generación de filas ---------- */
  const filaTrabajo = i => `
    <div class="fila fila-trab">
      <span class="n">${i}</span>
      <input name="t${i}_act" placeholder="Actividad / trabajo realizado" aria-label="Trabajo ${i}: actividad">
      <select name="t${i}_estado" aria-label="Trabajo ${i}: estado">${opciones(FR172.estadosTrabajo)}</select>
      <input name="t${i}_obs" placeholder="Observaciones / mediciones / piezas" aria-label="Trabajo ${i}: observaciones">
    </div>`;

  const filaMaterial = i => `
    <div class="fila fila-mat">
      <span class="n">${i}</span>
      <input name="m${i}_desc" placeholder="Descripción" aria-label="Material ${i}: descripción">
      <input name="m${i}_cant" placeholder="Cantidad" inputmode="decimal" aria-label="Material ${i}: cantidad">
      <input name="m${i}_unidad" placeholder="Unidad" aria-label="Material ${i}: unidad">
      <input name="m${i}_parte" placeholder="N° de parte / referencia" aria-label="Material ${i}: número de parte">
      <input name="m${i}_obs" placeholder="Observaciones" aria-label="Material ${i}: observaciones">
    </div>`;

  const filaVerif = (texto, k) => `
    <div class="fila fila-verif">
      <span class="txt">${esc(texto)}</span>
      <select name="v${k}_estado" aria-label="${esc(texto)}: estado">${opciones(FR172.estadosVerif)}</select>
      <input name="v${k}_obs" placeholder="Observaciones" aria-label="${esc(texto)}: observaciones">
    </div>`;

  const filaDoc = (texto, k) => `
    <div class="fila fila-doc">
      <label class="chk"><input type="checkbox" name="d${k}_chk"><span>${esc(texto)}</span></label>
      <input name="d${k}_txt" placeholder="Detalle (opcional)" aria-label="${esc(texto)}: detalle">
    </div>`;

  const filaOtro = `
    <div class="fila fila-doc">
      <label class="chk"><input type="checkbox" name="d8_chk"><span>Otro:</span></label>
      <div class="doble">
        <input name="d8_label" placeholder="Especificar" aria-label="Otro documento: especificar">
        <input name="d8_txt" placeholder="Detalle (opcional)" aria-label="Otro documento: detalle">
      </div>
    </div>`;

  function cantidadFilas(tipo) {
    const clave = tipo === 'trabajos' ? 'n_trab' : 'n_mat';
    const prefijo = tipo === 'trabajos' ? /^t(\d+)_/ : /^m(\d+)_/;
    const maxConDatos = Object.keys(est).reduce((max, nombre) => {
      const match = prefijo.exec(nombre);
      return match && String(est[nombre] || '').trim() ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return Math.min(FR172.filasMax, Math.max(FR172.filasBase[tipo], est[clave] || 0, maxConDatos));
  }

  const nTrab = () => cantidadFilas('trabajos');
  const nMat = () => cantidadFilas('materiales');

  function construir() {
    let h = '';
    for (let i = 1; i <= nTrab(); i++) h += filaTrabajo(i);
    $('#filas-trabajos').innerHTML = h;

    h = '';
    for (let i = 1; i <= nMat(); i++) h += filaMaterial(i);
    $('#filas-materiales').innerHTML = h;

    $('#filas-verif').innerHTML = FR172.verificaciones.map((t, k) => filaVerif(t, k + 1)).join('');
    $('#filas-docs').innerHTML = FR172.documentos.map((t, k) => filaDoc(t, k + 1)).join('') + filaOtro;

    $('#sel-operativo').innerHTML = opciones(FR172.operativo);
    $('#sel-conformidad').innerHTML = opciones(FR172.conformidad);
  }

  function rellenar() {
    $$('[name]', form).forEach(el => {
      if (el.type === 'checkbox') el.checked = false; else el.value = '';
      const v = est[el.name];
      if (v === undefined || v === null) return;
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    });
  }

  const signaturePads = {
    cliente: window.createSignaturePad(firmaCliente, {
      width: 600,
      height: 220,
      maxStrokes: 100,
      maxPathLength: 40000,
      lineWidth: 2.4,
      onChange: paths => {
        est.firma_cliente = paths;
        programarGuardado();
      },
      onLimit: type => {
        aviso.textContent = type === 'strokes'
          ? 'La firma alcanzó el máximo de trazos permitido.'
          : 'El trazo de firma es demasiado largo.';
      }
    }),
    tecnico: window.createSignaturePad(firmaTecnico, {
      width: 600,
      height: 220,
      maxStrokes: 100,
      maxPathLength: 40000,
      lineWidth: 2.4,
      onChange: paths => {
        est.firma_tecnico = paths;
        programarGuardado();
      },
      onLimit: type => {
        aviso.textContent = type === 'strokes'
          ? 'La firma alcanzó el máximo de trazos permitido.'
          : 'El trazo de firma es demasiado largo.';
      }
    })
  };

  function actualizarModoEdicion() {
    const soloLectura = !tieneSesion || !puedeEditar || cargandoFicha;
    $$('input, select, textarea, button[data-fila], button[data-borrar-firma]', form)
      .forEach(el => { el.disabled = soloLectura; });
    $$('button[data-fila][data-delta="1"]', form).forEach(el => {
      el.disabled = soloLectura || cantidadFilas(el.dataset.fila) >= FR172.filasMax;
    });
    $$('button[data-fila][data-delta="-1"]', form).forEach(el => {
      el.disabled = soloLectura || cantidadFilas(el.dataset.fila) <= FR172.filasBase[el.dataset.fila];
    });
    $$('.firma-path').forEach(svg => {
      svg.style.pointerEvents = soloLectura ? 'none' : '';
      svg.setAttribute('aria-disabled', String(soloLectura));
    });
    $('#btn-finalizar-ficha').hidden = soloLectura;
    $('#btn-finalizar-ficha').textContent = requestedId
      ? 'Guardar cambios y ver ficha imprimible'
      : 'Finalizar ficha de asistencia';
    aviso.textContent = estadoFicha === 'finalizada' ? 'Ficha finalizada' : 'Borrador';
  }

  function renderizarFicha() {
    if (!est.fecha) {
      const hoy = new Date();
      est.fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }
    construir();
    rellenar();
    signaturePads.cliente.setPaths(est.firma_cliente);
    signaturePads.tecnico.setPaths(est.firma_tecnico);
    actualizarModoEdicion();
  }

  function contenidoParaGuardar() {
    const datos = { ...est };
    const firma_cliente = datos.firma_cliente || null;
    const firma_tecnico = datos.firma_tecnico || null;
    delete datos.firma_cliente;
    delete datos.firma_tecnico;
    return { datos, firma_cliente, firma_tecnico };
  }

  function programarGuardado() {
    if (!tieneSesion || !puedeEditar) return;
    clearTimeout(temporizador);
    aviso.textContent = 'Guardando…';
    FR172.guardar(est);
    temporizador = setTimeout(() => guardarYa().catch(error => {
      aviso.textContent = `Error al guardar: ${error.message}`;
    }), 500);
  }

  function guardarYa() {
    clearTimeout(temporizador);
    FR172.guardar(est);
    if (!tieneSesion || !puedeEditar) return Promise.reject(new Error('Se requiere sesión de editor o administrador.'));
    const payload = contenidoParaGuardar();
    colaGuardado = colaGuardado.catch(() => {}).then(async () => {
      const response = await API_FETCH(idFicha
        ? `/api/fr172-puente-grua/${idFicha}`
        : '/api/fr172-puente-grua', {
        method: idFicha ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la ficha.');
      if (!idFicha) {
        idFicha = result.id;
        estadoFicha = result.estado;
        history.replaceState(null, '', `${location.pathname}?id=${idFicha}`);
      }
      const hora = new Date().toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
      aviso.textContent = `Guardado en servidor a las ${hora}`;
      return idFicha;
    });
    return colaGuardado;
  }

  function alCambiar(e) {
    const el = e.target;
    if (!el.name || !puedeEditar) return;
    est[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    const item = /^(t|m)(\d+)_/.exec(el.name);
    if (item && el.value.trim()) {
      const tipo = item[1] === 't' ? 'trabajos' : 'materiales';
      if (Number(item[2]) === cantidadFilas(tipo) &&
          cantidadFilas(tipo) < FR172.filasMax) {
        ajustarFilas(tipo, 1);
      }
    }
    programarGuardado();
  }
  form.addEventListener('input', alCambiar);
  form.addEventListener('change', alCambiar);

  /* ---------- Agregar / quitar filas ---------- */
  function ajustarFilas(tipo, delta) {
    const base = FR172.filasBase[tipo];
    const clave = tipo === 'trabajos' ? 'n_trab' : 'n_mat';
    const contenedor = $('#filas-' + tipo);
    let n = cantidadFilas(tipo);
    if (delta > 0) {
      if (n >= FR172.filasMax) return;
      n++;
      contenedor.insertAdjacentHTML('beforeend', tipo === 'trabajos' ? filaTrabajo(n) : filaMaterial(n));
    } else {
      if (n <= base) return;
      const ultima = contenedor.lastElementChild;
      $$('[name]', ultima).forEach(el => delete est[el.name]);
      ultima.remove();
      n--;
    }
    est[clave] = n;
    actualizarModoEdicion();
    programarGuardado();
  }
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-fila]');
    if (b) ajustarFilas(b.dataset.fila, Number(b.dataset.delta));
  });

  /* ---------- Firmas ---------- */
  const borrarFirma = {
    firma_cliente: () => signaturePads.cliente.clear(),
    firma_tecnico: () => signaturePads.tecnico.clear()
  };
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-borrar-firma]');
    if (b) borrarFirma[b.dataset.borrarFirma]();
  });

  /* ---------- Inicio ---------- */
  async function abrirFicha(id) {
    const response = await API_FETCH(`/api/fr172-puente-grua/${id}`);
    const record = await response.json();
    if (!response.ok) throw new Error(record.error || 'No se pudo abrir la ficha.');
    idFicha = record.id;
    estadoFicha = record.estado;
    est = { ...record.datos, firma_cliente: record.firma_cliente, firma_tecnico: record.firma_tecnico };
    FR172.guardar(est);
    history.replaceState(null, '', `${location.pathname}?id=${idFicha}`);
    cargandoFicha = false;
    renderizarFicha();
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const boton = $('#btn-finalizar-ficha');
    boton.disabled = true;
    try {
      const id = await guardarYa();
      const response = await API_FETCH(`/api/fr172-puente-grua/${id}/finalizar`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo finalizar la ficha.');
      estadoFicha = 'finalizada';
      const printableRoute = '../fr172-puente-grua-imprimible/';
      location.href = `${printableRoute}?id=${encodeURIComponent(id)}`;
    } catch (error) {
      aviso.textContent = `Error al finalizar: ${error.message}`;
      boton.disabled = !tieneSesion || !puedeEditar;
    }
  });

  async function validarAcceso() {
    if (!tieneSesion) {
      const loginUrl = new URL('/mantenimiento/', location.origin);
      loginUrl.searchParams.set('loginRequired', '1');
      loginUrl.searchParams.set('returnTo', `${location.pathname}${location.search}${location.hash}`);
      location.replace(loginUrl.href);
      return;
    }

    try {
      const response = await API_FETCH('/api/auth/session', { cache: 'no-store' });
      const session = await response.json();
      if (!response.ok) {
        if (response.status === 403) {
          location.replace('/mantenimiento/reportes/?vista=fr172&accessDenied=1');
          return;
        }
        throw new Error(session.error || 'No se pudo validar la sesión.');
      }
      if (!['editor', 'administrador'].includes(session.role)) {
        location.replace('/mantenimiento/reportes/?vista=fr172&accessDenied=1');
        return;
      }

      rol = session.role;
      puedeEditar = true;
      tieneSesion = true;
      localStorage.setItem('role', session.role);
      localStorage.setItem('username', session.username);
      $('#acceso-requerido').hidden = true;
      form.hidden = false;
      renderizarFicha();

      const params = new URLSearchParams(location.search);
      if (requestedId) {
        abrirFicha(requestedId).catch(error => {
          aviso.textContent = `No se pudo abrir la ficha: ${error.message}`;
        });
      } else {
        aviso.textContent = 'Nuevo borrador sin guardar';
      }
      if (params.has('id') && !requestedId) {
        aviso.textContent = 'El identificador de ficha no es válido.';
      }
    } catch (error) {
      $('#acceso-requerido').textContent = `No se pudo validar la sesión: ${error.message}`;
    }
  }

  validarAcceso();
})();
