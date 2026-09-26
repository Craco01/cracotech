const form = document.getElementById('form-datos');
const panel = document.getElementById('panel');

function ahoraTexto() {
  const d = new Date();
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const fecha = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  let horas = d.getHours();
  const ampm = horas >= 12 ? 'p. m.' : 'a. m.';
  horas = horas % 12 || 12;
  const minutos = pad(d.getMinutes());
  return fecha + ' — ' + pad(horas) + ':' + minutos + ' ' + ampm;
}

// Lee valores desde la URL, útil si esto se genera desde otro sistema.
// Ej: index.html?reparador=Carlos&equipo=Compresor&fecha=10/09/2026
function valoresDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const valores = {};
  Array.from(form.elements).forEach((el) => {
    if (el.name && params.has(el.name)) valores[el.name] = params.get(el.name);
  });

  const id = (params.get('id') || '').trim();
  const maquinaEquipo = (params.get('maquina_equipo') || '').trim();
  const nombreDeclarado = (params.get('nombre_declarado') || '').trim();
  const asunto = [id, maquinaEquipo, nombreDeclarado].filter(Boolean).join(' ');
  if (asunto) valores.equipo = 'OM: ' + asunto;

  return valores;
}

function render() {
  const datos = new FormData(form);

  document.querySelectorAll('[data-field]').forEach((el) => {
    const campo = el.dataset.field;
    if (campo === 'generado') return; // se maneja aparte
    const valor = (datos.get(campo) || '').trim();
    const vacio = el.dataset.emptyText !== undefined;

    if (valor) {
      el.textContent = valor;
    } else if (vacio) {
      el.textContent = el.dataset.emptyText;
    } else {
      el.textContent = valor;
    }
  });

  // Nota "Generado el" con fecha/hora actual
  document.querySelectorAll('[data-field="generado"]').forEach((el) => {
    el.textContent = ahoraTexto();
  });
}

function aplicarValores(valores) {
  Object.entries(valores).forEach(([campo, valor]) => {
    const input = form.elements[campo];
    if (input) input.value = valor;
  });
  render();
}

// Carga los datos desde el JSON de prueba y, si hay parámetros en la URL,
// estos tienen prioridad (útil para generar la orden desde otro sistema).
async function cargarDatos() {
  try {
    const res = await fetch('datos.json');
    if (!res.ok) throw new Error('No se pudo leer datos.json (' + res.status + ')');
    const datosJSON = await res.json();
    aplicarValores(datosJSON);
  } catch (err) {
    // Si se abre el archivo con doble clic (file://), el navegador puede
    // bloquear el fetch por CORS. En ese caso se sigue con los valores
    // que ya están escritos en el formulario.
    console.warn('No se pudieron cargar datos.json:', err.message);
  }
  aplicarValores(valoresDesdeURL());
}

cargarDatos();

form.addEventListener('input', render);

document.getElementById('btn-imprimir').addEventListener('click', () => {
  window.print();
});

function volverALista() {
  window.location.href = 'modulo_solicitudes.html';
}

document.getElementById('btn-volver').addEventListener('click', volverALista);

document.getElementById('btn-editar').addEventListener('click', () => {
  panel.classList.add('open');
});

document.getElementById('btn-cerrar-panel').addEventListener('click', () => {
  panel.classList.remove('open');
});

document.getElementById('btn-limpiar').addEventListener('click', () => {
  cargarDatos();
});
