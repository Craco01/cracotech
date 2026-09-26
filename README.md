# Frontend - Portal de mantenimiento

Este proyecto sigue siendo un proyecto académico, desarrollado para aplicar y consolidar conocimientos de frontend, arquitectura web y consumo de API en un contexto realista de mantenimiento industrial para Metalúrgica Vera S.A.E.

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
├── index.html
├── css/
├── data/
├── img/
├── js/
├── pages/
├── README.md
├── .github/workflows/deploy-pages.yml
└── ...
```

## Flujo principal

1. El navegador carga la página principal desde GitHub Pages.
2. El script [js/api-config.js](js/api-config.js) centraliza la URL base de la API.
3. La aplicación realiza llamadas a rutas bajo `/api/...` con JWT en el header cuando hay sesión activa.
4. El backend valida autenticación, roles y permisos antes de ejecutar la operación.

## Autenticación

La sesión no se guarda en el backend; se maneja por token JWT enviado desde el frontend y almacenado en localStorage.

Los componentes principales del flujo de login están en:
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

Cuando se modifique la navegación, módulos o formularios, conviene revisar:
- [index.html](index.html)
- [pages/](pages/)
- [js/](js/)
- [css/](css/)

## Autor

Proyecto desarrollado para la operación y gestión interna de mantenimiento industrial.
