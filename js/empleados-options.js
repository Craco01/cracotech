window.cargarOpcionesEmpleados = async configuraciones => {
  const selects = configuraciones
    .map(configuracion => ({ ...configuracion, select: document.getElementById(configuracion.id) }))
    .filter(configuracion => configuracion.select);
  if (!selects.length) return [];

  selects.forEach(({ select, placeholder }) => {
    select.disabled = true;
    select.dataset.employeeOptionsLoading = 'true';
    select.dataset.employeeOptionsLoaded = 'false';
    select.dataset.employeeOptionsPlaceholder = placeholder || 'Seleccione un empleado';
    if (select.dataset.employeeOptionsRetryBound !== 'true') {
      select.dataset.employeeOptionsRetryBound = 'true';
      select.addEventListener('focus', () => {
        if (select.dataset.employeeOptionsLoaded !== 'true' && select.dataset.employeeOptionsLoading !== 'true') {
          window.cargarOpcionesEmpleados([{ id: select.id, placeholder: select.dataset.employeeOptionsPlaceholder }])
            .catch(error => console.error('Error reintentando carga de empleados:', error));
        }
      });
    }
  });

  try {
    const response = await API_FETCH('/api/empleados/opciones');
    if (!response.ok) throw new Error(`No se pudieron cargar los empleados (HTTP ${response.status})`);
    const empleados = await response.json();
    if (!Array.isArray(empleados)) throw new Error('La respuesta de empleados no es válida');

    selects.forEach(({ select, placeholder }) => {
      const options = [new Option(placeholder || 'Seleccione un empleado', '')];
      empleados.forEach(empleado => options.push(new Option(empleado.nombre_apellido, String(empleado.id))));
      select.replaceChildren(...options);
      select.disabled = false;
      select.dataset.employeeOptionsLoaded = 'true';
      select.dataset.employeeOptionsLoading = 'false';
    });
    return empleados;
  } catch (error) {
    selects.forEach(({ select }) => {
      select.replaceChildren(new Option('No se pudieron cargar los empleados', ''));
      select.disabled = false;
      select.dataset.employeeOptionsLoading = 'false';
    });
    throw error;
  }
};