let datos = [];
let ordenAsc = true;
let columnaOrden = "id"; // columna inicial
let ordenInicialDesc = true;
let filaSeleccionadaId = null;
let filaSeleccionada = null;
const LIMITE_CARGA_INICIAL = 1500;

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

// Cargar datos desde backend (solo ordenes)
async function cargarOrdenes({ busqueda = '', limite = LIMITE_CARGA_INICIAL } = {}) {
  try {
    const parametros = new URLSearchParams();
    if (busqueda.trim()) parametros.set('search', busqueda.trim());
    if (!busqueda.trim()) parametros.set('limit', String(limite));

    const res = await API_FETCH(`/api/ordenes?${parametros.toString()}`);
    let data = await res.json();

    datos = data.sort((a, b) => b.id - a.id);

    renderTabla(datos);

    // marcar encabezado ID con indicador ▼
    const thId = document.querySelector('th[data-col="id"]');
    if (thId) thId.classList.add("desc");
    ordenAsc = false;
    columnaOrden = "id";
  } catch (err) {
    console.error("Error cargando ordenes:", err);
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
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.NE || ""}</td>
      <td>${row.codigo || ""}</td>
      <td>${row.maquina_equipo || ""}</td>
      <td>${row.nombre_declarado || ""}</td>
      <td>${row.averia || ""}</td>
      <td>${row.prioridad || ""}</td>
      <td>${row.solicitado || ""}</td>
      <td>${row.sector || ""}</td>
      <td>${row.registrado || ""}</td>
      <td>${formatFecha(row.fecha_inicio)}</td>
      <td>${formatFecha(row.fecha_vencimiento)}</td>
      <td>${formatFecha(row.fecha_final)}</td>
      <td>${formatFecha(row.fecha_entrega)}</td>
      <td>${row.reparacion || ""}</td>
      <td>${row.responsable || ""}</td>
      <td>${row.apoyo || ""}</td>
      <td>${row.categoria || ""}</td>
      <td>${row.clasificacion || ""}</td>
      <td>${row.costo_repuestos || ""}</td>
      <td>${row.unidad_mo || ""}</td>
      <td>${row.horas || ""}</td>
      <td>${row.total_mo || ""}</td>
      <td>${row.total_costo || ""}</td>
      <td>${row.notas || ""}</td>
      <td>${row.progreso || ""}</td>
      <td>${row.estado_ejecucion || ""}</td>
      <td>${row.carga || ""}</td>
      <td>${row.horas_paro || ""}</td>
      <td>${row.horas_mes || ""}</td>
    `;
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

    datos.sort((a, b) => {
      let valA = (a[col] || "").toString().toLowerCase();
      let valB = (b[col] || "").toString().toLowerCase();

      if (!isNaN(valA) && !isNaN(valB) && valA !== "" && valB !== "") {
        return ordenAsc ? valA - valB : valB - valA;
      } else {
        return ordenAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
    });

    th.classList.add(ordenAsc ? "asc" : "desc");
    renderTabla(datos);
  });
});

// Buscador dinámico
const buscador = document.getElementById("buscador");
const buscarRegistros = document.getElementById("buscarRegistros");
const refrescarRegistros = document.getElementById("refrescarRegistros");

buscador.addEventListener("input", e => {
  const palabras = e.target.value.toLowerCase().split(" ").filter(p => p);
  const filtrados = datos.filter(row => {
    const campos = `${row.codigo || ""} ${row.nombre_declarado || ""} ${row.maquina_equipo || ""}`.toLowerCase();
    return palabras.every(p => campos.includes(p));
  });
  renderTabla(filtrados);
});

buscarRegistros.addEventListener("click", () => cargarOrdenes({ busqueda: buscador.value }));

refrescarRegistros.addEventListener("click", () => {
  buscador.value = '';
  cargarOrdenes();
});

buscador.addEventListener("keydown", event => {
  if (event.key === "Enter") cargarOrdenes({ busqueda: buscador.value });
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
  window.location.href = `${ruta}?${parametros.toString()}`;
}

asignarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('asignar.html'));
cerrarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('cierre.html'));
reprogramarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('reprogramar.html'));

// Ejecutar carga inicial
cargarOrdenes();
