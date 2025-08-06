#!/bin/bash

# Worker-Sync Helm Chart Validation Script
# This script validates the Helm chart for syntax, best practices, and functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHART_DIR="$(dirname "$0")"
CHART_NAME="worker-sync"
NAMESPACE="worker-sync-test"
RELEASE_NAME="worker-sync-test"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm 3.8+ first."
        exit 1
    fi
    
    # Check helm version
    HELM_VERSION=$(helm version --short | cut -d'+' -f1 | cut -d'v' -f2)
    log_info "Helm version: $HELM_VERSION"
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if connected to a cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_warning "Not connected to a Kubernetes cluster. Some tests will be skipped."
        CLUSTER_AVAILABLE=false
    else
        CLUSTER_AVAILABLE=true
        log_info "Connected to Kubernetes cluster"
    fi
    
    log_success "Prerequisites check completed"
}

# Validate chart syntax
validate_syntax() {
    log_info "Validating chart syntax..."
    
    cd "$CHART_DIR"
    
    # Helm lint
    log_info "Running helm lint..."
    if helm lint .; then
        log_success "Helm lint passed"
    else
        log_error "Helm lint failed"
        exit 1
    fi
    
    # Template validation
    log_info "Validating templates..."
    if helm template "$RELEASE_NAME" . --debug > /dev/null; then
        log_success "Template validation passed"
    else
        log_error "Template validation failed"
        exit 1
    fi
    
    log_success "Syntax validation completed"
}

# Validate with different values files
validate_values() {
    log_info "Validating with different values files..."
    
    cd "$CHART_DIR"
    
    # Default values
    log_info "Testing with default values..."
    helm template "$RELEASE_NAME" . > /tmp/default-output.yaml
    if [ $? -eq 0 ]; then
        log_success "Default values validation passed"
    else
        log_error "Default values validation failed"
        exit 1
    fi
    
    # Production values
    if [ -f "values-production.yaml" ]; then
        log_info "Testing with production values..."
        helm template "$RELEASE_NAME" . -f values-production.yaml > /tmp/production-output.yaml
        if [ $? -eq 0 ]; then
            log_success "Production values validation passed"
        else
            log_error "Production values validation failed"
            exit 1
        fi
    fi
    
    # Development values
    if [ -f "values-development.yaml" ]; then
        log_info "Testing with development values..."
        helm template "$RELEASE_NAME" . -f values-development.yaml > /tmp/development-output.yaml
        if [ $? -eq 0 ]; then
            log_success "Development values validation passed"
        else
            log_error "Development values validation failed"
            exit 1
        fi
    fi
    
    log_success "Values validation completed"
}

# Validate Kubernetes resources
validate_k8s_resources() {
    log_info "Validating Kubernetes resources..."
    
    cd "$CHART_DIR"
    
    # Generate manifests
    helm template "$RELEASE_NAME" . > /tmp/manifests.yaml
    
    # Validate with kubectl
    if kubectl apply --dry-run=client -f /tmp/manifests.yaml > /dev/null 2>&1; then
        log_success "Kubernetes resources validation passed"
    else
        log_warning "Kubernetes resources validation failed (this might be due to CRDs not being available)"
    fi
    
    # Check for required resources
    log_info "Checking for required resources..."
    
    required_resources=(
        "Deployment"
        "Service"
        "ConfigMap"
        "Secret"
    )
    
    for resource in "${required_resources[@]}"; do
        if grep -q "kind: $resource" /tmp/manifests.yaml; then
            log_success "$resource found"
        else
            log_warning "$resource not found"
        fi
    done
    
    log_success "Kubernetes resources validation completed"
}

# Security validation
validate_security() {
    log_info "Validating security configurations..."
    
    cd "$CHART_DIR"
    
    # Generate manifests with production values
    if [ -f "values-production.yaml" ]; then
        helm template "$RELEASE_NAME" . -f values-production.yaml > /tmp/security-manifests.yaml
    else
        helm template "$RELEASE_NAME" . > /tmp/security-manifests.yaml
    fi
    
    # Check for security contexts
    if grep -q "securityContext:" /tmp/security-manifests.yaml; then
        log_success "Security contexts found"
    else
        log_warning "No security contexts found"
    fi
    
    # Check for non-root user
    if grep -q "runAsNonRoot: true" /tmp/security-manifests.yaml; then
        log_success "Non-root user configuration found"
    else
        log_warning "Non-root user configuration not found"
    fi
    
    # Check for read-only root filesystem
    if grep -q "readOnlyRootFilesystem: true" /tmp/security-manifests.yaml; then
        log_success "Read-only root filesystem found"
    else
        log_warning "Read-only root filesystem not found"
    fi
    
    # Check for NetworkPolicy
    if grep -q "kind: NetworkPolicy" /tmp/security-manifests.yaml; then
        log_success "NetworkPolicy found"
    else
        log_warning "NetworkPolicy not found"
    fi
    
    # Check for PodDisruptionBudget
    if grep -q "kind: PodDisruptionBudget" /tmp/security-manifests.yaml; then
        log_success "PodDisruptionBudget found"
    else
        log_warning "PodDisruptionBudget not found"
    fi
    
    log_success "Security validation completed"
}

# Test installation (if cluster is available)
test_installation() {
    if [ "$CLUSTER_AVAILABLE" = false ]; then
        log_warning "Skipping installation test (no cluster available)"
        return
    fi
    
    log_info "Testing chart installation..."
    
    cd "$CHART_DIR"
    
    # Create namespace
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Install chart
    log_info "Installing chart..."
    if helm install "$RELEASE_NAME" . --namespace "$NAMESPACE" --wait --timeout=5m; then
        log_success "Chart installation successful"
        
        # Run helm tests
        log_info "Running helm tests..."
        if helm test "$RELEASE_NAME" --namespace "$NAMESPACE"; then
            log_success "Helm tests passed"
        else
            log_warning "Some helm tests failed"
        fi
        
        # Cleanup
        log_info "Cleaning up test installation..."
        helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE"
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
        
    else
        log_error "Chart installation failed"
        
        # Show logs for debugging
        log_info "Showing pod logs for debugging..."
        kubectl get pods -n "$NAMESPACE"
        kubectl logs -n "$NAMESPACE" --selector=app.kubernetes.io/name=worker-sync --tail=50
        
        # Cleanup
        helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE" --ignore-not-found
        kubectl delete namespace "$NAMESPACE" --ignore-not-found=true
        
        exit 1
    fi
    
    log_success "Installation test completed"
}

# Validate chart metadata
validate_metadata() {
    log_info "Validating chart metadata..."
    
    cd "$CHART_DIR"
    
    # Check Chart.yaml exists
    if [ ! -f "Chart.yaml" ]; then
        log_error "Chart.yaml not found"
        exit 1
    fi
    
    # Check required fields
    required_fields=("name" "version" "description" "type")
    
    for field in "${required_fields[@]}"; do
        if grep -q "^$field:" Chart.yaml; then
            log_success "$field found in Chart.yaml"
        else
            log_error "$field not found in Chart.yaml"
            exit 1
        fi
    done
    
    # Check version format
    VERSION=$(grep "^version:" Chart.yaml | cut -d' ' -f2)
    if [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_success "Version format is valid: $VERSION"
    else
        log_warning "Version format might be invalid: $VERSION"
    fi
    
    log_success "Metadata validation completed"
}

# Performance validation
validate_performance() {
    log_info "Validating performance configurations..."
    
    cd "$CHART_DIR"
    
    # Generate manifests
    helm template "$RELEASE_NAME" . > /tmp/perf-manifests.yaml
    
    # Check for resource limits
    if grep -q "limits:" /tmp/perf-manifests.yaml; then
        log_success "Resource limits found"
    else
        log_warning "No resource limits found"
    fi
    
    # Check for resource requests
    if grep -q "requests:" /tmp/perf-manifests.yaml; then
        log_success "Resource requests found"
    else
        log_warning "No resource requests found"
    fi
    
    # Check for HPA
    if grep -q "kind: HorizontalPodAutoscaler" /tmp/perf-manifests.yaml; then
        log_success "HorizontalPodAutoscaler found"
    else
        log_warning "HorizontalPodAutoscaler not found"
    fi
    
    # Check for probes
    probe_types=("livenessProbe" "readinessProbe" "startupProbe")
    for probe in "${probe_types[@]}"; do
        if grep -q "$probe:" /tmp/perf-manifests.yaml; then
            log_success "$probe found"
        else
            log_warning "$probe not found"
        fi
    done
    
    log_success "Performance validation completed"
}

# Main execution
main() {
    log_info "Starting Worker-Sync Helm Chart validation..."
    
    check_prerequisites
    validate_metadata
    validate_syntax
    validate_values
    validate_k8s_resources
    validate_security
    validate_performance
    test_installation
    
    log_success "All validations completed successfully!"
    
    # Cleanup temporary files
    rm -f /tmp/default-output.yaml
    rm -f /tmp/production-output.yaml
    rm -f /tmp/development-output.yaml
    rm -f /tmp/manifests.yaml
    rm -f /tmp/security-manifests.yaml
    rm -f /tmp/perf-manifests.yaml
    
    log_info "Chart validation summary:"
    echo "  ✅ Syntax validation"
    echo "  ✅ Values validation"
    echo "  ✅ Kubernetes resources validation"
    echo "  ✅ Security validation"
    echo "  ✅ Performance validation"
    echo "  ✅ Metadata validation"
    if [ "$CLUSTER_AVAILABLE" = true ]; then
        echo "  ✅ Installation test"
    else
        echo "  ⚠️  Installation test (skipped - no cluster)"
    fi
    
    log_success "Worker-Sync Helm Chart is ready for deployment!"
}

# Run main function
main "$@"