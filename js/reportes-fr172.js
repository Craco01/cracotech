(() => {
  'use strict';
  const maintenanceRoute = location.pathname.includes('/mantenimiento/');

  const body = document.getElementById('fr172Body');
  const status = document.getElementById('fr172Estado');
  const search = document.getElementById('fr172Buscador');
  const createLink = document.querySelector('.fr172-reportes__nuevo');
  const masterDialog = document.getElementById('fr172MasterDialog');
  const masterForm = document.getElementById('fr172MasterForm');
  const masterPasswordInput = document.getElementById('fr172MasterPassword');
  const masterError = document.getElementById('fr172MasterError');
  let canEdit = false;
  let isAdmin = false;
  const accessDenied = new URLSearchParams(location.search).get('accessDenied') === '1';
  let fichas = [];

  function setRole(role) {
    canEdit = ['editor', 'supervisor', 'administrador'].includes(role);
    isAdmin = role === 'administrador';
    createLink.hidden = !canEdit;
    localStorage.setItem('role', role);
  }

  async function refreshRole() {
    const response = await API_FETCH('/api/auth/session', { cache: 'no-store' });
    const result = await response.json();
    if (response.status === 403) {
      setRole('viewer');
      return;
    }
    if (!response.ok) throw new Error(result.error || 'No se pudo validar el rol de la sesión.');
    if (!['editor', 'supervisor', 'administrador'].includes(result.role)) {
      throw new Error('El servidor devolvió un rol no válido para el reporte FR-172.');
    }
    setRole(result.role);
  }

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function displayDate(value) {
    const date = String(value ?? '').slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : date;
  }

  function render() {
    const query = search.value.trim();
    const visible = fichas.filter(ficha => SEARCH_UTILS.matches(
      query,
      ficha.id,
      ficha.ot,
      displayDate(ficha.fecha),
      ficha.cliente,
      ficha.lugar,
      ficha.n_puente,
      ficha.estado
    ));

    if (!visible.length) {
      body.innerHTML = `<tr><td colspan="8">${fichas.length ? 'No hay fichas que coincidan con la búsqueda.' : 'No hay fichas disponibles.'}</td></tr>`;
      return;
    }

    body.innerHTML = visible.map(ficha => {
      const id = encodeURIComponent(String(ficha.id));
      const editButton = canEdit
        ? `<button type="button" class="fr172-accion fr172-accion--editar" data-action="edit" data-id="${escapeHtml(ficha.id)}">Editar doc</button>`
        : '<button type="button" class="fr172-accion fr172-accion--editar" disabled title="No tienes autorización para modificar fichas">Editar doc</button>';
      const deleteButton = isAdmin
        ? `<button type="button" class="fr172-accion fr172-accion--eliminar" data-action="delete" data-id="${escapeHtml(ficha.id)}">Borrar</button>`
        : '';
      return `<tr>
        <td>${escapeHtml(ficha.id)}</td>
        <td>${escapeHtml(ficha.ot)}</td>
        <td>${escapeHtml(displayDate(ficha.fecha))}</td>
        <td>${escapeHtml(ficha.cliente)}</td>
        <td>${escapeHtml(ficha.lugar)}</td>
        <td>${escapeHtml(ficha.n_puente)}</td>
        <td>${escapeHtml(ficha.estado === 'finalizada' ? 'Finalizada' : 'Borrador')}</td>
        <td class="fr172-reportes__acciones">
          <button type="button" class="fr172-accion" data-action="print" data-id="${id}">Ver ficha imprimible</button>
          ${editButton}
          ${deleteButton}
        </td>
      </tr>`;
    }).join('');
  }

  async function load() {
    status.textContent = 'Cargando fichas...';
    document.getElementById('fr172Refrescar').disabled = true;
    body.replaceChildren();
    try {
      await refreshRole();
      const response = await API_FETCH('/api/fr172-puente-grua');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudieron cargar las fichas.');
      if (!Array.isArray(result)) throw new Error('La respuesta del servidor no tiene el formato esperado.');
      fichas = result;
      render();
      status.textContent = accessDenied
        ? 'La cuenta actual no tiene autorización para crear fichas FR-172.'
        : `${fichas.length} ficha${fichas.length === 1 ? '' : 's'} cargada${fichas.length === 1 ? '' : 's'}.`;
    } catch (error) {
      status.textContent = `Error al cargar las fichas: ${error.message}`;
      body.innerHTML = '<tr><td colspan="8">No se pudo cargar el listado.</td></tr>';
    } finally {
      document.getElementById('fr172Refrescar').disabled = false;
    }
  }

  function pedirClaveMaestra() {
    return new Promise(resolve => {
      const finish = value => {
        masterDialog.close();
        masterForm.removeEventListener('submit', onSubmit);
        document.getElementById('fr172MasterCancel').removeEventListener('click', onCancel);
        masterDialog.removeEventListener('cancel', onCancel);
        masterPasswordInput.value = '';
        resolve(value);
      };
      const onSubmit = event => {
        event.preventDefault();
        if (!masterPasswordInput.value.trim()) {
          masterError.textContent = 'La clave maestra es obligatoria.';
          return;
        }
        finish(masterPasswordInput.value);
      };
      const onCancel = () => finish(null);

      masterError.textContent = '';
      masterPasswordInput.value = '';
      masterForm.addEventListener('submit', onSubmit);
      document.getElementById('fr172MasterCancel').addEventListener('click', onCancel);
      masterDialog.addEventListener('cancel', onCancel);
      masterDialog.showModal();
      masterPasswordInput.focus();
    });
  }

  async function removeFicha(id, button) {
    if (!isAdmin || !await window.siteDialog.confirm(`¿Eliminar permanentemente la ficha FR-172 ${id}? Esta acción no se puede deshacer.`)) return;
    let masterPassword = await pedirClaveMaestra();
    if (!masterPassword) return;
    button.disabled = true;
    status.textContent = `Eliminando la ficha ${id}...`;
    try {
      const response = await API_FETCH(`/api/fr172-puente-grua/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'X-Master-Password': masterPassword }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo eliminar la ficha.');
      await load();
      if (!status.textContent.startsWith('Error al cargar')) {
        status.textContent = `Ficha ${id} eliminada. ${fichas.length} ficha${fichas.length === 1 ? '' : 's'} cargada${fichas.length === 1 ? '' : 's'}.`;
      }
    } catch (error) {
      status.textContent = `No se pudo eliminar la ficha ${id}: ${error.message}`;
      await window.siteDialog.alert(status.textContent);
    } finally {
      masterPassword = '';
      button.disabled = false;
    }
  }

  search.addEventListener('input', render);
  document.getElementById('fr172Refrescar').addEventListener('click', load);
  body.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const id = encodeURIComponent(button.dataset.id);
    if (button.dataset.action === 'print') {
      location.href = `../fr172-puente-grua-imprimible/?id=${id}`;
    } else if (button.dataset.action === 'edit' && canEdit) {
      location.href = `../fr172-puente-grua-formulario/?id=${id}`;
    } else if (button.dataset.action === 'delete' && isAdmin) {
      removeFicha(button.dataset.id, button);
    }
  });

  load();
})();
