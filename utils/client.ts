const API_BASE = '/api';

export const request = async <T,>(url: string, options: RequestInit = {}, parseJson: boolean = true): Promise<T> => {
  const token = localStorage.getItem('k8s_token');
  
  const headers = new Headers(options.headers || {});
  // 只有在不是纯文本请求时才设置Content-Type为application/json
  if (parseJson) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('k8s_token');
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || 'Request failed'}`);
  }

  if (parseJson) {
    // 尝试解析JSON响应，如果失败则提供更有用的错误信息
    let data;
    try {
      const text = await response.text();
      if (!text.trim()) {
        throw new Error('Empty response from server');
      }
      data = JSON.parse(text);
    } catch (parseError) {
      if (response.status === 404) {
        throw new Error('API endpoint not found');
      } else if (response.status === 500) {
        throw new Error('Server internal error');
      } else {
        throw new Error(`Failed to parse server response: ${parseError}`);
      }
    }
    return data as T;
  } else {
    // 直接返回文本响应
    return (await response.text()) as T;
  }
};