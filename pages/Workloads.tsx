
import React, { useEffect, useState } from 'react';
import { request } from '../utils/client';
import { NamespaceControllers, ControllerResource, NamespaceListResponse, NamespaceControllersResponse, DeploymentResponse, PodInfo, DeploymentPodsResponse } from '../types';

const Workloads: React.FC = () => {
  const [namespaces, setNamespaces] = useState<string[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [data, setData] = useState<NamespaceControllers | null>(null);
  const [loading, setLoading] = useState(true);
  const [namespaceLoading, setNamespaceLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'deployments' | 'statefulsets' | 'daemonsets'>('deployments');
  const [restarting, setRestarting] = useState<string | null>(null); // 用于跟踪正在重启的Deployment
  
  // 通知状态管理
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });
  
  // Pod信息状态管理
  const [selectedDeployment, setSelectedDeployment] = useState<string | null>(null); // 当前选中的Deployment名称
  const [podsData, setPodsData] = useState<PodInfo[]>([]); // 选中Deployment的Pod列表
  const [podsLoading, setPodsLoading] = useState(false); // Pod数据加载状态
  const [showPodDetails, setShowPodDetails] = useState(false); // 是否显示Pod详情面板
  
  // 日志相关状态管理
  const [selectedPod, setSelectedPod] = useState<string | null>(null); // 当前选中的Pod名称
  const [logsContent, setLogsContent] = useState<string>(''); // 日志内容
  const [logsLoading, setLogsLoading] = useState(false); // 日志加载状态
  const [showLogsPanel, setShowLogsPanel] = useState(false); // 是否显示日志面板
  const [tailLines, setTailLines] = useState<number>(100); // 日志行数，默认100
  const [followLogs, setFollowLogs] = useState<boolean>(false); // 是否实时跟踪日志
  const [downloading, setDownloading] = useState<boolean>(false); // 下载中状态
  
  // 使用ref来存储abortController，确保能立即访问到最新实例
  const abortControllerRef = React.useRef<AbortController | null>(null);

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
    console.log('🔄 Starting fetchData for namespace:', ns);
    try {
      // Skip if namespace is empty
      if (!ns) {
        console.warn('⚠️  Empty namespace, skipping data fetch');
        setLoading(false);
        return;
      }
      
      let apiUrl = '';
      let response: any = null;
      
      // 根据当前选中的标签页获取不同类型的资源数据
      switch (activeTab) {
        case 'deployments':
          apiUrl = `/k8s/get/deployment/${encodeURIComponent(ns)}`;
          break;
        case 'statefulsets':
          apiUrl = `/k8s/get/statefulset/${encodeURIComponent(ns)}`;
          break;
        case 'daemonsets':
          apiUrl = `/k8s/get/daemonset/${encodeURIComponent(ns)}`;
          break;
        default:
          apiUrl = `/k8s/get/deployment/${encodeURIComponent(ns)}`;
      }
      
      console.log('🔗 API URL being called:', apiUrl);
      console.log('🌐 Active tab:', activeTab);
      
      // 使用统一的request函数发送请求，已通过.env.local管理API地址
      response = await request<any>(apiUrl);
      console.log('📦 Raw API response for namespace', ns, ':', response);
      
      // 初始化数据对象
      const newData = {
        namespace: ns,
        deployments: [] as ControllerResource[],
        statefulsets: [] as ControllerResource[],
        daemonsets: [] as ControllerResource[]
      };
      
      // 根据当前标签页和响应数据更新相应的资源列表
      if (response && response.Status) {
        console.log('📊 Response contains', response.Status.length, `${activeTab}`);
        
        // 转换响应数据为统一格式
        const resources = response.Status.map((item: any) => {
          const readyMatch = item.status.match(/\((\d+)\/(\d+)\)/);
          const ready = readyMatch ? parseInt(readyMatch[1], 10) : 0;
          
          return {
            name: item.name,
            replicas: item.replicas,
            images: [], // API doesn't provide images, set empty array
            ready: ready,
            updated: ready, // Assume all ready replicas are updated
            available: ready, // Assume all ready replicas are available
            created_at: item.update_time, // Use update_time as created_at
            update_at: item.update_time,
            port: 0 // API doesn't provide port, set default to 0
          };
        });
        
        // 根据当前标签页设置对应资源列表
        switch (activeTab) {
          case 'deployments':
            newData.deployments = resources;
            break;
          case 'statefulsets':
            newData.statefulsets = resources;
            break;
          case 'daemonsets':
            newData.daemonsets = resources;
            break;
        }
        
        console.log('✅ Setting data for namespace', ns, 'with', resources.length, `${activeTab}`);
      } else {
        console.error('❌ Invalid response format for controllers');
        console.error('   - Response keys:', Object.keys(response || {}));
        console.error('   - Has Status property:', response && 'Status' in response);
      }
      
      setData(newData);
    } catch (err) {
      console.error('❌ Failed to fetch workload data for namespace', ns, ':', err);
      // Set empty data on error
      setData({
        namespace: ns,
        deployments: [],
        statefulsets: [],
        daemonsets: []
      });
    } finally {
      setLoading(false);
      console.log('🔚 Finished fetchData for namespace:', ns);
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
      // 当命名空间改变时，关闭Pod详情面板并清除相关状态
      setShowPodDetails(false);
      setSelectedDeployment(null);
      setPodsData([]);
      
      // 关闭日志面板并清除日志相关状态
      setShowLogsPanel(false);
      setSelectedPod(null);
      setLogsContent('');
      setFollowLogs(false);
      
      // 关闭SSE连接
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
  }, [selectedNamespace, activeTab]);

  // 显示通知的函数
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      message: message,
      type: type,
      visible: true
    });
    
    // 3秒后自动隐藏通知
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // 获取控制器资源的Pod信息（支持Deployment、StatefulSet、DaemonSet）
  const fetchControllerPods = async (name: string) => {
    try {
      setPodsLoading(true);
      console.log(`🔍 Fetching Pods for ${activeTab}: ${name} in namespace: ${selectedNamespace}`);
      
      // 根据当前标签页选择API端点
      let apiUrl = '';
      switch (activeTab) {
        case 'deployments':
          apiUrl = '/k8s/deployment/pods';
          break;
        case 'statefulsets':
          apiUrl = '/k8s/statefulset/pods';
          break;
        case 'daemonsets':
          apiUrl = '/k8s/daemonset/pods';
          break;
        default:
          apiUrl = '/k8s/deployment/pods';
      }
      
      // 发送POST请求到获取Pod信息接口，格式：{ "name": "calico-node", "namespace": "kube-system" }
      const response = await request<DeploymentPodsResponse>(apiUrl, {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          namespace: selectedNamespace
        })
      });
      
      console.log('✅ Pods fetched successfully:', response);
      
      // 更新Pod数据
      setPodsData(response.data || []);
      setSelectedDeployment(name);
      setShowPodDetails(true);
      
      // 关闭日志面板（如果打开的话）
      setShowLogsPanel(false);
      setSelectedPod(null);
      setLogsContent('');
      // 关闭SSE连接
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setFollowLogs(false);
    } catch (err) {
      console.error(`❌ Failed to fetch ${activeTab} Pods:`, err);
      showNotification(`获取 ${activeTab} ${name} 的 Pod 信息失败: ${err.message}`, 'error');
    } finally {
      setPodsLoading(false);
    }
  };
  
  // 重启Deployment的函数
  const handleRestartDeployment = async (name: string) => {
    try {
      setRestarting(name); // 设置正在重启的Deployment名称
      console.log(`🔄 Restarting Deployment: ${name} in namespace: ${selectedNamespace}`);
      
      // 发送POST请求到重启接口
      const response = await request<any>('/k8s/restart/deployment', {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          namespace: selectedNamespace
        })
      });
      
      console.log('✅ Deployment restarted successfully:', response);
      
      // 重启成功后刷新数据
      await fetchData(selectedNamespace);
      
      // 显示成功通知
      showNotification(`Deployment ${name} 已成功重启`, 'success');
    } catch (err) {
      console.error('❌ Failed to restart Deployment:', err);
      // 显示错误通知
      showNotification(`重启 Deployment ${name} 失败: ${err.message}`, 'error');
    } finally {
      setRestarting(null); // 清除重启状态
    }
  };
  
  // 获取Pod日志的函数（GET请求）
  const fetchLogs = async (podName: string, namespace: string, tail: number, follow: boolean) => {
    try {
      setLogsLoading(true);
      // 关闭之前的SSE连接
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // 重置状态
      setFollowLogs(false);
      
      // 优化日志行数处理：如果tail为0或空，使用默认值100
      const actualTail = tail || 100;
      // 更新tailLines状态，确保UI显示正确的值
      if (tailLines !== actualTail) {
        setTailLines(actualTail);
      }
      
      const apiUrl = `/k8s/pod/logs/${encodeURIComponent(namespace)}/${encodeURIComponent(podName)}?tail=${actualTail}`;
      console.log('🔗 Fetching logs from:', apiUrl);
      
      const response = await request<string>(apiUrl, {
        method: 'GET'
      }, false);
      
      console.log('✅ Logs fetched successfully');
      setLogsContent(response);
      
      // 如果需要实时跟踪，启动SSE连接
      if (follow) {
        startSSELogs(podName, namespace, actualTail);
      }
    } catch (err) {
      console.error('❌ Failed to fetch logs:', err);
      showNotification(`获取日志失败: ${err.message}`, 'error');
      setLogsContent(`Error fetching logs: ${err.message}`);
    } finally {
      setLogsLoading(false);
    }
  };
  
  // 启动SSE连接获取实时日志
  const startSSELogs = (podName: string, namespace: string, tail: number) => {
    try {
      // 如果已经有活跃的连接，先关闭
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // 创建新的AbortController
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const token = localStorage.getItem('k8s_token');
      // 使用相对URL，并添加API_BASE前缀，与request函数保持一致
      const API_BASE = '/api';
      const apiUrl = `${API_BASE}/k8s/pod/logs/${encodeURIComponent(namespace)}/${encodeURIComponent(podName)}?tail=${tail}&follow=true`;
      
      console.log('🔗 Starting SSE logs from:', apiUrl);
      
      // 使用fetch API创建一个带有headers和signal的连接
      fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        cache: 'no-cache',
        credentials: 'include',
        signal: controller.signal // 添加signal用于取消请求
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // 检查是否是SSE响应
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/event-stream')) {
          throw new Error('Expected text/event-stream response');
        }
        
        // 创建一个自定义的EventSource-like对象
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No readable stream');
        }
        
        let buffer = '';
        
        // 处理流数据
        const processStream = async () => {
          try {
            const { done, value } = await reader.read();
            
            if (done) {
              // 流结束
              showNotification('实时日志连接已断开', 'error');
              setFollowLogs(false);
              abortControllerRef.current = null;
              return;
            }
            
            // 将新数据添加到缓冲区
            buffer += new TextDecoder().decode(value);
            
            // 处理缓冲区中的事件
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';
            
            for (const event of events) {
              if (!event.trim()) continue;
              
              // 解析事件数据
              const lines = event.split('\n');
              let data = '';
              
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const lineData = line.slice(5).trim();
                  if (lineData) { // 只处理非空数据行
                    data += lineData + '\n';
                  }
                }
              }
              
              if (data) {
                // 更新日志内容
                setLogsContent(prev => prev + data);
              }
            }
            
            // 继续处理流
            processStream();
          } catch (err: any) {
            // 检查是否是由于abort导致的错误
            if (err.name !== 'AbortError') {
              console.error('❌ SSE stream processing error:', err);
              showNotification('实时日志连接已断开', 'error');
            }
            setFollowLogs(false);
            abortControllerRef.current = null;
          }
        };
        
        // 开始处理流
        processStream();
        setFollowLogs(true);
        
      }).catch((err: any) => {
        // 检查是否是由于abort导致的错误
        if (err.name !== 'AbortError') {
          console.error('❌ SSE connection error:', err);
          showNotification(`启动实时日志失败: ${err.message}`, 'error');
        }
        setFollowLogs(false);
        abortControllerRef.current = null;
      });
    } catch (err: any) {
      console.error('❌ Failed to start SSE logs:', err);
      showNotification(`启动实时日志失败: ${err.message}`, 'error');
      setFollowLogs(false);
      abortControllerRef.current = null;
    }
  };
  
  // 切换实时日志跟踪状态
  const toggleFollowLogs = () => {
    if (!selectedPod) return;
    
    if (followLogs) {
      // 关闭实时跟踪
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // 先设置followLogs为false，确保UI立即更新
      setFollowLogs(false);
    } else {
      // 开启实时跟踪
      startSSELogs(selectedPod, selectedNamespace, tailLines);
    }
  };
  
  // 下载日志功能
  const downloadLogs = () => {
    if (!logsContent || !selectedPod) return;
    
    try {
      setDownloading(true);
      
      // 创建Blob对象，使用UTF-8编码
      const blob = new Blob([logsContent], { type: 'text/plain;charset=utf-8' });
      
      // 设置文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${selectedPod}-logs-${timestamp}-${tailLines}lines.txt`;
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // 设置下载属性
      a.href = url;
      a.download = filename;
      
      // 触发下载
      document.body.appendChild(a);
      
      // 使用requestAnimationFrame确保浏览器有足够时间处理
      requestAnimationFrame(() => {
        a.click();
        
        // 清理DOM元素
        document.body.removeChild(a);
        
        // 清理URL对象
        URL.revokeObjectURL(url);
        
        // 直接设置下载完成，因为我们无法真正监听浏览器的下载完成事件
        // 这里的实现是：文件已经成功生成并触发了下载，浏览器会处理后续的下载过程
        setDownloading(false);
        
        // 显示下载触发成功通知，而不是下载完成通知
        showNotification(`日志下载已触发: ${filename}`, 'success');
      });
    } catch (err) {
      console.error('❌ Failed to download logs:', err);
      showNotification(`下载日志失败: ${err.message}`, 'error');
      setDownloading(false);
    }
  };

  const resources = data ? data[activeTab] : [];

  return (
    <div className="space-y-6">
      {/* 通知组件 */}
      {notification.visible && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform translate-y-0 opacity-100
          ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
        `}>
          <div className="flex items-center gap-2">
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
      
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
                    <td className="px-6 py-4 font-medium">
                      <button 
                        className="text-blue-600 hover:underline cursor-pointer"
                        onClick={() => fetchControllerPods(item.name)}
                      >
                        {item.name}
                      </button>
                    </td>
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
                      <button 
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleRestartDeployment(item.name)}
                        disabled={restarting === item.name}
                      >
                        {restarting === item.name ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          'Restart'
                        )}
                      </button>
                      <button className="text-slate-400 hover:text-red-600 px-3 py-1 rounded transition-colors"><i className="fas fa-ellipsis-v"></i></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pod详情面板 */}
      {showPodDetails && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {selectedDeployment} - Pods ({podsData.length})
              </h2>
              <p className="text-sm text-slate-500">Namespace: {selectedNamespace}</p>
            </div>
            <button 
              className="text-slate-400 hover:text-slate-600" 
              onClick={() => setShowPodDetails(false)}
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Pod Name</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Restarts</th>
                  <th className="px-6 py-4 font-semibold">Node</th>
                  <th className="px-6 py-4 font-semibold">Pod IP</th>
                  <th className="px-6 py-4 font-semibold">Ports</th>
                  <th className="px-6 py-4 font-semibold">Created At</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {podsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                      <p>Loading pods...</p>
                    </td>
                  </tr>
                ) : podsData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">No pods found for this deployment</td>
                  </tr>
                ) : (
                  podsData.map((pod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{pod.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pod.status === 'Running' ? 'bg-green-100 text-green-800' : pod.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {pod.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{pod.restart_count}</td>
                      <td className="px-6 py-4 text-slate-600">{pod.node_name}</td>
                      <td className="px-6 py-4 text-slate-600">{pod.pod_ip}</td>
                      <td className="px-6 py-4">
                        {pod.ports && pod.ports.length > 0 ? (
                          pod.ports.map((port, i) => (
                            <span key={i} className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 text-xs mr-1 mb-1">
                              {port}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(pod.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
              className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded transition-colors text-sm"
              onClick={() => {
                // 点击新Pod时，先关闭当前日志面板，再重新初始化
                setShowLogsPanel(false);
                // 使用setTimeout确保状态更新后再执行后续操作
                setTimeout(() => {
                  // 清除之前的日志和状态
                  setSelectedPod(pod.name);
                  setLogsContent('');
                  setFollowLogs(false);
                  setTailLines(100); // 重置为默认值100行
                  // 关闭之前的SSE连接
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                    abortControllerRef.current = null;
                  }
                  setShowLogsPanel(true);
                  // 初始加载日志
                  fetchLogs(pod.name, selectedNamespace, 100, false);
                }, 0);
              }}
            >
              <i className="fas fa-file-alt mr-1"></i> Logs
            </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 日志面板 */}
      {showLogsPanel && selectedPod && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {selectedPod} - Logs
              </h2>
              <p className="text-sm text-slate-500">Namespace: {selectedNamespace}</p>
            </div>
            <button 
              className="text-slate-400 hover:text-slate-600" 
              onClick={() => {
                // 关闭日志面板时断开SSE连接并重置状态
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                  abortControllerRef.current = null;
                }
                setFollowLogs(false);
                setShowLogsPanel(false);
                setSelectedPod(null);
                setLogsContent('');
              }}
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          </div>
          
          {/* 日志控制面板 */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Tail Lines:</label>
              <input 
                type="text" 
                maxLength={4}
                value={tailLines === 0 ? '' : tailLines}
                onChange={(e) => {
                  // 允许完全清空输入框
                  const value = e.target.value;
                  if (value === '') {
                    // 允许状态为0，后续在fetchLogs中处理
                    setTailLines(0);
                    return;
                  }
                  // 只允许输入数字
                  if (/^\d*$/.test(value)) {
                    const numValue = parseInt(value) || 0;
                    setTailLines(numValue);
                  }
                }}
                onKeyPress={(e) => {
                  // 允许通过回车键刷新日志
                  if (e.key === 'Enter' && selectedPod) {
                    fetchLogs(selectedPod, selectedNamespace, tailLines, false);
                  }
                }}
                className="w-20 px-3 py-1.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Follow:</label>
              <button 
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${followLogs ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}
                onClick={() => toggleFollowLogs()}
                disabled={logsLoading}
              >
                {followLogs ? 'Following' : 'Follow'}
              </button>
            </div>
            
            <button 
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fetchLogs(selectedPod, selectedNamespace, tailLines, false)}
              disabled={logsLoading}
            >
              {logsLoading ? (
                <i className="fas fa-spinner fa-spin mr-1"></i>
              ) : (
                <i className="fas fa-sync-alt mr-1"></i>
              )}
              Refresh
            </button>
            
            <button 
              className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={downloadLogs}
              disabled={!logsContent || logsLoading || downloading}
            >
              {downloading ? (
                <i className="fas fa-spinner fa-spin mr-1"></i>
              ) : (
                <i className="fas fa-download mr-1"></i>
              )}
              {downloading ? 'Downloading...' : 'Download Logs'}
            </button>
          </div>
          
          {/* 日志内容展示区域 */}
          <div className="p-6 bg-slate-900 rounded-b-xl overflow-auto max-h-96">
            {logsLoading ? (
              <div className="text-center py-8 text-slate-400">
                <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Loading logs...</p>
              </div>
            ) : (
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono">{logsContent || 'No logs available'}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workloads;
