/* Reporte: horometro_maquinas - datos brutos */
(function () {
  const ENDPOINT = "/api/reportes/horometros/datos";
  const columns = [
    {key:"id",label:"ID",number:true},
    {key:"responsable",label:"Responsable"},
    {key:"dia_registro",label:"Día registro",format:v=>ReportUtils.formatDateOnly(v)},
    {key:"turno_registro",label:"Turno"},
    {key:"pantografo_gs4000",label:"Pantógrafo GS4000",number:true},
    {key:"procesador_placas_kaltenbach",label:"Procesador placas Kaltenbach",number:true},
    {key:"pantografo_promax200",label:"Pantógrafo Promax200",number:true},
    {key:"perforadora_calfran",label:"Perforadora Calfran",number:true},
    {key:"punteadora_hg1500",label:"Punteadora HG1500",number:true},
    {key:"arco_sumergido_cabezal_1s",label:"Arco sumergido cabezal 1S",number:true},
    {key:"arco_sumergido_cabezal_2n",label:"Arco sumergido cabezal 2N",number:true},
    {key:"calibradora_perfiles_h",label:"Calibradora perfiles H",number:true},
    {key:"sierra_taladro_kaltenbach",label:"Sierra-taladro Kaltenbach",number:true},
    {key:"sierra_taladro_ficep",label:"Sierra-taladro Ficep",number:true},
    {key:"roscadora_rosquinel",label:"Roscadora Rosquinel",number:true},
    {key:"granalladora_automatica_kaltenbach",label:"Granalladora automática Kaltenbach",number:true},
    {key:"granalladora_manual",label:"Granalladora manual",number:true},
    {key:"cizalla_punzonadora_angulos_ficep",label:"Cizalla-punzonadora ángulos Ficep",number:true},
    {key:"cizalla_punzonadora_geka_hydracrop80",label:"Geka Hydracrop 80",number:true},
    {key:"cizalla_punzonadora_geka_microcrop36",label:"Geka Microcrop 36",number:true},
    {key:"plegadora_newton",label:"Plegadora Newton",number:true},
    {key:"plegadora_ermarksan",label:"Plegadora Ermarksan",number:true},
    {key:"guillotina_newton",label:"Guillotina Newton",number:true},
    {key:"guillotina_ermarksan",label:"Guillotina Ermarksan",number:true},
    {key:"guillotina_feysama",label:"Guillotina Feysama",number:true},
    {key:"plegadora_feysama",label:"Plegadora Feysama",number:true},
  ];
  const loadUtils = () => {
    const s=document.createElement("script"); s.src="../js/reporte-utils.js";
    s.onload=()=>ReportUtils.init({endpoint:ENDPOINT,columns});
    document.head.appendChild(s);
  };
  loadUtils();
})();
