#!/bin/bash

# Worker-Sync Helm Chart Installation Script
# This script automates the installation of the Worker-Sync Helm chart

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
CHART_DIR="$(dirname "$0")"
CHART_NAME="worker-sync"
NAMESPACE="worker-sync"
RELEASE_NAME="worker-sync"
VALUES_FILE=""
ENVIRONMENT="development"
DRY_RUN=false
WAIT=true
TIMEOUT="10m"
CREATE_NAMESPACE=true
UPGRADE=false
FORCE=false

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

show_help() {
    cat << EOF
Worker-Sync Helm Chart Installation Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -n, --namespace NAME    Kubernetes namespace (default: worker-sync)
    -r, --release NAME      Helm release name (default: worker-sync)
    -f, --values FILE       Values file to use
    -e, --environment ENV   Environment (development|production) (default: development)
    -d, --dry-run          Perform a dry run
    -w, --no-wait          Don't wait for deployment to be ready
    -t, --timeout DURATION Timeout for deployment (default: 10m)
    --no-create-namespace  Don't create namespace if it doesn't exist
    --upgrade              Upgrade existing release
    --force                Force upgrade even if there are no changes

Examples:
    $0                                          # Install with default settings
    $0 -e production                           # Install for production
    $0 -f custom-values.yaml                   # Install with custom values
    $0 -n my-namespace -r my-release          # Install with custom namespace and release name
    $0 --dry-run                              # Perform dry run
    $0 --upgrade                              # Upgrade existing installation

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -f|--values)
                VALUES_FILE="$2"
                shift 2
                ;;
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -w|--no-wait)
                WAIT=false
                shift
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --no-create-namespace)
                CREATE_NAMESPACE=false
                shift
                ;;
            --upgrade)
                UPGRADE=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
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
        log_error "Not connected to a Kubernetes cluster. Please configure kubectl first."
        exit 1
    fi
    
    log_info "Connected to cluster: $(kubectl config current-context)"
    
    log_success "Prerequisites check completed"
}

# Validate chart
validate_chart() {
    log_info "Validating chart..."
    
    cd "$CHART_DIR"
    
    # Check if Chart.yaml exists
    if [ ! -f "Chart.yaml" ]; then
        log_error "Chart.yaml not found in $CHART_DIR"
        exit 1
    fi
    
    # Helm lint
    if ! helm lint .; then
        log_error "Chart validation failed"
        exit 1
    fi
    
    log_success "Chart validation completed"
}

# Set values file based on environment
set_values_file() {
    if [ -z "$VALUES_FILE" ]; then
        case $ENVIRONMENT in
            production)
                if [ -f "$CHART_DIR/values-production.yaml" ]; then
                    VALUES_FILE="values-production.yaml"
                    log_info "Using production values file"
                else
                    log_warning "Production values file not found, using default values"
                fi
                ;;
            development)
                if [ -f "$CHART_DIR/values-development.yaml" ]; then
                    VALUES_FILE="values-development.yaml"
                    log_info "Using development values file"
                else
                    log_warning "Development values file not found, using default values"
                fi
                ;;
            *)
                log_warning "Unknown environment: $ENVIRONMENT, using default values"
                ;;
        esac
    else
        if [ ! -f "$CHART_DIR/$VALUES_FILE" ]; then
            log_error "Values file not found: $VALUES_FILE"
            exit 1
        fi
        log_info "Using custom values file: $VALUES_FILE"
    fi
}

# Create namespace if needed
create_namespace() {
    if [ "$CREATE_NAMESPACE" = true ]; then
        if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
            log_info "Creating namespace: $NAMESPACE"
            kubectl create namespace "$NAMESPACE"
        else
            log_info "Namespace already exists: $NAMESPACE"
        fi
    fi
}

# Check if release exists
check_release_exists() {
    if helm list -n "$NAMESPACE" | grep -q "^$RELEASE_NAME"; then
        return 0
    else
        return 1
    fi
}

# Install or upgrade chart
install_chart() {
    cd "$CHART_DIR"
    
    # Build helm command
    HELM_CMD="helm"
    
    if check_release_exists; then
        if [ "$UPGRADE" = true ]; then
            HELM_CMD="$HELM_CMD upgrade"
            log_info "Upgrading existing release: $RELEASE_NAME"
        else
            log_error "Release $RELEASE_NAME already exists in namespace $NAMESPACE"
            log_info "Use --upgrade flag to upgrade existing release"
            exit 1
        fi
    else
        HELM_CMD="$HELM_CMD install"
        log_info "Installing new release: $RELEASE_NAME"
    fi
    
    HELM_CMD="$HELM_CMD $RELEASE_NAME ."
    HELM_CMD="$HELM_CMD --namespace $NAMESPACE"
    
    if [ "$CREATE_NAMESPACE" = true ]; then
        HELM_CMD="$HELM_CMD --create-namespace"
    fi
    
    if [ -n "$VALUES_FILE" ]; then
        HELM_CMD="$HELM_CMD --values $VALUES_FILE"
    fi
    
    if [ "$DRY_RUN" = true ]; then
        HELM_CMD="$HELM_CMD --dry-run"
        log_info "Performing dry run..."
    fi
    
    if [ "$WAIT" = true ] && [ "$DRY_RUN" = false ]; then
        HELM_CMD="$HELM_CMD --wait --timeout $TIMEOUT"
    fi
    
    if [ "$FORCE" = true ] && [ "$UPGRADE" = true ]; then
        HELM_CMD="$HELM_CMD --force"
    fi
    
    # Execute helm command
    log_info "Executing: $HELM_CMD"
    
    if eval "$HELM_CMD"; then
        if [ "$DRY_RUN" = false ]; then
            log_success "Chart installation/upgrade completed successfully"
        else
            log_success "Dry run completed successfully"
        fi
    else
        log_error "Chart installation/upgrade failed"
        exit 1
    fi
}

# Show post-installation information
show_post_install_info() {
    if [ "$DRY_RUN" = true ]; then
        return
    fi
    
    log_info "Post-installation information:"
    
    # Show release status
    helm status "$RELEASE_NAME" -n "$NAMESPACE"
    
    # Show pods
    log_info "Pods in namespace $NAMESPACE:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    # Show services
    log_info "Services in namespace $NAMESPACE:"
    kubectl get svc -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    # Show ingress if exists
    if kubectl get ingress -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" &> /dev/null; then
        log_info "Ingress in namespace $NAMESPACE:"
        kubectl get ingress -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    fi
    
    # Show notes
    log_info "Getting application notes..."
    helm get notes "$RELEASE_NAME" -n "$NAMESPACE"
}

# Run tests
run_tests() {
    if [ "$DRY_RUN" = true ]; then
        return
    fi
    
    log_info "Running Helm tests..."
    
    if helm test "$RELEASE_NAME" -n "$NAMESPACE"; then
        log_success "All tests passed"
    else
        log_warning "Some tests failed. Check the test pod logs for details."
        
        # Show test pod logs
        log_info "Test pod logs:"
        kubectl logs -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME",app.kubernetes.io/component=test --tail=50
    fi
}

# Monitor deployment
monitor_deployment() {
    if [ "$DRY_RUN" = true ] || [ "$WAIT" = false ]; then
        return
    fi
    
    log_info "Monitoring deployment status..."
    
    # Wait for deployment to be ready
    if kubectl wait --for=condition=available deployment -l app.kubernetes.io/instance="$RELEASE_NAME" -n "$NAMESPACE" --timeout="$TIMEOUT"; then
        log_success "Deployment is ready"
    else
        log_warning "Deployment is not ready within timeout"
        
        # Show pod status
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
        
        # Show recent events
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -10
    fi
}

# Cleanup on failure
cleanup_on_failure() {
    if [ "$DRY_RUN" = true ]; then
        return
    fi
    
    log_warning "Installation failed. Cleaning up..."
    
    # Uninstall release if it was created
    if check_release_exists; then
        log_info "Uninstalling release: $RELEASE_NAME"
        helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
    fi
    
    # Delete namespace if it was created and is empty
    if [ "$CREATE_NAMESPACE" = true ]; then
        RESOURCE_COUNT=$(kubectl get all -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
        if [ "$RESOURCE_COUNT" -eq 0 ]; then
            log_info "Deleting empty namespace: $NAMESPACE"
            kubectl delete namespace "$NAMESPACE"
        fi
    fi
}

# Main execution
main() {
    log_info "Starting Worker-Sync Helm Chart installation..."
    
    # Set up error handling
    trap cleanup_on_failure ERR
    
    parse_args "$@"
    check_prerequisites
    validate_chart
    set_values_file
    create_namespace
    install_chart
    monitor_deployment
    show_post_install_info
    run_tests
    
    log_success "Worker-Sync installation completed successfully!"
    
    # Show useful commands
    log_info "Useful commands:"
    echo "  View pods:     kubectl get pods -n $NAMESPACE"
    echo "  View logs:     kubectl logs -f deployment/$RELEASE_NAME -n $NAMESPACE"
    echo "  Port forward:  kubectl port-forward svc/$RELEASE_NAME 3000:3000 -n $NAMESPACE"
    echo "  Uninstall:     helm uninstall $RELEASE_NAME -n $NAMESPACE"
    echo "  Upgrade:       $0 --upgrade"
}

# Run main function
main "$@"