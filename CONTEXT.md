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

## Tareas Pendientes
- *[Vacío por ahora. Listo para registrar los próximos cambios que hagamos]*
