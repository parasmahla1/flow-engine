import type { PipelineSchema } from "@flowengine/shared";
import { validateNodeConfig } from "./configValidation.js";
import { validateDag, type DagValidationResult } from "./dag.js";

export const validatePipeline = (pipeline: PipelineSchema): DagValidationResult => {
  for (const node of pipeline.nodes) {
    validateNodeConfig(node);
  }

  return validateDag(pipeline.nodes, pipeline.edges);
};

export const validatePipelineForSave = (pipeline: PipelineSchema): void => {
  if (pipeline.nodes.length === 0) {
    if (pipeline.edges.length > 0) {
      throw new Error("Draft pipelines cannot contain edges without nodes.");
    }

    return;
  }

  validatePipeline(pipeline);
};
