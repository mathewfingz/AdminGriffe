# Sync Worker

Sistema de sincronización bidireccional entre bases de datos heterogéneas con capacidades de auditoría en tiempo real.

## 🚀 Características

- **Multi-motor**: Soporte para PostgreSQL, MySQL y MongoDB
- **Tiempo real**: Sincronización con latencia < 100ms
- **Alta disponibilidad**: 99.99% uptime con circuit breakers
- **Resolución de conflictos**: 99% automática con estrategias configurables
- **Seguridad enterprise**: Encriptación en tránsito y reposo
- **Observabilidad**: Métricas Prometheus y dashboards Grafana

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 16+ (con logical replication)
- MySQL 8+ (con binlog habilitado)
- MongoDB 7+ (con change streams)
- Redis 7+ (para caché y pub/sub)
- Kafka 3.7+ (para streaming)
- RabbitMQ (para colas diferidas)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Inicializar bases de datos
npm run db:init

# Ejecutar migraciones
npm run db:migrate

# Construir aplicación
npm run build
```

## 🔧 Configuración

### Variables de Entorno

Consulta `.env.example` para todas las variables disponibles.

### Bases de Datos

1. **PostgreSQL**: Configurar logical replication
2. **MySQL**: Habilitar binlog y crear usuario Debezium
3. **MongoDB**: Configurar replica set para change streams

## 🚀 Uso

### Desarrollo

```bash
# Modo desarrollo con hot reload
npm run start:dev

# Ejecutar con Docker Compose
docker-compose up -d
```

### Producción

```bash
# Construir imagen Docker
docker build -t sync-worker .

# Ejecutar contenedor
docker run -d --name sync-worker \
  --env-file .env \
  -p 3001:3001 \
  sync-worker
```

### Kubernetes

```bash
# Desplegar con Helm
helm install sync-worker ./deploy/helm/sync-worker
```

## 📊 Monitoreo

### Health Checks

- **HTTP**: `GET /health`
- **Métricas**: `GET /metrics` (formato Prometheus)

### Métricas Clave

- `sync_lag_ms`: Latencia de sincronización
- `audit_write_tps`: Transacciones por segundo
- `conflict_rate`: Tasa de conflictos
- `queue_depth`: Profundidad de cola
- `error_ratio`: Ratio de errores

### Dashboards

Importar dashboards desde `deploy/grafana/dashboards/`

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests de integración
npm run test:integration

# Tests de carga
npm run test:load

# Cobertura
npm run test:cov
```

## 🔄 Sincronización

### Flujos Soportados

- PostgreSQL ↔ MySQL
- PostgreSQL ↔ MongoDB
- MySQL ↔ MongoDB

### Resolución de Conflictos

1. **Timestamp**: Última modificación gana
2. **Source Priority**: Prioridad por origen
3. **Manual**: Cola para revisión manual

### Estrategias de Retry

- Exponential backoff
- Dead letter queue
- Circuit breaker

## 🛡️ Seguridad

- JWT con RS256
- Rate limiting
- Helmet headers
- Column-level ACL
- Encriptación AES-256-GCM
- Firma digital HSM

## 📚 API

### Endpoints

- `GET /audit/logs` - Consultar logs de auditoría
- `GET /sync/status` - Estado de conectores
- `POST /sync/replay` - Re-ejecutar operación
- `WebSocket /audit/stream` - Stream en tiempo real

### Documentación

Swagger disponible en `/api/docs` en modo desarrollo.

## 🐛 Troubleshooting

### Problemas Comunes

1. **Alta latencia**: Verificar configuración de red y índices
2. **Conflictos frecuentes**: Revisar estrategia de resolución
3. **Pérdida de eventos**: Verificar configuración Kafka
4. **Memory leaks**: Monitorear métricas de memoria

### Logs

```bash
# Ver logs en tiempo real
docker logs -f sync-worker

# Logs estructurados en JSON
tail -f logs/sync-worker.log | jq
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear feature branch
3. Commit cambios
4. Push a la rama
5. Crear Pull Request

## 📄 Licencia

MIT License - ver `LICENSE` para detalles.

## 🆘 Soporte

- Issues: GitHub Issues
- Documentación: `/docs`
- Runbook: `docs/RUNBOOK_AUDIT.md`