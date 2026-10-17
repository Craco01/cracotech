(function () {
  function mostrarMensajeMPP({ titulo = 'Aviso', texto = 'Operación realizada.', redirigir = false, destino = '/mantenimiento/vista-mpp/' } = {}) {
    const mensaje = [titulo, texto].filter(Boolean).join('\n\n');
    return window.siteDialog.alert(mensaje).then(() => {
      if (redirigir) window.location.href = destino;
    });
  }

  window.mostrarMensajeMPP = mostrarMensajeMPP;
})();
