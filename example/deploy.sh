#!/bin/bash

# Kube-Vue 一键部署脚本

set -e

NAMESPACE="kube-vue-system"
DEPLOYMENT_NAME="kube-vue"

echo "=========================================="
echo "  Kube-Vue Kubernetes 部署脚本"
echo "=========================================="

# 检查 kubectl
if ! command -v kubectl &> /dev/null; then
    echo "错误: kubectl 未安装或不在 PATH 中"
    exit 1
fi

# 检查 kubectl 连接
if ! kubectl cluster-info &> /dev/null; then
    echo "错误: 无法连接到 Kubernetes 集群"
    exit 1
fi

echo ""
echo "步骤 1: 创建命名空间..."
kubectl apply -f kube-vue-namespace.yaml
echo "✓ 命名空间已创建"

echo ""
echo "步骤 2: 部署应用..."
kubectl apply -f kube-vue-deployment.yaml
echo "✓ Deployment 已部署"

echo ""
echo "步骤 3: 部署服务..."
kubectl apply -f kube-vue-service.yaml
echo "✓ Service 已部署"

echo ""
echo "步骤 4: 部署 Ingress（可选）..."
read -p "是否部署 Ingress? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl apply -f kube-vue-ingress.yaml
    echo "✓ Ingress 已部署"
fi

echo ""
echo "步骤 5: 等待 Pod 就绪..."
kubectl wait --for=condition=ready pod -l app=${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=120s
echo "✓ 应用已就绪"

echo ""
echo "=========================================="
echo "  部署完成!"
echo "=========================================="
echo ""
echo "查看部署状态:"
echo "  kubectl get pods -n ${NAMESPACE}"
echo "  kubectl get svc -n ${NAMESPACE}"
echo ""
echo "访问应用:"
echo "  kubectl port-forward -n ${NAMESPACE} svc/${DEPLOYMENT_NAME} 8080:80"
echo "  然后访问 http://localhost:8080"
echo ""
