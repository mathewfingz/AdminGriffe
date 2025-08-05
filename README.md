# AdminGriffe - Sistema de Gestión Multi-Dashboard

## 🎯 Descripción del Proyecto

AdminGriffe es una aplicación web completa construida con **Next.js 14**, **React 18**, **TypeScript** y **Tailwind CSS** que implementa un sistema de autenticación robusto y dos dashboards especializados dentro de la misma aplicación:

- **Dashboard ADMIN** (nova-haven): Panel de administración global para supervisar todas las tiendas
- **Dashboard TIENDAS** (nova-works): Panel específico para gestión individual de tiendas

## 🏗️ Arquitectura

### Monorepo con Turbo Repo
```
AdminGriffe/
├── apps/
│   └── web/                    # Aplicación Next.js principal
├── packages/
│   ├── ui/                     # Componentes UI compartidos
│   └── design-tokens/          # Tokens de diseño y presets de Tailwind
├── pixel-verse/                # Diseños de referencia - Login escritorio
├── curry-landing/              # Diseños de referencia - Login móvil
├── nova-haven/                 # Diseños de referencia - Dashboard ADMIN
└── nova-works/                 # Diseños de referencia - Dashboard TIENDAS
```

### Stack Tecnológico

#### Frontend
- **Next.js 14** con App Router
- **React 18** con Server Components
- **TypeScript** para tipado estático
- **Tailwind CSS** para estilos
- **Radix UI** para componentes primitivos
- **Zustand** para estado global ligero

#### Backend & Base de Datos
- **Prisma ORM** para gestión de base de datos
- **PostgreSQL** como base de datos principal
- **NextAuth.js** para autenticación

#### Validación & Formularios
- **Zod** para validación de esquemas
- **React Hook Form** para gestión de formularios
- **bcryptjs** para hash de contraseñas

#### Testing & Calidad
- **Vitest** como framework de testing
- **Testing Library** para testing de componentes
- **Storybook** para documentación de componentes
- **ESLint** y **Prettier** para linting y formateo

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 18+
- pnpm 8+
- PostgreSQL

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd AdminGriffe
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar base de datos**
```bash
# Copiar variables de entorno
cp apps/web/.env.example apps/web/.env.local

# Configurar DATABASE_URL en .env.local
# Ejecutar migraciones
cd apps/web
pnpm prisma migrate dev
pnpm prisma generate
```

4. **Iniciar desarrollo**
```bash
# Desde la raíz del proyecto
pnpm dev
```

La aplicación estará disponible en:
- **Aplicación principal**: http://localhost:3001
- **Storybook**: http://localhost:6006

## 🔐 Sistema de Autenticación

### Características
- ✅ Registro de usuarios con validación
- ✅ Login con credenciales y Google OAuth
- ✅ Recuperación de contraseña
- ✅ Refresh tokens automático
- ✅ Protección de rutas
- ✅ Roles de usuario (Admin/Tienda)

### Rutas de Autenticación
- `/login` - Inicio de sesión
- `/register` - Registro de usuarios
- `/forgot-password` - Recuperación de contraseña
- `/reset-password` - Restablecer contraseña

## 📊 Dashboards

### Dashboard Admin (`/admin`)
Panel de administración global con:
- KPIs generales del sistema
- Gestión de tiendas
- Análisis de ventas globales
- Administración de usuarios
- Reportes y métricas

### Dashboard Tienda (`/tienda`)
Panel específico para tiendas con:
- Métricas de rendimiento individual
- Gestión de productos
- Análisis de ventas
- Gestión de pedidos
- Herramientas de marketing

## 🎨 Sistema de Diseño

### Design Tokens
Los tokens de diseño están centralizados en `packages/design-tokens/`:
- `pixel-verse.json` - Tema para login desktop
- `curry-landing.json` - Tema para login móvil
- `nova-haven.json` - Tema para dashboard admin
- `nova-works.json` - Tema para dashboard tiendas

### Componentes UI
Biblioteca de componentes en `packages/ui/`:
- Button, Input, Label
- MetricsCard, DataTable
- Sidebar, Topbar
- GoogleIcon, PasswordInput

## 🧪 Testing

### Configuración
- **Framework**: Vitest + jsdom
- **Testing Library**: React Testing Library
- **Cobertura**: v8 provider
- **Objetivo**: 80% de cobertura

### Comandos
```bash
# Ejecutar todas las pruebas
pnpm test

# Ejecutar con cobertura
pnpm test:coverage

# Ejecutar en modo watch
pnpm test:watch
```

## 📚 Storybook

Documentación interactiva de componentes:

```bash
# Iniciar Storybook
cd packages/ui
pnpm storybook
```

## 🔧 Scripts Disponibles

### Raíz del proyecto
```bash
pnpm dev          # Iniciar desarrollo
pnpm build        # Construir para producción
pnpm test         # Ejecutar pruebas
pnpm lint         # Linter
pnpm type-check   # Verificación de tipos
```

### Aplicación web
```bash
cd apps/web
pnpm dev          # Servidor de desarrollo
pnpm build        # Construir aplicación
pnpm start        # Servidor de producción
pnpm prisma:*     # Comandos de Prisma
```

### Paquete UI
```bash
cd packages/ui
pnpm test         # Pruebas de componentes
pnpm storybook    # Documentación
pnpm build        # Construir biblioteca
```

## 🌐 Despliegue

### Variables de Entorno Requeridas
```env
# Base de datos
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Docker
```bash
# Construir imagen
docker build -t admin-griffe .

# Ejecutar contenedor
docker run -p 3000:3000 admin-griffe
```

## 🎯 Características Implementadas

### ✅ Funcionalidades Core
- [x] Arquitectura monorepo con Turbo Repo
- [x] Sistema de autenticación completo
- [x] Dos dashboards especializados
- [x] Diseño responsive pixel-perfect
- [x] Sistema de design tokens
- [x] Biblioteca de componentes UI

### ✅ Calidad y Testing
- [x] Configuración de testing con Vitest
- [x] Pruebas unitarias de componentes
- [x] Documentación con Storybook
- [x] Linting y formateo automático
- [x] TypeScript estricto

### ✅ Accesibilidad
- [x] Cumplimiento WCAG 2.1 AA
- [x] Navegación por teclado
- [x] Etiquetas semánticas
- [x] Contraste de colores adecuado

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

Para soporte y preguntas:
- Crear un issue en GitHub
- Revisar la documentación en Storybook
- Consultar los diseños de referencia en las carpetas correspondientes

---

**AdminGriffe** - Sistema de gestión moderno y escalable para administración multi-tienda.