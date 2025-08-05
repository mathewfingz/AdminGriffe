#!/bin/bash

# Integral Audit System Deployment Script
# Automated deployment with environment-specific configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
ENVIRONMENT=${ENVIRONMENT:-"development"}
NAMESPACE=${NAMESPACE:-"audit-system"}
RELEASE_NAME=${RELEASE_NAME:-"audit-system"}
CHART_PATH=${CHART_PATH:-"./deploy/helm/audit-system"}
VALUES_FILE=""
TIMEOUT=${TIMEOUT:-"600s"}
DRY_RUN=${DRY_RUN:-"false"}
SKIP_DEPS=${SKIP_DEPS:-"false"}
FORCE_UPGRADE=${FORCE_UPGRADE:-"false"}

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy the Integral Audit System to Kubernetes

OPTIONS:
    -e, --environment ENV     Target environment (development|staging|production) [default: development]
    -n, --namespace NS        Kubernetes namespace [default: audit-system]
    -r, --release NAME        Helm release name [default: audit-system]
    -c, --chart PATH          Path to Helm chart [default: ./deploy/helm/audit-system]
    -f, --values FILE         Custom values file
    -t, --timeout DURATION    Deployment timeout [default: 600s]
    -d, --dry-run             Perform a dry run
    -s, --skip-deps           Skip dependency installation
    -F, --force               Force upgrade even if no changes
    -h, --help                Show this help message

EXAMPLES:
    # Deploy to development
    $0 -e development

    # Deploy to production with custom values
    $0 -e production -f values-prod.yaml

    # Dry run deployment
    $0 -e staging --dry-run

    # Force upgrade
    $0 -e production --force

EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -n|--namespace)
                NAMESPACE="$2"
                shift 2
                ;;
            -r|--release)
                RELEASE_NAME="$2"
                shift 2
                ;;
            -c|--chart)
                CHART_PATH="$2"
                shift 2
                ;;
            -f|--values)
                VALUES_FILE="$2"
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN="true"
                shift
                ;;
            -s|--skip-deps)
                SKIP_DEPS="true"
                shift
                ;;
            -F|--force)
                FORCE_UPGRADE="true"
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        development|staging|production)
            success "Environment: $ENVIRONMENT"
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT"
            error "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        error "Helm is not installed or not in PATH"
        exit 1
    fi
    
    # Check chart directory
    if [ ! -d "$CHART_PATH" ]; then
        error "Chart directory not found: $CHART_PATH"
        exit 1
    fi
    
    # Check values file if specified
    if [ -n "$VALUES_FILE" ] && [ ! -f "$VALUES_FILE" ]; then
        error "Values file not found: $VALUES_FILE"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Setup environment-specific values
setup_environment_values() {
    log "Setting up environment-specific values..."
    
    local env_values_file="$CHART_PATH/values-$ENVIRONMENT.yaml"
    
    if [ -z "$VALUES_FILE" ]; then
        if [ -f "$env_values_file" ]; then
            VALUES_FILE="$env_values_file"
            success "Using environment values file: $VALUES_FILE"
        else
            warning "No environment-specific values file found: $env_values_file"
            VALUES_FILE="$CHART_PATH/values.yaml"
            success "Using default values file: $VALUES_FILE"
        fi
    fi
}

# Create namespace if it doesn't exist
create_namespace() {
    log "Checking namespace: $NAMESPACE"
    
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        success "Namespace $NAMESPACE already exists"
    else
        log "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
        
        # Add labels for monitoring and security
        kubectl label namespace "$NAMESPACE" \
            app.kubernetes.io/name=audit-system \
            app.kubernetes.io/environment="$ENVIRONMENT" \
            security.policy/network-isolation=enabled \
            monitoring.coreos.com/enabled=true
        
        success "Namespace $NAMESPACE created"
    fi
}

# Install or update Helm dependencies
install_dependencies() {
    if [ "$SKIP_DEPS" = "true" ]; then
        warning "Skipping dependency installation"
        return
    fi
    
    log "Installing Helm dependencies..."
    
    cd "$CHART_PATH"
    
    if [ -f "Chart.lock" ]; then
        helm dependency update
    else
        helm dependency build
    fi
    
    cd - > /dev/null
    success "Dependencies installed"
}

# Validate Helm chart
validate_chart() {
    log "Validating Helm chart..."
    
    local helm_cmd="helm template $RELEASE_NAME $CHART_PATH"
    
    if [ -n "$VALUES_FILE" ]; then
        helm_cmd="$helm_cmd -f $VALUES_FILE"
    fi
    
    helm_cmd="$helm_cmd --namespace $NAMESPACE"
    
    if $helm_cmd > /dev/null; then
        success "Chart validation passed"
    else
        error "Chart validation failed"
        exit 1
    fi
}

# Deploy or upgrade the application
deploy_application() {
    log "Deploying Audit System..."
    
    local helm_cmd="helm upgrade --install $RELEASE_NAME $CHART_PATH"
    helm_cmd="$helm_cmd --namespace $NAMESPACE"
    helm_cmd="$helm_cmd --timeout $TIMEOUT"
    helm_cmd="$helm_cmd --wait"
    
    if [ -n "$VALUES_FILE" ]; then
        helm_cmd="$helm_cmd -f $VALUES_FILE"
    fi
    
    # Environment-specific settings
    helm_cmd="$helm_cmd --set global.environment=$ENVIRONMENT"
    
    if [ "$DRY_RUN" = "true" ]; then
        helm_cmd="$helm_cmd --dry-run"
        log "Performing dry run..."
    fi
    
    if [ "$FORCE_UPGRADE" = "true" ]; then
        helm_cmd="$helm_cmd --force"
        warning "Force upgrade enabled"
    fi
    
    # Execute deployment
    if $helm_cmd; then
        if [ "$DRY_RUN" = "true" ]; then
            success "Dry run completed successfully"
        else
            success "Deployment completed successfully"
        fi
    else
        error "Deployment failed"
        exit 1
    fi
}

# Wait for deployment to be ready
wait_for_deployment() {
    if [ "$DRY_RUN" = "true" ]; then
        return
    fi
    
    log "Waiting for deployment to be ready..."
    
    # Wait for pods to be ready
    local components=("api-gateway" "sync-worker")
    
    for component in "${components[@]}"; do
        log "Waiting for $component to be ready..."
        
        if kubectl wait --for=condition=Available \
            deployment/"$RELEASE_NAME-$component" \
            -n "$NAMESPACE" \
            --timeout="$TIMEOUT"; then
            success "$component is ready"
        else
            error "$component failed to become ready"
            kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/component="$component"
            exit 1
        fi
    done
    
    # Wait for init job to complete
    if kubectl get job "$RELEASE_NAME-init" -n "$NAMESPACE" &> /dev/null; then
        log "Waiting for initialization job to complete..."
        if kubectl wait --for=condition=Complete \
            job/"$RELEASE_NAME-init" \
            -n "$NAMESPACE" \
            --timeout="$TIMEOUT"; then
            success "Initialization completed"
        else
            warning "Initialization job did not complete within timeout"
        fi
    fi
}

# Run post-deployment checks
post_deployment_checks() {
    if [ "$DRY_RUN" = "true" ]; then
        return
    fi
    
    log "Running post-deployment checks..."
    
    # Check pod status
    local failed_pods=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" --no-headers | grep -v Running | grep -v Completed | wc -l)
    
    if [ "$failed_pods" -eq 0 ]; then
        success "All pods are running"
    else
        warning "$failed_pods pod(s) are not in Running state"
        kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    fi
    
    # Check services
    local service_count=$(kubectl get services -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" --no-headers | wc -l)
    success "$service_count service(s) deployed"
    
    # Check HPA
    if kubectl get hpa -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        success "HPA is configured"
    else
        warning "HPA not found"
    fi
}

# Display deployment information
show_deployment_info() {
    if [ "$DRY_RUN" = "true" ]; then
        return
    fi
    
    log "Deployment Information"
    log "====================="
    
    echo ""
    echo "Release Information:"
    helm status "$RELEASE_NAME" -n "$NAMESPACE"
    
    echo ""
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    echo ""
    echo "Services:"
    kubectl get services -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME"
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE" -l app.kubernetes.io/instance="$RELEASE_NAME" || echo "No ingress found"
    
    echo ""
    echo "To access the application:"
    echo "  kubectl port-forward -n $NAMESPACE service/$RELEASE_NAME-api-gateway 8080:80"
    echo "  Then visit: http://localhost:8080"
    echo ""
    echo "API Documentation: http://localhost:8080/api/docs"
    echo "Health Check: http://localhost:8080/health"
    echo "Metrics: http://localhost:8080/metrics"
    
    echo ""
    echo "To view logs:"
    echo "  kubectl logs -n $NAMESPACE -l app.kubernetes.io/component=api-gateway -f"
    echo "  kubectl logs -n $NAMESPACE -l app.kubernetes.io/component=sync-worker -f"
    
    echo ""
    echo "To run validation:"
    echo "  ./scripts/validate-audit-system.sh"
}

# Cleanup on failure
cleanup_on_failure() {
    if [ "$?" -ne 0 ] && [ "$DRY_RUN" != "true" ]; then
        error "Deployment failed. Checking for partial deployment..."
        
        if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
            warning "Partial deployment detected. You may want to run:"
            echo "  helm rollback $RELEASE_NAME -n $NAMESPACE"
            echo "  or"
            echo "  helm uninstall $RELEASE_NAME -n $NAMESPACE"
        fi
    fi
}

# Main deployment function
main() {
    # Set up error handling
    trap cleanup_on_failure EXIT
    
    log "Starting Audit System Deployment"
    log "================================"
    log "Environment: $ENVIRONMENT"
    log "Namespace: $NAMESPACE"
    log "Release: $RELEASE_NAME"
    log "Chart: $CHART_PATH"
    log "Values: ${VALUES_FILE:-"default"}"
    log "Dry Run: $DRY_RUN"
    
    # Deployment steps
    validate_environment
    check_prerequisites
    setup_environment_values
    create_namespace
    install_dependencies
    validate_chart
    deploy_application
    wait_for_deployment
    post_deployment_checks
    show_deployment_info
    
    # Remove error trap on success
    trap - EXIT
    
    if [ "$DRY_RUN" = "true" ]; then
        success "Dry run completed successfully!"
    else
        success "Audit System deployed successfully!"
        success "Run './scripts/validate-audit-system.sh' to validate the deployment"
    fi
}

# Parse arguments and run main function
parse_args "$@"
main