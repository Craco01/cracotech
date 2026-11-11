'use strict';
/* Usa globals de dashboard-data.js: pedidos, ESTADOS, ESTADOS_HERR, TIPOS, esc, lunes, suma, fFH, $ */

const COLOR = {
  'Solicitado': 'var(--buscar)', 'En proceso': 'var(--cobre-claro)', 'Envío parcial': '#b88900', 'Completado': 'var(--ok)', 'Cancelado': 'var(--tenue)',
  'Disponible': 'var(--ok)', 'No disponible': 'var(--no)', 'Buscar': 'var(--buscar)', 'Para compra': 'var(--compra)'
};

function barras(titulo, filas) {
  const max = Math.max(1, ...filas.map(f => f[1]));
  const cuerpo = filas.length ? filas.map(([l, v, c]) =>
    `<div class="mx-fila"><span class="mx-l" title="${esc(l)}">${esc(l)}</span><span class="mx-b"><i style="width:${v / max * 100}%;background:${c || 'var(--cobre)'}"></i></span><b>${v}</b></div>`).join('')
    : '<p class="vacio">Sin datos</p>';
  return `<article class="mx-card"><h3>${titulo}</h3>${cuerpo}</article>`;
}

function contar(arr, clave) {
  const m = new Map();
  arr.forEach(x => { const k = clave(x); m.set(k, (m.get(k) || 0) + 1); });
  return m;
}

function calcular() {
  const activos = pedidos.filter(p => p.estado === 'Solicitado' || p.estado === 'En proceso' || p.estado === 'Envío parcial');
  const items = pedidos.flatMap(p => p.detalle.map(d => ({ ...d, p })));
  const unidades = items.reduce((a, d) => a + d.cantidad, 0);
  const entregados = pedidos.filter(p => (p.estado === 'Completado' || p.estado === 'Envío parcial') && p.fecha_entrega);
  const aTiempo = entregados.filter(p => p.fecha_entrega <= p.fecha_necesidad).length;
  const porGestionar = items.filter(d => d.p.estado !== 'Cancelado' && d.p.estado !== 'Completado' && (d.estado_herramienta === 'Buscar' || d.estado_herramienta === 'Para compra')).length;

  $('#mxKpis').innerHTML = [
    ['Pedidos', pedidos.length], ['Activos', activos.length], ['Unidades pedidas', unidades],
    ['Entregas a tiempo', entregados.length ? Math.round(aTiempo / entregados.length * 100) + '%' : '—'],
    ['Ítems por buscar o comprar', porGestionar]
  ].map(([t, v]) => `<div class="kpi"><b>${v}</b><span>${t}</span></div>`).join('');

  // Por estado de pedido y de herramienta
  const pe = contar(pedidos, p => p.estado);
  const he = contar(items, d => d.estado_herramienta);

  // Por tipo
  const pt = contar(pedidos, p => p.tipo_solicitud);

  // Top herramientas por cantidad
  const ct = new Map();
  items.forEach(d => ct.set(d.herramienta, (ct.get(d.herramienta) || 0) + d.cantidad));
  const top = [...ct].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => [k, v]);

  // Carga por puntero
  const pp = [...contar(pedidos, p => p.puntero_asignado)].sort((a, b) => b[1] - a[1]);

  // Pedidos por semana de necesidad dentro del mes seleccionado.
  const hoy = new Date();
  const anioSeleccionado = Number($('#filtroAnioPanel').value) || hoy.getFullYear();
  const mesSeleccionado = Number($('#filtroMesPanel').value);
  const inicioPeriodo = mesSeleccionado
    ? new Date(anioSeleccionado, mesSeleccionado - 1, 1)
    : hoy;
  const ini = mesSeleccionado ? lunes(inicioPeriodo) : suma(lunes(hoy), -14);
  const semanas = Array.from({ length: 6 }, (_, i) => {
    const a = suma(ini, i * 7), b = suma(a, 7);
    const actual = hoy >= a && hoy < b;
    return { a, n: pedidos.filter(p => p.fecha_necesidad >= a && p.fecha_necesidad < b).length, act: actual };
  });
  const maxS = Math.max(1, ...semanas.map(s => s.n));
  const cols = `<article class="mx-card"><h3>Pedidos por semana (fecha de necesidad)</h3><div class="mx-cols">${
    semanas.map(s => `<div class="mx-c${s.act ? ' act' : ''}"><b>${s.n}</b><i style="height:${s.n / maxS * 78}%"></i><span>${String(s.a.getDate()).padStart(2, '0')}/${String(s.a.getMonth() + 1).padStart(2, '0')}</span></div>`).join('')
  }</div></article>`;

  // Próximos vencimientos
  const ahora = new Date();
  const prox = [...activos].sort((a, b) => a.fecha_necesidad - b.fecha_necesidad).slice(0, 6);
  const cuando = d => {
    const h = Math.round((d - ahora) / 36e5);
    if (h < 0) return `<span class="venc">vencido hace ${Math.abs(h) < 48 ? Math.abs(h) + ' h' : Math.round(Math.abs(h) / 24) + ' d'}</span>`;
    return h < 48 ? `en ${h} h` : `en ${Math.round(h / 24)} d`;
  };
  const lista = `<article class="mx-card"><h3>Próximos a entregar</h3>${prox.length
    ? `<ul class="mx-prox">${prox.map(p => `<li><span><b>${esc(p.ot_obra)}</b> · ${esc(p.puntero_asignado)}<br><small>${fFH(p.fecha_necesidad)}</small></span><span>${cuando(p.fecha_necesidad)}</span></li>`).join('')}</ul>`
    : '<p class="vacio">No hay pedidos activos.</p>'}</article>`;

  $('#mxGrid').innerHTML =
    barras('Pedidos por estado', ESTADOS.map(e => [e, pe.get(e) || 0, COLOR[e]])) +
    barras('Herramientas por estado', ESTADOS_HERR.map(e => [e, he.get(e) || 0, COLOR[e]])) +
    lista + cols +
    barras('Pedidos por tipo de solicitud', TIPOS.map(t => [t.split(' (')[0], pt.get(t) || 0])) +
    barras('Herramientas más pedidas (unidades)', top) +
    barras('Pedidos por puntero', pp);
}
