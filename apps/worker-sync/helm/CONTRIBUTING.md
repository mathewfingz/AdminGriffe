# Contributing to Worker-Sync Helm Chart

Thank you for your interest in contributing to the Worker-Sync Helm Chart! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Chart Development Guidelines](#chart-development-guidelines)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Review Process](#review-process)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful**: Treat all community members with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be collaborative**: Work together to improve the project
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Maintain a professional tone in all interactions

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Kubernetes cluster** (local or remote) for testing
- **Helm 3.8+** installed
- **kubectl** configured to access your cluster
- **Git** for version control
- **Docker** for building and testing images
- **Basic knowledge** of Kubernetes, Helm, and YAML

### Repository Structure

```
helm/
├── Chart.yaml              # Chart metadata
├── values.yaml            # Default configuration values
├── values-production.yaml # Production environment values
├── values-development.yaml # Development environment values
├── templates/             # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   ├── pdb.yaml
│   ├── rbac.yaml
│   ├── networkpolicy.yaml
│   ├── servicemonitor.yaml
│   ├── prometheusrule.yaml
│   ├── job.yaml
│   ├── cronjob.yaml
│   ├── pvc.yaml
│   ├── NOTES.txt
│   └── tests/
│       └── test-connection.yaml
├── charts/                # Chart dependencies
├── README.md             # Chart documentation
├── CHANGELOG.md          # Version history
├── LICENSE               # License information
├── CONTRIBUTING.md       # This file
├── .helmignore          # Files to ignore when packaging
├── validate-chart.sh    # Chart validation script
└── install.sh           # Installation script
```

## Development Setup

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/AdminGriffe.git
cd AdminGriffe/apps/worker-sync/helm

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/AdminGriffe.git
```

### 2. Create Development Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. Set Up Local Environment

```bash
# Install chart dependencies
helm dependency update

# Validate chart syntax
helm lint .

# Test chart rendering
helm template worker-sync . --values values-development.yaml
```

## Contributing Process

### 1. Issue Creation

Before starting work:

- **Search existing issues** to avoid duplicates
- **Create a new issue** describing:
  - Problem or feature request
  - Expected behavior
  - Current behavior (for bugs)
  - Steps to reproduce (for bugs)
  - Proposed solution (for features)

### 2. Development Workflow

```bash
# 1. Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes
# Edit files as needed

# 4. Test changes
./validate-chart.sh

# 5. Commit changes
git add .
git commit -m "feat: add new feature description"

# 6. Push to your fork
git push origin feature/your-feature

# 7. Create pull request
```

### 3. Commit Message Format

Use conventional commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

**Examples:**
```
feat(monitoring): add Grafana dashboard configuration
fix(rbac): correct ClusterRole permissions for metrics
docs(readme): update installation instructions
test(validation): add connectivity tests for Redis
```

## Chart Development Guidelines

### 1. Template Best Practices

#### Use Proper Indentation
```yaml
# Good
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "worker-sync.selectorLabels" . | nindent 6 }}

# Bad
spec:
replicas: {{ .Values.replicaCount }}
selector:
matchLabels:
{{- include "worker-sync.selectorLabels" . | nindent 6 }}
```

#### Conditional Resources
```yaml
{{- if .Values.monitoring.prometheus.enabled }}
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
# ... rest of the resource
{{- end }}
```

#### Resource Naming
```yaml
metadata:
  name: {{ include "worker-sync.fullname" . }}-config
  labels:
    {{- include "worker-sync.labels" . | nindent 4 }}
```

### 2. Values Structure

#### Organize Logically
```yaml
# Application settings
app:
  name: worker-sync
  version: "1.0.0"

# Deployment settings
deployment:
  replicaCount: 3
  image:
    repository: worker-sync
    tag: "latest"

# Service settings
service:
  type: ClusterIP
  port: 8080
```

#### Provide Sensible Defaults
```yaml
# Good - provides working defaults
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

# Bad - requires user configuration
resources: {}
```

#### Document All Values
```yaml
# Database configuration
database:
  # PostgreSQL settings
  postgresql:
    # Enable PostgreSQL integration
    enabled: true
    # Database host
    host: "postgresql"
    # Database port
    port: 5432
```

### 3. Security Guidelines

#### Use Security Contexts
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  readOnlyRootFilesystem: true
```

#### Implement RBAC
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "worker-sync.fullname" . }}
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
```

#### Use Network Policies
```yaml
{{- if .Values.networkPolicy.enabled }}
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "worker-sync.fullname" . }}
spec:
  podSelector:
    matchLabels:
      {{- include "worker-sync.selectorLabels" . | nindent 6 }}
  policyTypes:
  - Ingress
  - Egress
{{- end }}
```

### 4. Resource Management

#### Set Resource Limits
```yaml
resources:
  limits:
    cpu: {{ .Values.resources.limits.cpu }}
    memory: {{ .Values.resources.limits.memory }}
  requests:
    cpu: {{ .Values.resources.requests.cpu }}
    memory: {{ .Values.resources.requests.memory }}
```

#### Configure Probes
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: {{ .Values.probes.liveness.initialDelaySeconds }}
  periodSeconds: {{ .Values.probes.liveness.periodSeconds }}
```

## Testing Requirements

### 1. Chart Validation

Run the validation script before submitting:

```bash
./validate-chart.sh
```

This script performs:
- Syntax validation (`helm lint`)
- Template rendering tests
- Kubernetes resource validation
- Security checks
- Metadata validation

### 2. Manual Testing

Test in different environments:

```bash
# Development environment
helm install worker-sync . -f values-development.yaml --dry-run

# Production environment
helm install worker-sync . -f values-production.yaml --dry-run

# Custom values
helm install worker-sync . --set replicaCount=5 --dry-run
```

### 3. Integration Testing

If you have access to a cluster:

```bash
# Install chart
./install.sh --environment development --namespace worker-sync-test

# Run tests
helm test worker-sync -n worker-sync-test

# Check deployment
kubectl get all -n worker-sync-test

# Clean up
helm uninstall worker-sync -n worker-sync-test
```

### 4. Test Coverage

Ensure your changes include:

- **Unit tests** for template functions
- **Integration tests** for resource interactions
- **End-to-end tests** for complete workflows
- **Security tests** for RBAC and network policies

## Documentation Standards

### 1. README Updates

When adding features, update:

- **Features list**
- **Configuration options**
- **Installation instructions**
- **Examples**
- **Troubleshooting**

### 2. Values Documentation

Document all new values:

```yaml
# New feature configuration
newFeature:
  # Enable the new feature
  enabled: false
  # Configuration option 1
  option1: "default-value"
  # Configuration option 2 (required if enabled)
  option2: ""
```

### 3. CHANGELOG Updates

Add entries to CHANGELOG.md:

```markdown
## [Unreleased]

### Added
- New feature for XYZ functionality
- Support for ABC configuration

### Changed
- Improved performance of DEF component

### Fixed
- Fixed issue with GHI not working properly
```

### 4. Inline Comments

Add comments for complex logic:

```yaml
{{- /*
Calculate the number of replicas based on environment and scaling settings.
In production, use autoscaling if enabled, otherwise use configured replicas.
In development, always use 1 replica for simplicity.
*/ -}}
{{- if eq .Values.environment "production" }}
  {{- if .Values.autoscaling.enabled }}
replicas: {{ .Values.autoscaling.minReplicas }}
  {{- else }}
replicas: {{ .Values.replicaCount }}
  {{- end }}
{{- else }}
replicas: 1
{{- end }}
```

## Review Process

### 1. Pull Request Requirements

Your PR should include:

- **Clear description** of changes
- **Issue reference** (if applicable)
- **Testing evidence** (screenshots, logs)
- **Documentation updates**
- **CHANGELOG entry**

### 2. Review Checklist

Reviewers will check:

- [ ] Code follows chart development guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Security best practices are followed
- [ ] Breaking changes are documented
- [ ] Backward compatibility is maintained

### 3. Approval Process

1. **Automated checks** must pass
2. **At least one reviewer** approval required
3. **Maintainer approval** for significant changes
4. **Security review** for security-related changes

## Release Process

### 1. Version Bumping

Follow semantic versioning:

- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backward compatible
- **Patch** (0.0.X): Bug fixes, backward compatible

### 2. Release Preparation

1. Update `Chart.yaml` version
2. Update `CHANGELOG.md`
3. Update documentation
4. Run full test suite
5. Create release PR

### 3. Release Execution

1. Merge release PR
2. Create git tag
3. Package chart (`helm package`)
4. Publish to chart repository
5. Update release notes

## Getting Help

### 1. Documentation

- **README.md**: Installation and configuration
- **values.yaml**: Configuration options
- **CHANGELOG.md**: Version history
- **Troubleshooting**: Common issues and solutions

### 2. Community Support

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Slack/Discord**: Real-time community chat (if available)

### 3. Maintainer Contact

For urgent issues or security concerns:

- Create a GitHub issue with `urgent` label
- Contact maintainers directly (if contact info available)
- Follow security disclosure process for vulnerabilities

## Recognition

Contributors will be recognized in:

- **CHANGELOG.md**: Feature and fix credits
- **README.md**: Contributors section
- **Release notes**: Major contribution highlights

Thank you for contributing to the Worker-Sync Helm Chart! Your contributions help make this project better for everyone.

---

*Last updated: January 2024*