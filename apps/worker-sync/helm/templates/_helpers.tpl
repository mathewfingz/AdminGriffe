{{/*
Expand the name of the chart.
*/}}
{{- define "worker-sync.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "worker-sync.fullname" -}}
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
{{- define "worker-sync.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "worker-sync.labels" -}}
helm.sh/chart: {{ include "worker-sync.chart" . }}
{{ include "worker-sync.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/component: worker
app.kubernetes.io/part-of: sync-system
{{- end }}

{{/*
Selector labels
*/}}
{{- define "worker-sync.selectorLabels" -}}
app.kubernetes.io/name: {{ include "worker-sync.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "worker-sync.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "worker-sync.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the PostgreSQL connection string
*/}}
{{- define "worker-sync.postgresqlUrl" -}}
{{- if .Values.postgresql.enabled }}
postgresql://{{ .Values.postgresql.username }}:{{ .Values.secrets.postgresql.password }}@{{ .Values.postgresql.host }}:{{ .Values.postgresql.port }}/{{ .Values.postgresql.database }}{{- if .Values.postgresql.ssl }}?sslmode=require{{- end }}
{{- end }}
{{- end }}

{{/*
Create the MySQL connection string
*/}}
{{- define "worker-sync.mysqlUrl" -}}
{{- if .Values.mysql.enabled }}
mysql://{{ .Values.mysql.username }}:{{ .Values.secrets.mysql.password }}@{{ .Values.mysql.host }}:{{ .Values.mysql.port }}/{{ .Values.mysql.database }}{{- if .Values.mysql.ssl }}?ssl=true{{- end }}
{{- end }}
{{- end }}

{{/*
Create the MongoDB connection string
*/}}
{{- define "worker-sync.mongodbUrl" -}}
{{- if .Values.mongodb.enabled }}
mongodb://{{ .Values.mongodb.username }}:{{ .Values.secrets.mongodb.password }}@{{ .Values.mongodb.host }}:{{ .Values.mongodb.port }}/{{ .Values.mongodb.database }}{{- if .Values.mongodb.ssl }}?ssl=true{{- end }}
{{- end }}
{{- end }}

{{/*
Create the Redis connection string
*/}}
{{- define "worker-sync.redisUrl" -}}
{{- if .Values.redis.enabled }}
redis://{{- if .Values.secrets.redis.password }}:{{ .Values.secrets.redis.password }}@{{- end }}{{ .Values.redis.host }}:{{ .Values.redis.port }}/{{ .Values.redis.database }}
{{- end }}
{{- end }}

{{/*
Create the RabbitMQ connection string
*/}}
{{- define "worker-sync.rabbitmqUrl" -}}
{{- if .Values.rabbitmq.enabled }}
amqp://{{ .Values.rabbitmq.username }}:{{ .Values.secrets.rabbitmq.password }}@{{ .Values.rabbitmq.host }}:{{ .Values.rabbitmq.port }}{{ .Values.rabbitmq.vhost }}
{{- end }}
{{- end }}

{{/*
Generate certificates for JWT
*/}}
{{- define "worker-sync.gen-certs" -}}
{{- $altNames := list ( printf "%s.%s" (include "worker-sync.name" .) .Release.Namespace ) ( printf "%s.%s.svc" (include "worker-sync.name" .) .Release.Namespace ) -}}
{{- $ca := genCA "worker-sync-ca" 365 -}}
{{- $cert := genSignedCert ( include "worker-sync.name" . ) nil $altNames 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
{{- end }}

{{/*
Return the appropriate apiVersion for HorizontalPodAutoscaler
*/}}
{{- define "worker-sync.hpa.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "autoscaling/v2" -}}
autoscaling/v2
{{- else if .Capabilities.APIVersions.Has "autoscaling/v2beta2" -}}
autoscaling/v2beta2
{{- else -}}
autoscaling/v2beta1
{{- end -}}
{{- end -}}

{{/*
Return the appropriate apiVersion for PodDisruptionBudget
*/}}
{{- define "worker-sync.pdb.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "policy/v1" -}}
policy/v1
{{- else -}}
policy/v1beta1
{{- end -}}
{{- end -}}

{{/*
Return the appropriate apiVersion for NetworkPolicy
*/}}
{{- define "worker-sync.networkPolicy.apiVersion" -}}
{{- if .Capabilities.APIVersions.Has "networking.k8s.io/v1" -}}
networking.k8s.io/v1
{{- else -}}
networking.k8s.io/v1beta1
{{- end -}}
{{- end -}}

{{/*
Validate required values
*/}}
{{- define "worker-sync.validateValues" -}}
{{- if not .Values.secrets.postgresql.password -}}
{{- fail "PostgreSQL password is required" -}}
{{- end -}}
{{- if not .Values.secrets.mysql.password -}}
{{- fail "MySQL password is required" -}}
{{- end -}}
{{- if not .Values.secrets.mongodb.password -}}
{{- fail "MongoDB password is required" -}}
{{- end -}}
{{- if not .Values.secrets.jwt.privateKey -}}
{{- fail "JWT private key is required" -}}
{{- end -}}
{{- if not .Values.secrets.jwt.publicKey -}}
{{- fail "JWT public key is required" -}}
{{- end -}}
{{- if not .Values.secrets.encryption.key -}}
{{- fail "Encryption key is required" -}}
{{- end -}}
{{- end -}}