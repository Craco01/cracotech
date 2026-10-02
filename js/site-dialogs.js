(() => {
  if (window.siteDialog) return;

  function show(message, confirmMode) {
    return new Promise(resolve => {
      const previousFocus = document.activeElement;
      const layer = document.createElement('div');
      const dialog = document.createElement('section');
      const title = document.createElement('h2');
      const content = document.createElement('p');
      const actions = document.createElement('div');
      const accept = document.createElement('button');
      let cancel;
      let finished = false;

      layer.className = 'site-dialog-layer';
      dialog.className = 'site-dialog';
      dialog.setAttribute('role', 'alertdialog');
      dialog.setAttribute('aria-modal', 'true');
      title.id = 'siteDialogTitle';
      title.textContent = confirmMode ? 'Confirmar acción' : 'Aviso';
      dialog.setAttribute('aria-labelledby', title.id);
      content.className = 'site-dialog__message';
      content.textContent = String(message ?? '');
      actions.className = 'site-dialog__actions';
      accept.type = 'button';
      accept.className = 'site-dialog__accept';
      accept.textContent = confirmMode ? 'Confirmar' : 'Aceptar';

      function close(result) {
        if (finished) return;
        finished = true;
        document.removeEventListener('keydown', onKeyDown);
        layer.remove();
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        resolve(result);
      }

      function onKeyDown(event) {
        if (event.key === 'Escape') {
          event.preventDefault();
          close(!confirmMode);
        } else if (event.key === 'Tab') {
          const focusable = [cancel, accept].filter(Boolean);
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        } else if (event.key === 'Enter') {
          event.preventDefault();
          close(document.activeElement !== cancel);
        }
      }

      accept.addEventListener('click', () => close(true));
      actions.appendChild(accept);
      if (confirmMode) {
        cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'site-dialog__cancel';
        cancel.textContent = 'Cancelar';
        cancel.addEventListener('click', () => close(false));
        actions.insertBefore(cancel, accept);
      }

      dialog.append(title, content, actions);
      layer.appendChild(dialog);
      document.body.appendChild(layer);
      document.addEventListener('keydown', onKeyDown);
      accept.focus();
    });
  }

  window.siteDialog = {
    alert: message => show(message, false),
    confirm: message => show(message, true)
  };
})();