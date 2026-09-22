# Lavina Band App

Una plataforma web de gestión moderna e integral diseñada específicamente para equipos de alabanza y grupos musicales, desarrollada con Next.js 16.

## 🚀 Características Principales

- **Dashboard Inteligente**: Vista general rápida con información crítica: fecha del próximo ensayo, próximo servicio y la lectura bíblica semanal de preparación.
- **Gestión de Canciones (Repertorio)**: Catálogo completo de canciones que incluye metadatos útiles como tonalidad original, tempo (BPM), artista original, enlaces directos a YouTube y sistema de etiquetas personalizadas (Ej: Alabanza, Adoración, Júbilo).
- **Organización de Setlists**: Creación y gestión de listas de canciones para servicios o eventos. Soporta fechas de eventos y fechas de ensayo de forma independiente.
- **Lector Bíblico Integrado**: Lector de la Biblia a pantalla completa dentro de la misma aplicación. Permite leer los capítulos semanales sin salir del flujo de trabajo. Soporta múltiples versiones (NTV, RV60, NVI, PDT) respetando la estructura de títulos, subtítulos y números capitulares.
- **Sistema de Roles y Autenticación**:
  - `ADMIN`: Control total para crear, editar o eliminar canciones, setlists y configuraciones globales de la banda.
  - `MUSICIAN`: Acceso de solo lectura al repertorio y setlists para estudiar y prepararse.
  - `GUEST`: Nivel de invitado (por defecto al registrarse) que requiere aprobación de un administrador para ver información sensible.

## 💻 Stack Tecnológico

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Estilos e Interfaz**: [Tailwind CSS](https://tailwindcss.com/) (diseño oscuro, modo dark-first, animaciones fluidas) y [Lucide Icons](https://lucide.dev/).
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) gestionado con [Mongoose](https://mongoosejs.com/).
- **Autenticación**: [NextAuth.js](https://next-auth.js.org/) con estrategia de Credenciales y MongoDB Adapter.
- **Herramientas de Backend**: Rutas API integradas de Next.js y `cheerio` para scraping dinámico del texto bíblico.

## 🛠️ Instalación y Configuración Local

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd lavinaband-node
   ```

2. **Instalar las dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y configura tus credenciales:
   ```env
   MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/lavinaband?retryWrites=true&w=majority
   NEXTAUTH_SECRET=tu-secreto-seguro-aqui
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **¡Listo!**
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.
