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

function mostrarErrorPedidos(mensaje) {
  $('#mensajeError').textContent = mensaje;
  $('#mensajeError').hidden = false;
  $('#mxKpis').replaceChildren();
  $('#mxGrid').replaceChildren();
}

async function cargarPedidos() {
  if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
    pedidos = [];
    mostrarErrorPedidos('Inicia sesión para consultar los pedidos y sus métricas.');
    return;
  }

  try {
    const response = await API_FETCH('/api/pedidos?limit=200');
    const data = await response.json();
    if (!response.ok) throw new Error(data.errores?.join(' ') || data.error || 'No se pudieron cargar los pedidos.');
    if (!Array.isArray(data)) throw new TypeError('La API devolvió una lista de pedidos no válida.');

    pedidos = data.map(pedido => ({
      ...pedido,
      detalle: Array.isArray(pedido.detalle) ? pedido.detalle : [],
      fecha_necesidad: pedido.fecha_necesidad ? new Date(String(pedido.fecha_necesidad).replace(' ', 'T')) : null,
      fecha_registro: pedido.fecha_registro ? new Date(String(pedido.fecha_registro).replace(' ', 'T')) : null,
      fecha_entrega: pedido.fecha_entrega ? new Date(String(pedido.fecha_entrega).replace(' ', 'T')) : null
    }));
    $('#mensajeError').hidden = true;
    calcular();
  } catch (error) {
    console.error('No se pudieron cargar las métricas de pedidos.', error);
    pedidos = [];
    mostrarErrorPedidos(error.message || 'No se pudieron cargar los pedidos desde la API.');
  }
}

document.addEventListener('herramientas:auth-change', cargarPedidos);
cargarPedidos();
