let busquedaCarpetas = '';
let cargaCarpetasId = 0;
let temporizadorBusqueda = null;
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

async function cargarCarpetas(busqueda = busquedaCarpetas) {
  const cargaActual = ++cargaCarpetasId;
  busquedaCarpetas = busqueda.trim();
  const lista = document.getElementById('listaEquipos');
  lista.innerHTML = '<p class="lista-vacia">Cargando máquinas y equipos...</p>';

  try {
    const parametros = new URLSearchParams();
    if (busquedaCarpetas) parametros.set('search', busquedaCarpetas);
    const res = await API_FETCH(`/api/ordenes/equipos?${parametros.toString()}`);
    if (!res.ok) throw new Error(`No se pudieron cargar las carpetas (${res.status})`);
    const carpetas = await res.json();
    if (!Array.isArray(carpetas)) throw new Error('La respuesta de carpetas no tiene el formato esperado.');
    if (cargaActual !== cargaCarpetasId) return;
    renderLista(carpetas, busquedaCarpetas);
  } catch (err) {
    console.error('Error cargando carpetas de órdenes:', err);
    if (cargaActual === cargaCarpetasId) {
      lista.innerHTML = '<p class="lista-vacia">No se pudieron cargar las máquinas y equipos. Recargue la vista e inténtelo nuevamente.</p>';
      const loginModal = document.getElementById('loginModal');
      if (loginModal && !loginModal.classList.contains('is-visible')) {
        loginModal.classList.add('is-visible');
        document.getElementById('user')?.focus();
      }
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
  const campo = document.createElement('div');
  const titulo = document.createElement('dt');
  const contenido = document.createElement('dd');
  campo.className = 'solicitud-campo';
  titulo.textContent = etiqueta;
  contenido.textContent = valor;
  campo.append(titulo, contenido);
  return campo;
}

function crearCelda(etiqueta, valor, clase = '') {
  const celda = document.createElement('div');
  const titulo = document.createElement('span');
  const contenido = document.createElement('strong');
  celda.className = `solicitud-celda${clase ? ` ${clase}` : ''}`;
  titulo.textContent = etiqueta;
  contenido.textContent = valor;
  celda.append(titulo, contenido);
  return celda;
}

function renderSolicitud(row) {
  const claseEstado = claseEstadoFila(row);
  const estado = valorCampo(row, 'progreso');
  const card = document.createElement('article');
  card.className = `solicitud-row ${claseEstado}`;
  card.dataset.id = row.id;
  card.append(
    crearCelda('ID', valorCampo(row, 'id'), 'solicitud-id'),
    crearCelda('Código', valorCampo(row, 'codigo')),
    crearCampo('Avería', valorCampo(row, 'averia')),
    crearCampo('Prioridad', valorCampo(row, 'prioridad')),
    crearCampo('Solicitado', valorCampo(row, 'solicitado')),
    crearCampo('Sector', valorCampo(row, 'sector')),
    crearCampo('Fecha inicio', valorCampo(row, 'fecha_inicio', true)),
    crearCampo('Fecha vencimiento', valorCampo(row, 'fecha_vencimiento', true)),
    crearCampo('Responsable', valorCampo(row, 'responsable')),
    crearCelda('Progreso', estado)
  );
  card.addEventListener('click', () => seleccionarFila(row, card));
  card.addEventListener('contextmenu', event => {
    event.preventDefault();
    seleccionarFila(row, card);
    abrirModalEntrega();
  });
  return card;
}

const LIMITE_CARPETA = 250;

async function cargarPaginaCarpeta(carpeta, contenido, estado, pagina) {
  const solicitudId = (estado.solicitudId || 0) + 1;
  estado.solicitudId = solicitudId;
  contenido.replaceChildren();
  const cargando = document.createElement('p');
  cargando.className = 'lista-vacia';
  cargando.textContent = 'Cargando órdenes de esta máquina...';
  contenido.appendChild(cargando);

  try {
    const parametros = new URLSearchParams({
      equipo: carpeta.equipo,
      limit: String(LIMITE_CARPETA),
      offset: String(pagina * LIMITE_CARPETA)
    });
    if (carpeta.busqueda) parametros.set('search', carpeta.busqueda);
    const res = await API_FETCH(`/api/ordenes/por-equipo?${parametros.toString()}`);
    if (!res.ok) throw new Error(`No se pudieron cargar las órdenes (${res.status})`);
    const result = await res.json();
    if (!Array.isArray(result.rows) || !Number.isFinite(Number(result.total))) {
      throw new Error('La respuesta de órdenes de la carpeta no tiene el formato esperado.');
    }
    if (solicitudId !== estado.solicitudId) return;

    estado.pagina = pagina;
    estado.total = Number(result.total);
    estado.cargada = true;
    contenido.replaceChildren();
    if (!result.rows.length) {
      const vacio = document.createElement('p');
      vacio.className = 'lista-vacia';
      vacio.textContent = 'No hay solicitudes para mostrar.';
      contenido.appendChild(vacio);
    } else {
      result.rows.forEach(row => contenido.appendChild(renderSolicitud(row)));
    }

    const totalPaginas = Math.ceil(estado.total / LIMITE_CARPETA);
    if (totalPaginas > 1) {
      const navegacion = document.createElement('nav');
      const resumen = document.createElement('span');
      const anterior = document.createElement('button');
      const siguiente = document.createElement('button');
      navegacion.className = 'carpeta-pagination';
      navegacion.setAttribute('aria-label', `Paginación de ${carpeta.equipo}`);
      resumen.setAttribute('aria-live', 'polite');
      resumen.textContent = `Página ${pagina + 1} de ${totalPaginas} · ${estado.total} solicitudes`;
      anterior.type = 'button';
      anterior.textContent = 'Anterior';
      anterior.disabled = pagina === 0;
      siguiente.type = 'button';
      siguiente.textContent = 'Siguiente';
      siguiente.disabled = (pagina + 1) * LIMITE_CARPETA >= estado.total;
      anterior.addEventListener('click', () => cargarPaginaCarpeta(carpeta, contenido, estado, pagina - 1));
      siguiente.addEventListener('click', () => cargarPaginaCarpeta(carpeta, contenido, estado, pagina + 1));
      navegacion.append(anterior, resumen, siguiente);
      contenido.appendChild(navegacion);
    }
  } catch (err) {
    console.error(`Error cargando órdenes de ${carpeta.equipo}:`, err);
    if (solicitudId !== estado.solicitudId) return;
    contenido.replaceChildren();
    const mensaje = document.createElement('p');
    const reintentar = document.createElement('button');
    mensaje.className = 'lista-vacia';
    mensaje.textContent = 'No se pudieron cargar las órdenes de esta máquina.';
    reintentar.type = 'button';
    reintentar.textContent = 'Reintentar';
    reintentar.addEventListener('click', () => cargarPaginaCarpeta(carpeta, contenido, estado, pagina));
    contenido.append(mensaje, reintentar);
  }
}

function renderLista(data, busqueda = '') {
  const lista = document.getElementById('listaEquipos');
  lista.replaceChildren();
  if (!data.length) {
    lista.innerHTML = '<p class="lista-vacia">No hay solicitudes para mostrar.</p>';
    return;
  }

  data.forEach(({ equipo, total }) => {
    const carpeta = document.createElement('details');
    const summary = document.createElement('summary');
    const icono = document.createElement('span');
    const nombre = document.createElement('span');
    const contador = document.createElement('span');
    const contenido = document.createElement('div');
    const carpetaData = { equipo, busqueda };
    const estado = { cargada: false, pagina: 0, total: Number(total) };
    carpeta.className = 'equipo-carpeta';
    carpeta.open = false;
    icono.className = 'carpeta-icono';
    icono.textContent = '▸';
    nombre.className = 'equipo-nombre';
    nombre.textContent = equipo;
    contador.className = 'equipo-contador';
    contador.textContent = `${total} solicitud${Number(total) === 1 ? '' : 'es'}`;
    summary.append(icono, nombre, contador);
    contenido.className = 'solicitudes-equipo';
    const instruccion = document.createElement('p');
    instruccion.className = 'lista-vacia';
    instruccion.textContent = 'Abra la carpeta para cargar sus órdenes.';
    contenido.appendChild(instruccion);
    carpeta.append(summary, contenido);
    carpeta.addEventListener('toggle', () => {
      if (carpeta.open && !estado.cargada) {
        cargarPaginaCarpeta(carpetaData, contenido, estado, estado.pagina);
      }
    });
    lista.appendChild(carpeta);
  });
}

document.getElementById('buscador').addEventListener('input', event => {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(() => cargarCarpetas(event.target.value), 250);
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
  window.top.location.href = `formularios.html?vista=${encodeURIComponent(ruta)}&${parametros.toString()}`;
}

asignarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('asignar'));
cerrarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('cierre'));
reprogramarSolicitud.addEventListener('click', () => abrirFormularioSolicitud('reprogramar'));

// Cargar inicialmente solo los nombres y totales de las carpetas.
cargarCarpetas();
