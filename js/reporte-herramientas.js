'use strict';

/* ===== Catálogos (iguales a los ENUM de la BD) ===== */
const ESTADOS = ['Solicitado', 'En proceso', 'Envío parcial', 'Completado', 'Cancelado'];
const TIPOS = [
  'Herramientas para Ingreso a Obra',
  'Reposición de Herramientas (Herramientas averiadas o extraviadas)',
  'Herramientas Adicionales',
  'Herramientas para Puntero Nuevo'
];
const ESTADOS_HERR = ['Disponible', 'No disponible', 'Buscar', 'Para compra', 'Envío cancelado', 'Ya enviado', 'Ya completado'];
const ETIQUETAS_ESTADO_HERR = {
  Buscar: 'Para buscar',
  'Ya completado': 'El operador ya cuenta con ella'
};

/* ===== Datos =====
   Para conectar a la API: poné la URL aquí. Debe devolver una lista de pedidos con
   la forma de DEMO (cada pedido con su arreglo "detalle"). */
let aviso = '';
const aFecha = s => s ? new Date(String(s).replace(' ', 'T')) : null; // "2026-10-31 08:00:00" -> Date

const slug = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
const $ = s => document.querySelector(s);
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/* ===== Estado ===== */
let pedidos = [];
let vista = 'tabla';
let inicializado = false;
let cargaJsQR;
let tokenCapturaQR = 0;
let streamCapturaQR = null;
let frameCapturaQR = null;
let ref = new Date(); ref.setHours(0, 0, 0, 0);
let orden = { col: 'id', dir: -1 };
let ordenInicialPorEstado = true;

/* ===== Utilidades ===== */
const mismoDia = (a, b) => a.toDateString() === b.toDateString();
const fFecha = d => d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '—';
const fHora = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const fFH = d => d ? `${fFecha(d)} ${fHora(d)}` : '—';
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lunes = d => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const suma = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const cap = s => s[0].toUpperCase() + s.slice(1);

const tagEstado = e => `<span class="tag e-${slug(e)}">${esc(e)}</span>`;
const etiquetaEstadoHerr = e => ETIQUETAS_ESTADO_HERR[e] || e;
const requiereFechaEnvio = estado => estado === 'Completado' || estado === 'Cancelado' || estado === 'Envío parcial';
const tagHerr = e => e ? `<span class="tag h-${slug(e)}">${esc(etiquetaEstadoHerr(e))}</span>` : '';
function puntos(p) {
  return `<span class="pts">${p.detalle.filter(d => d.estado_herramienta).map(d => `<span class="pt h-${slug(d.estado_herramienta)}" title="${esc(d.herramienta)}: ${esc(etiquetaEstadoHerr(d.estado_herramienta))}"><small>${esc(etiquetaEstadoHerr(d.estado_herramienta))}</small></span>`).join('')}</span>`;
}

const puedeGestionarEnvios = () => ['gestor', 'administrador'].includes(sessionStorage.getItem('herramientas_rol'));
const esAdministradorHerramientas = () => sessionStorage.getItem('herramientas_rol') === 'administrador';

function normalizarPedido(p) {
  return {
    ...p,
    remisiones_qr: Array.isArray(p.remisiones_qr) ? p.remisiones_qr : [],
    solicitante: p.solicitante || p.solicitante_nombre || '—',
    fecha_necesidad: aFecha(p.fecha_necesidad),
    fecha_registro: aFecha(p.fecha_registro),
    fecha_entrega: aFecha(p.fecha_entrega),
    fecha_envio: aFecha(p.fecha_envio),
    detalle: (p.detalle || p.herramientas || []).map(d => ({
      ...d,
      id: d.id == null ? null : Number(d.id)
    }))
  };
}

function filtrados(aplicarFecha = vista === 'tabla') {
  const q = $('#q').value.trim().toLowerCase(), fe = $('#fEstado').value, ft = $('#fTipo').value, fh = $('#fHerr').value;
  const anio = aplicarFecha ? Number($('#fAnio').value) : 0;
  const mes = aplicarFecha ? Number($('#fMes').value) : 0;
  return pedidos.filter(p =>
    (!fe || p.estado === fe) && (!ft || p.tipo_solicitud === ft) &&
    (!fh || p.detalle.some(d => d.estado_herramienta === fh)) &&
    (!anio || (p.fecha_necesidad && p.fecha_necesidad.getFullYear() === anio)) &&
    (!mes || (p.fecha_necesidad && p.fecha_necesidad.getMonth() + 1 === mes)) &&
    (!q || [p.ot_obra, p.nombre_obra, p.puntero_asignado, p.solicitante, ...p.detalle.map(d => d.herramienta)].join(' ').toLowerCase().includes(q))
  );
}

function actualizarAnios() {
  const select = $('#fAnio');
  const seleccionado = select.value || String(new Date().getFullYear());
  const anios = new Set([new Date().getFullYear(), ...pedidos
    .filter(p => p.fecha_necesidad && !Number.isNaN(p.fecha_necesidad.getTime()))
    .map(p => p.fecha_necesidad.getFullYear())]);
  select.innerHTML = '<option value="">Todos los años</option>' +
    [...anios].sort((a, b) => b - a).map(anio => `<option value="${anio}">${anio}</option>`).join('');
  select.value = anios.has(Number(seleccionado)) ? seleccionado : String(new Date().getFullYear());
}
const delDia = (lista, d) => lista.filter(p => mismoDia(p.fecha_necesidad, d)).sort((a, b) => a.fecha_necesidad - b.fecha_necesidad);

/* ===== KPIs ===== */
function kpis(l) {
  const n = e => l.reduce((a, p) => a + p.detalle.filter(d => d.estado_herramienta === e).length, 0);
  const items = [
    ['Pedidos', l.length], ['Solicitados', l.filter(p => p.estado === 'Solicitado').length],
    ['En proceso', l.filter(p => p.estado === 'En proceso').length],
    ['Para buscar', n('Buscar')], ['Para compra', n('Para compra')], ['No disponibles', n('No disponible')]
  ];
  $('#kpis').innerHTML = items.map(([t, v]) => `<div class="kpi"><b>${v}</b><span>${t}</span></div>`).join('');
}

/* ===== Vistas ===== */
function evBtn(p, conHora = true) {
  return `<button class="ev e-${slug(p.estado)}" data-id="${p.id}" title="${esc(p.puntero_asignado)}">${conHora ? `<span class="hora">${fHora(p.fecha_necesidad)}</span> ` : ''}${esc(p.ot_obra)} · ${esc(p.puntero_asignado)}</button>`;
}

function vTabla(l) {
  const cols = [['id', 'ID'], ['ot_obra', 'OT / Obra'], ['puntero_asignado', 'Puntero'], ['solicitante', 'Solicitante'], ['tipo_solicitud', 'Tipo'],
    ['fecha_necesidad', 'Necesidad'], ['estado', 'Estado'], ['herr', 'Herramientas']];
  const v = (p, c) => c === 'herr' ? p.detalle.length : p[c];
  const o = [...l].sort((a, b) => {
    if (ordenInicialPorEstado) {
      const grupo = p => p.estado === 'Solicitado' || p.estado === 'En proceso' ? 0 : 1;
      const porGrupo = grupo(a) - grupo(b);
      if (porGrupo) return porGrupo;
      return Number(b.id) - Number(a.id);
    }
    const x = v(a, orden.col), y = v(b, orden.col);
    return (x > y ? 1 : x < y ? -1 : 0) * orden.dir;
  });
  if (!o.length) return '<div class="vacio">No hay pedidos con estos filtros. Probá quitar alguno.</div>';
  return `<div class="cont"><table><thead><tr>${cols.map(([c, t]) => `<th scope="col" data-col="${c}" tabindex="0" aria-sort="${orden.col === c ? (orden.dir > 0 ? 'ascending' : 'descending') : 'none'}" class="${orden.col === c ? (orden.dir > 0 ? 'asc' : 'desc') : ''}">${t}</th>`).join('')}</tr></thead><tbody>${
    o.map(p => {
      const filaEstado = p.estado === 'Envío parcial' ? 'fila-envio-parcial'
        : p.estado === 'Completado' ? 'fila-completada'
        : p.estado === 'Cancelado' ? 'fila-cancelada'
        : p.fecha_necesidad && p.fecha_necesidad < new Date() ? 'fila-vencida' : '';
      return `<tr tabindex="0" class="${filaEstado}" data-id="${p.id}"><td><b>${p.id}</b></td><td><b>${esc(p.ot_obra)}</b>${p.nombre_obra ? `<br><small>${esc(p.nombre_obra)}</small>` : ''}</td><td>${esc(p.puntero_asignado)}</td><td>${esc(p.solicitante)}</td><td>${esc(p.tipo_solicitud.split(' (')[0])}</td><td>${fFH(p.fecha_necesidad)}</td><td>${tagEstado(p.estado)}</td><td>${p.detalle.length} ${puntos(p)}</td></tr>`;
    }).join('')
  }</tbody></table></div>`;
}

function vMes(l) {
  const ini = lunes(new Date(ref.getFullYear(), ref.getMonth(), 1));
  const hoy = new Date();
  let h = DIAS.map(d => `<div class="dow">${cap(d)}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const d = suma(ini, i), ev = delDia(l, d);
    h += `<div class="cel${d.getMonth() !== ref.getMonth() ? ' fuera' : ''}${mismoDia(d, hoy) ? ' hoy' : ''}" data-dia="${d.toISOString()}"><span class="n">${d.getDate()}</span>${ev.slice(0, 3).map(p => evBtn(p)).join('')}${ev.length > 3 ? `<div class="mas">+${ev.length - 3} más</div>` : ''}</div>`;
    if (i === 34 && suma(ini, 35).getMonth() !== ref.getMonth()) break;
  }
  return `<div class="cal-wrap"><div class="mes">${h}</div></div>`;
}

function vSemana(l) {
  const ini = lunes(ref), hoy = new Date();
  return `<div class="cal-wrap"><div class="semana">${Array.from({ length: 7 }, (_, i) => {
    const d = suma(ini, i), ev = delDia(l, d);
    return `<div class="col${mismoDia(d, hoy) ? ' hoy' : ''}"><h3>${cap(DIAS[i])} ${d.getDate()}</h3>${ev.map(p => evBtn(p)).join('') || ''}</div>`;
  }).join('')}</div></div>`;
}

function vDia(l) {
  const ev = delDia(l, ref);
  const horas = Array.from({ length: 15 }, (_, i) => i + 6);
  const fuera = ev.filter(p => p.fecha_necesidad.getHours() < 6 || p.fecha_necesidad.getHours() > 20);
  const fila = (h, lista) => `<div class="fila"><div class="h">${String(h).padStart(2, '0')}:00</div><div>${lista.map(p => evBtn(p)).join('')}</div></div>`;
  return `<div class="dia">${horas.map(h => fila(h, ev.filter(p => p.fecha_necesidad.getHours() === h))).join('')}${fuera.length ? fila('--', fuera).replace('--:00', 'Otras') : ''}</div>${ev.length ? '' : '<div class="vacio">Sin pedidos para este día.</div>'}`;
}

/* ===== Render ===== */
function titulo() {
  if (vista === 'mes') return cap(`${MESES[ref.getMonth()]} ${ref.getFullYear()}`);
  if (vista === 'semana') { const a = lunes(ref), b = suma(a, 6); return `${a.getDate()} ${MESES[a.getMonth()].slice(0, 3)} – ${b.getDate()} ${MESES[b.getMonth()].slice(0, 3)} ${b.getFullYear()}`; }
  return `${DIAS[(ref.getDay() + 6) % 7]} ${fFecha(ref)}`;
}

function pedidosDelPeriodo(lista) {
  if (vista === 'semana') {
    const inicio = lunes(ref);
    const fin = suma(inicio, 7);
    return lista.filter(p => p.fecha_necesidad >= inicio && p.fecha_necesidad < fin)
      .sort((a, b) => a.fecha_necesidad - b.fecha_necesidad);
  }
  return delDia(lista, ref);
}

async function imprimirPeriodo() {
  if (!puedeGestionarEnvios()) return;
  const lista = pedidosDelPeriodo(filtrados());
  const esDia = vista === 'dia';
  const periodo = esDia ? `Programación diaria · ${titulo()}` : `Programación semanal · ${titulo()}`;
  const grupos = lista.map(p => {
    const pedidoInfo = `<strong>${esc(p.ot_obra)}${p.nombre_obra ? ` · ${esc(p.nombre_obra)}` : ''}</strong><br>
      <small>Pedido #${esc(p.id)} · ${esc(p.estado) || '—'}</small><br>
      <small>Puntero: ${esc(p.puntero_asignado) || '—'} · Solicitante: ${esc(p.solicitante) || '—'}</small><br>
      <small>Tipo: ${esc(p.tipo_solicitud) || '—'} · Traslado: ${p.necesita_traslado ? 'Sí' : 'No'}</small><br>
      <small>Registrado: ${fFH(p.fecha_registro)} · Entrega: ${fFH(p.fecha_entrega)} · Envío: ${fFH(p.fecha_envio)}</small><br>
      <small>Obs. pedido: ${esc(p.observaciones) || '—'}</small>`;
    const detalles = p.detalle.length ? p.detalle : [null];
    return `<tbody class="imp-grupo">${detalles.map((d, index) => `<tr>
      ${index === 0 ? `<td rowspan="${detalles.length}" class="imp-fecha">${fFecha(p.fecha_necesidad)}<br><strong>${fHora(p.fecha_necesidad)}</strong></td><td rowspan="${detalles.length}" class="imp-pedido-info">${pedidoInfo}</td>` : ''}
      ${d ? `<td class="imp-herramienta">${esc(d.herramienta) || '—'}</td><td>${esc(d.cantidad ?? '—')}</td><td>${esc(d.unidad_medida) || '—'}</td><td>${esc(etiquetaEstadoHerr(d.estado_herramienta || '')) || '—'}</td><td>${esc(d.observacion) || '—'}</td>` : '<td colspan="5">Sin herramientas registradas</td>'}
    </tr>`).join('')}</tbody>`;
  }).join('');
  const cantidadHerramientas = lista.reduce((total, p) => total + p.detalle.length, 0);
  $('#impresion').className = esDia ? 'imp-dia' : 'imp-semana';
  $('#impresion').setAttribute('role', 'dialog');
  $('#impresion').setAttribute('aria-modal', 'true');
  $('#impresion').setAttribute('aria-label', 'Vista previa de impresión');
  $('#impresion').innerHTML = `<div class="imp-preview-toolbar" role="toolbar" aria-label="Acciones de impresión">
      <strong>Vista previa A4 · ${esDia ? 'Día' : 'Semana'}</strong>
      <div><button type="button" id="cerrarPrevisualizacion">Volver al reporte</button><button type="button" id="imprimirPrevisualizacion">Imprimir</button></div>
    </div><div class="imp-pagina"><header class="imp-membrete">
      <img class="imp-logo" src="../../img/Logo%20MV%20Vertical%20SAE.png" alt="Logotipo de Metalúrgica Vera S.A.E.">
      <div class="imp-empresa"><strong>Metalúrgica Vera S.A.E.</strong><span>Confiabilidad, disponibilidad y eficiencia de los equipos e instalaciones industriales.</span></div>
      <div class="imp-documento"><strong>GESTIÓN OPERATIVA</strong><span>REPORTE DE HERRAMIENTAS</span><small>${esDia ? 'Programación diaria' : 'Programación semanal'}</small></div>
    </header><header class="imp-cabecera"><h1>Programación de herramientas</h1><h2>${esc(periodo)}</h2><p>${lista.length} pedidos · ${cantidadHerramientas} herramientas · Impreso el ${fFH(new Date())}</p></header>
    <table class="imp-tabla-programacion"><thead><tr><th>Fecha / hora</th><th>Pedido y asignación</th><th>Herramienta solicitada</th><th>Cant.</th><th>Unidad</th><th>Estado herramienta</th><th>Observación de herramienta</th></tr></thead>${grupos || '<tbody><tr><td colspan="7">No hay pedidos en este periodo con los filtros actuales.</td></tr></tbody>'}</table></div>`;
  const logo = $('#impresion .imp-logo');
  if (logo && !logo.complete) await new Promise(resolve => { logo.onload = resolve; logo.onerror = resolve; });
  $('#cerrarPrevisualizacion').addEventListener('click', () => {
    document.body.classList.remove('imprimiendo-reporte');
    $('#impresion').removeAttribute('role');
    $('#impresion').removeAttribute('aria-modal');
  });
  $('#imprimirPrevisualizacion').addEventListener('click', () => window.print());
  document.body.classList.add('imprimiendo-reporte');
}

function render() {
  const l = filtrados();
  kpis(filtrados(false));
  $('#vista').innerHTML = { tabla: vTabla, mes: vMes, semana: vSemana, dia: vDia }[vista](l);
  $('#nav').classList.toggle('oculto', vista === 'tabla');
  $('#imprimir').hidden = !['semana', 'dia'].includes(vista) || !puedeGestionarEnvios();
  $('#imprimir').textContent = vista === 'dia' ? 'Imprimir día A4' : 'Imprimir semana A4';
  $('#nav .titulo')?.remove();
  if (vista !== 'tabla') $('#hoy').insertAdjacentHTML('beforebegin', `<span class="titulo">${titulo()}</span>`);
  document.querySelectorAll('#tabs button').forEach(b => {
    const selected = b.dataset.vista === vista;
    b.classList.toggle('on', selected);
    b.setAttribute('aria-selected', String(selected));
    b.tabIndex = selected ? 0 : -1;
  });
  $('#vista').setAttribute('aria-labelledby', `tab-${vista}`);
  const ayudaEnvio = puedeGestionarEnvios() ? ' · Clic derecho sobre un pedido para registrar el envío' : '';
  const descripcionOrden = ordenInicialPorEstado
    ? 'Solicitados y en proceso primero · ID decreciente'
    : `ordenados por ${orden.col.replace('_', ' ')} ${orden.dir > 0 ? 'ascendente' : 'descendente'}`;
  $('#rango').textContent = `${l.length} pedidos · ${descripcionOrden}${ayudaEnvio}${aviso}`;
}

function detalle(id) {
  const p = pedidos.find(x => x.id === +id); if (!p) return;
  $('#modalBody').innerHTML = `<div class="m">
    <div class="envio-modal-header">
      <h2>${esc(p.ot_obra)} · Pedido #${p.id}</h2>
      <div class="envio-acciones">
        <button class="btn-guardar" id="editarPedido" data-id="${p.id}" type="button" hidden>Editar</button>
        <button class="cerrar" id="cerrar" type="button">Cerrar</button>
      </div>
    </div>
    <div class="pedido-estado-general"><b>Estado del pedido</b>${tagEstado(p.estado)}</div>
    <dl><dt>Nombre de la obra</dt><dd>${esc(p.nombre_obra) || '—'}</dd><dt>Puntero asignado</dt><dd>${esc(p.puntero_asignado)}</dd><dt>Solicitante</dt><dd>${esc(p.solicitante)}</dd>
    <dt>Tipo de solicitud</dt><dd>${esc(p.tipo_solicitud)}</dd><dt>Necesita traslado</dt><dd>${p.necesita_traslado ? 'Sí' : 'No'}</dd>
    <dt>Fecha de necesidad</dt><dd>${fFH(p.fecha_necesidad)}</dd><dt>Registrado</dt><dd>${fFH(p.fecha_registro)}</dd>
    <dt>Entrega</dt><dd>${fFH(p.fecha_entrega)}</dd><dt>Envío</dt><dd>${requiereFechaEnvio(p.estado) ? fFH(p.fecha_envio) : '—'}</dd>
    <dt>Observaciones</dt><dd>${esc(p.observaciones) || '—'}</dd></dl>
    <section class="remisiones-qr-field remisiones-qr-readonly" aria-labelledby="tituloRemisionesDetalle">
      <strong id="tituloRemisionesDetalle">Remisiones</strong>
      ${renderListaRemisiones(p.remisiones_qr)}
    </section>
    <table><thead><tr><th scope="col">Herramienta</th><th scope="col">Cant.</th><th scope="col">Unidad</th><th scope="col">Estado</th><th scope="col">Nota</th></tr></thead><tbody>${
      p.detalle.map(d => `<tr><td>${esc(d.herramienta)}</td><td>${d.cantidad}</td><td>${esc(d.unidad_medida) || '—'}</td><td>${tagHerr(d.estado_herramienta)}</td><td>${esc(d.observacion) || '—'}</td></tr>`).join('')
    }</tbody></table></div>`;
  $('#editarPedido').hidden = !puedeGestionarEnvios();
  $('#modal').showModal();
}

function urlRemisionSegura(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function renderListaRemisiones(remisiones) {
  if (!remisiones.length) return '<p class="remision-vacia">Todavía no hay remisiones cargadas.</p>';
  return `<ol class="remisiones-lista">${remisiones.map((remision, index) => {
    const url = urlRemisionSegura(remision.url);
    const origen = remision.origen === 'lectura' ? 'Leído con cámara' : 'Subido desde imagen';
    const fecha = remision.cargado_en ? new Date(remision.cargado_en) : null;
    const fechaTexto = fecha && !Number.isNaN(fecha.getTime()) ? fecha.toLocaleString('es-PY') : '';
    return `<li class="remision-item">
      <div><strong>Remisión ${index + 1}</strong><small>${origen}${fechaTexto ? ` · ${esc(fechaTexto)}` : ''}</small></div>
      ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Remisión ${index + 1}</a>` : '<span>Enlace QR no válido</span>'}
    </li>`;
  }).join('')}</ol>`;
}

function campoRemisiones(pedido) {
  return `<section class="remisiones-qr-field" aria-labelledby="tituloRemisionesQR">
    <div class="remisiones-qr-heading">
      <div><strong id="tituloRemisionesQR">Remisiones</strong><small>Cada QR se guarda como una remisión independiente al leerlo o cargarlo.</small></div>
      <div class="remisiones-qr-actions">
        <button type="button" id="leerQrRemision">Leer QR</button>
        <button type="button" id="subirQrRemision">Subir QR</button>
        <input id="archivoQrRemision" type="file" accept="image/*" multiple hidden>
      </div>
    </div>
    <div id="lectorQrRemision" class="lector-qr-remision" hidden>
      <video id="videoQrRemision" muted playsinline></video>
      <div><p id="estadoLectorQr" role="status" aria-live="polite"></p><button type="button" id="cancelarLecturaQr">Cancelar lectura</button></div>
    </div>
    <p id="mensajeRemisionesQR" class="mensaje-remisiones-qr" role="status" aria-live="polite"></p>
    <div id="listaRemisionesQR">${renderListaRemisiones(pedido.remisiones_qr)}</div>
  </section>`;
}

function mensajeRemisiones(texto, error = false) {
  const mensaje = $('#mensajeRemisionesQR');
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.classList.toggle('error', error);
}

function bloquearAccionesQR(bloquear) {
  const leer = $('#leerQrRemision');
  const subir = $('#subirQrRemision');
  if (leer) leer.disabled = bloquear;
  if (subir) subir.disabled = bloquear;
}

function cargarJsQR() {
  if (window.jsQR) return Promise.resolve(window.jsQR);
  if (!cargaJsQR) {
    cargaJsQR = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => window.jsQR ? resolve(window.jsQR) : reject(new Error('No se pudo iniciar el lector QR.'));
      script.onerror = () => reject(new Error('No se pudo cargar el lector QR.'));
      document.head.appendChild(script);
    }).catch(error => {
      cargaJsQR = null;
      throw error;
    });
  }
  return cargaJsQR;
}

function detenerLecturaQR() {
  tokenCapturaQR += 1;
  if (frameCapturaQR !== null) cancelAnimationFrame(frameCapturaQR);
  frameCapturaQR = null;
  if (streamCapturaQR) streamCapturaQR.getTracks().forEach(track => track.stop());
  streamCapturaQR = null;
  const video = $('#videoQrRemision');
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  const lector = $('#lectorQrRemision');
  if (lector) lector.hidden = true;
}

async function guardarRemisionQR(pedidoId, url, origen) {
  const response = await API_FETCH(`/api/pedidos/${pedidoId}/remisiones`, {
    method: 'POST',
    headers: API_JSON_HEADERS,
    body: JSON.stringify({ url, origen })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.errores?.join(' ') || result.error || 'No se pudo guardar la remisión.');

  const pedido = pedidos.find(item => item.id === pedidoId);
  if (pedido) {
    pedido.remisiones_qr = Array.isArray(result.remisiones_qr) ? result.remisiones_qr : [];
    const lista = $('#listaRemisionesQR');
    if (lista) lista.innerHTML = renderListaRemisiones(pedido.remisiones_qr);
  }
}

async function iniciarLecturaQR(pedidoId) {
  detenerLecturaQR();
  const token = tokenCapturaQR;
  const lector = $('#lectorQrRemision');
  const estado = $('#estadoLectorQr');
  lector.hidden = false;
  estado.textContent = 'Preparando cámara…';
  mensajeRemisiones('');
  bloquearAccionesQR(true);

  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador no permite acceder a la cámara.');
    const decoder = await cargarJsQR();
    if (token !== tokenCapturaQR) return;
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    if (token !== tokenCapturaQR) {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    streamCapturaQR = stream;
    const video = $('#videoQrRemision');
    video.srcObject = stream;
    await video.play();
    estado.textContent = 'Enfoca el código QR de la remisión.';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const escanear = async () => {
      if (token !== tokenCapturaQR) return;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const codigo = decoder(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, {
          inversionAttempts: 'attemptBoth'
        });
        if (codigo) {
          detenerLecturaQR();
          try {
            const url = urlRemisionSegura(codigo.data);
            if (!url) throw new Error('El QR debe contener un enlace HTTP o HTTPS válido.');
            await guardarRemisionQR(pedidoId, url, 'lectura');
            mensajeRemisiones('Remisión guardada.');
          } catch (error) {
            mensajeRemisiones(error.message || 'No se pudo guardar la remisión.', true);
          } finally {
            bloquearAccionesQR(false);
          }
          return;
        }
      }
      frameCapturaQR = requestAnimationFrame(escanear);
    };
    frameCapturaQR = requestAnimationFrame(escanear);
  } catch (error) {
    detenerLecturaQR();
    bloquearAccionesQR(false);
    mensajeRemisiones(error.message || 'No se pudo iniciar la lectura QR.', true);
  }
}

async function leerQRDeArchivo(file) {
  const decoder = await cargarJsQR();
  if (typeof createImageBitmap !== 'function') throw new Error('Este navegador no permite leer imágenes QR.');
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const codigo = decoder(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, {
      inversionAttempts: 'attemptBoth'
    });
    if (!codigo) throw new Error('No se encontró un QR legible en la imagen.');
    const url = urlRemisionSegura(codigo.data);
    if (!url) throw new Error('El QR debe contener un enlace HTTP o HTTPS válido.');
    return url;
  } finally {
    image.close();
  }
}

async function subirImagenesQR(files, pedidoId) {
  const seleccionados = Array.from(files || []);
  if (!seleccionados.length) return;
  bloquearAccionesQR(true);
  let guardadas = 0;
  const errores = [];
  try {
    for (const [index, file] of seleccionados.entries()) {
      mensajeRemisiones(`Leyendo imagen ${index + 1} de ${seleccionados.length}…`);
      try {
        const url = await leerQRDeArchivo(file);
        await guardarRemisionQR(pedidoId, url, 'subida');
        guardadas += 1;
      } catch (error) {
        errores.push(`${file.name}: ${error.message || 'no se pudo leer.'}`);
      }
    }
    const resumen = guardadas ? `${guardadas} remisión(es) guardada(s).` : '';
    mensajeRemisiones([resumen, ...errores].filter(Boolean).join(' '), errores.length > 0);
  } finally {
    bloquearAccionesQR(false);
  }
}

function valorFechaLocal(fecha) {
  const d = fecha || new Date();
  const dos = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

function abrirModalEnvio(pedidoId) {
  const pedido = pedidos.find(p => p.id === Number(pedidoId));
  if (!pedido || !puedeGestionarEnvios()) return;
  const tieneIdsReales = pedido.detalle.length > 0 &&
    pedido.detalle.every(item => Number.isSafeInteger(item.id) && item.id > 0);
  const puedeGuardar = tieneIdsReales && puedeGestionarEnvios();
  const esAdmin = esAdministradorHerramientas();
  const estadoTerminal = ['Completado', 'Cancelado'].includes(pedido.estado);
  const bloquearEstado = !esAdmin && estadoTerminal;

  const pedidoEstadoOpciones = ESTADOS.map(estado =>
    `<option value="${esc(estado)}"${estado === pedido.estado ? ' selected' : ''}${!esAdmin && pedido.estado !== 'Solicitado' && estado === 'Solicitado' ? ' disabled' : ''}>${esc(estado)}</option>`
  ).join('');
  const mostrarFechaEnvio = requiereFechaEnvio(pedido.estado);
  const detalle = pedido.detalle.map((item, index) => {
    const estados = ESTADOS_HERR.map(estado =>
      `<option value="${esc(estado)}"${estado === item.estado_herramienta ? ' selected' : ''}>${esc(etiquetaEstadoHerr(estado))}</option>`
    ).join('');
    const estadoActualVacio = item.estado_herramienta == null;
    return `<tr>
      <td>${esc(item.herramienta)}</td>
      <td>${item.cantidad}</td>
      <td>${esc(item.unidad_medida) || '—'}</td>
      <td><select name="estadoHerramienta" aria-label="Estado de ${esc(item.herramienta)}"
        data-herramienta-id="${item.id ?? `preview-${index}`}"
        data-estado-original="${esc(item.estado_herramienta)}">${estadoActualVacio ? '<option value="" selected aria-label="Sin estado asignado"></option>' : ''}${estados}</select></td>
      <td><div class="nota-actual">${esc(item.observacion) || '—'}</div>
        <textarea name="notaHerramienta" data-nota-herramienta-id="${item.id ?? `preview-${index}`}" maxlength="300"
          aria-label="Agregar nota para ${esc(item.herramienta)}"
          placeholder="Agregar nota; se conservará la anterior"></textarea></td>
    </tr>`;
  }).join('');
  $('#modalEnvioBody').innerHTML = `<div class="m">
    <div class="envio-modal-header">
      <h2>${esc(pedido.ot_obra)} · Pedido #${pedido.id}</h2>
      <div class="envio-acciones">
        <button id="guardarEnvio" class="btn-guardar" type="submit" form="formEnvio"${puedeGuardar ? '' : ' disabled'}>Guardar</button>
        <button class="cerrar" id="cerrarEnvio" type="button">Cerrar</button>
      </div>
    </div>
    ${puedeGuardar ? '' : `<p class="envio-preview" role="status">${tieneIdsReales ? 'Vista previa: inicia sesión como gestor o administrador para guardar.' : 'Vista previa con datos de ejemplo: el guardado está deshabilitado.'}</p>`}
    <form id="formEnvio" class="envio-form" data-pedido-id="${pedido.id}" data-estado-original="${esc(pedido.estado)}">
      <div class="pedido-estado-general">
        <label for="estadoPedido">Estado general del pedido</label>
        <select id="estadoPedido" name="estadoPedido" required${bloquearEstado ? ' disabled' : ''}>${pedidoEstadoOpciones}</select>
        ${bloquearEstado ? '<small>No tienes autorización para cambiar el estado de este pedido.</small>' : ''}
      </div>
      ${campoRemisiones(pedido)}
      <dl><dt>Nombre de la obra</dt><dd>${esc(pedido.nombre_obra) || '—'}</dd><dt>Puntero asignado</dt><dd>${esc(pedido.puntero_asignado)}</dd><dt>Solicitante</dt><dd>${esc(pedido.solicitante)}</dd>
      <dt>Tipo de solicitud</dt><dd>${esc(pedido.tipo_solicitud)}</dd><dt>Necesita traslado</dt><dd>${pedido.necesita_traslado ? 'Sí' : 'No'}</dd>
      <dt>Fecha de necesidad</dt><dd>${fFH(pedido.fecha_necesidad)}</dd><dt>Registrado</dt><dd>${fFH(pedido.fecha_registro)}</dd>
      <dt>Entrega registrada</dt><dd>${fFH(pedido.fecha_entrega)}</dd>
      <dt id="fechaEnvioEtiqueta"${mostrarFechaEnvio ? '' : ' hidden'}>Fecha de envío</dt>
      <dd id="fechaEnvioCampo"${mostrarFechaEnvio ? '' : ' hidden'}><input id="fechaEnvio" name="fechaEnvio" type="datetime-local" value="${mostrarFechaEnvio ? valorFechaLocal(pedido.fecha_envio) : ''}"${mostrarFechaEnvio ? ' required' : ''}></dd>
      <dt>Observaciones</dt><dd>${esc(pedido.observaciones) || '—'}</dd></dl>
      <div class="cont"><table><thead><tr><th scope="col">Herramienta</th><th scope="col">Cant.</th><th scope="col">Unidad</th><th scope="col">Estado</th><th scope="col">Nota</th></tr></thead>
      <tbody>${detalle}</tbody></table></div>
      <p id="mensajeEnvio" role="alert" aria-live="polite"></p>
    </form>
  </div>`;

  const modal = $('#modalEnvio');
  modal.showModal();
  $('#estadoPedido').focus({ preventScroll: true });
}

function actualizarFechaEnvio() {
  const mostrar = requiereFechaEnvio($('#estadoPedido').value);
  const fecha = $('#fechaEnvio');
  $('#fechaEnvioEtiqueta').hidden = !mostrar;
  $('#fechaEnvioCampo').hidden = !mostrar;
  fecha.required = mostrar;
  if (!mostrar) {
    fecha.value = '';
  } else if (!fecha.value) {
    fecha.value = valorFechaLocal(null);
  }
}

async function guardarEnvio(event) {
  event.preventDefault();
  detenerLecturaQR();
  const form = event.target;
  const submit = $('#guardarEnvio');
  const mensaje = $('#mensajeEnvio');
  const pedidoId = Number(form.dataset.pedidoId);
  const estadoPedido = form.elements.estadoPedido.value;
  const estadoOriginal = form.dataset.estadoOriginal;
  const rol = sessionStorage.getItem('herramientas_rol');
  if (rol === 'gestor' && estadoPedido === 'Solicitado' && estadoOriginal !== 'Solicitado') {
    mensaje.textContent = 'El gestor no puede volver un pedido al estado Solicitado.';
    return;
  }
  if (['Completado', 'Cancelado'].includes(estadoPedido) && estadoPedido !== estadoOriginal &&
      !window.confirm(`¿Confirma que desea marcar el pedido como ${estadoPedido}? Después, se requerirá autorización especial para cambiarlo.`)) {
    return;
  }
  const herramientas = Array.from(form.querySelectorAll('[data-herramienta-id]'), select => ({
    id: Number(select.dataset.herramientaId),
    estadoHerramienta: select.value || select.dataset.estadoOriginal || null,
    nota: form.querySelector(`[data-nota-herramienta-id="${select.dataset.herramientaId}"]`)?.value || ''
  }));
  const fechaEnvio = form.elements.fechaEnvio.value;
  submit.disabled = true;
  mensaje.textContent = '';

  try {
    const response = await API_FETCH(`/api/pedidos/${pedidoId}/envio`, {
      method: 'PATCH',
      headers: API_JSON_HEADERS,
      body: JSON.stringify({ estadoPedido, herramientas, fechaEnvio })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.errores?.join(' ') || result.error || 'No se pudo guardar el envío.');

    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      pedido.fecha_envio = aFecha(result.fechaEnvio);
      pedido.fecha_entrega = aFecha(result.fechaEntrega);
      pedido.estado = result.estado;
      for (const herramienta of result.herramientas) {
        const item = pedido.detalle.find(d => d.id === herramienta.id);
        if (item) {
          item.estado_herramienta = herramienta.estadoHerramienta;
          item.observacion = herramienta.observacion;
        }
      }
    }
    $('#modalEnvio').close();
    render();
  } catch (error) {
    mensaje.textContent = error instanceof TypeError
      ? 'No se pudo conectar con el servicio de herramientas.'
      : error.message || 'No se pudo guardar el envío.';
  } finally {
    submit.disabled = false;
  }
}

/* ===== Eventos ===== */
function mover(n) {
  if (vista === 'mes') ref = new Date(ref.getFullYear(), ref.getMonth() + n, 1);
  else ref = suma(ref, vista === 'semana' ? 7 * n : n);
  render();
}

function init() {
  if (inicializado) {
    render();
    return;
  }
  inicializado = true;
  const llenar = (id, arr) => $(id).insertAdjacentHTML('beforeend', arr.map(x => `<option>${esc(x)}</option>`).join(''));
  llenar('#fEstado', ESTADOS); llenar('#fTipo', TIPOS);
  $('#fHerr').insertAdjacentHTML('beforeend', ESTADOS_HERR.map(estado =>
    `<option value="${esc(estado)}">${esc(etiquetaEstadoHerr(estado))}</option>`
  ).join(''));
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { vista = b.dataset.vista; render(); } });
  $('#tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = [...$('#tabs').querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(e.target);
    if (index < 0) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 :
      (index + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length;
    tabs[next].focus();
    vista = tabs[next].dataset.vista;
    render();
  });
  $('#prev').onclick = () => mover(-1); $('#next').onclick = () => mover(1);
  $('#hoy').onclick = () => { ref = new Date(); ref.setHours(0, 0, 0, 0); render(); };
  $('#imprimir').addEventListener('click', imprimirPeriodo);
  ['#q', '#fEstado', '#fTipo', '#fHerr'].forEach(s => $(s).addEventListener('input', render));
  ['#fAnio', '#fMes'].forEach(s => $(s).addEventListener('change', render));
  $('#vista').addEventListener('click', e => {
    const th = e.target.closest('th[data-col]');
    if (th) {
      ordenInicialPorEstado = false;
      orden = { col: th.dataset.col, dir: orden.col === th.dataset.col ? -orden.dir : 1 };
      return render();
    }
    const el = e.target.closest('[data-id]'); if (el) return detalle(el.dataset.id);
    const c = e.target.closest('[data-dia]'); if (c) { ref = new Date(c.dataset.dia); vista = 'dia'; render(); }
  });
  $('#vista').addEventListener('contextmenu', e => {
    const el = e.target.closest('[data-id]');
    if (!el || !puedeGestionarEnvios()) return;
    e.preventDefault();
    abrirModalEnvio(el.dataset.id);
  });
  $('#vista').addEventListener('keydown', e => { const tr = e.target.closest('tr[data-id]'); if (tr && e.key === 'Enter') detalle(tr.dataset.id); });
  $('#vista').addEventListener('keydown', e => {
    const th = e.target.closest('th[data-col]');
    if (!th || !['Enter', ' '].includes(e.key)) return;
    e.preventDefault();
    ordenInicialPorEstado = false;
    orden = { col: th.dataset.col, dir: orden.col === th.dataset.col ? -orden.dir : 1 };
    render();
    $('#vista th[data-col="' + CSS.escape(orden.col) + '"]')?.focus();
  });
  $('#modal').addEventListener('click', e => {
    if (e.target.id === 'modal' || e.target.id === 'cerrar') {
      $('#modal').close();
    } else if (e.target.id === 'editarPedido') {
      $('#modal').close();
      abrirModalEnvio(e.target.dataset.id);
    }
  });
  $('#modalEnvio').addEventListener('click', e => {
    if (e.target.id === 'modalEnvio' || e.target.id === 'cerrarEnvio') {
      detenerLecturaQR();
      $('#modalEnvio').close();
    } else if (e.target.id === 'leerQrRemision') {
      iniciarLecturaQR(Number($('#formEnvio').dataset.pedidoId));
    } else if (e.target.id === 'subirQrRemision') {
      $('#archivoQrRemision').click();
    } else if (e.target.id === 'cancelarLecturaQr') {
      detenerLecturaQR();
      bloquearAccionesQR(false);
      mensajeRemisiones('Lectura cancelada.');
    }
  });
  $('#modalEnvio').addEventListener('change', e => {
    if (e.target.id === 'estadoPedido') {
      actualizarFechaEnvio();
    } else if (e.target.matches('[name="estadoHerramienta"]') && e.target.value) {
      const form = e.target.closest('#formEnvio');
      if (form?.dataset.estadoOriginal === 'Solicitado') {
        $('#estadoPedido').value = 'En proceso';
        actualizarFechaEnvio();
      }
    } else if (e.target.id === 'archivoQrRemision') {
      const form = e.target.closest('#formEnvio');
      subirImagenesQR(e.target.files, Number(form.dataset.pedidoId));
      e.target.value = '';
    }
  });
  $('#modalEnvio').addEventListener('close', detenerLecturaQR);
  $('#modalEnvio').addEventListener('submit', guardarEnvio);
  const hoy = new Date();
  $('#fMes').value = String(hoy.getMonth() + 1);
  actualizarAnios();
  $('#fAnio').value = String(hoy.getFullYear());
  render();
}

async function cargar() {
  aviso = '';
  if (!sessionStorage.getItem('herramientas_token')) {
    pedidos = [];
    aviso = ' · Inicia sesión para consultar los pedidos.';
    init();
    return;
  }

  try {
    const res = await API_FETCH('/api/pedidos?limit=200');
    const data = await res.json();
    if (!res.ok) throw new Error(data.errores?.join(' ') || data.error || 'No se pudieron cargar los pedidos.');
    if (!Array.isArray(data)) throw new TypeError('La API devolvió una lista de pedidos no válida.');
    pedidos = data.map(normalizarPedido);
  } catch (err) {
    console.error(err);
    aviso = ` · ${err.message || 'No se pudieron cargar los pedidos desde la API.'}`;
    pedidos = [];
  }
  if (inicializado) actualizarAnios();
  init();
}
document.addEventListener('herramientas:auth-change', cargar);
cargar();
