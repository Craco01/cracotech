let ordenActual = null;

function formatFecha(value) {
  if (!value) return '—';
  const texto = String(value).trim();
  const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return texto;
  // Compensa el desfase del navegador únicamente al mostrar el comprobante.
  const fecha = new Date(match[1], Number(match[2]) - 1, match[3], match[4], match[5], match[6] || 0);
  fecha.setHours(fecha.getHours() - 4);
  const dosDigitos = numero => String(numero).padStart(2, '0');
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dosDigitos(fecha.getHours())}:${dosDigitos(fecha.getMinutes())}`;
}

function formatFechaEntrega(value) {
  return formatFecha(value);
}

function leerTrazosFirma(value, campo) {
  if (value == null || value === '') return [];
  let trazos;
  try {
    trazos = Array.isArray(value) ? value : JSON.parse(value);
  } catch {
    throw new Error(`La firma de ${campo} tiene un formato anterior. Genere un QR nuevo y vuelva a firmar.`);
  }
  if (!Array.isArray(trazos) || trazos.some(trazo => typeof trazo !== 'string')) {
    throw new Error(`La firma de ${campo} tiene un formato no válido. Genere un QR nuevo y vuelva a firmar.`);
  }
  return trazos;
}

function rellenarCopia(copy, orden, etiqueta, mostrarTimestamp) {
  copy.querySelector('.copy-tag').textContent = etiqueta;
  copy.querySelectorAll('[data-field]').forEach(elemento => { elemento.textContent = orden[elemento.dataset.field] || '—'; });
  copy.querySelectorAll('[data-date]').forEach(elemento => {
    const valor = elemento.dataset.date === 'fecha_entrega'
      ? orden.fecha_entrega
      : orden[elemento.dataset.date];
    elemento.textContent = elemento.dataset.date === 'fecha_entrega' ? formatFechaEntrega(valor) : formatFecha(valor);
  });
  copy.querySelectorAll('[data-signature]').forEach(elemento => {
    const campo = elemento.dataset.signature;
    if (!Object.prototype.hasOwnProperty.call(orden, campo)) {
      throw new Error('La base de datos no tiene las columnas de firmas de entrega. Aplique la migración add_ordenes_firmas_entrega.sql y reinicie el backend.');
    }
    const trazos = leerTrazosFirma(
      orden[campo],
      campo === 'operador_firma' ? 'operador' : 'responsable'
    );
    elemento.toggleAttribute('hidden', !trazos.length);
    window.renderSignaturePaths(elemento, trazos, { width: 600, height: 220, lineWidth: 2.4 });
  });
  copy.querySelectorAll('[data-signatory]').forEach(elemento => {
    const id = elemento.dataset.signatory;
    const valores = {
      operador_nombre: orden.operador_nombre && `Nombre: ${orden.operador_nombre}`,
      operador_ci: orden.operador_ci && `CI: ${orden.operador_ci}`,
      mantenimiento_nombre: orden.mantenimiento_usuario
    };
    const valor = valores[id];
    const texto = id === 'mantenimiento_nombre' && valor
      ? `Firmado por: ${valor}`
      : valor || 'No registrado';
    elemento.textContent = texto;
    elemento.hidden = !texto;
  });
  copy.querySelector('.ts').textContent = mostrarTimestamp
    ? `Documento generado el ${formatTimestampImpresion(new Date())} por ${localStorage.getItem('username') || 'usuario desconocido'}`
    : '';
}

function formatTimestampImpresion(value) {
  const fecha = new Date(value);
  fecha.setHours(fecha.getHours() + 1);
  return formatFecha(fecha.toISOString());
}

function mostrarEntrega(orden, mostrarTimestamp = false) {
  const page = document.getElementById('page');
  const plantilla = document.getElementById('copy-template');
  page.innerHTML = '';
  ['Mantenimiento', 'Operador'].forEach((etiqueta, indice) => {
    const fragmento = plantilla.content.cloneNode(true);
    rellenarCopia(fragmento, orden, etiqueta, mostrarTimestamp);
    page.appendChild(fragmento);
    if (indice === 0) {
      const corte = document.createElement('div');
      corte.className = 'cut-line';
      corte.innerHTML = '<span>CORTAR AQUÍ</span>';
      page.appendChild(corte);
    }
  });
}

function headersAutorizados() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function cargarEntrega() {
  const page = document.getElementById('page');
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) { page.textContent = 'No se indicó una orden para imprimir.'; return; }
  try {
    const respuesta = await API_FETCH(`/api/ordenes/${encodeURIComponent(id)}`, {
      headers: headersAutorizados(),
      cache: 'no-store'
    });
    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => ({}));
      throw new Error(detalle.error || 'No se pudo cargar la orden seleccionada.');
    }
    ordenActual = await respuesta.json();
    mostrarEntrega(ordenActual);
  } catch (error) { page.textContent = error.message; }
}

async function imprimirEntrega() {
  if (!ordenActual) return;
  if (!ordenActual.operador_firma || !ordenActual.mantenimiento_firma) {
    await window.siteDialog.alert('Faltan las firmas del operador y de mantenimiento. Regrese a reportes y complete la firma antes de imprimir.');
    return;
  }
  const boton = document.getElementById('imprimirPaginaEntrega');
  boton.disabled = true;
  boton.textContent = 'Guardando fecha...';
  try {
    // La fecha ya se registra al guardar la última firma; este endpoint solo valida y devuelve la orden.
    const respuesta = await API_FETCH(`/api/ordenes/${encodeURIComponent(ordenActual.id)}/entrega`, {
      method: 'PUT',
      headers: headersAutorizados()
    });
    const detalle = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(detalle.error || 'No se pudo guardar la fecha de entrega.');
    ordenActual = detalle;
    mostrarEntrega(ordenActual, true);
    window.print();
  } catch (error) {
    await window.siteDialog.alert(error.message);
  } finally {
    boton.disabled = false;
    boton.textContent = 'Imprimir / Guardar PDF';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('imprimirPaginaEntrega').addEventListener('click', imprimirEntrega);
  cargarEntrega();
});
