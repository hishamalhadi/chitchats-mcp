import { config } from "dotenv";

config();

const CLIENT_ID = process.env.CHITCHATS_CLIENT_ID;
const ACCESS_TOKEN = process.env.CHITCHATS_ACCESS_TOKEN;
const BASE_URL = process.env.CHITCHATS_BASE_URL || "https://chitchats.com";

if (!CLIENT_ID || !ACCESS_TOKEN) {
  console.error(
    "Missing CHITCHATS_CLIENT_ID or CHITCHATS_ACCESS_TOKEN in environment"
  );
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  total?: number;
}

class ChitChatsClient {
  private baseUrl: string;
  private clientId: string;
  private accessToken: string;

  constructor() {
    this.baseUrl = `${BASE_URL}/api/v1/clients/${CLIENT_ID}`;
    this.clientId = CLIENT_ID || "";
    this.accessToken = ACCESS_TOKEN || "";
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: this.accessToken,
      Accept: "application/json",
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        return {
          error: `Rate limited. Retry after ${retryAfter || "unknown"} seconds.`,
          status: 429,
        };
      }

      if (response.status === 204) {
        return { status: 204 };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || data.message || `HTTP ${response.status}`,
          status: response.status,
        };
      }

      return { data, status: response.status };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Unknown error",
        status: 500,
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint);
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, body);
  }

  async patch<T>(
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint);
  }

  // Public tracking endpoint (no auth needed)
  async getPublicTracking(shipmentId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await fetch(
        `${BASE_URL}/tracking/${shipmentId}.json`
      );
      const data = await response.json();
      return { data, status: response.status };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Unknown error",
        status: 500,
      };
    }
  }
}

export const client = new ChitChatsClient();
