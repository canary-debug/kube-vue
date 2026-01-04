
import React, { useEffect, useState } from 'react';
import { request } from '../utils/client';
import { NamespaceControllers, ControllerResource } from '../types';

const Workloads: React.FC = () => {
  const [data, setData] = useState<NamespaceControllers | null>(null);
  const [namespace, setNamespace] = useState('default');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deployments' | 'statefulsets' | 'daemonsets'>('deployments');

  const fetchData = async (ns: string) => {
    setLoading(true);
    try {
      const result = await request<NamespaceControllers>(`/k8s/namespaces/${ns}/controllers`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(namespace);
  }, [namespace]);

  const resources = data ? data[activeTab] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Namespace:</label>
          <select 
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="default">default</option>
            <option value="kube-system">kube-system</option>
            <option value="ingress-nginx">ingress-nginx</option>
          </select>
        </div>
        
        <div className="flex p-1 bg-slate-200 rounded-lg">
          {(['deployments', 'statefulsets', 'daemonsets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Resource Name</th>
                <th className="px-6 py-4 font-semibold">Images</th>
                <th className="px-6 py-4 font-semibold">Status (Ready/Total)</th>
                <th className="px-6 py-4 font-semibold">Ports</th>
                <th className="px-6 py-4 font-semibold">Age</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                    <p>Loading {activeTab}...</p>
                  </td>
                </tr>
              ) : resources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No {activeTab} found in this namespace</td>
                </tr>
              ) : (
                resources.map((item: ControllerResource, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{item.name}</td>
                    <td className="px-6 py-4">
                      {item.images.map((img, i) => (
                        <div key={i} className="text-xs text-slate-500 truncate max-w-[200px]" title={img}>
                          {img}
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                          <div 
                            className={`h-full ${item.ready === item.replicas ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${(item.ready / (item.replicas || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          {item.ready}/{item.replicas}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.port ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">{item.port}</span> : '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors text-sm">Restart</button>
                      <button className="text-slate-400 hover:text-red-600 px-3 py-1 rounded transition-colors"><i className="fas fa-ellipsis-v"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Workloads;
