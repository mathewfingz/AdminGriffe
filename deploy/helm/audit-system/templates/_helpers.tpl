{{/*
Expand the name of the chart.
*/}}
{{- define "audit-system.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "audit-system.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "audit-system.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "audit-system.labels" -}}
helm.sh/chart: {{ include "audit-system.chart" . }}
{{ include "audit-system.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "audit-system.selectorLabels" -}}
app.kubernetes.io/name: {{ include "audit-system.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "audit-system.serviceAccountName" -}}
{{- if .Values.security.serviceAccount.create }}
{{- default (include "audit-system.fullname" .) .Values.security.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.security.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the PostgreSQL connection string
*/}}
{{- define "audit-system.postgresql.connectionString" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "postgresql://%s:%s@%s-postgresql:5432/%s" .Values.postgresql.auth.username .Values.postgresql.auth.password (include "audit-system.fullname" .) .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.postgresql.connectionString }}
{{- end }}
{{- end }}

{{/*
Create the MySQL connection string
*/}}
{{- define "audit-system.mysql.connectionString" -}}
{{- if .Values.mysql.enabled }}
{{- printf "mysql://%s:%s@%s-mysql:3306/%s" .Values.mysql.auth.username .Values.mysql.auth.password (include "audit-system.fullname" .) .Values.mysql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.mysql.connectionString }}
{{- end }}
{{- end }}

{{/*
Create the MongoDB connection string
*/}}
{{- define "audit-system.mongodb.connectionString" -}}
{{- if .Values.mongodb.enabled }}
{{- printf "mongodb://%s:%s@%s-mongodb:27017/%s" .Values.mongodb.auth.username .Values.mongodb.auth.password (include "audit-system.fullname" .) .Values.mongodb.auth.database }}
{{- else }}
{{- .Values.externalDatabase.mongodb.connectionString }}
{{- end }}
{{- end }}

{{/*
Create the Redis connection string
*/}}
{{- define "audit-system.redis.connectionString" -}}
{{- if .Values.redis.enabled }}
{{- if .Values.redis.auth.enabled }}
{{- printf "redis://:%s@%s-redis-master:6379" .Values.redis.auth.password (include "audit-system.fullname" .) }}
{{- else }}
{{- printf "redis://%s-redis-master:6379" (include "audit-system.fullname" .) }}
{{- end }}
{{- else }}
{{- .Values.externalCache.redis.connectionString }}
{{- end }}
{{- end }}

{{/*
Create the Kafka brokers list
*/}}
{{- define "audit-system.kafka.brokers" -}}
{{- if .Values.kafka.enabled }}
{{- printf "%s-kafka:9092" (include "audit-system.fullname" .) }}
{{- else }}
{{- .Values.externalMessaging.kafka.brokers }}
{{- end }}
{{- end }}

{{/*
Create security context for containers
*/}}
{{- define "audit-system.securityContext" -}}
allowPrivilegeEscalation: false
capabilities:
  drop:
  - ALL
readOnlyRootFilesystem: true
runAsNonRoot: true
runAsUser: 1000
{{- end }}

{{/*
Create pod security context
*/}}
{{- define "audit-system.podSecurityContext" -}}
runAsNonRoot: true
runAsUser: 1000
fsGroup: 1000
seccompProfile:
  type: RuntimeDefault
{{- end }}

{{/*
Create common environment variables
*/}}
{{- define "audit-system.commonEnv" -}}
- name: NODE_ENV
  value: "production"
- name: LOG_LEVEL
  value: {{ .Values.global.logLevel | default "info" | quote }}
- name: METRICS_PORT
  value: "9090"
- name: HEALTH_CHECK_PORT
  value: "8080"
{{- end }}

{{/*
Create database environment variables
*/}}
{{- define "audit-system.databaseEnv" -}}
- name: POSTGRESQL_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "audit-system.fullname" . }}-secrets
      key: postgresql-url
- name: MYSQL_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "audit-system.fullname" . }}-secrets
      key: mysql-url
- name: MONGODB_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "audit-system.fullname" . }}-secrets
      key: mongodb-url
{{- end }}

{{/*
Create messaging environment variables
*/}}
{{- define "audit-system.messagingEnv" -}}
- name: KAFKA_BROKERS
  valueFrom:
    configMapKeyRef:
      name: {{ include "audit-system.fullname" . }}-config
      key: kafka-brokers
- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: {{ include "audit-system.fullname" . }}-secrets
      key: redis-url
{{- end }}

{{/*
Create volume mounts for security
*/}}
{{- define "audit-system.volumeMounts" -}}
- name: tmp
  mountPath: /tmp
- name: var-cache
  mountPath: /var/cache
- name: var-run
  mountPath: /var/run
{{- end }}

{{/*
Create volumes for security
*/}}
{{- define "audit-system.volumes" -}}
- name: tmp
  emptyDir: {}
- name: var-cache
  emptyDir: {}
- name: var-run
  emptyDir: {}
{{- end }}