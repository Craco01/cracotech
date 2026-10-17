# Frontend de CracoTech

Este repositorio contiene el portafolio público de CracoTech y el portal web de mantenimiento industrial para Metalúrgica Vera S.A.E. El portal consume la API REST del backend mediante JavaScript fetch.

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

Este repositorio contiene el sitio estático que se publica en GitHub Pages. La interfaz consume la API del backend; no guarda credenciales de base de datos ni implementa permisos de negocio.

```text
frontend/
├── index.html                 # Portafolio público
├── mantenimiento/             # Rutas limpias del portal de mantenimiento
│   ├── index.html              # Inicio del portal
│   ├── formularios/index.html
│   └── ...
├── pages/                      # Respaldo de las páginas HTML anteriores
├── css/
│   ├── portfolio.css
├── data/
├── img/
│   ├── craco-mark.svg
│   └── cracovec-mark.svg
├── js/
│   ├── api-config.js
│   └── portfolio.js
├── README.md
└── ...
```

## Flujo principal

1. El workflow `.github/workflows/deploy-pages.yml` publica el sitio en GitHub Pages al actualizar `main` o al ejecutarse manualmente desde GitHub Actions.
2. El acceso principal al portal es [mantenimiento/](mantenimiento/); sus módulos usan rutas limpias, por ejemplo `/mantenimiento/reportes/`.
3. `pages/` se conserva como respaldo de las páginas anteriores; la navegación principal ya no depende de esa carpeta.
4. [js/api-config.js](js/api-config.js) centraliza la URL base de la API productiva.
5. El backend está en el repositorio independiente `upkeepmv_backend` y se actualiza manualmente en AWS Lightsail.

## Autenticación

La sesión no se guarda en el backend; se maneja por token JWT enviado desde el frontend y almacenado en localStorage.

Los componentes del flujo de login del portal están en:
- [js/login-modal.js](js/login-modal.js)
- [js/api-config.js](js/api-config.js)

## Ejecución local

Desde este directorio, inicia un servidor estático para el frontend:

```powershell
py -m http.server 5500
```

Abre `http://127.0.0.1:5500/mantenimiento/`. En este repositorio, [js/api-config.js](js/api-config.js) apunta al API HTTPS de producción; por tanto, la interfaz local seguirá consultando el backend productivo. Las pruebas locales integrales deben ejecutarse en el directorio independiente `pruebas`, con su propia configuración local y sin copiar su `.env` a este repositorio.

## Publicación

No se publica durante las pruebas locales. Para publicar, sube los cambios revisados a `main` y verifica el workflow de GitHub Pages. Los cambios del backend no se publican con ese workflow: se despliegan manualmente en AWS Lightsail siguiendo la guía del repositorio backend, después de respaldar la base y aplicar las migraciones requeridas.

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
- [mantenimiento/](mantenimiento/)
- [pages/](pages/) (respaldo)
- [js/](js/)
- [css/](css/)

Para cambios en el portafolio, revisar [index.html](index.html), [css/portfolio.css](css/portfolio.css) y [js/portfolio.js](js/portfolio.js).

## Autor

Proyecto desarrollado para la operación y gestión interna de mantenimiento industrial.
