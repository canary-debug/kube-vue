
import React, { useEffect, useState } from 'react';
import { request } from '../utils/client';
import { NamespaceControllers, NodeBrief, NodeCountResponse, PodCountResponse, ClusterHealthResponse, EtcdStatus, EtcdStatusResponse } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    nodes: 0,
    pods: 0,
    deployments: 0,
  });
  const [clusterHealth, setClusterHealth] = useState<{
    status: string;
    reason?: string;
    details?: {
      unhealthy_pods: number;
      crash_pods: number;
      dns_active: boolean;
    };
  }>({
    status: 'Healthy'
  });
  const [etcdStatuses, setEtcdStatuses] = useState<EtcdStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // 天气相关状态
  const [weather, setWeather] = useState({
    temp: 0,
    dressing: '',
    dressing_detail: ''
  });
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        console.log('🚀 Starting dashboard data fetch...');
        
        // 直接调用fetch，不使用request工具，以排除工具函数的问题
        const token = localStorage.getItem('k8s_token');
        const healthUrl = 'http://localhost:9000/api/k8s/get/cluster_healthz';
        console.log('📞 Direct API call to:', healthUrl);
        console.log('🔑 Token available:', !!token);
        
        const healthResponse = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Health API response status:', healthResponse.status);
        console.log('📊 Health API response ok:', healthResponse.ok);
        
        const healthText = await healthResponse.text();
        console.log('📦 Raw health API response text:', healthText);
        
        // 解析健康数据
        const healthData = JSON.parse(healthText);
        console.log('📋 Parsed health data:', healthData);
        
        // 更新集群健康状态
        if (healthData && typeof healthData === 'object') {
          setClusterHealth({
            status: healthData.status || 'Healthy',
            reason: healthData.reason,
            details: healthData.details
          });
          console.log('📊 Updated cluster health:', healthData.status);
        }
        
        // 获取其他数据，包括ETCD状态和天气信息
        const [nodeData, podData, etcdResponse, weatherResponse] = await Promise.all([
          request<{ node_len: number }>('/k8s/get/nodes/len'),
          request<{ pod_count: number }>('/k8s/get/pods/len'),
          fetch('http://localhost:9000/api/k8s/etcd/status', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('http://localhost:9000/api/k8s/weather', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);
        
        console.log('📦 Node count API response:', nodeData);
        console.log('📦 Pod count API response:', podData);
        
        // 处理ETCD响应
        console.log('📊 ETCD API response status:', etcdResponse.status);
        const etcdText = await etcdResponse.text();
        console.log('📦 Raw ETCD API response text:', etcdText);
        const etcdData = JSON.parse(etcdText);
        console.log('📋 Parsed ETCD data:', etcdData);
        
        // 更新ETCD状态
        if (etcdData && Array.isArray(etcdData.data)) {
          setEtcdStatuses(etcdData.data);
          console.log('📊 Updated ETCD statuses:', etcdData.data.length, 'nodes');
        }
        
        // 处理天气响应
        console.log('📊 Weather API response status:', weatherResponse.status);
        const weatherText = await weatherResponse.text();
        console.log('📦 Raw weather API response text:', weatherText);
        const weatherData = JSON.parse(weatherText);
        console.log('📋 Parsed weather data:', weatherData);
        
        // 更新天气状态
        if (weatherData && weatherData.code === 200 && weatherData.data) {
          setWeather({
            temp: weatherData.data.temp || 0,
            dressing: weatherData.data.dressing || '',
            dressing_detail: weatherData.data.dressing_detail || ''
          });
          console.log('📊 Updated weather data:', weatherData.data);
        }
        setWeatherLoading(false);
        
        // 提取节点数量
        let nodeCount = 0;
        if (nodeData && typeof nodeData === 'object') {
          if ('node_len' in nodeData) {
            nodeCount = parseInt(nodeData.node_len as unknown as string, 10);
            console.log('📊 Extracted node count:', nodeCount);
          }
        }
        
        // 提取Pod数量
        let podCount = 0;
        if (podData && typeof podData === 'object') {
          if ('pod_count' in podData) {
            podCount = parseInt(podData.pod_count as unknown as string, 10);
            console.log('📊 Extracted pod count:', podCount);
          }
        }
        
        console.log('📊 Final stats:', {
          nodes: nodeCount,
          pods: podCount,
          deployments: 0 // Deployments暂时设置为0，后续可添加真实数据获取
        });
        
        // 更新状态
        setStats({
          nodes: nodeCount,
          pods: podCount,
          deployments: 0
        });
        
        console.log('✅ Dashboard stats updated successfully');
      } catch (err) {
        console.error('❌ Error fetching dashboard data:', err);
        console.error('🔍 Error name:', err.name);
        console.error('🔍 Error message:', err.message);
        console.error('🔍 Error stack:', err.stack);
        // 错误时设置默认值
        setStats({
          nodes: 0,
          pods: 0,
          deployments: 0
        });
        // 设置错误状态
        setClusterHealth({
          status: 'Error',
          reason: err.message,
          details: {
            unhealthy_pods: 0,
            crash_pods: 0,
            dns_active: false
          }
        });
      } finally {
        setLoading(false);
        console.log('🔚 Dashboard data fetch completed');
      }
    };
    fetchDashboardData();
  }, []);

  // 定义哪些状态被视为不健康
  const isUnhealthy = clusterHealth.status !== 'Healthy';
  
  // 计算健康的ETCD节点数量
  const healthyEtcdNodes = etcdStatuses.filter(node => node.healthy).length;
  const totalEtcdNodes = etcdStatuses.length;
  
  const statCards = [
    { label: 'Total Nodes', value: stats.nodes, icon: 'fa-server', color: 'blue' },
    { label: 'Running Pods', value: stats.pods, icon: 'fa-cube', color: 'green' },
    { 
      label: 'ETCD Status', 
      value: `${healthyEtcdNodes}/${totalEtcdNodes} Healthy`, 
      icon: 'fa-database', 
      color: healthyEtcdNodes === totalEtcdNodes ? 'emerald' : 'red',
      hasTooltip: totalEtcdNodes > 0, // 只有当有ETCD节点时显示tooltip
      etcdStatuses: etcdStatuses // 传递ETCD状态数据
    },
    { 
      label: 'Cluster Health', 
      value: clusterHealth.status, 
      // 根据健康状态动态设置图标和颜色
      icon: isUnhealthy ? 'fa-heart-crack' : 'fa-heartbeat', 
      color: isUnhealthy ? 'red' : 'emerald',
      hasTooltip: isUnhealthy // 只有在不健康状态下显示tooltip
    },
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎信息和天气显示 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">早安，管理员，请开始一天的工作吧</h1>
            <p className="text-sm text-slate-500 mt-1">
              今日温度 {weatherLoading ? '...' : `${weather.temp}°C`}，{weatherLoading ? '正在获取天气信息...' : weather.dressing}。
              {!weatherLoading && weather.dressing_detail}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-lg">
            <div className="text-3xl text-blue-600">
              <i className="fas fa-sun"></i>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {weatherLoading ? '...' : `${weather.temp}°C`}
              </div>
              <div className="text-sm text-slate-500">
                {weatherLoading ? 'Loading...' : weather.dressing}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div 
                className={`w-12 h-12 bg-${stat.color}-100 text-${stat.color}-600 rounded-lg flex items-center justify-center text-xl relative`}
                onMouseEnter={() => stat.hasTooltip && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <i className={`fas ${stat.icon}`}></i>
                {/* 显示问号图标 */}
                {stat.hasTooltip && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-${stat.color}-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    ?
                  </span>
                )}
                {/* Tooltip显示详细信息 */}
                {stat.hasTooltip && showTooltip && (
                  <div className="absolute -right-60 top-14 z-50 w-56 bg-slate-800 text-white p-3 rounded-lg shadow-xl text-sm">
                    {/* 根据卡片类型显示不同的tooltip内容 */}
                    {stat.label === 'Cluster Health' ? (
                      // 集群健康状态的tooltip
                      <>
                        <h4 className="font-semibold text-red-400 mb-2">Cluster {clusterHealth.status}</h4>
                        <p className="mb-2 text-sm">{clusterHealth.reason}</p>
                        {clusterHealth.details && (
                          <div className="space-y-1">
                            <p>Unhealthy Pods: {clusterHealth.details.unhealthy_pods}</p>
                            <p>Crash Loop Pods: {clusterHealth.details.crash_pods}</p>
                            <p>DNS Active: {clusterHealth.details.dns_active ? 'Yes' : 'No'}</p>
                          </div>
                        )}
                      </>
                    ) : stat.label === 'ETCD Status' ? (
                      // ETCD状态的tooltip
                      <>
                        <h4 className="font-semibold text-red-400 mb-2">ETCD Nodes</h4>
                        <div className="space-y-2">
                          {stat.etcdStatuses.map((node, idx) => (
                            <div key={idx} className="border-b border-slate-700 pb-2 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{node.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${node.healthy ? 'bg-green-600' : 'bg-red-600'}`}>
                                  {node.healthy ? 'Healthy' : 'Unhealthy'}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>IP: {node.ip || '-'}</span>
                                {node.message && <span className="text-red-400">{node.message}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statistics</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className={`text-2xl font-bold mt-1 ${isUnhealthy ? 'text-red-600' : 'text-slate-800'}`}>
              {loading ? '...' : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <i className="fas fa-plus-circle text-2xl text-slate-400 group-hover:text-blue-500 mb-2"></i>
              <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600">Deploy New App</span>
            </button>
            <button className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <i className="fas fa-file-upload text-2xl text-slate-400 group-hover:text-blue-500 mb-2"></i>
              <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600">Upload YAML</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Events Log</h2>
          <div className="space-y-4">
            {[
              { type: 'Normal', reason: 'ScalingReplicaSet', msg: 'Scaled up replica set...', time: '2m' },
              { type: 'Warning', reason: 'Unhealthy', msg: 'Liveness probe failed...', time: '10m' },
              { type: 'Normal', reason: 'Created', msg: 'Created pod nginx-pod-xyz', time: '15m' },
            ].map((ev, i) => (
              <div key={i} className="flex gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border-l-4 border-blue-400">
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm text-slate-800">{ev.reason}</span>
                    <span className="text-xs text-slate-400">{ev.time} ago</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">{ev.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
