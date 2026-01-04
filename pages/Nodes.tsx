
import React, { useEffect, useState } from 'react';
import { request } from '../utils/client';
import { NodeBrief } from '../types';

const Nodes: React.FC = () => {
  const [nodes, setNodes] = useState<NodeBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request<NodeBrief[]>('/k8s/get/nodes')
      .then(setNodes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h2 className="text-lg font-semibold text-slate-800">Cluster Nodes</h2>
        <button 
          onClick={() => { setLoading(true); request<NodeBrief[]>('/k8s/get/nodes').then(setNodes).finally(() => setLoading(false)); }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2"
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Resources (CPU/MEM)</th>
              <th className="px-6 py-4 font-semibold">Taints</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading nodes...</p>
                </td>
              </tr>
            ) : nodes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No nodes found</td>
              </tr>
            ) : (
              nodes.map((node) => (
                <tr key={node.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                        <i className="fas fa-server text-sm"></i>
                      </div>
                      <span className="font-medium text-slate-800">{node.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      node.status === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 capitalize">{node.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex gap-4">
                      <span><i className="fas fa-microchip mr-1 opacity-50"></i>{node.cpu} vCPU</span>
                      <span><i className="fas fa-memory mr-1 opacity-50"></i>{node.memory}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {node.taints.length > 0 ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                        {node.taints.length} Taints
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">View Details</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Nodes;
