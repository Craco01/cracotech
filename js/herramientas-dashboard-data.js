'use strict';

const ESTADOS = ['Solicitado', 'En proceso', 'Completado', 'Cancelado'];
const TIPOS = [
  'Herramientas para Ingreso a Obra',
  'Reposición de Herramientas (Herramientas averiadas o extraviadas)',
  'Herramientas Adicionales',
  'Herramientas para Puntero Nuevo'
];
const ESTADOS_HERR = ['Disponible', 'No disponible', 'Buscar', 'Para compra'];
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
}[char]));
const lunes = date => {
  const result = new Date(date);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
};
const suma = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};
const fFH = date => date
  ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  : '—';

let pedidos = [];
let todosPedidos = [];

function actualizarFiltroFecha() {
  if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) return;
  const anio = Number($('#filtroAnioPanel').value);
  const mes = Number($('#filtroMesPanel').value);
  pedidos = todosPedidos.filter(p =>
    p.fecha_necesidad &&
    !Number.isNaN(p.fecha_necesidad.getTime()) &&
    (!anio || p.fecha_necesidad.getFullYear() === anio) &&
    (!mes || p.fecha_necesidad.getMonth() + 1 === mes)
  );
  calcular();
}

function prepararFiltrosFecha() {
  const anioSelect = $('#filtroAnioPanel');
  const anioSeleccionado = anioSelect.value || String(new Date().getFullYear());
  const anios = new Set([new Date().getFullYear(), ...todosPedidos
    .filter(p => p.fecha_necesidad && !Number.isNaN(p.fecha_necesidad.getTime()))
    .map(p => p.fecha_necesidad.getFullYear())]);
  anioSelect.innerHTML = '<option value="">Todos los años</option>' +
    [...anios].sort((a, b) => b - a).map(anio => `<option value="${anio}">${anio}</option>`).join('');
  anioSelect.value = anios.has(Number(anioSeleccionado)) ? anioSeleccionado : String(new Date().getFullYear());

  const mesSelect = $('#filtroMesPanel');
  if (!mesSelect.value) mesSelect.value = String(new Date().getMonth() + 1);
  if (!anioSelect.dataset.listenerAdded) {
    anioSelect.addEventListener('change', actualizarFiltroFecha);
    mesSelect.addEventListener('change', actualizarFiltroFecha);
    anioSelect.dataset.listenerAdded = 'true';
  }
}

function mostrarErrorPedidos(mensaje) {
  $('#mensajeError').textContent = mensaje;
  $('#mensajeError').hidden = false;
  $('#mxKpis').replaceChildren();
  $('#mxGrid').replaceChildren();
}

async function cargarPedidos() {
  prepararFiltrosFecha();
  if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
    pedidos = [];
    todosPedidos = [];
    mostrarErrorPedidos('Inicia sesión para consultar los pedidos y sus métricas.');
    return;
  }

  try {
    const response = await API_FETCH('/api/pedidos?limit=200');
    const data = await response.json();
    if (!response.ok) throw new Error(data.errores?.join(' ') || data.error || 'No se pudieron cargar los pedidos.');
    if (!Array.isArray(data)) throw new TypeError('La API devolvió una lista de pedidos no válida.');

    todosPedidos = data.map(pedido => ({
      ...pedido,
      detalle: Array.isArray(pedido.detalle) ? pedido.detalle : [],
      fecha_necesidad: pedido.fecha_necesidad ? new Date(String(pedido.fecha_necesidad).replace(' ', 'T')) : null,
      fecha_registro: pedido.fecha_registro ? new Date(String(pedido.fecha_registro).replace(' ', 'T')) : null,
      fecha_entrega: pedido.fecha_entrega ? new Date(String(pedido.fecha_entrega).replace(' ', 'T')) : null
    }));
    $('#mensajeError').hidden = true;
    prepararFiltrosFecha();
    actualizarFiltroFecha();
  } catch (error) {
    console.error('No se pudieron cargar las métricas de pedidos.', error);
    pedidos = [];
    todosPedidos = [];
    mostrarErrorPedidos(error.message || 'No se pudieron cargar los pedidos desde la API.');
  }
}

document.addEventListener('herramientas:auth-change', cargarPedidos);
cargarPedidos();
