(async () => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const enBlanco = params.get('blanco') === '1';
  const modoPublicoDos = params.get('public') === '2';
  const formatoNuevo = true;
  const est = {};
  const fichaId = params.get('id');
  if (modoPublicoDos) {
    try {
      Object.assign(est, JSON.parse(sessionStorage.getItem('fr172-publica-datos-2') || '{}'));
    } catch {
      // Si los datos temporales no están disponibles, se muestra la ficha en blanco.
    }
  } else if (fichaId && !enBlanco) {
    try {
      const response = await API_FETCH(`/api/fr172-puente-grua/${encodeURIComponent(fichaId)}`);
      const record = await response.json();
      if (!response.ok) throw new Error(record.error || 'No se pudo cargar la ficha.');
      Object.assign(est, FR172.normalizarDatos(record.datos), {
        firma_cliente: record.firma_cliente,
        firma_tecnico: record.firma_tecnico
      });
    } catch (error) {
      const message = document.createElement('p');
      message.className = 'error-impresion';
      message.textContent = `No se pudo cargar la ficha guardada: ${error.message}`;
      document.querySelector('.pliego').before(message);
      throw error;
    }
  }

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const v = k => esc(est[k]);
  const celda = (k, cls) => `<td${cls ? ` class="${cls}"` : ''}>${v(k)}</td>`;
  const caja = on => `<i class="caja${on ? ' on' : ''}"></i>`;
  const $ = id => document.getElementById(id);
  const cantidadUsada = prefijo => {
    const patron = new RegExp(`^${prefijo}(\\d+)_`);
    return Math.min(FR172.filasMax, Object.keys(est).reduce((max, nombre) => {
      const match = patron.exec(nombre);
      return match && String(est[nombre] || '').trim() ? Math.max(max, Number(match[1])) : max;
    }, 0));
  };

  /* Campos simples */
  document.querySelectorAll('[data-f]').forEach(el => {
    const k = el.dataset.f;
    el.textContent = el.dataset.tipo === 'fecha' ? FR172.fecha(est[k]) : (est[k] == null ? '' : est[k]);
  });

  /* 3. Trabajos realizados */
  const baseTrabajos = modoPublicoDos ? 3 : FR172.filasImpresionBase.trabajos;
  const nT = Math.max(Number(est.n_trab) || baseTrabajos, cantidadUsada('t'));
  $('filas-trabajos').innerHTML = Array.from({ length: nT }, (_, j) => {
    const i = j + 1;
    return `<tr><th>${i}</th>${celda('t' + i + '_act')}${celda('t' + i + '_estado', 'c')}${celda('t' + i + '_obs')}</tr>`;
  }).join('');

  /* 4. Verificaciones */
  if (formatoNuevo) {
    $('filas-verif').innerHTML = FR172.verificaciones.map((t, j) => {
      const k = j + 1;
      const estado = String(est['v' + k + '_estado'] || 'N/A');
      const radio = valor => `<span class="casilla-estado"><input class="radio-imprimible" type="radio" disabled${estado === valor ? ' checked' : ''} aria-label="${esc(valor)}"></span>`;
      return `<tr><th>${esc(t)}</th><td class="c">${radio('Conforme')}</td><td class="c">${radio('No conforme')}</td><td class="c">${radio('Observado')}</td><td class="c">${radio('N/A')}</td><td class="obs">${esc(est['v' + k + '_obs'])}</td></tr>`;
    }).join('');
  } else {
    $('filas-verif').innerHTML = FR172.verificaciones.map((t, j) => {
      const k = j + 1;
      return `<tr><th>${esc(t)}</th>${celda('v' + k + '_estado', 'c')}${celda('v' + k + '_obs')}</tr>`;
    }).join('');
  }

  if (formatoNuevo) {
    const operativo = String(est.entregado_operativo || '');
    $('operativo-radio').innerHTML =
      ['Sí', 'No', 'Con restricciones'].map(valor =>
        `<span class="operativo-celdas"><span class="casilla-estado"><input class="radio-imprimible" type="radio" disabled${operativo === valor ? ' checked' : ''} aria-label="${esc(valor)}"></span> ${esc(valor)}</span>`
      ).join('&nbsp;&nbsp;');
  }

  /* 5. Materiales */
  const baseMateriales = modoPublicoDos ? 3 : FR172.filasImpresionBase.materiales;
  const nM = Math.max(Number(est.n_mat) || baseMateriales, cantidadUsada('m'));
  $('filas-materiales').innerHTML = Array.from({ length: nM }, (_, j) => {
    const i = j + 1;
    return `<tr><th>${i}</th>${celda('m' + i + '_desc')}${celda('m' + i + '_cant', 'c')}` +
      `${celda('m' + i + '_unidad', 'c')}${celda('m' + i + '_parte', 'c')}${celda('m' + i + '_obs')}</tr>`;
  }).join('');

  /* 7. Documentación / anexos */
  let docs = FR172.documentos.map((t, j) => {
    const k = j + 1;
    return `<tr><th>${caja(est['d' + k + '_chk'])}${esc(t)}</th>${celda('d' + k + '_txt')}</tr>`;
  }).join('');
  const otro = est.d8_label
    ? `<span class="subr">${esc(est.d8_label)}</span>`
    : '<span class="sin-dato">______________________________</span>';
  docs += `<tr><th>${caja(est.d8_chk)}Otro: ${otro}</th>${celda('d8_txt')}</tr>`;
  $('filas-docs').innerHTML = docs;

  /* 8. Firmas */
  const firma = (id, k) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sello');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Firma');
    let paths = est[k];
    if (typeof paths === 'string') {
      try {
        paths = JSON.parse(paths);
      } catch {
        paths = [];
      }
    }
    window.renderSignaturePaths(svg, paths, {
      width: 600,
      height: 220,
      preserveAspectRatio: 'xMidYMid meet',
      lineWidth: 2.4
    });
    $(id).insertBefore(svg, $(id).firstChild);
  };
  firma('firma-cliente', 'firma_cliente');
  firma('firma-tecnico', 'firma_tecnico');

  /* Barra de pantalla */
  $('b-imprimir').addEventListener('click', () => window.print());
  $('b-volver').href = modoPublicoDos
    ? '../fr172-puente-grua-formulario/'
    : '../reportes/?vista=fr172';
  $('b-volver').textContent = modoPublicoDos ? 'Volver al formulario' : 'Volver a reportes';
  const modo = $('b-modo');
  if (modo && enBlanco) {
    modo.textContent = 'Cargar datos del formulario';
    modo.setAttribute('href', location.pathname);
  }
})();
