'use strict';

(() => {
  const frame = document.getElementById('panelHerramientasFrame');
  if (frame) {
    document.addEventListener('herramientas:auth-change', () => {
      if (frame.contentWindow) frame.contentWindow.location.reload();
    });
  }
})();
