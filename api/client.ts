
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

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.msg || 'Request failed');
  }

  return data as T;
};
