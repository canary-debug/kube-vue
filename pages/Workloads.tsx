
import React, { useEffect, useState } from 'react';
import { request } from '../utils/client';
import { NamespaceControllers, ControllerResource, NamespaceListResponse, NamespaceControllersResponse } from '../types';

const Workloads: React.FC = () => {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [data, setData] = useState<NamespaceControllers | null>(null);
  const [loading, setLoading] = useState(true);
  const [namespaceLoading, setNamespaceLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deployments' | 'statefulsets' | 'daemonsets'>('deployments');

  const fetchNamespaces = async () => {
    setNamespaceLoading(true);
    console.log('🚀 Starting namespace fetch...');
    console.log('🔑 Token available:', !!localStorage.getItem('k8s_token'));
    console.log('📋 Current namespaces state before fetch:', namespaces);
    
    try {
      const apiUrl = '/k8s/get/namespaces/namespacename';
      console.log('🔗 Making request to:', apiUrl);
      
      const response = await request<NamespaceListResponse>(apiUrl);
      console.log('📦 Raw API response:', response);
      console.log('📊 Response type:', typeof response);
      console.log('🔑 Response keys:', Object.keys(response || {}));
      console.log('🔍 Detailed response inspection:');
      console.log('  - Has namespaces property:', response && 'namespaces' in response);
      console.log('  - Namespaces value:', response?.namespaces);
      console.log('  - Is array check:', Array.isArray(response?.namespaces));
      console.log('  - Namespaces length:', response?.namespaces?.length);
      
      // 检查API响应格式
      if (response && Array.isArray(response.namespaces)) {
        console.log('Successfully fetched namespaces:', response.namespaces);
        setNamespaces(response.namespaces);
        
        // 更新选中的命名空间，如果当前选中的命名空间不在列表中
        if (response.namespaces.length > 0) {
          if (!response.namespaces.includes(selectedNamespace)) {
            console.log(`Updating selected namespace from ${selectedNamespace} to ${response.namespaces[0]}`);
            setSelectedNamespace(response.namespaces[0]);
          }
        } else {
          console.warn('No namespaces found from API');
          // 如果API返回空数组，设置一个默认命名空间
          setNamespaces(['default']);
        }
      } else {
        console.error('Invalid response format for namespaces');
        console.log('Response structure:', JSON.stringify(response, null, 2));
        console.log('Expected format: { namespaces: string[] }');
        console.log('Actual response has namespaces property:', response && 'namespaces' in response);
        setNamespaces(['default']);
      }
    } catch (err) {
      console.error('Failed to fetch namespaces:', err);
      // 发生错误时设置默认命名空间
      setNamespaces(['default']);
      setSelectedNamespace('default');
    } finally {
      setNamespaceLoading(false);
    }
  };

  const fetchData = async (ns: string) => {
    setLoading(true);
    try {
      // Skip if namespace is empty
      if (!ns) {
        console.warn('Empty namespace, skipping data fetch');
        setLoading(false);
        return;
      }
      
      console.log(`Fetching controllers for namespace: ${ns}`);
      const response = await request<NamespaceControllersResponse>(`/k8s/get/namespaces/${encodeURIComponent(ns)}/controllers`);
      console.log('Controllers API response:', response);
      
      // 更新后的响应格式直接使用数据而不是通过response.data
      if (response) {
        setData(response);
      } else {
        console.error('Invalid response format for controllers');
        // Set empty data on invalid response
        setData({
          namespace: ns,
          deployments: [],
          statefulsets: [],
          daemonsets: []
        });
      }
    } catch (err) {
      console.error('Failed to fetch workload data:', err);
      // Set empty data on error
      setData({
        namespace: ns,
        deployments: [],
        statefulsets: [],
        daemonsets: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize with default namespace
    fetchNamespaces();
  }, []);

  useEffect(() => {
    // Only fetch data if we have a valid namespace
    if (selectedNamespace && selectedNamespace.trim()) {
      fetchData(selectedNamespace);
    }
  }, [selectedNamespace]);

  const resources = data ? data[activeTab] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Namespace:</label>
          <select 
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            disabled={namespaceLoading}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {namespaceLoading ? (
              <option value="">Loading namespaces...</option>
            ) : namespaces.length > 0 ? (
              namespaces.map((ns) => (
                <option key={ns} value={ns}>{ns}</option>
              ))
            ) : (
              <option value="">No namespaces available</option>
            )}
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
