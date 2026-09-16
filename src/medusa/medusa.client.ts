import { config } from "../config.js";
import { log } from "../logging.js";
import { MedusaHttpError, medusaErrorFromStatus } from "./errors.js";

type HttpMethod = "GET" | "POST" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  query?: Record<string, unknown>;
  body?: unknown;
  token?: string;
  requestId?: string;
};

function toQuery(query?: Record<string, unknown>): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
    } else {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export class MedusaClient {
  constructor(
    private readonly baseUrl = config.medusaBackendUrl,
    private readonly publishableKey = config.medusaPublishableKey
  ) {}

  async getProducts(
    query: Record<string, unknown>,
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ products: unknown[]; count?: number }> {
    return this.request("/store/products", {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async getProduct(
    productId: string,
    query: Record<string, unknown>,
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ product: unknown }> {
    return this.request(`/store/products/${encodeURIComponent(productId)}`, {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async getOrders(
    query: Record<string, unknown>,
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ orders: unknown[]; count?: number }> {
    return this.request("/store/orders", {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async getOrder(
    orderId: string,
    query: Record<string, unknown>,
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ order: unknown }> {
    return this.request(`/store/orders/${encodeURIComponent(orderId)}`, {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async getCustomerMe(
    query: Record<string, unknown>,
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ customer: unknown }> {
    return this.request("/store/customers/me", {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async getCompany(
    companyId: string,
    query: Record<string, unknown> = {},
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ company: unknown }> {
    return this.request(`/store/companies/${encodeURIComponent(companyId)}`, {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async getRegions(
    options: { requestId?: string } = {}
  ): Promise<{ regions: unknown[] }> {
    return this.request("/store/regions", { requestId: options.requestId });
  }

  async getCart(
    cartId: string,
    query: Record<string, unknown> = {},
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ cart: unknown }> {
    return this.request(`/store/carts/${encodeURIComponent(cartId)}`, {
      query,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async createCart(
    body: Record<string, unknown>,
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ cart: unknown }> {
    return this.request("/store/carts", {
      method: "POST",
      body,
      token: options.token,
      requestId: options.requestId,
    });
  }

  async addLineItem(
    cartId: string,
    body: { variant_id: string; quantity: number },
    options: { token?: string; requestId?: string } = {}
  ): Promise<{ cart: unknown }> {
    return this.request(
      `/store/carts/${encodeURIComponent(cartId)}/line-items`,
      {
        method: "POST",
        body,
        token: options.token,
        requestId: options.requestId,
      }
    );
  }

  async deleteLineItem(
    cartId: string,
    lineId: string,
    options: { token?: string; requestId?: string } = {}
  ): Promise<unknown> {
    return this.request(
      `/store/carts/${encodeURIComponent(cartId)}/line-items/${encodeURIComponent(lineId)}`,
      {
        method: "DELETE",
        token: options.token,
        requestId: options.requestId,
      }
    );
  }

  async transferCart(
    cartId: string,
    options: { token?: string; requestId?: string } = {}
  ): Promise<unknown> {
    return this.request(
      `/store/carts/${encodeURIComponent(cartId)}/customer`,
      {
        method: "POST",
        body: {},
        token: options.token,
        requestId: options.requestId,
      }
    );
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}${toQuery(options.query)}`;
    const started = Date.now();
    const headers: Record<string, string> = {
      accept: "application/json",
    };

    if (this.publishableKey) {
      headers["x-publishable-api-key"] = this.publishableKey;
    }

    if (options.token) {
      headers.authorization = `Bearer ${options.token}`;
    }

    if (options.body !== undefined) {
      headers["content-type"] = "application/json";
    }

    let status = 0;

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: AbortSignal.timeout(config.medusaTimeoutMs),
      });

      status = response.status;

      if (!response.ok) {
        throw medusaErrorFromStatus(response.status);
      }

      const text = await response.text();
      const data = (text ? JSON.parse(text) : {}) as T;
      log("medusa.http", {
        requestId: options.requestId,
        path,
        status,
        durationMs: Date.now() - started,
      });
      return data;
    } catch (error) {
      if (error instanceof MedusaHttpError) {
        log("medusa.http", {
          requestId: options.requestId,
          path,
          status: error.status,
          durationMs: Date.now() - started,
          error: error.code,
        });
        throw error;
      }

      const timedOut =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");

      log("medusa.http", {
        requestId: options.requestId,
        path,
        status,
        durationMs: Date.now() - started,
        error: timedOut ? "TIMEOUT" : "NETWORK",
      });

      throw new MedusaHttpError(
        timedOut ? "Medusa request timed out" : "Medusa request failed",
        0,
        timedOut ? "TIMEOUT" : "MEDUSA_ERROR"
      );
    }
  }
}

export const medusaClient = new MedusaClient();
