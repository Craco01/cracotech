# Registro de pruebas beta: Herramientas

- **Fecha:** 18/11/2026
- **Frontend:** `http://127.0.0.1:5500/herramientas/`
- **API:** producción (`api.cracotech.com`), autorizada para esta prueba
**Alcance inicial:** solicitudes 12–61 (50 registros)

## Alcance y resultado

Al inicio, 48 solicitudes del rango estaban en «Solicitado» y las solicitudes 12 y 13 ya estaban «En proceso». Se eligieron al azar 40 de las 48. En la primera pasada solo se probó una herramienta por solicitud; tras la aclaración del alcance, se cambió al azar **cada selector de herramienta** de las 40 solicitudes elegidas y de los ocho reemplazos de reprogramación. Los estados aleatorios son el resultado final. No se escribieron cambios en las ocho solicitudes no seleccionadas.

- Solicitudes originales seleccionadas: 14, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 27, 29, 30, 31, 32, 34, 35, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60 y 61.
- Herramientas actualizadas al azar: **307** en 48 registros (40 solicitudes originales y ocho reemplazos).
- Distribución final: Disponible 44; No disponible 48; Buscar 44; Para compra 47; Envío cancelado 35; Ya enviado 48; Puntero ya tiene 41.
- Las 32 solicitudes seleccionadas no reprogramadas permanecen «En proceso». Las ocho fuentes de reprogramación quedan «Cancelado» por el flujo del módulo; sus reemplazos están «En proceso».
- Solicitudes no seleccionadas: 18, 26, 28, 33, 36, 44, 45 y 50. Sus estados generales siguen «Solicitado»; no se guardaron cambios en ellas. Las solicitudes 12 y 13 tampoco se modificaron.

## Reprogramaciones

Reprogramar crea una solicitud nueva y deja cancelada la original. En cada pareja se actualizaron al azar todos los estados de herramienta, tanto en el original cancelado como en el reemplazo activo.

| Solicitud original | Reemplazo | Nueva fecha de necesidad |
|---:|---:|---|
| 19 | 62 | 20/11/2026 07:30 |
| 21 | 63 | 20/11/2026 08:00 |
| 22 | 64 | 20/11/2026 08:30 |
| 34 | 65 | 20/11/2026 09:00 |
| 49 | 66 | 20/11/2026 09:30 |
| 56 | 67 | 20/11/2026 10:00 |
| 59 | 68 | 20/11/2026 10:30 |
| 60 | 69 | 20/11/2026 11:00 |

Todas las fechas cumplen la anticipación mínima de 10 horas hábiles y se eligieron con el selector de fecha y hora del frontend.

## Estados finales por herramienta

Cada par indica `ID de detalle=estado final`. La asignación aleatoria se realizó con el selector de la interfaz.

| Pedido | Estado del pedido | Herramientas |
|---:|---|---|
| 14 | En proceso | 50=Ya enviado, 51=No disponible, 52=No disponible, 53=Ya enviado, 54=Buscar, 55=Buscar, 56=No disponible, 57=Para compra, 58=Envío cancelado |
| 15 | En proceso | 59=Puntero ya tiene, 60=Ya enviado, 61=No disponible, 62=Ya enviado, 63=Envío cancelado, 64=Ya enviado |
| 16 | En proceso | 65=Puntero ya tiene, 66=Puntero ya tiene, 67=Envío cancelado, 68=Buscar |
| 17 | En proceso | 69=Ya enviado, 70=No disponible, 71=Para compra, 72=Envío cancelado, 73=Disponible, 74=No disponible, 75=No disponible |
| 19 | Cancelado | 82=Ya enviado, 83=No disponible, 84=Para compra, 85=Para compra, 86=Ya enviado, 87=Disponible, 88=No disponible, 89=Ya enviado, 90=Puntero ya tiene, 91=Buscar |
| 20 | En proceso | 92=Disponible, 93=Disponible |
| 21 | Cancelado | 94=Envío cancelado, 95=Buscar, 96=Ya enviado |
| 22 | Cancelado | 97=Buscar, 98=Para compra, 99=Puntero ya tiene, 100=Buscar, 101=Buscar, 102=Disponible, 103=Envío cancelado, 104=Buscar |
| 23 | En proceso | 105=No disponible, 106=No disponible, 107=Puntero ya tiene, 108=No disponible, 109=Disponible, 110=Envío cancelado, 111=No disponible, 112=Envío cancelado, 113=Disponible, 114=Envío cancelado |
| 24 | En proceso | 115=No disponible, 116=Para compra, 117=Puntero ya tiene, 118=Para compra, 119=Disponible, 120=No disponible, 121=Envío cancelado |
| 25 | En proceso | 122=Disponible, 123=Puntero ya tiene, 124=Buscar, 125=Para compra, 126=No disponible, 127=Envío cancelado, 128=Puntero ya tiene, 129=No disponible, 130=Para compra, 131=Para compra |
| 27 | En proceso | 135=Puntero ya tiene, 136=No disponible, 137=No disponible, 138=Puntero ya tiene, 139=Envío cancelado |
| 29 | En proceso | 150=Buscar, 151=Ya enviado, 152=Envío cancelado, 153=No disponible, 154=No disponible, 155=Para compra |
| 30 | En proceso | 156=No disponible, 157=Envío cancelado, 158=Para compra, 159=Disponible, 160=Para compra, 161=Para compra, 162=Envío cancelado, 163=Puntero ya tiene |
| 31 | En proceso | 164=Puntero ya tiene, 165=No disponible, 166=Para compra, 167=Envío cancelado, 168=Envío cancelado, 169=Envío cancelado, 170=Para compra, 171=Puntero ya tiene, 172=Para compra, 173=Buscar |
| 32 | En proceso | 174=Disponible, 175=Disponible, 176=Puntero ya tiene, 177=Disponible, 178=Disponible |
| 34 | Cancelado | 186=Buscar, 187=No disponible, 188=Envío cancelado, 189=Puntero ya tiene, 190=Buscar, 191=Ya enviado, 192=Buscar |
| 35 | En proceso | 193=Puntero ya tiene, 194=Ya enviado, 195=Puntero ya tiene, 196=No disponible, 197=Buscar, 198=Envío cancelado, 199=Para compra |
| 37 | En proceso | 210=Ya enviado, 211=Puntero ya tiene, 212=No disponible, 213=Ya enviado, 214=Ya enviado, 215=Buscar, 216=Ya enviado, 217=Ya enviado, 218=Para compra, 219=No disponible |
| 38 | En proceso | 220=Para compra, 221=No disponible, 222=Buscar, 223=Buscar, 224=No disponible, 225=No disponible, 226=No disponible, 227=Buscar, 228=No disponible |
| 39 | En proceso | 229=Envío cancelado, 230=Ya enviado |
| 40 | En proceso | 231=Para compra, 232=Disponible, 233=Puntero ya tiene, 234=Puntero ya tiene, 235=Disponible, 236=Envío cancelado, 237=Buscar |
| 41 | En proceso | 238=Para compra, 239=Ya enviado, 240=Disponible, 241=Puntero ya tiene |
| 42 | En proceso | 242=Envío cancelado, 243=Ya enviado |
| 43 | En proceso | 244=Para compra, 245=Para compra, 246=Para compra, 247=Para compra |
| 46 | En proceso | 255=Buscar, 256=Buscar, 257=No disponible, 258=Puntero ya tiene, 259=Disponible, 260=Para compra, 261=Ya enviado, 262=Puntero ya tiene |
| 47 | En proceso | 263=Buscar, 264=Envío cancelado, 265=Envío cancelado, 266=Buscar |
| 48 | En proceso | 267=Disponible, 268=No disponible, 269=Para compra, 270=Disponible, 271=Envío cancelado, 272=Disponible, 273=Disponible, 274=Buscar, 275=Ya enviado, 276=Puntero ya tiene |
| 49 | Cancelado | 277=Ya enviado, 278=Ya enviado, 279=Ya enviado |
| 51 | En proceso | 284=Para compra, 285=Puntero ya tiene, 286=Envío cancelado, 287=Puntero ya tiene |
| 52 | En proceso | 288=Disponible, 289=Buscar, 290=Disponible, 291=Para compra, 292=No disponible, 293=Disponible, 294=Disponible, 295=Ya enviado |
| 53 | En proceso | 296=Buscar, 297=Buscar, 298=Disponible |
| 54 | En proceso | 299=Buscar, 300=Buscar, 301=Buscar, 302=Para compra, 303=Disponible, 304=Buscar, 305=Disponible, 306=Para compra, 307=Disponible, 308=Ya enviado |
| 55 | En proceso | 309=Puntero ya tiene, 310=Puntero ya tiene, 311=Puntero ya tiene |
| 56 | Cancelado | 312=Disponible, 313=No disponible, 314=Disponible, 315=Disponible, 316=Puntero ya tiene, 317=Buscar, 318=Para compra |
| 57 | En proceso | 319=No disponible, 320=Para compra, 321=Envío cancelado, 322=Disponible |
| 58 | En proceso | 323=No disponible, 324=Envío cancelado, 325=Envío cancelado, 326=Ya enviado, 327=Buscar |
| 59 | Cancelado | 328=Para compra, 329=Envío cancelado, 330=Disponible, 331=Para compra, 332=Disponible, 333=Buscar, 334=Ya enviado, 335=Ya enviado, 336=No disponible |
| 60 | Cancelado | 337=Ya enviado, 338=Puntero ya tiene, 339=Ya enviado, 340=Ya enviado, 341=Buscar, 342=No disponible, 343=Ya enviado, 344=Puntero ya tiene, 345=Para compra |
| 61 | En proceso | 346=Ya enviado, 347=Ya enviado |
| 62 | En proceso | 348=Puntero ya tiene, 349=No disponible, 350=Disponible, 351=Para compra, 352=No disponible, 353=Disponible, 354=Puntero ya tiene, 355=No disponible, 356=Ya enviado, 357=Envío cancelado |
| 63 | En proceso | 358=Para compra, 359=Puntero ya tiene, 360=Ya enviado |
| 64 | En proceso | 361=Puntero ya tiene, 362=Buscar, 363=No disponible, 364=Puntero ya tiene, 365=Buscar, 366=Envío cancelado, 367=Para compra, 368=Ya enviado |
| 65 | En proceso | 369=Para compra, 370=Ya enviado, 371=Disponible, 372=Puntero ya tiene, 373=Buscar, 374=Buscar, 375=Ya enviado |
| 66 | En proceso | 376=Puntero ya tiene, 377=Para compra, 378=No disponible |
| 67 | En proceso | 379=Para compra, 380=Para compra, 381=Para compra, 382=Ya enviado, 383=Ya enviado, 384=Puntero ya tiene, 385=Para compra |
| 68 | En proceso | 386=No disponible, 387=Disponible, 388=Envío cancelado, 389=No disponible, 390=Disponible, 391=Buscar, 392=Disponible, 393=Disponible, 394=Buscar |
| 69 | En proceso | 395=Disponible, 396=Buscar, 397=Ya enviado, 398=Ya enviado, 399=Envío cancelado, 400=Ya enviado, 401=No disponible, 402=Ya enviado, 403=Para compra |

## Verificación y notas

- Se recargó el reporte y se verificaron 48 solicitudes modificadas y los 307 estados de herramientas persistidos.
- Los ocho pedidos no seleccionados (18, 26, 28, 33, 36, 44, 45 y 50) permanecen «Solicitado».
- Se corrigió [js/reporte-herramientas.js](./js/reporte-herramientas.js): el selector ahora ofrece «Sin estado asignado» y el guardado permite limpiar un estado sin reenviar el valor anterior.
- Validación técnica: `node --check .\frontend-dev\js\reporte-herramientas.js` pasó.
- No se ejecutó `TRUNCATE`; queda a cargo del usuario.
