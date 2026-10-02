# Frontend de CracoTech

Este repositorio contiene el portafolio público de CracoTech y el portal web de mantenimiento industrial para Metalúrgica Vera S.A.E. El portal consume la API REST del backend mediante JavaScript fetch.

Este directorio contiene la interfaz web del sistema de mantenimiento para Metalúrgica Vera S.A.E. La aplicación está construida como un frontend estático y consume la API REST del backend mediante JavaScript fetch.

## Objetivo

Centralizar el acceso a:
- solicitudes de mantenimiento
- órdenes de trabajo
- mantenimientos preventivos
- reportes e indicadores
- formularios de inventario y totales operativos
- paneles y vistas de consulta del área industrial

## Tecnologías

- HTML5
- CSS3
- JavaScript vanilla
- Fetch API
- Servidor estático local para pruebas
- Font Awesome, assets internos y contenido institucional

## Arquitectura

La estructura está pensada para funcionar como sitio público y de gestión, pero la información sensible y la lógica de negocio se mantienen en el backend.

```text
frontend/
├── index.html                 # Portafolio público
├── pages/upkeepmv.html        # Portal de mantenimiento
├── css/
│   ├── portfolio.css
├── data/
├── img/
│   ├── craco-mark.svg
│   └── cracovec-mark.svg
├── js/
│   ├── api-config.js
│   └── portfolio.js
├── pages/
├── README.md
└── ...
```

## Flujo principal

1. Un servidor estático local sirve la interfaz.
2. El portal de mantenimiento está disponible en [pages/upkeepmv.html](pages/upkeepmv.html).
3. En el portal, [js/api-config.js](js/api-config.js) centraliza la URL base de la API.
4. El portal realiza llamadas a rutas bajo `/api/...` y el backend valida autenticación, roles y permisos.

## Autenticación

La sesión no se guarda en el backend; se maneja por token JWT enviado desde el frontend y almacenado en localStorage.

Los componentes del flujo de login del portal están en:
- [js/login-modal.js](js/login-modal.js)
- [js/api-config.js](js/api-config.js)

## Ejecución local

La API está configurada en [js/api-config.js](js/api-config.js) para conectarse a `http://127.0.0.1:3000`.

Desde este directorio, inicia un servidor estático para el frontend:

```powershell
py -m http.server 5500
```

Abre `http://127.0.0.1:5500/pages/upkeepmv.html`. Para iniciar el backend y configurar MySQL, consulta el README de la carpeta `pruebas`.

## Consideraciones

- Este directorio no debería depender de una base de datos ni ejecutar lógica de negocio.
- La UI debe ser responsabilidad del frontend; los permisos, validaciones y datos reales deben resolverse en el backend.
- El contenido y ciertos textos institucionales deben mantenerse actualizados junto con el negocio.

## Estado actual

El frontend se encuentra en una etapa funcional con varias pantallas y módulos reunidos en una sola app estática, pero hay margen para:
- consolidar una estructura más modular
- reducir duplicación entre vistas
- centralizar mejor variables de configuración por entorno
- mejorar documentación técnica y mantenimiento del código

## Mantenimiento

Cuando se modifique la navegación, módulos o formularios del portal, conviene revisar:
- [pages/upkeepmv.html](pages/upkeepmv.html)
- [pages/](pages/)
- [js/](js/)
- [css/](css/)

Para cambios en el portafolio, revisar [index.html](index.html), [css/portfolio.css](css/portfolio.css) y [js/portfolio.js](js/portfolio.js).

## Autor

Proyecto desarrollado para la operación y gestión interna de mantenimiento industrial.
