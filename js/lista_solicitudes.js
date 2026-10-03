let datos = [];
let ordenAsc = false;
let columnaOrden = "id"; // columna inicial
let filaSeleccionadaId = null;
let filaSeleccionada = null;
const LIMITE_POR_PAGINA = 250;
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

  estado.textContent = `Mostrando ${inicio}-${fin} de ${totalOrdenes} órdenes · Página ${totalPaginas === 0 ? 0 : paginaActual + 1} de ${totalPaginas}`;
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

  const texto = String(value).trim();
  if (!texto) return '';

  const match = texto.match(/^\s*(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\s*$/i);
  if (match) {
    let [, año, mes, dia, hora, minutos, segundos] = match;
    
    // Convertir a números y ajustar por 4 horas de diferencia
    hora = parseInt(hora, 10);
    minutos = parseInt(minutos, 10);
    segundos = segundos ? parseInt(segundos, 10) : 0;
    dia = parseInt(dia, 10);
    mes = parseInt(mes, 10);
    año = parseInt(año, 10);
    
    // Restar 4 horas
    hora -= 4;
    if (hora < 0) {
      hora += 24;
      dia -= 1;
      if (dia < 1) {
        mes -= 1;
        if (mes < 1) {
          mes = 12;
          año -= 1;
        }
        // Días del mes (simplificado, sin considerar bisiestos)
        const diasMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        dia = diasMes[mes - 1];
      }
    }
    
    const diaStr = String(dia).padStart(2, '0');
    const mesStr = String(mes).padStart(2, '0');
    const horaStr = String(hora).padStart(2, '0');
    const minutosStr = String(minutos).padStart(2, '0');
    const segundosStr = String(segundos).padStart(2, '0');
    
    return `${diaStr}/${mesStr}/${año} ${horaStr}:${minutosStr}${segundos ? `:${segundosStr}` : ''}`;
  }

  return texto;
}

function normalizarTexto(value) {
  return String(value || "").trim().toLowerCase();
}

function fechaVencimiento(row) {
  if (!row.fecha_vencimiento) return null;
  const vencimiento = new Date(String(row.fecha_vencimiento).replace(' ', 'T'));
  if (Number.isNaN(vencimiento.getTime())) return null;
  vencimiento.setTime(vencimiento.getTime() - 4 * 60 * 60 * 1000);
  return vencimiento;
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
  if (paginaActual > 0) cargarOrdenes({ pagina: paginaActual - 1 });
});

document.getElementById('paginaSiguiente').addEventListener('click', () => {
  if ((paginaActual + 1) * LIMITE_POR_PAGINA < totalOrdenes) {
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
  window.location.href = `entrega.html?id=${encodeURIComponent(filaSeleccionada.id)}`;
});

function abrirFormularioSolicitud(ruta) {
  if (!filaSeleccionada) return;
  const parametros = new URLSearchParams({
    id: String(filaSeleccionada.id),
    detalle: filaSeleccionada.maquina_equipo || filaSeleccionada.nombre_declarado || ''
  });
  window.top.location.href = `formularios.html?vista=${encodeURIComponent(ruta)}&${parametros.toString()}`;
}

asignarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('asignar'));
cerrarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('cierre'));
reprogramarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('reprogramar'));

// Ejecutar carga inicial
cargarOrdenes();
