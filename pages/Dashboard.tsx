
import React, { useEffect, useState } from 'react';
import { request } from '../api/client';
import { NamespaceControllers, NodeBrief } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    nodes: 0,
    pods: 0,
    deployments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [nodes, workloads] = await Promise.all([
          request<NodeBrief[]>('/k8s/get/nodes'),
          request<NamespaceControllers>('/k8s/namespaces/default/controllers')
        ]);
        
        setStats({
          nodes: nodes.length,
          pods: workloads.deployments.reduce((acc, d) => acc + d.ready, 0),
          deployments: workloads.deployments.length
        });
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { label: 'Total Nodes', value: stats.nodes, icon: 'fa-server', color: 'blue' },
    { label: 'Running Pods', value: stats.pods, icon: 'fa-cube', color: 'green' },
    { label: 'Deployments', value: stats.deployments, icon: 'fa-layer-group', color: 'purple' },
    { label: 'Cluster Health', value: 'Healthy', icon: 'fa-heartbeat', color: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-100 text-${stat.color}-600 rounded-lg flex items-center justify-center text-xl`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Statistics</span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{loading ? '...' : stat.value}</p>
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
