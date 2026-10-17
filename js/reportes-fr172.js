(() => {
  'use strict';
  const maintenanceRoute = location.pathname.includes('/mantenimiento/');

  const body = document.getElementById('fr172Body');
  const status = document.getElementById('fr172Estado');
  const search = document.getElementById('fr172Buscador');
  const canEdit = ['editor', 'administrador'].includes(localStorage.getItem('role'));
  const accessDenied = new URLSearchParams(location.search).get('accessDenied') === '1';
  let fichas = [];

  if (!canEdit) document.querySelector('.fr172-reportes__nuevo').hidden = true;

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
        : '<button type="button" class="fr172-accion fr172-accion--editar" disabled title="Se requiere perfil editor para modificar fichas">Editar doc</button>';
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
        </td>
      </tr>`;
    }).join('');
  }

  async function load() {
    status.textContent = 'Cargando fichas...';
    document.getElementById('fr172Refrescar').disabled = true;
    body.replaceChildren();
    try {
      const response = await API_FETCH('/api/fr172-puente-grua');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudieron cargar las fichas.');
      if (!Array.isArray(result)) throw new Error('La respuesta del servidor no tiene el formato esperado.');
      fichas = result;
      render();
      status.textContent = accessDenied
        ? 'La cuenta actual no tiene permisos para crear fichas FR-172. Se requiere perfil editor o administrador.'
        : `${fichas.length} ficha${fichas.length === 1 ? '' : 's'} cargada${fichas.length === 1 ? '' : 's'}.`;
    } catch (error) {
      status.textContent = `Error al cargar las fichas: ${error.message}`;
      body.innerHTML = '<tr><td colspan="8">No se pudo cargar el listado.</td></tr>';
    } finally {
      document.getElementById('fr172Refrescar').disabled = false;
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
    }
  });

  load();
})();
