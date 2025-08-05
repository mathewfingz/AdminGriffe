# Runbook Operacional - Worker Sync

## 📋 Información General

**Servicio**: Worker Sync - Sistema de Auditoría y Sincronización  
**Versión**: 1.0.0  
**Equipo**: AdminGriffe Platform Team  
**Criticidad**: Alta (Tier 1)  
**SLA**: 99.99% uptime, < 100ms latencia  

## 🎯 Objetivos de Nivel de Servicio (SLO)

| Métrica | SLO | SLA |
|---------|-----|-----|
| Disponibilidad | 99.95% | 99.99% |
| Latencia P95 | < 100ms | < 200ms |
| Throughput | 10,000 TPS | 8,000 TPS |
| Tasa de Errores | < 0.1% | < 1% |
| Resolución Conflictos | > 99% | > 95% |

## 🚨 Alertas y Escalación

### Niveles de Severidad

#### 🔴 CRÍTICO (P1)
- **Tiempo de Respuesta**: 15 minutos
- **Escalación**: Inmediata al equipo on-call
- **Ejemplos**:
  - Servicio completamente down
  - Pérdida de datos
  - Latencia > 1000ms por > 5 minutos

#### 🟡 ALTO (P2)
- **Tiempo de Respuesta**: 1 hora
- **Escalación**: Equipo de desarrollo
- **Ejemplos**:
  - Latencia > 500ms por > 10 minutos
  - Tasa de errores > 5%
  - Cola > 5000 jobs

#### 🟢 MEDIO (P3)
- **Tiempo de Respuesta**: 4 horas
- **Escalación**: Durante horario laboral
- **Ejemplos**:
  - Latencia > 200ms por > 30 minutos
  - Tasa de errores > 1%

### Contactos de Escalación

```
L1: On-Call Engineer (PagerDuty)
L2: Platform Team Lead
L3: Engineering Manager
L4: CTO
```

## 🔍 Monitoreo y Métricas

### Dashboards Principales

1. **[Worker Sync Overview](http://grafana.company.com/d/worker-sync-overview)**
   - Métricas generales del sistema
   - Estado de salud de componentes
   - Throughput y latencia

2. **[Database Health](http://grafana.company.com/d/database-health)**
   - Estado de PostgreSQL, MySQL, MongoDB
   - Conexiones activas
   - Replicación lag

3. **[Kafka Monitoring](http://grafana.company.com/d/kafka-monitoring)**
   - Consumer lag
   - Partition health
   - Message throughput

### Métricas Clave

```promql
# Latencia de sincronización
histogram_quantile(0.95, sync_latency_ms_bucket)

# Tasa de errores
rate(sync_errors_total[5m]) / rate(sync_events_total[5m])

# Profundidad de cola
queue_depth

# Lag de sincronización
sync_lag_ms

# Disponibilidad del servicio
up{job="worker-sync"}
```

### Alertas Configuradas

```yaml
# Latencia alta
- alert: HighSyncLatency
  expr: histogram_quantile(0.95, sync_latency_ms_bucket) > 500
  for: 1m
  labels:
    severity: warning
  annotations:
    summary: "Alta latencia de sincronización"

# Servicio down
- alert: ServiceDown
  expr: up{job="worker-sync"} == 0
  for: 30s
  labels:
    severity: critical
  annotations:
    summary: "Worker Sync service is down"

# Cola saturada
- alert: QueueSaturated
  expr: queue_depth > 1000
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "Cola de sincronización saturada"
```

## 🛠️ Procedimientos de Respuesta a Incidentes

### 1. Servicio Down (P1)

#### Síntomas
- Health check falla
- Alertas de disponibilidad
- No se procesan eventos CDC

#### Diagnóstico Inicial
```bash
# Verificar estado del pod
kubectl get pods -n sync-system -l app=worker-sync

# Ver logs recientes
kubectl logs -f deployment/worker-sync -n sync-system --tail=100

# Verificar health endpoints
curl -f http://worker-sync.sync-system.svc.cluster.local:3003/health
```

#### Acciones de Mitigación
```bash
# 1. Restart del deployment
kubectl rollout restart deployment/worker-sync -n sync-system

# 2. Verificar recursos
kubectl describe pod <pod-name> -n sync-system

# 3. Escalar horizontalmente si es necesario
kubectl scale deployment worker-sync --replicas=5 -n sync-system

# 4. Verificar dependencias
kubectl get pods -n database
kubectl get pods -n kafka
kubectl get pods -n redis
```

#### Verificación de Recuperación
```bash
# Health check
curl http://worker-sync.sync-system.svc.cluster.local:3003/health

# Métricas
curl http://worker-sync.sync-system.svc.cluster.local:3003/metrics | grep up

# Procesamiento de eventos
kubectl logs deployment/worker-sync -n sync-system | grep "Processing CDC event"
```

### 2. Alta Latencia (P2)

#### Síntomas
- Latencia P95 > 500ms
- Alertas de performance
- Quejas de usuarios

#### Diagnóstico
```bash
# Verificar métricas de latencia
curl -s http://worker-sync:3003/metrics | grep sync_latency

# Verificar conexiones a DB
kubectl exec -it deployment/worker-sync -n sync-system -- npm run health:db

# Verificar lag de Kafka
kubectl exec -it kafka-0 -n kafka -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group worker-sync-group
```

#### Acciones de Mitigación
```bash
# 1. Escalar workers
kubectl scale deployment worker-sync --replicas=10 -n sync-system

# 2. Verificar índices de DB
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats WHERE tablename='audit_log';"

# 3. Limpiar cache si es necesario
kubectl exec -it redis-0 -n cache -- redis-cli FLUSHDB

# 4. Reiniciar conexiones de pool
kubectl rollout restart deployment/worker-sync -n sync-system
```

### 3. Cola Saturada (P2)

#### Síntomas
- queue_depth > 1000
- Procesamiento lento
- Memoria alta en Redis

#### Diagnóstico
```bash
# Verificar profundidad de cola
curl -s http://worker-sync:3003/metrics | grep queue_depth

# Verificar memoria de Redis
kubectl exec -it redis-0 -n cache -- redis-cli INFO memory

# Ver jobs fallidos
kubectl exec -it redis-0 -n cache -- redis-cli LLEN bull:sync:failed
```

#### Acciones de Mitigación
```bash
# 1. Aumentar concurrencia
kubectl patch deployment worker-sync -n sync-system -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"worker-sync","env":[{"name":"QUEUE_CONCURRENCY","value":"20"}]}]}}}}'

# 2. Escalar workers
kubectl scale deployment worker-sync --replicas=15 -n sync-system

# 3. Limpiar jobs fallidos si es seguro
kubectl exec -it redis-0 -n cache -- redis-cli DEL bull:sync:failed

# 4. Aumentar recursos de Redis
kubectl patch statefulset redis -n cache -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"redis","resources":{"limits":{"memory":"4Gi"}}}]}}}}'
```

### 4. Conflictos de Sincronización (P3)

#### Síntomas
- conflict_rate > 5%
- Datos inconsistentes
- Alertas de resolución manual

#### Diagnóstico
```bash
# Ver conflictos pendientes
curl http://worker-sync:3001/sync/conflicts

# Verificar logs de conflictos
kubectl logs deployment/worker-sync -n sync-system | grep "Conflict detected"

# Verificar vector clocks
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "SELECT * FROM sync_conflicts WHERE resolved_at IS NULL LIMIT 10;"
```

#### Acciones de Mitigación
```bash
# 1. Forzar resolución automática
curl -X POST http://worker-sync:3001/sync/resolve-conflicts

# 2. Verificar configuración de resolución
kubectl get configmap worker-sync-config -n sync-system -o yaml

# 3. Revisar estrategia de vector clock
kubectl logs deployment/worker-sync -n sync-system | grep "Vector clock"

# 4. Resolución manual si es necesario
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "UPDATE sync_conflicts SET resolution_strategy='manual_override', resolved_at=NOW() WHERE id=<conflict_id>;"
```

## 🔧 Comandos de Mantenimiento

### Operaciones Rutinarias

#### Health Checks
```bash
# Health check completo
kubectl exec -it deployment/worker-sync -n sync-system -- npm run health:full

# Verificar conectividad a todas las DBs
kubectl exec -it deployment/worker-sync -n sync-system -- npm run health:db

# Verificar Kafka connectivity
kubectl exec -it deployment/worker-sync -n sync-system -- npm run health:kafka
```

#### Limpieza de Datos
```bash
# Limpiar logs de auditoría antiguos (> 90 días)
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "DELETE FROM audit_log WHERE executed_at < NOW() - INTERVAL '90 days';"

# Limpiar conflictos resueltos antiguos
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "DELETE FROM sync_conflicts WHERE resolved_at < NOW() - INTERVAL '30 days';"

# Limpiar métricas antiguas de Redis
kubectl exec -it redis-0 -n cache -- redis-cli --scan --pattern "metrics:*" | \
  xargs kubectl exec -it redis-0 -n cache -- redis-cli DEL
```

#### Backup y Restore
```bash
# Backup de configuración de sync
kubectl exec -it postgres-0 -n database -- pg_dump -U sync_user -d sync_db \
  -t sync_metadata -t sync_conflicts > sync_config_backup.sql

# Backup de logs de auditoría
kubectl exec -it postgres-0 -n database -- pg_dump -U sync_user -d sync_db \
  -t audit_log --where="executed_at >= NOW() - INTERVAL '7 days'" > audit_backup.sql

# Restore desde backup
kubectl exec -i postgres-0 -n database -- psql -U sync_user -d sync_db < sync_config_backup.sql
```

### Operaciones de Emergencia

#### Parada de Emergencia
```bash
# Parar procesamiento de eventos (mantener health checks)
kubectl patch deployment worker-sync -n sync-system -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"worker-sync","env":[{"name":"EMERGENCY_STOP","value":"true"}]}]}}}}'

# Parada completa del servicio
kubectl scale deployment worker-sync --replicas=0 -n sync-system
```

#### Recuperación de Desastre
```bash
# 1. Verificar estado de las bases de datos
kubectl get pods -n database
kubectl exec -it postgres-0 -n database -- pg_isready
kubectl exec -it mysql-0 -n database -- mysqladmin ping
kubectl exec -it mongo-0 -n database -- mongo --eval "db.runCommand('ping')"

# 2. Verificar Kafka
kubectl exec -it kafka-0 -n kafka -- kafka-topics.sh --bootstrap-server localhost:9092 --list

# 3. Limpiar estado corrupto si es necesario
kubectl exec -it redis-0 -n cache -- redis-cli FLUSHALL

# 4. Reiniciar desde checkpoint conocido
kubectl patch deployment worker-sync -n sync-system -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"worker-sync","env":[{"name":"RESET_CHECKPOINT","value":"true"}]}]}}}}'

# 5. Escalar gradualmente
kubectl scale deployment worker-sync --replicas=1 -n sync-system
# Esperar estabilización
kubectl scale deployment worker-sync --replicas=3 -n sync-system
```

## 📊 Análisis de Capacidad

### Métricas de Capacidad

```bash
# CPU y memoria por pod
kubectl top pods -n sync-system

# Throughput actual vs límites
curl -s http://worker-sync:3003/metrics | grep sync_events_total

# Utilización de conexiones DB
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"
```

### Planificación de Escalamiento

#### Triggers de Escalamiento
- CPU > 70% por 5 minutos
- Memoria > 80% por 5 minutos
- queue_depth > 500 por 2 minutos
- sync_lag_ms > 200 por 5 minutos

#### Escalamiento Horizontal
```bash
# Escalar workers
kubectl scale deployment worker-sync --replicas=<new_count> -n sync-system

# Verificar distribución de carga
kubectl get pods -n sync-system -o wide
```

#### Escalamiento Vertical
```bash
# Aumentar recursos del pod
kubectl patch deployment worker-sync -n sync-system -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"worker-sync","resources":{"requests":{"cpu":"2","memory":"4Gi"},"limits":{"cpu":"4","memory":"8Gi"}}}]}}}}'
```

## 🔐 Seguridad y Compliance

### Auditoría de Seguridad

```bash
# Verificar certificados TLS
kubectl get secret worker-sync-tls -n sync-system -o yaml

# Verificar permisos RBAC
kubectl auth can-i --list --as=system:serviceaccount:sync-system:worker-sync

# Verificar políticas de red
kubectl get networkpolicy -n sync-system
```

### Compliance SOX

```bash
# Exportar logs de auditoría para compliance
kubectl exec -it postgres-0 -n database -- psql -U sync_user -d sync_db \
  -c "COPY (SELECT * FROM audit_log WHERE executed_at >= '2024-01-01') TO STDOUT WITH CSV HEADER;" > sox_audit_export.csv

# Verificar integridad de firmas digitales
kubectl exec -it deployment/worker-sync -n sync-system -- npm run verify:signatures

# Generar reporte de compliance
kubectl exec -it deployment/worker-sync -n sync-system -- npm run compliance:report
```

## 📞 Contactos y Recursos

### Equipo de Desarrollo
- **Tech Lead**: [nombre@company.com]
- **DevOps**: [devops@company.com]
- **On-Call**: [oncall@company.com]

### Recursos Útiles
- **Grafana**: http://grafana.company.com
- **Prometheus**: http://prometheus.company.com
- **Logs**: http://kibana.company.com
- **Documentation**: http://docs.company.com/worker-sync
- **Runbooks**: http://runbooks.company.com

### Herramientas de Diagnóstico
```bash
# Script de diagnóstico completo
curl -s https://raw.githubusercontent.com/company/worker-sync/main/scripts/diagnose.sh | bash

# Recolección de logs para soporte
kubectl exec -it deployment/worker-sync -n sync-system -- npm run collect:logs

# Generación de bundle de diagnóstico
kubectl exec -it deployment/worker-sync -n sync-system -- npm run support:bundle
```

---

**Última actualización**: 2024-01-15  
**Próxima revisión**: 2024-04-15  
**Versión del documento**: 1.2