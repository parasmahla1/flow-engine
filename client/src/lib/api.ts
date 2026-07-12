import type { PipelineSchema } from "@flowengine/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
};

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
