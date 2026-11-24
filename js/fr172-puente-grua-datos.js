/* Datos y utilidades compartidas por las vistas FR-172 de puente grúa. */
const FR172 = {
  filasBase: { trabajos: 10, materiales: 6 },
  filasImpresionBase: { trabajos: 10, materiales: 6 },
  filasMax: 15,
  tiposPolipasto: ['Eléctrico a cadena', 'Eléctrico a cable', 'Manual a cadena', 'Neumático'],
  tiposTrabajo: [
    'Mantenimiento preventivo',
    'Mantenimiento correctivo',
    'Inspección',
    'Reparación',
    'Instalación',
    'Prueba y puesta en marcha'
  ],
  estadosTrabajo: ['Realizado', 'Parcial', 'Pendiente'],
  estadosVerif: ['Conforme', 'No conforme', 'Observado', 'N/A'],
  operativo: ['Sí', 'No', 'Con restricciones'],
  conformidad: ['Conforme', 'Conforme con observaciones', 'No conforme'],
  verificaciones: [
    'Estructura, vigas, soldaduras y elementos de fijación',
    'Carro / traslación y ruedas',
    'Polipasto: cadena o cable, guías y componentes asociados',
    'Gancho, pestillo de seguridad y aparejos',
    'Freno / sistema de retención de carga',
    'Finales de carrera y limitadores',
    'Alimentación eléctrica',
    'Tablero, botonera / control (si aplica)',
    'Mando a distancia / sistema de control',
    'Lubricación y estado general',
    'Prueba en vacío',
    'Prueba de funcionamiento con carga (si aplica y está autorizada)',
    'Sentidos de movimiento y parada'
  ],
  documentos: [
    'Informe técnico',
    'Registro de mediciones',
    'Fotografías',
    'Certificados',
    'Recomendaciones/Usos del Equipo',
    'Manual de Mantenimiento Preventivo de Puente Grúa',
    'Acta de Recepción de PG'
  ],

  fecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || '');
  },

  normalizarDatos(datosOriginales) {
    const datos = { ...(datosOriginales || {}) };
    if (!String(datos.datos_cliente_lugar || '').trim()) {
      const cliente = String(datos.cliente || '').trim();
      const lugar = String(datos.lugar || '').trim();
      datos.datos_cliente_lugar = [cliente, lugar].filter(Boolean).join(' - ');
    }
    if (!String(datos.datos_equipo || '').trim()) {
      const partes = [
        datos.tipo_polipasto && `Tipo de polipasto: ${datos.tipo_polipasto}`,
        datos.capacidad && `Capacidad: ${datos.capacidad}`,
        datos.marca && `Marca/Fabricante: ${datos.marca}`,
        datos.modelo && `Modelo: ${datos.modelo}`,
        datos.tension && `Tensión: ${datos.tension}`,
        datos.altura && `Altura/Luz/Recorrido: ${datos.altura}`
      ].filter(Boolean);
      datos.datos_equipo = partes.join('\n');
    }
    if (!String(datos.cierres_observaciones || '').trim()) {
      const pendientes = String(datos.pendientes || '').trim();
      const adicionales = String(datos.obs_adic || '').trim();
      datos.cierres_observaciones = [pendientes, adicionales].filter(Boolean).join('\n');
    }
    if (!datos.entregado_operativo && datos.operativo) datos.entregado_operativo = datos.operativo;
    return datos;
  }
};
