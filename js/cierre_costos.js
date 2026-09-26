let productos = [];
const maxFilas = 15;

// Función para formatear números como enteros con separadores de mil
function formatearNumero(num) {
  const entero = Math.floor(num);
  return entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Función para parsear número formateado
function parseNumeroFormateado(texto) {
  return parseFloat(texto.replace(/\./g, '').replace(/,/g, '.')) || 0;
}

async function cargarProductos() {
  try {
    const response = await API_FETCH('/api/productos');
    const data = await response.json();
    productos = data;

    // Poblar datalist global con código + descripción
    const lista = document.getElementById('listaProductos');
    lista.innerHTML = '';
    productos.forEach(p => {
      const option = document.createElement('option');
      option.value = `${p.codigo} - ${p.descripcion}`;
      lista.appendChild(option);
    });

    agregarFila(); // primera fila vacía
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

function crearBuscador() {
  const buscador = document.createElement('input');
  buscador.type = 'text';
  buscador.placeholder = 'Buscar producto...';
  buscador.setAttribute('list', 'listaProductos');
  return buscador;
}

function agregarFila() {
  const tablaBody = document.getElementById('tablaBody');
  const filasActuales = tablaBody.querySelectorAll('tr').length;
  if (filasActuales >= maxFilas) return;

  const fila = document.createElement('tr');

  const buscador = crearBuscador();
  const inputCantidad = document.createElement('input');
  inputCantidad.type = 'number';
  inputCantidad.min = '0';

  const costoUnitario = document.createElement('input');
  costoUnitario.type = 'text';
  costoUnitario.readOnly = true;

  const total = document.createElement('input');
  total.type = 'text';
  total.readOnly = true;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'X';
  removeBtn.classList.add('remove-btn');
  removeBtn.addEventListener('click', () => {
    fila.remove();
    // Siempre debe quedar al menos una fila
    const filasRestantes = document.getElementById('tablaBody').querySelectorAll('tr').length;
    if (filasRestantes === 0) {
      agregarFila();
    }
    recalcularTotal();
  });

  buscador.addEventListener('change', () => {
    // Buscar por código o descripción
    const valor = buscador.value.trim();
    let prod = productos.find(p => `${p.codigo} - ${p.descripcion}` === valor);

    // Si no coincide exactamente, intentar buscar por código o por descripción parcial
    if (!prod) {
      prod = productos.find(p => p.codigo.toString() === valor || p.descripcion === valor);
    }

    if (prod) {
      const precio = prod.precio_compra || 0;
      costoUnitario.value = formatearNumero(precio);
      verificarFilaCompleta(fila);
      agregarFilaSiNecesaria();
    }
  });

  buscador.addEventListener('input', () => {
    agregarFilaSiNecesaria();
  });

  inputCantidad.addEventListener('input', () => {
    const cantidad = parseFloat(inputCantidad.value) || 0;
    const precio = parseNumeroFormateado(costoUnitario.value);
    const totalVal = cantidad * precio;
    total.value = formatearNumero(totalVal);
    verificarFilaCompleta(fila);
    recalcularTotal();
    agregarFilaSiNecesaria();
  });

  fila.appendChild(document.createElement('td')).appendChild(buscador);
  fila.appendChild(document.createElement('td')).appendChild(inputCantidad);
  fila.appendChild(document.createElement('td')).appendChild(costoUnitario);
  fila.appendChild(document.createElement('td')).appendChild(total);
  fila.appendChild(document.createElement('td')).appendChild(removeBtn);

  tablaBody.appendChild(fila);
}

function verificarFilaCompleta(fila) {
  const buscador = fila.querySelector('td:nth-child(1) input');
  const cantidad = fila.querySelector('td:nth-child(2) input');
  const costo = fila.querySelector('td:nth-child(3) input');

  if (buscador.value && cantidad.value && costo.value) {
    // Fila completa
    return true;
  }
  return false;
}

function agregarFilaSiNecesaria() {
  const tablaBody = document.getElementById('tablaBody');
  const filasActuales = tablaBody.querySelectorAll('tr').length;
  
  if (filasActuales >= maxFilas) return;

  // Verificar si la última fila tiene algún dato
  if (filasActuales > 0) {
    const ultimaFila = tablaBody.lastElementChild;
    const buscador = ultimaFila.querySelector('td:nth-child(1) input').value;
    const cantidad = ultimaFila.querySelector('td:nth-child(2) input').value;
    
    // Si la última fila tiene algo, agregar una nueva
    if (buscador || cantidad) {
      agregarFila();
    }
  }
}

function recalcularTotal() {
  let costoTotal = 0;
  document.querySelectorAll('#tablaBody tr').forEach(fila => {
    const totalText = fila.querySelector('td:nth-child(4) input').value;
    const total = parseNumeroFormateado(totalText);
    costoTotal += total;
  });
  document.getElementById('costoTotal').textContent = formatearNumero(costoTotal);
  document.getElementById('costo_repuestos').value = costoTotal.toFixed(2);
}

function construirNotas() {
  const repuestos = [];

  document.querySelectorAll('#tablaBody tr').forEach(fila => {
    const valorProducto = fila.querySelector('td:nth-child(1) input')?.value.trim() || '';
    const cantidad = fila.querySelector('td:nth-child(2) input')?.value.trim() || '';
    const producto = productos.find(item => `${item.codigo} - ${item.descripcion}` === valorProducto);

    if (producto && cantidad) {
      repuestos.push(`${producto.codigo} | ${producto.descripcion} | ${cantidad}`);
    }
  });

  const observacion = document.getElementById('observacion')?.value.trim() || '';
  const partes = [];

  if (repuestos.length > 0) {
    partes.push(`Repuestos:\n${repuestos.map(item => `- ${item}`).join('\n')}`);
  }
  if (observacion) {
    partes.push(`Observación:\n${observacion}`);
  }

  return partes.join('\n\n');
}

// Cuando se envía el formulario principal
const formularioCierre = document.querySelector('form[action="/api/mantenimientos-preventivos/cierre"], form[action="/api/ordenes/cierre"]');
if (formularioCierre) {
  const action = (formularioCierre.getAttribute('action') || '').trim();

  // MPP usa su propio flujo de cierre y no debe recalcular unidad de MO ni enviar el cálculo genérico.
  if (!action.includes('/mantenimientos-preventivos/cierre')) {
    formularioCierre.addEventListener('submit', async (e) => {
      e.preventDefault();
      recalcularTotal();
      const submitButton = e.target.querySelector('button[type="submit"]');
      if (submitButton?.disabled) return;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Cerrando...';
      }

      // Calcular costo_mo basado en salarios
      try {
        await calcularUnidadMO();
      } catch (error) {
        console.error('Error calculando unidad_mo:', error);
      window.alert('Error al calcular unidad de MO');
        return;
      }

      // Enviar formulario por AJAX
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData);
      payload.notas = construirNotas();
      const selectApoyo = document.getElementById('apoyo');

      // El item se usa para calcular el salario; en la orden se guarda el nombre visible.
      payload.apoyo = selectApoyo?.value
        ? selectApoyo.selectedOptions[0].text.trim()
        : '';

      const endpoint = action || '/api/ordenes/cierre';

      try {
        const response = await API_FETCH(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data = {};
        
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Error al parsear JSON:', e);
        }

        if (!response.ok) {
          const errorMsg = data.detalle || data.error || 'No se pudo cerrar la orden';
          alert('Error: ' + errorMsg);
          return;
        }

        alert('Orden cerrada exitosamente');
        if (endpoint.includes('/mantenimientos-preventivos/')) {
          window.location.reload();
        } else {
          window.location.href = '../pages/lista_solicitudes.html';
        }
      } catch (error) {
        console.error('Error al cerrar orden:', error);
        alert('Error al cerrar la orden: ' + error.message);
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Cerrar solicitud';
        }
      }
    });
  }
}

// Obtener usuario logueado del localStorage
function getUsernameFromLocalStorage() {
  return localStorage.getItem('username');
}

// Obtener salario de un empleado por username o nombre
async function obtenerSalarioEmpleado(identificador) {
  if (!identificador) return 0;
  try {
    const response = await API_FETCH(`/api/auth/empleados/${encodeURIComponent(identificador)}/salario`);
    if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
    const data = await response.json();
    return data.salario || 0;
  } catch (err) {
    console.error(`Error obteniendo salario de ${identificador}:`, err);
    return 0;
  }
}

// Calcular unidad_mo
async function calcularUnidadMO() {
  // El responsable es el usuario logueado (desde token JWT, que es el username/user)
  const responsable = getUsernameFromLocalStorage();
  
  // El apoyo es el nombre_apellido seleccionado en el select
  const itemApoyo = document.getElementById('apoyo').value;

  let salarioResponsable = 0;
  let salarioApoyo = 0;

  if (responsable) {
    // Buscar salario del responsable por username
    salarioResponsable = await obtenerSalarioEmpleado(responsable);
  }

  // Si apoyo dice "Sin apoyo", no buscar salario
  if (itemApoyo) {
    // Buscar salario del apoyo por nombre_apellido
    salarioApoyo = await obtenerSalarioEmpleado(itemApoyo);
  }

  const unidadMO = (salarioResponsable + salarioApoyo) / 240;
  document.getElementById('unidad_mo').value = unidadMO.toFixed(2);
}

// Inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', cargarProductos);
} else {
  cargarProductos();
}
