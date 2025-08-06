# Worker-Sync Helm Chart

Este Helm chart despliega el sistema Worker-Sync, una solución integral de auditoría y sincronización de bases de datos multi-motor con capacidades de tiempo real y compliance empresarial.

## Características

- **Auditoría Integral**: Captura automática de cambios en PostgreSQL, MySQL y MongoDB
- **Sincronización Bidireccional**: Sincronización en tiempo real entre bases de datos heterogéneas
- **Alta Disponibilidad**: Configuración para 99.99% uptime con auto-scaling y circuit breakers
- **Observabilidad**: Métricas completas con Prometheus, Grafana y AlertManager
- **Seguridad**: Encriptación at-rest/transit, RBAC, NetworkPolicies
- **Compliance**: Auditoría inmutable con firmas digitales

## Requisitos Previos

- Kubernetes 1.20+
- Helm 3.8+
- PV provisioner support en el cluster subyacente
- Ingress controller (opcional)

## Instalación

### Instalación Rápida

```bash
helm install worker-sync ./helm
```

### Instalación con Valores Personalizados

```bash
helm install worker-sync ./helm -f values-production.yaml
```

### Instalación en Namespace Específico

```bash
kubectl create namespace worker-sync
helm install worker-sync ./helm --namespace worker-sync
```

## Configuración

### Valores Principales

| Parámetro | Descripción | Valor por Defecto |
|-----------|-------------|-------------------|
| `replicaCount` | Número de réplicas | `3` |
| `image.repository` | Repositorio de la imagen | `worker-sync` |
| `image.tag` | Tag de la imagen | `latest` |
| `image.pullPolicy` | Política de pull de imagen | `IfNotPresent` |

### Configuración de Bases de Datos

```yaml
databases:
  postgresql:
    enabled: true
    host: "postgresql.default.svc.cluster.local"
    port: 5432
    database: "audit_db"
    username: "audit_user"
  mysql:
    enabled: true
    host: "mysql.default.svc.cluster.local"
    port: 3306
    database: "audit_db"
    username: "audit_user"
  mongodb:
    enabled: true
    host: "mongodb.default.svc.cluster.local"
    port: 27017
    database: "audit_db"
    username: "audit_user"
```

### Configuración de Monitoreo

```yaml
prometheus:
  enabled: true
  persistence:
    enabled: true
    size: 50Gi
  retention: "30d"

grafana:
  enabled: true
  adminPassword: "secure-password"
  persistence:
    enabled: true
    size: 10Gi

alertmanager:
  enabled: true
  persistence:
    enabled: true
    size: 5Gi
```

### Auto-scaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Configuración de Red

```yaml
networkPolicy:
  enabled: true
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: api-gateway
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 5432  # PostgreSQL
        - protocol: TCP
          port: 3306  # MySQL
        - protocol: TCP
          port: 27017 # MongoDB
```

## Componentes Desplegados

### Aplicación Principal
- **Deployment**: Worker-Sync application
- **Service**: Exposición de puertos HTTP y métricas
- **ConfigMap**: Configuración de la aplicación
- **Secret**: Credenciales y certificados
- **HPA**: Auto-scaling horizontal

### Monitoreo
- **Prometheus**: Recolección de métricas
- **Grafana**: Visualización y dashboards
- **AlertManager**: Gestión de alertas
- **ServiceMonitor**: Configuración de scraping

### Jobs y CronJobs
- **Init Job**: Inicialización de esquemas de auditoría
- **Migration Job**: Migraciones de base de datos
- **Backup CronJob**: Respaldos automáticos
- **Cleanup CronJob**: Limpieza de logs antiguos

### Seguridad
- **RBAC**: Roles y permisos
- **NetworkPolicy**: Políticas de red
- **PodSecurityPolicy**: Políticas de seguridad de pods
- **PodDisruptionBudget**: Garantía de disponibilidad

## Comandos Útiles

### Verificar Estado

```bash
# Estado de pods
kubectl get pods -l app.kubernetes.io/name=worker-sync

# Estado de servicios
kubectl get svc -l app.kubernetes.io/name=worker-sync

# Logs de la aplicación
kubectl logs -f deployment/worker-sync
```

### Monitoreo

```bash
# Port-forward Grafana
kubectl port-forward svc/worker-sync-grafana 3000:3000

# Port-forward Prometheus
kubectl port-forward svc/worker-sync-prometheus 9090:9090

# Port-forward AlertManager
kubectl port-forward svc/worker-sync-alertmanager 9093:9093
```

### Operaciones de Sync

```bash
# Estado de sincronización
kubectl exec -it deployment/worker-sync -- npm run sync:status

# Sincronización manual
kubectl exec -it deployment/worker-sync -- npm run sync:manual

# Ver logs de auditoría
kubectl exec -it deployment/worker-sync -- npm run audit:logs
```

### Backups

```bash
# Backup manual
kubectl create job --from=cronjob/worker-sync-backup manual-backup-$(date +%s)

# Ver estado de backups
kubectl get jobs -l app.kubernetes.io/component=backup
```

## Testing

### Ejecutar Tests de Helm

```bash
helm test worker-sync
```

### Tests Incluidos

- **test-connection**: Verifica conectividad HTTP
- **test-database**: Verifica conexiones a bases de datos
- **test-redis**: Verifica conexión a Redis
- **test-prometheus**: Verifica métricas
- **test-grafana**: Verifica dashboards
- **test-sync-functionality**: Verifica funcionalidad de sync

## Métricas y Alertas

### Métricas Principales

| Métrica | Descripción | Tipo |
|---------|-------------|------|
| `sync_lag_ms` | Lag de sincronización en ms | Gauge |
| `audit_write_tps` | Transacciones de auditoría por segundo | Counter |
| `conflict_rate` | Tasa de conflictos detectados | Counter |
| `queue_depth` | Profundidad de cola de trabajos | Gauge |
| `error_ratio` | Ratio de errores | Ratio |

### Alertas Configuradas

- **WorkerSyncDown**: Aplicación no disponible
- **HighSyncLag**: Lag de sincronización > 500ms
- **HighErrorRate**: Tasa de errores > 1%
- **QueueBacklog**: Cola con > 1000 trabajos pendientes
- **HighConflictRate**: Tasa de conflictos > 5%

## Troubleshooting

### Problemas Comunes

#### Pods en CrashLoopBackOff

```bash
# Ver logs detallados
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous

# Verificar configuración
kubectl get configmap worker-sync-config -o yaml
```

#### Problemas de Conectividad a BD

```bash
# Test de conectividad
kubectl exec -it deployment/worker-sync -- pg_isready -h postgresql -p 5432

# Verificar secrets
kubectl get secret worker-sync-secret -o yaml
```

#### Métricas No Aparecen

```bash
# Verificar ServiceMonitor
kubectl get servicemonitor worker-sync -o yaml

# Verificar targets en Prometheus
kubectl port-forward svc/worker-sync-prometheus 9090:9090
# Ir a http://localhost:9090/targets
```

### Logs de Debug

```bash
# Habilitar logs de debug
helm upgrade worker-sync ./helm --set logLevel=debug

# Ver logs en tiempo real
kubectl logs -f deployment/worker-sync --tail=100
```

## Seguridad

### Configuración de Seguridad

```yaml
securityContext:
  enabled: true
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
  capabilities:
    drop:
      - ALL

podSecurityContext:
  enabled: true
  fsGroup: 1001
  runAsUser: 1001
  runAsGroup: 1001
```

### Encriptación

- **At Rest**: AES-256 para datos sensibles
- **In Transit**: TLS 1.3 para todas las comunicaciones
- **Secrets**: Encriptados en etcd

### RBAC

El chart incluye configuración RBAC mínima:

```yaml
rbac:
  create: true
  rules:
    - apiGroups: [""]
      resources: ["pods", "services", "endpoints"]
      verbs: ["get", "list", "watch"]
    - apiGroups: [""]
      resources: ["configmaps", "secrets"]
      verbs: ["get", "list"]
```

## Backup y Recuperación

### Configuración de Backup

```yaml
cronJobs:
  backup:
    enabled: true
    schedule: "0 2 * * *"  # Diario a las 2 AM
    retentionDays: 30
    s3:
      enabled: true
      bucket: "worker-sync-backups"
      region: "us-west-2"
```

### Restauración

```bash
# Descargar backup desde S3
aws s3 cp s3://worker-sync-backups/backup_20240101_020000.tar.gz .

# Extraer backup
tar -xzf backup_20240101_020000.tar.gz

# Restaurar PostgreSQL
kubectl exec -i postgresql-0 -- psql -U postgres < postgresql_backup.sql

# Restaurar MySQL
kubectl exec -i mysql-0 -- mysql -u root -p < mysql_backup.sql

# Restaurar MongoDB
kubectl exec -i mongodb-0 -- mongorestore --drop mongodb_backup/
```

## Actualizaciones

### Actualización de la Aplicación

```bash
# Actualizar imagen
helm upgrade worker-sync ./helm --set image.tag=v2.0.0

# Actualizar con nuevos valores
helm upgrade worker-sync ./helm -f values-new.yaml
```

### Rollback

```bash
# Ver historial
helm history worker-sync

# Rollback a versión anterior
helm rollback worker-sync 1
```

## Desarrollo

### Estructura del Chart

```
helm/
├── Chart.yaml              # Metadatos del chart
├── values.yaml             # Valores por defecto
├── templates/              # Templates de Kubernetes
│   ├── deployment.yaml     # Deployment principal
│   ├── service.yaml        # Servicios
│   ├── configmap.yaml      # ConfigMaps
│   ├── secret.yaml         # Secrets
│   ├── ingress.yaml        # Ingress
│   ├── hpa.yaml           # HorizontalPodAutoscaler
│   ├── rbac.yaml          # RBAC resources
│   ├── networkpolicy.yaml # NetworkPolicies
│   ├── pdb.yaml           # PodDisruptionBudgets
│   ├── job.yaml           # Jobs de inicialización
│   ├── cronjob.yaml       # CronJobs de mantenimiento
│   ├── pvc.yaml           # PersistentVolumeClaims
│   ├── servicemonitor.yaml # ServiceMonitors
│   ├── prometheusrule.yaml # PrometheusRules
│   ├── NOTES.txt          # Notas post-instalación
│   └── tests/             # Tests de Helm
└── README.md              # Esta documentación
```

### Validación del Chart

```bash
# Lint del chart
helm lint ./helm

# Dry-run
helm install worker-sync ./helm --dry-run --debug

# Template rendering
helm template worker-sync ./helm
```

## Soporte

Para soporte técnico:

1. Revisar logs: `kubectl logs -f deployment/worker-sync`
2. Verificar métricas en Grafana
3. Consultar alertas en AlertManager
4. Crear issue en el repositorio

## Licencia

Este proyecto está licenciado bajo MIT License.

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crear feature branch
3. Commit cambios
4. Push al branch
5. Crear Pull Request

## Changelog

### v1.0.0
- Implementación inicial
- Soporte para PostgreSQL, MySQL, MongoDB
- Monitoreo con Prometheus/Grafana
- Auto-scaling y alta disponibilidad
- Seguridad enterprise-grade