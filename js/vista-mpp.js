function estaLogueado() {
  return Boolean(localStorage.getItem('token'));
}

function ocultarTodasLasVistas() {
  ['vistaTabla', 'vistaMensual', 'vistaAnual'].forEach((id) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.hidden = true;
  });
}

function aplicarVista(vista) {
  const selector = document.getElementById('selectorVista');
  const vistaSeleccionada = vista || 'anual';
  if (selector) selector.value = vistaSeleccionada;
  ocultarTodasLasVistas();
  const mapa = {
    tabla: 'vistaTabla',
    mensual: 'vistaMensual',
    anual: 'vistaAnual'
  };
  const elemento = document.getElementById(mapa[vistaSeleccionada] || 'vistaAnual');
  if (elemento) elemento.hidden = false;
}

function actualizarVisibilidadDeVistas() {
  const tieneLogin = estaLogueado();
  const selector = document.getElementById('selectorVista');
  if (selector) selector.disabled = !tieneLogin;

  if (!tieneLogin) {
    ocultarTodasLasVistas();
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.classList.add('is-visible');
    return;
  }

  const vistaActual = selector && selector.value ? selector.value : 'anual';
  aplicarVista(vistaActual);
}

function mostrarVista(vista) {
  if (!estaLogueado()) {
    actualizarVisibilidadDeVistas();
    return;
  }
  aplicarVista(vista);
}

document.addEventListener('DOMContentLoaded', () => {
  const selectorVista = document.getElementById('selectorVista');
  const selectorMes = document.getElementById('mes');

  selectorVista?.addEventListener('change', (event) => mostrarVista(event.target.value));
  selectorMes?.addEventListener('change', (event) => window.cambiarMes?.(event.target.value));

  ocultarTodasLasVistas();
  aplicarVista('anual');
  actualizarVisibilidadDeVistas();
});
