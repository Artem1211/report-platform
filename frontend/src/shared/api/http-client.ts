import { API_URL } from './config';

const BASE_URL = API_URL;

async function assertOkBody<TResult>(response: Response): Promise<TResult> {
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return JSON.parse((await response.text()) || 'null');
}

export class ApiClient {
  private readonly baseUrl: string;

  private readonly headers = {
    'Content-Type': 'application/json',
    accept: 'application/json',
  };

  constructor(url: string) {
    this.baseUrl = url.endsWith('/') ? url : `${url}/`;
  }

  async get<TResult>(
    endpoint: string,
    queryParams?: Record<string, string | number>,
    config: RequestInit = {},
  ): Promise<TResult> {
    let url = `${this.baseUrl}${endpoint}`;
    if (queryParams) {
      const params = new URLSearchParams(
        Object.entries(queryParams).map(([k, v]) => [k, v.toString()]),
      );
      url += `?${params.toString()}`;
    }

    const response = await fetch(url, {
      ...config,
      method: 'GET',
      headers: { ...this.headers, ...config.headers },
    });

    return assertOkBody(response);
  }

  async post<TResult, TData = Record<string, unknown>>(
    endpoint: string,
    body: TData,
    config: RequestInit = {},
  ): Promise<TResult> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...config,
      method: 'POST',
      headers: { ...this.headers, ...config.headers },
      body: JSON.stringify(body),
    });

    return assertOkBody(response);
  }

  async postForm<TResult>(endpoint: string, body: FormData): Promise<TResult> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body,
    });

    return assertOkBody(response);
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, { method: 'DELETE' });
    return assertOkBody(response);
  }
}

export const apiClient = new ApiClient(BASE_URL);
