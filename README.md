# Sockbuster Video & Socks

Prototipo web de la tienda de calcetines temáticos Sockbuster, con su arquitectura modelada según el paradigma 4+1 de vistas UML.

**Sitio publicado:** https://sockbuster-inacap.netlify.app

Evaluación Sumativa 3 · TI3025 Modelamiento de soluciones informáticas · Ingeniería en Informática · INACAP Punta Arenas
Docente: Paulo Simunovic Oyarzún

## Integrantes

- Mauricio Aravena
- Benjamin Aguayo
- Oscar Ojeda

## Páginas

| Página | Contenido |
|---|---|
| `index.html` | Presentación de la marca, banner principal, colecciones e integrantes. |
| `catalogo.html` | Catálogo con filtros, ficha con reseñas, carrito, checkout simulado y panel de administración. |
| `diagramas.html` | Documentación 4+1: Vista Lógica, Vista de Desarrollo, Vista de Procesos, Vista Física y Escenarios. |

## Requerimientos y dónde se prueban

| Código | Requerimiento | Cómo probarlo |
|---|---|---|
| RF01 | Catálogo por colecciones temáticas | En el catálogo, filtrar por colección, talla, precio o texto. Cada tarjeta muestra foto, precio, stock y tallas. |
| RF02 | Carrito y gestión de pedidos | Agregar productos, cambiar cantidades en el carrito y pagar. Se muestra el resumen con un ID tipo `SB-AAAAMMDD-XXXX`. |
| RF03 | Administración de inventario y temáticas | Ingresar como administrador y usar el panel al final del catálogo para registrar modelos, asociarlos a una película o serie y cambiar stock y precio. |
| RF04 | Reseñas de fanáticos | Ingresar como cliente, abrir la ficha de un producto y publicar de 1 a 5 estrellas con un comentario. |
| RNF01 | Disponibilidad y despliegue en la nube | Sitio estático en Netlify (HTTPS + CDN), CSS compilado y fotos en SVG livianos. |
| RNF02 | Seguridad con HTTPS y JWT | El `ApiGateway` valida un JWT firmado con HS256. Las rutas de administración responden 401 sin sesión y 403 si el rol no es ADMIN. |

### Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | cliente@sockbuster.cl | cliente123 |
| Administrador | admin@sockbuster.cl | admin123 |

La pasarela de pago es simulada: cualquier tarjeta de 16 dígitos se aprueba y las que terminan en `0000` se rechazan.

## Estructura

```
├── index.html
├── catalogo.html
├── diagramas.html
├── arquitectura.puml        todas las vistas en un solo archivo PlantUML
├── diagramas/               un .puml y su .svg por diagrama
├── css/estilos.css          Tailwind CSS compilado
├── js/
│   ├── modelo.js            clases del diagrama de clases
│   ├── datos.js             DB simulada (localStorage)
│   ├── servicios.js         AuthService, CatalogoService, ResenaService, PedidoService
│   ├── gateway.js           ApiGateway con validación de JWT y roles
│   ├── comun.js             encabezado, sesión y utilidades
│   ├── catalogo.js          lógica de la página de catálogo
│   └── diagramas.js         pestañas de la página de arquitectura
├── src/estilos.css          entrada de Tailwind
├── tailwind.config.js
└── netlify.toml             cabeceras de seguridad y caché para Netlify
```

## Ejecutar en local

Basta con abrir `index.html` en el navegador. Para que funcione igual que en Netlify es mejor usar un servidor local:

```bash
python -m http.server 8000
```

y entrar a http://localhost:8000.

## Regenerar el CSS y los diagramas

```bash
npx tailwindcss@3.4.17 -c tailwind.config.js -i src/estilos.css -o css/estilos.css --minify
```

```bash
java -jar plantuml.jar -tsvg diagramas/*.puml
```

## Tecnologías

HTML5, Tailwind CSS 3, JavaScript sin frameworks, Web Crypto API (JWT HS256), PlantUML y Netlify.
