let datos = [];
let filaSeleccionadaId = null;
let filaSeleccionada = null;

const modalEntrega = document.getElementById('modalEntrega');
const detalleEntrega = document.getElementById('detalleEntrega');
const tituloModalEntrega = document.getElementById('tituloModalEntrega');
const asignarSolicitud = document.getElementById('asignarSolicitud');
const cerrarSolicitud = document.getElementById('cerrarSolicitud');
const reprogramarSolicitud = document.getElementById('reprogramarSolicitud');
const imprimirEntrega = document.getElementById('imprimirEntrega');

function seleccionarFila(row, tr) {
  if (filaSeleccionadaId !== null && String(filaSeleccionadaId) === String(row.id)) {
    abrirInforme(row);
    return;
  }
  filaSeleccionadaId = row.id;
  filaSeleccionada = row;
  document.querySelectorAll('.solicitud-row').forEach(fila => {
    fila.classList.toggle('fila-seleccionada', fila === tr);
  });
}

function abrirInforme(row) {
  const equipo = String(row.maquina_equipo || '').trim();
  const nombreDeclarado = String(row.nombre_declarado || '').trim();
  const asunto = [equipo, nombreDeclarado]
    .filter((valor, indice, valores) => valor && valores.indexOf(valor) === indice)
    .join(' - ');

  const parametros = new URLSearchParams({
    id: row.id || '',
    maquina_equipo: equipo,
    nombre_declarado: nombreDeclarado,
    para: 'Metalúrgica Vera S.R.L.',
    reparador: row.responsable || '',
    fecha: formatFecha(row.fecha_inicio) || '',
    equipo: asunto,
    solicitante: row.solicitado || '',
    averia: row.averia || '',
    reparacion: row.reparacion || '',
    observaciones: row.notas || '',
    estado: row.progreso || '',
    codigo: 'FR-014',
    rev: '00'
  });
  window.location.href = `informe_om.html?${parametros.toString()}`;
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
async function cargarOrdenes() {
  try {
    const res = await API_FETCH('/api/ordenes');
    if (!res.ok) throw new Error(`No se pudieron cargar las órdenes (${res.status})`);
    let data = await res.json();

    // Ordenar por id descendente y limitar a 1500
    datos = data.sort((a, b) => b.id - a.id);

    renderLista(datos);
  } catch (err) {
    console.error("Error cargando ordenes:", err);
    const lista = document.getElementById('listaEquipos');
    if (lista) {
      lista.innerHTML = '<p class="lista-vacia">No se pudieron cargar las solicitudes. Inicie sesión nuevamente para consultar las máquinas y equipos.</p>';
    }
    const loginModal = document.getElementById('loginModal');
    if (loginModal && !loginModal.classList.contains('is-visible')) {
      loginModal.classList.add('is-visible');
      document.getElementById('user')?.focus();
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

function valorCampo(row, campo, fecha = false) {
  const valor = fecha ? formatFecha(row[campo]) : row[campo];
  return valor === undefined || valor === null || valor === '' ? 'Sin datos' : String(valor);
}

function crearCampo(etiqueta, valor) {
  return `<div class="solicitud-campo"><dt>${etiqueta}</dt><dd>${valor}</dd></div>`;
}

function renderSolicitud(row) {
  const claseEstado = claseEstadoFila(row);
  const estado = valorCampo(row, 'progreso');
  const card = document.createElement('article');
  card.className = `solicitud-row ${claseEstado}`;
  card.dataset.id = row.id;
  card.innerHTML = `
    <div class="solicitud-celda solicitud-id"><span>ID</span><strong>${valorCampo(row, 'id')}</strong></div>
    <div class="solicitud-celda"><span>Código</span><strong>${valorCampo(row, 'codigo')}</strong></div>
      ${crearCampo('Avería', valorCampo(row, 'averia'))}
      ${crearCampo('Prioridad', valorCampo(row, 'prioridad'))}
      ${crearCampo('Solicitado', valorCampo(row, 'solicitado'))}
      ${crearCampo('Sector', valorCampo(row, 'sector'))}
      ${crearCampo('Fecha inicio', valorCampo(row, 'fecha_inicio', true))}
      ${crearCampo('Fecha vencimiento', valorCampo(row, 'fecha_vencimiento', true))}
      ${crearCampo('Responsable', valorCampo(row, 'responsable'))}
      <div class="solicitud-celda"><span>Progreso</span><strong>${estado}</strong></div>`;
  card.addEventListener('click', () => seleccionarFila(row, card));
  card.addEventListener('contextmenu', event => {
    event.preventDefault();
    seleccionarFila(row, card);
    abrirModalEntrega();
  });
  return card;
}

function renderLista(data) {
  const lista = document.getElementById('listaEquipos');
  lista.innerHTML = '';
  const grupos = new Map();
  data.forEach(row => {
    const equipo = String(row.maquina_equipo || row.nombre_declarado || 'Sin máquina/equipo').trim();
    if (!grupos.has(equipo)) grupos.set(equipo, []);
    grupos.get(equipo).push(row);
  });

  if (!grupos.size) {
    lista.innerHTML = '<p class="lista-vacia">No hay solicitudes para mostrar.</p>';
    return;
  }

  const gruposOrdenados = [...grupos.entries()].sort(([equipoA, solicitudesA], [equipoB, solicitudesB]) => {
    return solicitudesB.length - solicitudesA.length || equipoA.localeCompare(equipoB);
  });

  gruposOrdenados.forEach(([equipo, solicitudes]) => {
    const carpeta = document.createElement('details');
    carpeta.className = 'equipo-carpeta';
    carpeta.open = false;
    carpeta.innerHTML = `<summary><span class="carpeta-icono">▸</span><span class="equipo-nombre">${equipo}</span><span class="equipo-contador">${solicitudes.length} solicitud${solicitudes.length === 1 ? '' : 'es'}</span></summary><div class="solicitudes-equipo"></div>`;
    const contenido = carpeta.querySelector('.solicitudes-equipo');
    solicitudes.forEach(row => contenido.appendChild(renderSolicitud(row)));
    lista.appendChild(carpeta);
  });
}

// Buscador dinámico
document.getElementById("buscador").addEventListener("input", e => {
  const palabras = e.target.value.toLowerCase().split(" ").filter(p => p);
  const filtrados = datos.filter(row => {
    const campos = `${row.codigo || ""} ${row.nombre_declarado || ""} ${row.maquina_equipo || ""}`.toLowerCase();
    return palabras.every(p => campos.includes(p));
  });
  renderLista(filtrados);
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
  window.location.href = `../pages/entrega.html?id=${encodeURIComponent(filaSeleccionada.id)}`;
});

function abrirFormularioSolicitud(ruta) {
  if (!filaSeleccionada) return;
  const parametros = new URLSearchParams({
    id: String(filaSeleccionada.id),
    detalle: filaSeleccionada.maquina_equipo || filaSeleccionada.nombre_declarado || ''
  });
  window.location.href = `../pages/${ruta}?${parametros.toString()}`;
}

asignarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('asignar.html'));
cerrarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('cierre.html'));
reprogramarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('reprogramar.html'));

// Ejecutar carga inicial
cargarOrdenes();
