import type { AuthResponse, AuthUser, PipelineSchema } from "@flowengine/shared";
import { getAuthToken } from "./authToken";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const token = getAuthToken();
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorPayload?.message ?? `Request failed with ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const registerUser = (username: string, password: string): Promise<AuthResponse> =>
  requestJson<AuthResponse>(`${apiUrl}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });

export const loginUser = (username: string, password: string): Promise<AuthResponse> =>
  requestJson<AuthResponse>(`${apiUrl}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password })
  });

export const getCurrentUser = (): Promise<{ user: AuthUser }> =>
  requestJson<{ user: AuthUser }>(`${apiUrl}/api/auth/me`);

export const listPipelines = (): Promise<PipelineSchema[]> =>
  requestJson<PipelineSchema[]>(`${apiUrl}/api/pipelines`);

export const savePipeline = (pipeline: PipelineSchema): Promise<PipelineSchema> => {
  const endpoint = pipeline.id
    ? `${apiUrl}/api/pipelines/${pipeline.id}`
    : `${apiUrl}/api/pipelines`;

  return requestJson<PipelineSchema>(endpoint, {
    method: pipeline.id ? "PUT" : "POST",
    body: JSON.stringify(pipeline)
  });
};
