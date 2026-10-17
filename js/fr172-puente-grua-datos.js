/* Datos y utilidades compartidas por las vistas FR-172 de puente grúa. */
const FR172 = {
  CLAVE: 'fr172_borrador_v1',
  filasBase: { trabajos: 1, materiales: 1 },
  filasImpresionBase: { trabajos: 10, materiales: 6 },
  filasMax: 15,
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

  cargar() {
    try {
      const raw = localStorage.getItem(this.CLAVE) ||
        (window.name.indexOf('FR172:') === 0 ? window.name.slice(6) : null);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  },
  guardar(est) {
    const raw = JSON.stringify(est);
    try { localStorage.setItem(this.CLAVE, raw); } catch (e) {}
    /* Respaldo para navegadores que aíslan localStorage entre archivos locales */
    try { window.name = 'FR172:' + raw; } catch (e) {}
  },
  borrar() {
    try { localStorage.removeItem(this.CLAVE); } catch (e) {}
    try { window.name = ''; } catch (e) {}
  },
  fecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : (iso || '');
  }
};
