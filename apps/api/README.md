# AdminGriffe API - Sistema de Auditoría Integral

Sistema de auditoría y sincronización de bases de datos multi-motor con capacidades de tiempo real, compliance y alta disponibilidad.

## 🚀 Características Principales

- **Auditoría Multi-Motor**: PostgreSQL, MySQL, MongoDB
- **Sincronización Bidireccional**: Tiempo real con resolución de conflictos
- **Alto Rendimiento**: 10,000+ TPS, <100ms latency
- **Seguridad Enterprise**: Encriptación, firmas digitales, compliance
- **Observabilidad**: Métricas, alertas, dashboards
- **API REST + WebSocket**: Endpoints completos y streaming en tiempo real

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- RabbitMQ 3.12+
- Docker & Docker Compose

## 🛠️ Instalación

### Desarrollo Local

```bash
# Clonar el repositorio
git clone <repository-url>
cd AdminGriffe/apps/api

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Levantar servicios con Docker Compose
docker-compose up -d

# Ejecutar migraciones y configurar auditoría
pnpm db:migrate
pnpm db:setup-audit

# Iniciar en modo desarrollo
pnpm dev
```

### Producción

```bash
# Construir la aplicación
pnpm build

# Ejecutar migraciones de producción
pnpm db:migrate:prod

# Iniciar aplicación
pnpm start
```

## 🔧 Scripts Disponibles

### Desarrollo
- `pnpm dev` - Iniciar en modo desarrollo
- `pnpm build` - Construir para producción
- `pnpm start` - Iniciar aplicación construida

### Testing
- `pnpm test` - Ejecutar todas las pruebas
- `pnpm test:unit` - Pruebas unitarias
- `pnpm test:integration` - Pruebas de integración
- `pnpm test:coverage` - Reporte de cobertura
- `pnpm test:watch` - Modo watch para desarrollo

### Base de Datos
- `pnpm db:generate` - Generar cliente Prisma
- `pnpm db:migrate` - Ejecutar migraciones (desarrollo)
- `pnpm db:migrate:prod` - Ejecutar migraciones (producción)
- `pnpm db:seed` - Poblar base de datos con datos de prueba
- `pnpm db:setup-audit` - Configurar triggers de auditoría
- `pnpm db:ping` - Verificar conectividad de bases de datos

### Auditoría y Sincronización
- `pnpm audit:verify` - Verificar integridad de logs de auditoría
- `pnpm sync:status` - Estado de sincronización (usar --watch para monitoreo continuo)
- `pnpm queue:status` - Estado de colas de procesamiento
- `pnpm queue:clear` - Limpiar colas (usar con precaución)
- `pnpm metrics:export` - Exportar métricas para análisis

### Calidad de Código
- `pnpm lint` - Verificar código con ESLint
- `pnpm lint:fix` - Corregir problemas automáticamente
- `pnpm type-check` - Verificar tipos TypeScript

## 🏗️ Arquitectura

### Componentes Principales

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Sync Worker    │    │  Audit Engine   │
│                 │    │                 │    │                 │
│ • REST API      │    │ • CDC Capture   │    │ • Log Capture   │
│ • WebSocket     │    │ • Conflict Res  │    │ • Integrity     │
│ • Auth/Rate     │    │ • Queue Proc    │    │ • Compliance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              Message Bus (Kafka)                │
         └─────────────────────────────────────────────────┘
                                 │
    ┌────────────┬────────────────┼────────────────┬────────────┐
    │            │                │                │            │
┌───▼───┐   ┌───▼───┐        ┌───▼───┐       ┌───▼───┐   ┌───▼───┐
│ PgSQL │   │ MySQL │        │ Redis │       │ RabbitMQ│   │ Mongo │
└───────┘   └───────┘        └───────┘       └─────────┘   └───────┘
```

### Patrones de Diseño

- **Repository Pattern**: Abstracción de acceso a datos
- **Factory Pattern**: Creación dinámica de conectores
- **Observer Pattern**: Notificación de eventos CDC
- **Strategy Pattern**: Resolución de conflictos por contexto
- **Circuit Breaker**: Resiliencia ante fallos

## 🔐 Seguridad

### Características de Seguridad

- **Autenticación JWT**: RS256 con refresh tokens
- **Rate Limiting**: Protección contra ataques DDoS
- **Encriptación**: AES-256-GCM para datos sensibles
- **Firmas Digitales**: HMAC-SHA256 para integridad de auditoría
- **Row Level Security**: Control granular de acceso
- **Helmet**: Headers de seguridad HTTP

### Variables de Entorno Críticas

```bash
# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Auditoría
AUDIT_SIGNATURE_KEY=your-audit-signature-key

# Encriptación
ENCRYPTION_KEY=your-32-byte-encryption-key
```

## 📊 Monitoreo y Observabilidad

### Métricas Clave

- `sync_lag_ms`: Latencia de sincronización
- `audit_write_tps`: Transacciones de auditoría por segundo
- `error_rate`: Tasa de errores
- `queue_depth`: Profundidad de colas
- `conflict_rate`: Tasa de conflictos

### Dashboards

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **API Docs**: http://localhost:3001/docs

### Alertas Críticas

- Sync lag > 500ms
- Error rate > 1%
- Queue depth > 1000
- Audit integrity failure

## 🧪 Testing

### Estructura de Pruebas

```
tests/
├── unit/           # Pruebas unitarias
├── integration/    # Pruebas de integración
├── load/          # Pruebas de carga (k6)
└── setup.ts       # Configuración global
```

### Ejecutar Pruebas

```bash
# Todas las pruebas
pnpm test

# Solo unitarias
pnpm test:unit

# Solo integración (requiere Docker)
pnpm test:integration

# Con cobertura
pnpm test:coverage

# Pruebas de carga
k6 run tests/load/load_test.js
```

## 🚀 Deployment

### Docker Compose (Desarrollo)

```bash
docker-compose up -d
```

### Kubernetes (Producción)

```bash
# Instalar con Helm
helm install audit-system ./deploy/helm/audit-system

# Actualizar
helm upgrade audit-system ./deploy/helm/audit-system
```

### Variables de Entorno por Ambiente

- `.env` - Desarrollo local
- `.env.test` - Testing
- `.env.staging` - Staging
- `.env.production` - Producción

## 📚 API Documentation

### Endpoints Principales

#### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Cerrar sesión

#### Auditoría
- `GET /audit/logs` - Obtener logs de auditoría
- `GET /audit/stats` - Estadísticas de auditoría
- `POST /audit/verify` - Verificar integridad

#### Sincronización
- `GET /sync/status` - Estado de sincronización
- `POST /sync/replay` - Re-ejecutar operación
- `GET /sync/conflicts` - Conflictos pendientes

#### WebSocket
- `ws://api/audit/stream` - Stream de auditoría en tiempo real

### Documentación Completa

Visita http://localhost:3001/docs para la documentación interactiva de Swagger.

## 🔧 Troubleshooting

### Problemas Comunes

#### High Sync Lag
```bash
# Verificar estado
pnpm sync:status

# Revisar colas
pnpm queue:status

# Limpiar colas si es necesario
pnpm queue:clear
```

#### Audit Integrity Issues
```bash
# Verificar integridad
pnpm audit:verify

# Revisar logs
docker-compose logs api
```

#### Database Connectivity
```bash
# Ping todas las bases de datos
pnpm db:ping

# Verificar configuración
docker-compose ps
```

### Logs y Debugging

```bash
# Ver logs de la aplicación
docker-compose logs -f api

# Ver logs de bases de datos
docker-compose logs -f postgres mysql mongodb

# Ver logs de infraestructura
docker-compose logs -f redis rabbitmq kafka
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código

- ESLint para linting
- Prettier para formateo
- Conventional Commits
- Cobertura de pruebas > 80%

## 📄 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Documentación**: [docs/](./docs/)
- **Issues**: GitHub Issues
- **Email**: support@admingriffe.com
- **Slack**: #audit-system

---

**AdminGriffe API** - Sistema de Auditoría Integral de Bases de Datos