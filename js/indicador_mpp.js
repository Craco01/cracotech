const CIRC = 364.4;

function getTipoActivo(row = {}) {
  const raw = String(row.tipo_activo ?? row.tipoActivo ?? row.activo_tipo ?? '').trim().toLowerCase();

  if (raw) {
    if (['infraestructura', 'infra', 'infraestructura y servicios', 'servicios', 'edificio', 'instalacion', 'instalación'].includes(raw)) {
      return 'infraestructura';
    }
    if (['maquinaria', 'maquina', 'equipo', 'equipos', 'maquinarias'].includes(raw)) {
      return 'maquinaria';
    }
  }

  const texto = String(row.maquina_equipo ?? row.descripcion ?? row.activo ?? row.nombre ?? '').trim().toLowerCase();
  const sector = String(row.sector ?? '').trim().toLowerCase();
  const infraKeywords = ['infraestructura', 'instalación', 'instalacion', 'edificio', 'aire acondicionado', 'aire-acondicionado', 'electricidad', 'subestación', 'subestacion', 'baja tensión', 'baja tension', 'media tensión', 'media tension', 'sistema de agua', 'red de agua', 'planta', 'galeria', 'torre', 'cocina industrial'];
  const maquinariaKeywords = ['sierra', 'taladro', 'fresadora', 'torno', 'molino', 'prensa', 'cortadora', 'calandra', 'galvanizado', 'rectificadora', 'arco sumergido', 'compresor', 'máquina', 'maquina', 'equipo'];

  if (infraKeywords.some(keyword => texto.includes(keyword) || sector.includes(keyword))) {
    return 'infraestructura';
  }
  if (maquinariaKeywords.some(keyword => texto.includes(keyword) || sector.includes(keyword))) {
    return 'maquinaria';
  }

  return 'maquinaria';
}

function getFechaProgramacion(row = {}) {
  const value = row.programacion_inicio ?? row.fecha_inicio ?? row.programacionInicio ?? row.fechaProgramacion;
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function esReprogramado(row = {}) {
  const value = row.reprogramacion_inicio ?? row.reprogramacionInicio ?? row.fecha_reprogramacion ?? row.reprogramacion;
  return value !== null && value !== undefined && value !== '' && value !== 'null' && value !== 'NULL';
}

function calcularMetricas(rows = []) {
  const metricas = {
    maq1: { programados: 0, reprogramados: 0 },
    maq2: { programados: 0, reprogramados: 0 },
    infra: { programados: 0, reprogramados: 0 }
  };

  rows.forEach((row) => {
    const tipo = getTipoActivo(row);
    if (tipo === 'infraestructura') {
      metricas.infra.programados += 1;
      if (esReprogramado(row)) metricas.infra.reprogramados += 1;
      return;
    }

    const fecha = getFechaProgramacion(row);
    if (!fecha) return;

    const semestre = fecha.getMonth() + 1 <= 6 ? 'maq1' : 'maq2';
    metricas[semestre].programados += 1;
    if (esReprogramado(row)) metricas[semestre].reprogramados += 1;
  });

  return metricas;
}

function paintMetric(prefix, programados, reprogramados) {
  const pct = programados > 0 ? (reprogramados / programados) * 100 : 0;
  const pctClamped = Math.min(Math.max(pct, 0), 100);
  const total = programados || 0;

  const arc = document.getElementById(`arc-${prefix}`);
  const label = document.getElementById(`pct-${prefix}`);
  const pill = document.getElementById(`pill-${prefix}`);
  const frac = document.getElementById(`txt-${prefix}-frac`);

  const offset = CIRC - (pctClamped / 100) * CIRC;
  arc.style.strokeDashoffset = String(offset);

  const ok = pct <= 10;
  arc.style.stroke = ok ? '#207a3d' : pct <= 15 ? '#d28c0f' : '#b42318';
  label.textContent = `${pct.toFixed(1).replace(/\.0$/, '')}%`;
  frac.textContent = `${reprogramados} de ${total}`;
  pill.textContent = ok ? 'Dentro de meta' : 'Fuera de meta';
  pill.className = `status-pill ${ok ? 'status-ok' : 'status-bad'}`;
}

async function cargarIndicadoresMPP() {
  const status = document.getElementById('indicadorStatus');
  const loginModal = document.getElementById('loginModal');

  if (!localStorage.getItem('token')) {
    status.textContent = 'Debe iniciar sesión para ver los indicadores de mantenimiento preventivo.';
    if (loginModal) loginModal.classList.add('is-visible');
    ['maq1', 'maq2', 'infra'].forEach((prefix) => paintMetric(prefix, 0, 0));
    return;
  }

  status.textContent = 'Cargando datos desde mantenimientos preventivos...';

  try {
    const response = await API_FETCH('/api/mantenimientos-preventivos');
    if (!response.ok) {
      throw new Error('No se pudo obtener la información de MPP');
    }

    const rows = await response.json();
    const metricas = calcularMetricas(Array.isArray(rows) ? rows : []);

    paintMetric('maq1', metricas.maq1.programados, metricas.maq1.reprogramados);
    paintMetric('maq2', metricas.maq2.programados, metricas.maq2.reprogramados);
    paintMetric('infra', metricas.infra.programados, metricas.infra.reprogramados);

    status.textContent = `Datos actualizados desde la API de mantenimientos preventivos (${Array.isArray(rows) ? rows.length : 0} registros).`;
  } catch (error) {
    console.error(error);
    status.textContent = 'No se pudieron cargar los datos. Verifique la conexión con la API de mantenimientos preventivos.';
    ['maq1', 'maq2', 'infra'].forEach((prefix) => {
      paintMetric(prefix, 0, 0);
    });
  }
}

window.addEventListener('DOMContentLoaded', cargarIndicadoresMPP);
