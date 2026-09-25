# LavinaBand Node - Project Context

## Descripción General
LavinaBand Node es una aplicación web construida con **Next.js (App Router)** diseñada para la gestión de una banda musical (setlists, canciones, roles, anuncios y usuarios).

## Stack Tecnológico
- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB usando **Mongoose**
- **Autenticación**: NextAuth (
ext-auth)
- **Estilos**: Tailwind CSS
- **Entorno**: Requiere Node.js v20+ (usar 
vm use 20 en WSL).

## Estructura de Directorios (src/)
- pp/(protected): Rutas protegidas (dashboard, profile, setlists, songs, users, setlist-roles, anuncios).
- pp/auth: Rutas públicas para inicio de sesión y registro.
- pp/api: Endpoints REST API.
- models: Esquemas de Mongoose.
- ctions: Server actions para mutaciones.

## Comandos Principales
- **Desarrollo**: 
pm run dev (Node v20)

*Nota: Lee este archivo para obtener contexto al iniciar una nueva sesión.*

## Estado Actual y Registro de Cambios
- **Sept 2026:** 
  - Corrección de discrepancia de zonas horarias (Vercel UTC vs Local) en el cálculo del turno activo en el dashboard usando `date-fns` y `force-dynamic`.
  - Actualización de la lógica del Rol de Set Lists: El turno ahora inicia abarcando el Domingo y concluye el Jueves de la semana siguiente. El "cambio de turno" automático en la interfaz ocurre los Viernes. 
  - Se agregó la funcionalidad para eliminar usuarios desde el panel de `Gestión de Usuarios` (solo para Administradores, e incluye protección para no auto-eliminarse).
  - Se refactorizó la tabla de Gestión de Usuarios para ser responsiva en celulares, utilizando renglones expandibles (acordeón) ocultando opciones complejas y reduciendo el scroll horizontal excesivo.
  - Se implementó la opción de editar los metadatos de las canciones (título, artista, tono, tempo) y la opción de eliminarlas permanentemente desde su modal de detalle.
  - Se implementó el archivado automático de Set Lists: cualquier set list con fecha anterior al día de hoy se mueve automáticamente a una nueva sección desplegable llamada "Archivo Histórico" en la página principal de Set Lists.
  - Se agregó la visualización del creador del Set List debajo de su título en su página de detalle, y se restringió la edición y eliminación de los enlaces de YouTube de las canciones dentro del Set List exclusivamente para usuarios Administradores. Además, se mejoró visualmente el botón del enlace de YouTube.
  - Se implementó una capa de seguridad en los Set Lists: ahora nadie puede modificar su estructura (título, fechas, lista de canciones, notas) ni eliminar el Set List a menos que sea el creador original o un usuario Administrador. El resto de la banda únicamente puede confirmar o declinar su asistencia.
  - Se corrigió un problema donde el cambio de contraseña desde el perfil no se guardaba correctamente en la base de datos, asegurando la actualización utilizando métodos directos (updateOne).
  - Se habilitó la visualización de las letras de las canciones dentro de los Set Lists: al dar clic en el título de cualquier canción, se abre una ventana modal flotante mostrando la letra completa (si está registrada) de forma clara y accesible.
  - Se optimizó la tabla del catálogo de canciones para dispositivos móviles: la columna "Artista" ahora se oculta en pantallas pequeñas, pero el nombre del artista se muestra sutilmente justo debajo del título de la canción para aprovechar mejor el espacio horizontal.

## Tareas Pendientes
- *[Vacío por ahora. Listo para registrar los próximos cambios que hagamos]*
