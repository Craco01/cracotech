/* Datos y utilidades compartidas por las vistas FR-172 de puente grúa. */
const FR172 = {
  filasBase: { trabajos: 1, materiales: 1 },
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
  }
};
