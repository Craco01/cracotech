let datos = [];
let ordenAsc = false;
let columnaOrden = "id"; // columna inicial
let filaSeleccionadaId = null;
let filaSeleccionada = null;
const LIMITE_POR_PAGINA = 120;
let paginaActual = 0;
let totalOrdenes = 0;
let busquedaActiva = '';
let solicitudCarga = 0;
let temporizadorBusqueda = null;

const modalEntrega = document.getElementById('modalEntrega');
const detalleEntrega = document.getElementById('detalleEntrega');
const tituloModalEntrega = document.getElementById('tituloModalEntrega');
const asignarSolicitud = document.getElementById('asignarSolicitud');
const cerrarSolicitud = document.getElementById('cerrarSolicitud');
const reprogramarSolicitud = document.getElementById('reprogramarSolicitud');
const imprimirEntrega = document.getElementById('imprimirEntrega');

function seleccionarFila(row, tr) {
  filaSeleccionadaId = row.id;
  filaSeleccionada = row;
  document.querySelectorAll('#tablaOrdenes tbody tr').forEach(fila => {
    fila.classList.toggle('fila-seleccionada', fila === tr);
  });
}

function abrirModalEntrega() {
  if (!filaSeleccionada) return;
  const completada = normalizarTexto(filaSeleccionada.progreso) === 'completado';
  const descripcion = filaSeleccionada.maquina_equipo || filaSeleccionada.nombre_declarado || 'sin equipo declarado';

  tituloModalEntrega.textContent = completada ? 'Imprimir entrega' : 'Solicitud pendiente';
  detalleEntrega.textContent = `Orden N.º ${filaSeleccionada.id}: ${descripcion}.`;
  modalEntrega.classList.toggle('modal-entrega--pendiente', !completada);
  asignarSolicitud.hidden = completada;
  cerrarSolicitud.hidden = completada;
  reprogramarSolicitud.hidden = completada;
  imprimirEntrega.hidden = !completada;
  modalEntrega.hidden = false;
  (completada ? imprimirEntrega : asignarSolicitud).focus();
}

function cerrarModalEntrega() {
  modalEntrega.hidden = true;
}

function renderPaginacion() {
  const anterior = document.getElementById('paginaAnterior');
  const siguiente = document.getElementById('paginaSiguiente');
  const estado = document.getElementById('paginaEstado');
  const totalPaginas = Math.ceil(totalOrdenes / LIMITE_POR_PAGINA);
  const inicio = totalOrdenes === 0 ? 0 : paginaActual * LIMITE_POR_PAGINA + 1;
  const fin = Math.min((paginaActual + 1) * LIMITE_POR_PAGINA, totalOrdenes);

  estado.textContent = `${totalPaginas === 0 ? 0 : paginaActual + 1}/${totalPaginas}`;
  estado.setAttribute('aria-label', `Página ${totalPaginas === 0 ? 0 : paginaActual + 1} de ${totalPaginas}; mostrando ${inicio}-${fin} de ${totalOrdenes} órdenes`);
  anterior.disabled = paginaActual === 0;
  siguiente.disabled = (paginaActual + 1) * LIMITE_POR_PAGINA >= totalOrdenes;
}

// Cargar datos desde el backend por páginas, sin descargar el conjunto completo.
async function cargarOrdenes({ busqueda = busquedaActiva, pagina = paginaActual } = {}) {
  const cargaActual = ++solicitudCarga;
  paginaActual = pagina;
  busquedaActiva = busqueda.trim();
  const estado = document.getElementById('paginaEstado');
  const anterior = document.getElementById('paginaAnterior');
  const siguiente = document.getElementById('paginaSiguiente');
  estado.textContent = 'Cargando órdenes...';
  anterior.disabled = true;
  siguiente.disabled = true;

  try {
    const parametros = new URLSearchParams();
    parametros.set('limit', String(LIMITE_POR_PAGINA));
    parametros.set('offset', String(paginaActual * LIMITE_POR_PAGINA));
    parametros.set('sortBy', columnaOrden);
    parametros.set('sortOrder', ordenAsc ? 'asc' : 'desc');
    if (busquedaActiva) parametros.set('search', busquedaActiva);

    const res = await API_FETCH(`/api/ordenes/paginadas?${parametros.toString()}`);
    if (!res.ok) throw new Error(`No se pudieron cargar las órdenes (${res.status})`);
    const result = await res.json();
    if (!Array.isArray(result.rows) || !Number.isFinite(Number(result.total))) {
      throw new Error('La respuesta de paginación de órdenes no tiene el formato esperado.');
    }
    if (cargaActual !== solicitudCarga) return;

    datos = result.rows;
    totalOrdenes = Number(result.total);
    filaSeleccionadaId = null;
    filaSeleccionada = null;

    document.querySelectorAll("#tablaOrdenes th").forEach(th => {
      th.classList.remove("asc", "desc");
    });
    document.querySelector(`th[data-col="${columnaOrden}"]`)?.classList.add(ordenAsc ? "asc" : "desc");
    renderTabla(datos);
    renderPaginacion();
    document.querySelector('.table-scroll').scrollTop = 0;
  } catch (err) {
    console.error("Error cargando ordenes:", err);
    if (cargaActual === solicitudCarga) {
      estado.textContent = 'No se pudieron cargar las órdenes. Intente nuevamente.';
      anterior.disabled = true;
      siguiente.disabled = true;
    }
  }
}

function formatFecha(value) {
  if (!value && value !== 0) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    const p = n => String(n).padStart(2, '0');
    return `${p(value.getDate())}/${p(value.getMonth() + 1)}/${value.getFullYear()} ${p(value.getHours())}:${p(value.getMinutes())}${value.getSeconds() ? `:${p(value.getSeconds())}` : ''}`;
  }
  const texto = String(value).trim();
  if (!texto) return '';
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto)) {
    const fecha = new Date(texto);
    if (Number.isNaN(fecha.getTime())) return texto;
    const p = n => String(n).padStart(2, '0');
    return `${p(fecha.getDate())}/${p(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${p(fecha.getHours())}:${p(fecha.getMinutes())}${fecha.getSeconds() ? `:${p(fecha.getSeconds())}` : ''}`;
  }
  const match = texto.match(/^\s*(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*$/i);
  if (!match) return texto;
  const [, anio, mes, dia, hora, minutos, segundos = '00'] = match;
  return `${dia}/${mes}/${anio} ${hora}:${minutos}${segundos !== '00' ? `:${segundos}` : ''}`;
}

function normalizarTexto(value) {
  return String(value || "").trim().toLowerCase();
}

function fechaVencimiento(row) {
  if (!row.fecha_vencimiento) return null;
  const value = String(row.fecha_vencimiento);
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    const fecha = new Date(value);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
}

function claseEstadoFila(row) {
  const progreso = normalizarTexto(row.progreso);
  const estadoEjecucion = normalizarTexto(row.estado_ejecucion);

  if (progreso === "baja" || progreso === "de baja") return "estado-baja";
  if (progreso === "reprogramado") return "estado-reprogramado";

  if (progreso === "completado") {
    if (estadoEjecucion === "en plazo") return "estado-completado-plazo";
    if (estadoEjecucion === "con retraso") return "estado-completado-retraso";
  }

  const vencimiento = fechaVencimiento(row);
  const vencida = vencimiento && vencimiento < new Date();

  if (progreso === "asignado") return vencida ? "estado-vencido" : "estado-asignado";
  if (progreso === "no iniciado") return vencida ? "estado-vencido" : "estado-pendiente";

  return "";
}

// Renderizar tabla
function renderTabla(data) {
  const tbody = document.querySelector("#tablaOrdenes tbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    const claseEstado = claseEstadoFila(row);
    if (claseEstado) tr.classList.add(claseEstado);
    if (String(row.id) === String(filaSeleccionadaId)) tr.classList.add("fila-seleccionada");
    tr.addEventListener('click', () => seleccionarFila(row, tr));
    tr.addEventListener('contextmenu', event => {
      event.preventDefault();
      seleccionarFila(row, tr);
      abrirModalEntrega();
    });
    const valores = [
      row.id, row.NE, row.codigo, row.maquina_equipo, row.nombre_declarado,
      row.averia, row.prioridad, row.solicitado, row.sector, row.registrado,
      formatFecha(row.fecha_inicio), formatFecha(row.fecha_vencimiento),
      formatFecha(row.fecha_final), formatFecha(row.fecha_entrega), row.reparacion,
      row.responsable, row.apoyo, row.categoria, row.clasificacion,
      row.costo_repuestos, row.unidad_mo, row.horas, row.total_mo,
      row.total_costo, row.notas, row.progreso, row.estado_ejecucion,
      row.carga, row.horas_paro, row.horas_mes
    ];
    valores.forEach(valor => {
      const celda = document.createElement('td');
      celda.textContent = valor === null || valor === undefined ? '' : String(valor);
      tr.appendChild(celda);
    });
    tbody.appendChild(tr);
  });
}

// Ordenar por columna al hacer clic en el encabezado
document.querySelectorAll("#tablaOrdenes th").forEach(th => {
  th.addEventListener("click", () => {
    const col = th.getAttribute("data-col");
    if (!col) return;

    document.querySelectorAll("#tablaOrdenes th").forEach(h => {
      h.classList.remove("asc", "desc");
    });

    if (columnaOrden === col) {
      ordenAsc = !ordenAsc;
    } else {
      columnaOrden = col;
      ordenAsc = true;
    }

    th.classList.add(ordenAsc ? "asc" : "desc");
    paginaActual = 0;
    cargarOrdenes();
  });
});

// Buscador dinámico
const buscador = document.getElementById("buscador");
const buscarRegistros = document.getElementById("buscarRegistros");
const refrescarRegistros = document.getElementById("refrescarRegistros");

buscador.addEventListener("input", event => {
  clearTimeout(temporizadorBusqueda);
  const busqueda = event.target.value;
  temporizadorBusqueda = setTimeout(() => cargarOrdenes({ busqueda, pagina: 0 }), 300);
});

buscarRegistros.addEventListener("click", () => {
  clearTimeout(temporizadorBusqueda);
  cargarOrdenes({ busqueda: buscador.value, pagina: 0 });
});

refrescarRegistros.addEventListener("click", () => {
  clearTimeout(temporizadorBusqueda);
  buscador.value = '';
  columnaOrden = 'id';
  ordenAsc = false;
  cargarOrdenes({ busqueda: '', pagina: 0 });
});

buscador.addEventListener("keydown", event => {
  if (event.key === "Enter") {
    clearTimeout(temporizadorBusqueda);
    cargarOrdenes({ busqueda: buscador.value, pagina: 0 });
  }
});

document.getElementById('paginaAnterior').addEventListener('click', () => {
  if (paginaActual > 0) {
    document.querySelector('#tablaOrdenes').scrollIntoView({ behavior: 'smooth', block: 'start' });
    cargarOrdenes({ pagina: paginaActual - 1 });
  }
});

document.getElementById('paginaSiguiente').addEventListener('click', () => {
  if ((paginaActual + 1) * LIMITE_POR_PAGINA < totalOrdenes) {
    document.querySelector('#tablaOrdenes').scrollIntoView({ behavior: 'smooth', block: 'start' });
    cargarOrdenes({ pagina: paginaActual + 1 });
  }
});

document.getElementById('cancelarEntrega').addEventListener('click', cerrarModalEntrega);
modalEntrega.addEventListener('click', event => {
  if (event.target === modalEntrega) cerrarModalEntrega();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !modalEntrega.hidden) cerrarModalEntrega();
});

imprimirEntrega.addEventListener('click', async () => {
  if (!filaSeleccionada) return;
  modalEntrega.hidden = true;
  window.abrirModalFirmasEntrega(filaSeleccionada.id, () => {
    modalEntrega.hidden = false;
    imprimirEntrega.focus();
  });
});

function abrirFormularioSolicitud(ruta) {
  if (!filaSeleccionada) return;
  const parametros = new URLSearchParams({
    id: String(filaSeleccionada.id),
    detalle: filaSeleccionada.maquina_equipo || filaSeleccionada.nombre_declarado || '',
    averia: filaSeleccionada.averia || ''
  });
  const formularioRoute = `../formularios/?vista=${encodeURIComponent(ruta)}&${parametros.toString()}`;
  window.top.location.href = formularioRoute;
}

asignarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('asignar'));
cerrarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('cierre'));
reprogramarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('reprogramar'));

// Ejecutar carga inicial
cargarOrdenes();
