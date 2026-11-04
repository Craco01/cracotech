'use strict';

(() => {
  const gate = document.getElementById('adminGate');
  const gateMessage = document.getElementById('adminGateMessage');
  const loginAdmin = document.getElementById('loginAdmin');
  const content = document.getElementById('adminContent');
  const form = document.getElementById('userForm');
  const formTitle = document.getElementById('formTitle');
  const passwordLabel = document.getElementById('passwordLabel');
  const activeField = document.getElementById('activeField');
  const saveButton = document.getElementById('saveUser');
  const cancelEdit = document.getElementById('cancelEdit');
  const formError = document.getElementById('formError');
  const notice = document.getElementById('usersNotice');
  const usersTable = document.getElementById('usersTable');
  const userCount = document.getElementById('userCount');
  const userFilter = document.getElementById('userFilter');
  let users = [];
  let editingUser = null;
  let checkingAccess = false;
  let requestNumber = 0;

  const isActive = user => user.activo === true || Number(user.activo) === 1;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));

  async function responseData(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.errores?.join(' ') || 'No se pudo completar la solicitud.');
    }
    return data;
  }

  function showNotice(message, success = false) {
    notice.textContent = message;
    notice.classList.toggle('success', success);
    notice.hidden = false;
  }

  function setFormError(message) {
    formError.textContent = message;
    formError.hidden = !message;
  }

  function resetForm() {
    editingUser = null;
    form.reset();
    form.elements.rol.value = 'solicitante';
    form.elements.activo.value = 'true';
    form.elements.password.required = true;
    form.elements.passwordConfirm.required = true;
    form.elements.username.readOnly = false;
    form.elements.email.readOnly = false;
    formTitle.textContent = 'Crear usuario';
    passwordLabel.textContent = 'Contraseña inicial';
    saveButton.textContent = 'Crear usuario';
    activeField.hidden = true;
    cancelEdit.hidden = true;
    setFormError('');
  }

  function renderUsers() {
    const term = userFilter.value.trim().toLocaleLowerCase();
    const visibleUsers = users.filter(user =>
      [user.nombre, user.username, user.email, user.rol]
        .some(value => String(value).toLocaleLowerCase().includes(term))
    );
    userCount.textContent = `${visibleUsers.length} de ${users.length} usuario(s)`;
    if (!visibleUsers.length) {
      usersTable.innerHTML = '<tr><td class="empty-row" colspan="7">No hay usuarios para mostrar.</td></tr>';
      return;
    }

    usersTable.innerHTML = visibleUsers.map(user => `
      <tr>
        <td>${escapeHtml(user.nombre)}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.rol)}</td>
        <td><span class="user-status${isActive(user) ? '' : ' inactive'}">
          ${isActive(user) ? 'Activo' : 'Desactivado'}
        </span></td>
        <td>${escapeHtml(user.ultimo_acceso || '—')}</td>
        <td>
          <div class="user-actions">
            <button class="table-action" type="button" data-edit="${Number(user.id)}" aria-label="Editar a ${escapeHtml(user.nombre)}">Editar</button>
            <button class="table-action danger" type="button" data-delete="${Number(user.id)}" aria-label="Eliminar a ${escapeHtml(user.nombre)}">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  async function loadUsers() {
    const data = await responseData(await API_FETCH('/api/usuarios'));
    users = data;
    renderUsers();
  }

  async function verifyAdmin() {
    if (checkingAccess) return;
    checkingAccess = true;
    const currentRequest = ++requestNumber;
    gate.hidden = false;
    content.hidden = true;
    loginAdmin.hidden = true;
    gateMessage.textContent = 'Verificando permisos...';

    try {
      if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) {
        gateMessage.textContent = 'Inicia sesión con una cuenta de administrador para continuar.';
        loginAdmin.hidden = false;
        window.abrirLoginHerramientas();
        return;
      }

      const session = await responseData(await API_FETCH('/api/auth/session'));
      if (currentRequest !== requestNumber) return;
      const previousRole = sessionStorage.getItem(AUTH_ROLE_KEY);
      sessionStorage.setItem(AUTH_ROLE_KEY, session.rol);
      if (previousRole !== session.rol) {
        document.dispatchEvent(new Event('herramientas:auth-change'));
      }
      if (session.rol !== 'administrador') {
        gateMessage.textContent = 'Esta sección es exclusiva para administradores. Inicia sesión con una cuenta administradora.';
        loginAdmin.hidden = false;
        window.abrirLoginHerramientas();
        return;
      }

      await loadUsers();
      if (currentRequest !== requestNumber) return;
      gate.hidden = true;
      content.hidden = false;
    } catch (error) {
      if (currentRequest !== requestNumber) return;
      gateMessage.textContent = error instanceof TypeError
        ? 'No se pudo conectar con el servicio. Verifica que la API esté iniciada.'
        : error.message;
      loginAdmin.hidden = !sessionStorage.getItem(AUTH_TOKEN_KEY);
      if (!sessionStorage.getItem(AUTH_TOKEN_KEY)) window.abrirLoginHerramientas();
    } finally {
      checkingAccess = false;
    }
  }

  function editUser(id) {
    const user = users.find(item => Number(item.id) === id);
    if (!user) return;
    editingUser = user;
    form.elements.nombre.value = user.nombre;
    form.elements.username.value = user.username;
    form.elements.email.value = user.email;
    form.elements.rol.value = user.rol;
    form.elements.activo.value = String(isActive(user));
    form.elements.password.value = '';
    form.elements.passwordConfirm.value = '';
    form.elements.password.required = false;
    form.elements.passwordConfirm.required = false;
    form.elements.username.readOnly = false;
    form.elements.email.readOnly = false;
    formTitle.textContent = `Editar usuario: ${user.nombre}`;
    passwordLabel.textContent = 'Nueva contraseña (opcional)';
    saveButton.textContent = 'Guardar cambios';
    activeField.hidden = false;
    cancelEdit.hidden = false;
    setFormError('');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.elements.nombre.focus({ preventScroll: true });
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    setFormError('');
    const values = new FormData(form);
    const password = values.get('password');
    const passwordConfirm = values.get('passwordConfirm');
    if (password !== passwordConfirm && (!editingUser || password || passwordConfirm)) {
      setFormError('Las contraseñas no coinciden.');
      form.elements.passwordConfirm.focus();
      return;
    }

    saveButton.disabled = true;
    const payload = {
      nombre: values.get('nombre').trim(),
      username: values.get('username').trim(),
      email: values.get('email').trim(),
      rol: values.get('rol')
    };

    try {
      if (editingUser) {
        payload.activo = values.get('activo') === 'true';
        await responseData(await API_FETCH(`/api/usuarios/${editingUser.id}`, {
          method: 'PUT',
          headers: API_JSON_HEADERS,
          body: JSON.stringify(payload)
        }));
        if (password) {
          try {
            await responseData(await API_FETCH(`/api/usuarios/${editingUser.id}/password`, {
              method: 'PUT',
              headers: API_JSON_HEADERS,
              body: JSON.stringify({ password })
            }));
          } catch (error) {
            await loadUsers();
            resetForm();
            showNotice(`Los datos se guardaron, pero no se pudo restablecer la contraseña: ${error.message}`);
            return;
          }
        }
        showNotice('Usuario actualizado correctamente.', true);
      } else {
        payload.password = values.get('password');
        await responseData(await API_FETCH('/api/usuarios', {
          method: 'POST',
          headers: API_JSON_HEADERS,
          body: JSON.stringify(payload)
        }));
        showNotice('Usuario creado correctamente.', true);
      }
      resetForm();
      await loadUsers();
    } catch (error) {
      setFormError(error instanceof TypeError
        ? 'No se pudo conectar con el servicio de herramientas.'
        : error.message);
    } finally {
      saveButton.disabled = false;
    }
  });

  usersTable.addEventListener('click', async event => {
    const editButton = event.target.closest('[data-edit]');
    if (editButton) {
      editUser(Number(editButton.dataset.edit));
      return;
    }

    const deleteButton = event.target.closest('[data-delete]');
    if (!deleteButton) return;
    const user = users.find(item => Number(item.id) === Number(deleteButton.dataset.delete));
    if (!user || !await window.siteDialog.confirm(`¿Eliminar físicamente la cuenta de ${user.nombre}? Si tiene pedidos asociados, la base impedirá el borrado; en ese caso, desactiva la cuenta para conservar el historial.`)) {
      return;
    }

    deleteButton.disabled = true;
    try {
      const result = await responseData(await API_FETCH(`/api/usuarios/${user.id}`, { method: 'DELETE' }));
      showNotice(result.mensaje, true);
      if (editingUser && Number(editingUser.id) === Number(user.id)) resetForm();
      await loadUsers();
    } catch (error) {
      showNotice(error instanceof TypeError
        ? 'No se pudo conectar con el servicio de herramientas.'
        : error.message);
      deleteButton.disabled = false;
    }
  });

  userFilter.addEventListener('input', renderUsers);
  cancelEdit.addEventListener('click', resetForm);
  loginAdmin.addEventListener('click', () => window.abrirLoginHerramientas());
  document.addEventListener('herramientas:auth-change', verifyAdmin);
  document.addEventListener('herramientas:session-expirada', () => {
    gate.hidden = false;
    content.hidden = true;
    gateMessage.textContent = 'La sesión venció. Inicia sesión con una cuenta de administrador.';
    loginAdmin.hidden = false;
  });

  resetForm();
  verifyAdmin();
})();
