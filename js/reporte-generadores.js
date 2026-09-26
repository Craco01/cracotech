/* Reporte: mantenimiento_criticos - grupos generadores */
(function () {
  const ENDPOINT = "/api/reportes/mantenimientos-criticos/generadores";
  const columns = [
    {key:"id",label:"ID",number:true},
    {key:"responsable",label:"Responsable"},
    {key:"fecha_registro",label:"Fecha de registro",format:v=>ReportUtils.formatDateOnly(v)},
    {key:"tipo_mantenimiento",label:"Tipo de mantenimiento"},
    {key:"horometro_generador_660",label:"Horómetro generador 660",number:true},
    {key:"hallazgos_generador_660",label:"Hallazgos generador 660"},
    {key:"horometro_generador_220",label:"Horómetro generador 220",number:true},
    {key:"hallazgos_generador_220",label:"Hallazgos generador 220"},
  ];
  const s=document.createElement("script"); s.src="../js/reporte-utils.js";
  s.onload=()=>ReportUtils.init({endpoint:ENDPOINT,columns});
  document.head.appendChild(s);
})();
