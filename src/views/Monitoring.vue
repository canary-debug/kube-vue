<template>
  <div class="monitoring-page">
    <div class="page-header">
      <h2>监控工具</h2>
      <p class="subtitle">Prometheus 监控全家桶管理</p>
    </div>

    <div class="monitoring-cards">
      <div class="monitor-card prometheus" @click="openInNewTab(prometheusUrl)">
        <div class="card-icon">
          <Database :size="48" />
        </div>
        <div class="card-info">
          <h3>Prometheus</h3>
          <p>开源监控系统</p>
          <code>{{ prometheusUrl }}</code>
        </div>
        <div class="card-arrow">
          <ArrowRight :size="24" />
        </div>
      </div>

      <div class="monitor-card grafana" @click="openInNewTab(grafanaUrl)">
        <div class="card-icon">
          <BarChart3 :size="48" />
        </div>
        <div class="card-info">
          <h3>Grafana</h3>
          <p>可视化监控平台</p>
          <code>{{ grafanaUrl }}</code>
        </div>
        <div class="card-arrow">
          <ArrowRight :size="24" />
        </div>
      </div>

      <div class="monitor-card alertmanager" @click="openInNewTab(alertmanagerUrl)">
        <div class="card-icon">
          <Bell :size="48" />
        </div>
        <div class="card-info">
          <h3>AlertManager</h3>
          <p>告警管理系统</p>
          <code>{{ alertmanagerUrl }}</code>
        </div>
        <div class="card-arrow">
          <ArrowRight :size="24" />
        </div>
      </div>
    </div>

    <div class="info-section">
      <h3>工具说明</h3>
      <div class="info-grid">
        <div class="info-card">
          <Database :size="24" class="info-icon" />
          <h4>Prometheus</h4>
          <ul>
            <li>指标采集与存储</li>
            <li>强大的查询语言 PromQL</li>
            <li>多维度数据模型</li>
            <li>高效的时间序列存储</li>
          </ul>
        </div>
        <div class="info-card">
          <BarChart3 :size="24" class="info-icon" />
          <h4>Grafana</h4>
          <ul>
            <li>丰富的图表类型</li>
            <li>灵活的仪表盘配置</li>
            <li>支持多种数据源</li>
            <li>告警规则管理</li>
          </ul>
        </div>
        <div class="info-card">
          <Bell :size="24" class="info-icon" />
          <h4>AlertManager</h4>
          <ul>
            <li>告警分组与抑制</li>
            <li>多渠道通知</li>
            <li>静默规则配置</li>
            <li>灵活的路由配置</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Database, BarChart3, Bell, ArrowRight } from 'lucide-vue-next'

const prometheusUrl = import.meta.env.VITE_PROMETHEUS_URL
const grafanaUrl = import.meta.env.VITE_GRAFANA_URL
const alertmanagerUrl = import.meta.env.VITE_ALERTMANAGER_URL

function openInNewTab(url: string) {
  window.open(url, '_blank')
}
</script>

<style scoped>
.monitoring-page {
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.monitoring-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.monitor-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.monitor-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.monitor-card.prometheus::before {
  background: linear-gradient(180deg, #e6522c, #fc6d3d);
}

.monitor-card.grafana::before {
  background: linear-gradient(180deg, #f46800, #ffa500);
}

.monitor-card.alertmanager::before {
  background: linear-gradient(180deg, #723csf, #9b59b6);
}

.monitor-card:hover {
  transform: translateX(8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.monitor-card.prometheus:hover {
  border-color: #e6522c;
}

.monitor-card.grafana:hover {
  border-color: #f46800;
}

.monitor-card.alertmanager:hover {
  border-color: #723csf;
}

.card-icon {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.monitor-card.prometheus .card-icon {
  background: linear-gradient(135deg, #fff5f2, #ffe4dd);
  color: #e6522c;
}

.monitor-card.grafana .card-icon {
  background: linear-gradient(135deg, #fffaf0, #fff3cd);
  color: #f46800;
}

.monitor-card.alertmanager .card-icon {
  background: linear-gradient(135deg, #f8f0fc, #f3e5f5);
  color: #723csf;
}

.card-info {
  flex: 1;
}

.card-info h3 {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
}

.card-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.card-info code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #4f46e5;
  background: #f5f3ff;
  padding: 4px 8px;
  border-radius: 4px;
}

.card-arrow {
  color: #9ca3af;
  transition: all 0.3s;
}

.monitor-card:hover .card-arrow {
  color: #4f46e5;
  transform: translateX(4px);
}

.info-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.info-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.info-card {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.info-icon {
  color: #4f46e5;
  margin-bottom: 12px;
}

.info-card h4 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.info-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-card li {
  font-size: 13px;
  color: #6b7280;
  padding: 6px 0;
  padding-left: 16px;
  position: relative;
}

.info-card li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4f46e5;
}

@media (max-width: 768px) {
  .monitor-card {
    flex-direction: column;
    text-align: center;
  }

  .card-arrow {
    display: none;
  }

  .monitor-card:hover {
    transform: translateY(-4px);
  }
}
</style>
