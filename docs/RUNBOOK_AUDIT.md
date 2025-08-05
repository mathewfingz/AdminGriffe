# Runbook Operacional - Sistema de Auditoría AdminGriffe

## 🚨 Procedimientos de Emergencia

### Escalación de Incidentes

| Severidad | Tiempo Respuesta | Contacto | Acción |
|-----------|------------------|----------|---------|
| **P0 - Crítico** | 15 minutos | On-call + Manager | Página inmediata |
| **P1 - Alto** | 1 hora | On-call | Slack + Email |
| **P2 - Medio** | 4 horas | Equipo | Ticket |
| **P3 - Bajo** | 24 horas | Equipo | Backlog |

### Contactos de Emergencia

```
🔴 On-Call Principal: +1-555-0123
🟡 On-Call Backup: +1-555-0124
📧 Email: oncall@admingriffe.com
💬 Slack: #incident-response
```

## 📊 Métricas Críticas y Umbrales

### SLIs (Service Level Indicators)

| Métrica | SLI | Umbral Alerta | Umbral Crítico |
|---------|-----|---------------|----------------|
| Sync Lag | p95 < 100ms | > 200ms | > 500ms |
| Error Rate | < 0.1% | > 0.5% | > 1% |
| Throughput | > 1000 TPS | < 500 TPS | < 100 TPS |
| Availability | > 99.9% | < 99.5% | < 99% |
| Queue Depth | < 1000 | > 5000 | > 10000 |

### Comandos de Verificación Rápida

```bash
# Estado general del sistema
curl -s http://localhost:3000/api/health | jq

# Métricas de sincronización
curl -s http://localhost:3000/api/sync/metrics | jq

# Cola de trabajos
curl -s http://localhost:3000/api/sync/queue-status | jq

# Últimos errores
curl -s http://localhost:3000/api/audit/errors?limit=10 | jq
```

## 🔧 Procedimientos de Resolución

### 1. Lag de Sincronización Alto (> 500ms)

#### Diagnóstico
```bash
# 1. Verificar métricas
curl http://localhost:9090/api/v1/query?query=sync_lag_ms

# 2. Revisar cola de trabajos
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli queue:status

# 3. Verificar conectividad de bases de datos
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli db:ping --all
```

#### Resolución
```bash
# Opción 1: Escalar workers
kubectl scale deployment admingriffe-sync-worker --replicas=5

# Opción 2: Limpiar cola bloqueada
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli queue:clear --failed

# Opción 3: Reiniciar servicio de sync
kubectl rollout restart deployment/admingriffe-sync-worker
```

### 2. Tasa de Errores Alta (> 1%)

#### Diagnóstico
```bash
# 1. Identificar tipos de errores
curl http://localhost:3000/api/audit/errors?groupBy=type

# 2. Revisar logs recientes
kubectl logs --tail=100 deployment/admingriffe-api | grep ERROR

# 3. Verificar conectividad
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli connectivity:test
```

#### Resolución
```bash
# Opción 1: Reiniciar conexiones
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli connections:reset

# Opción 2: Aplicar circuit breaker
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli circuit-breaker:enable --service=mysql

# Opción 3: Rollback si es por deployment
kubectl rollout undo deployment/admingriffe-api
```

### 3. Cola Saturada (> 10,000 jobs)

#### Diagnóstico
```bash
# 1. Analizar distribución de trabajos
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli queue:analyze

# 2. Identificar trabajos bloqueados
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli queue:stuck

# 3. Verificar workers activos
kubectl get pods -l app=admingriffe-sync-worker
```

#### Resolución
```bash
# Opción 1: Escalar workers agresivamente
kubectl scale deployment admingriffe-sync-worker --replicas=10

# Opción 2: Procesar trabajos en lotes
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli queue:batch-process --size=1000

# Opción 3: Purgar trabajos antiguos (CUIDADO)
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli queue:purge --older-than=24h --confirm
```

### 4. Fallo de Integridad de Auditoría

#### Diagnóstico
```bash
# 1. Verificar integridad
curl http://localhost:3000/api/audit/integrity

# 2. Identificar registros corruptos
kubectl exec -it deployment/admingriffe-postgres -- \
  psql -c "SELECT * FROM audit_log WHERE signature IS NULL LIMIT 10;"

# 3. Verificar triggers
kubectl exec -it deployment/admingriffe-postgres -- \
  psql -c "SELECT * FROM information_schema.triggers WHERE trigger_name LIKE 'audit_%';"
```

#### Resolución
```bash
# Opción 1: Re-aplicar triggers
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli audit:setup-triggers

# Opción 2: Reparar firmas faltantes
kubectl exec -it deployment/admingriffe-api -- \
  pnpm cli audit:repair-signatures

# Opción 3: Restaurar desde backup (ÚLTIMO RECURSO)
kubectl exec -it deployment/admingriffe-postgres -- \
  pg_restore -d admingriffe /backups/latest.dump
```

## 🔄 Procedimientos de Mantenimiento

### Backup y Restauración

#### Backup Diario
```bash
# PostgreSQL
kubectl exec -it deployment/admingriffe-postgres -- \
  pg_dump -Fc admingriffe > backup_$(date +%Y%m%d).dump

# Redis
kubectl exec -it deployment/admingriffe-redis -- \
  redis-cli BGSAVE

# Configuraciones
kubectl get configmaps,secrets -o yaml > config_backup_$(date +%Y%m%d).yaml
```

#### Restauración
```bash
# PostgreSQL
kubectl exec -i deployment/admingriffe-postgres -- \
  pg_restore -d admingriffe < backup_20241201.dump

# Redis
kubectl cp backup.rdb admingriffe-redis-0:/data/dump.rdb
kubectl exec -it deployment/admingriffe-redis -- redis-cli DEBUG RESTART
```

### Rotación de Logs

#### Configuración Automática
```bash
# Configurar logrotate
cat > /etc/logrotate.d/admingriffe << EOF
/var/log/admingriffe/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 admingriffe admingriffe
    postrotate
        systemctl reload admingriffe
    endscript
}
EOF
```

#### Limpieza Manual
```bash
# Limpiar logs antiguos (> 30 días)
find /var/log/admingriffe -name "*.log" -mtime +30 -delete

# Comprimir logs grandes
find /var/log/admingriffe -name "*.log" -size +100M -exec gzip {} \;
```

### Actualización de Certificados

#### Verificar Expiración
```bash
# Certificados TLS
openssl x509 -in /etc/ssl/certs/admingriffe.crt -noout -dates

# Certificados JWT
kubectl get secret jwt-keys -o jsonpath='{.data.public\.pem}' | base64 -d | \
  openssl x509 -noout -dates
```

#### Renovación
```bash
# Let's Encrypt (automático)
certbot renew --nginx

# Certificados internos
kubectl create secret tls admingriffe-tls \
  --cert=new-cert.pem \
  --key=new-key.pem \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 📈 Monitoreo y Alertas

### Dashboard URLs

```
🔍 Grafana: http://grafana.admingriffe.com/d/audit-sync-dashboard
📊 Prometheus: http://prometheus.admingriffe.com
🚨 AlertManager: http://alertmanager.admingriffe.com
📋 Kibana: http://kibana.admingriffe.com
```

### Alertas Críticas

#### Configuración Slack
```yaml
# alertmanager.yml
route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-critical'

receivers:
- name: 'slack-critical'
  slack_configs:
  - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
    channel: '#alerts-critical'
    title: 'AdminGriffe Alert'
    text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

#### Verificar Alertas
```bash
# Estado de alertas activas
curl http://alertmanager.admingriffe.com/api/v1/alerts

# Silenciar alerta temporalmente
curl -X POST http://alertmanager.admingriffe.com/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{"matchers":[{"name":"alertname","value":"SyncLagHigh"}],"startsAt":"2024-01-01T00:00:00Z","endsAt":"2024-01-01T01:00:00Z","comment":"Maintenance window"}'
```

## 🔐 Procedimientos de Seguridad

### Rotación de Credenciales

#### Base de Datos
```bash
# 1. Crear nuevo usuario
kubectl exec -it deployment/admingriffe-postgres -- \
  psql -c "CREATE USER admingriffe_new WITH PASSWORD 'new_secure_password';"

# 2. Otorgar permisos
kubectl exec -it deployment/admingriffe-postgres -- \
  psql -c "GRANT ALL PRIVILEGES ON DATABASE admingriffe TO admingriffe_new;"

# 3. Actualizar secret
kubectl create secret generic db-credentials \
  --from-literal=username=admingriffe_new \
  --from-literal=password=new_secure_password \
  --dry-run=client -o yaml | kubectl apply -f -

# 4. Reiniciar aplicación
kubectl rollout restart deployment/admingriffe-api
```

#### JWT Keys
```bash
# 1. Generar nuevas claves
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# 2. Actualizar secret
kubectl create secret generic jwt-keys \
  --from-file=private.pem=private.pem \
  --from-file=public.pem=public.pem \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Rolling update
kubectl rollout restart deployment/admingriffe-api
```

### Auditoría de Seguridad

#### Escaneo de Vulnerabilidades
```bash
# Escaneo de contenedores
trivy image admingriffe/api:latest

# Escaneo de dependencias
kubectl exec -it deployment/admingriffe-api -- \
  pnpm audit --audit-level moderate

# Escaneo de configuración
kube-score score deployment.yaml
```

#### Revisión de Accesos
```bash
# Usuarios activos
kubectl exec -it deployment/admingriffe-postgres -- \
  psql -c "SELECT usename, valuntil FROM pg_user WHERE valuntil > NOW();"

# Sesiones activas
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/auth/sessions

# Logs de autenticación
kubectl logs deployment/admingriffe-api | grep "AUTH"
```

## 📋 Checklist de Go-Live

### Pre-Deployment

- [ ] **Backup completo** de base de datos de producción
- [ ] **Verificación de conectividad** a todas las bases de datos
- [ ] **Pruebas de carga** completadas exitosamente
- [ ] **Certificados SSL** válidos y configurados
- [ ] **Secrets y ConfigMaps** actualizados
- [ ] **Monitoreo y alertas** configurados
- [ ] **Runbook** actualizado y distribuido
- [ ] **Plan de rollback** documentado y probado

### Durante Deployment

- [ ] **Ventana de mantenimiento** comunicada
- [ ] **Tráfico** desviado a modo mantenimiento
- [ ] **Deployment** ejecutado con rolling update
- [ ] **Health checks** pasando
- [ ] **Smoke tests** ejecutados
- [ ] **Métricas** monitoreadas en tiempo real
- [ ] **Logs** revisados por errores

### Post-Deployment

- [ ] **Funcionalidad crítica** verificada
- [ ] **Rendimiento** dentro de SLAs
- [ ] **Alertas** funcionando correctamente
- [ ] **Dashboards** actualizados
- [ ] **Documentación** actualizada
- [ ] **Equipo** notificado del éxito
- [ ] **Retrospectiva** programada

## 🆘 Contactos de Emergencia

### Equipo Principal

| Rol | Nombre | Teléfono | Email | Horario |
|-----|--------|----------|-------|---------|
| **Tech Lead** | Juan Pérez | +1-555-0101 | juan@admingriffe.com | 24/7 |
| **DevOps** | María García | +1-555-0102 | maria@admingriffe.com | 8-20 |
| **DBA** | Carlos López | +1-555-0103 | carlos@admingriffe.com | 9-18 |
| **Security** | Ana Martín | +1-555-0104 | ana@admingriffe.com | 9-18 |

### Proveedores

| Servicio | Contacto | Teléfono | SLA |
|----------|----------|----------|-----|
| **AWS** | Enterprise Support | +1-800-AWS-HELP | 15 min |
| **MongoDB Atlas** | Premium Support | +1-844-666-4632 | 1 hour |
| **Redis Cloud** | Support | support@redis.com | 4 hours |

---

**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Próxima revisión**: Enero 2024  
**Mantenido por**: Equipo DevOps AdminGriffe