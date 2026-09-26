/* Reporte: mantenimiento_criticos - compresores */
(function () {
  const ENDPOINT = "/api/reportes/mantenimientos-criticos/compresores";
  const columns = [
    {key:"id",label:"ID",number:true},
    {key:"responsable",label:"Responsable"},
    {key:"fecha_registro",label:"Fecha de registro",format:v=>ReportUtils.formatDateOnly(v)},
    {key:"tipo_mantenimiento",label:"Tipo de mantenimiento"},
    {key:"horometro_compresor_100hp",label:"Horómetro compresor 100 HP",number:true},
    {key:"hallazgos_compresor_100hp",label:"Hallazgos compresor 100 HP"},
    {key:"horometro_compresor_75hp",label:"Horómetro compresor 75 HP",number:true},
    {key:"hallazgos_compresor_75hp",label:"Hallazgos compresor 75 HP"},
  ];
  const s=document.createElement("script"); s.src="../js/reporte-utils.js";
  s.onload=()=>ReportUtils.init({endpoint:ENDPOINT,columns});
  document.head.appendChild(s);
})();
