import type { JsonObject, JsonValue } from "@flowengine/shared";
import type { PipelineRecord } from "./types.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isJsonValue = (value: unknown): value is JsonValue => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }

  if (isPlainObject(value)) {
    return Object.values(value).every(isJsonValue);
  }

  return false;
};

const toJsonObject = (value: Record<string, unknown>): JsonObject => {
  const output: Record<string, JsonValue> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (isJsonValue(nestedValue)) {
      output[key] = nestedValue;
    }
  }

  return output;
};

export const normalizeJsonRecords = (value: unknown): PipelineRecord[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => (isPlainObject(item) ? [toJsonObject(item)] : []));
  }

  if (isPlainObject(value)) {
    return [toJsonObject(value)];
  }

  if (isJsonValue(value)) {
    return [{ value }];
  }

  return [];
};
