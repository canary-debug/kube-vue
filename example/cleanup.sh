#!/bin/bash

# Kube-Vue 清理脚本

set -e

NAMESPACE="kube-vue-system"

echo "=========================================="
echo "  Kube-Vue 清理脚本"
echo "=========================================="
echo ""

# 检查 namespace 是否存在
if kubectl get namespace ${NAMESPACE} &> /dev/null; then
    echo "正在删除 ${NAMESPACE} 命名空间..."
    kubectl delete namespace ${NAMESPACE}
    echo "✓ 命名空间已删除"
else
    echo "命名空间 ${NAMESPACE} 不存在，无需清理"
fi

echo ""
echo "=========================================="
echo "  清理完成!"
echo "=========================================="
