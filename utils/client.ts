const API_BASE = '/api';

export const request = async <T,>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('k8s_token');
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
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
  
  if (!response.ok) {
    throw new Error(data.error || data.msg || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
};