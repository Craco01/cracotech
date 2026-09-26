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
- GitHub Pages para publicación estática
- Font Awesome, assets internos y contenido institucional

## Arquitectura

La estructura está pensada para funcionar como sitio público y de gestión, pero la información sensible y la lógica de negocio se mantienen en el backend.

```text
frontend/
├── index.html                 # Portafolio público
├── upkeepmv.html              # Portal de mantenimiento
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
├── .github/workflows/deploy-pages.yml
└── ...
```

## Flujo principal

1. GitHub Pages sirve el portafolio desde `index.html`.
2. El portal de mantenimiento está disponible en [upkeepmv.html](upkeepmv.html).
3. En el portal, [js/api-config.js](js/api-config.js) centraliza la URL base de la API.
4. El portal realiza llamadas a rutas bajo `/api/...` y el backend valida autenticación, roles y permisos.

## Autenticación

La sesión no se guarda en el backend; se maneja por token JWT enviado desde el frontend y almacenado en localStorage.

Los componentes del flujo de login del portal están en:
- [js/login-modal.js](js/login-modal.js)
- [js/api-config.js](js/api-config.js)

## Publicación

El sitio puede publicarse como una app estática en GitHub Pages. El workflow de despliegue está en:
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml)

La URL base configurada para las llamadas a la API es:
- `https://api.cracotech.com`

Esto significa que, para que el frontend funcione en producción, el backend debe estar expuesto detrás de HTTPS en el subdominio `api` y el proxy correcto (Nginx o equivalente) debe redirigir `/api` hacia el servidor de Node.js.

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
- [upkeepmv.html](upkeepmv.html)
- [pages/](pages/)
- [js/](js/)
- [css/](css/)

Para cambios en el portafolio, revisar [index.html](index.html), [css/portfolio.css](css/portfolio.css) y [js/portfolio.js](js/portfolio.js).

## Autor

Proyecto desarrollado para la operación y gestión interna de mantenimiento industrial.
