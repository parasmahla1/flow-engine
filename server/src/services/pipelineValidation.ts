import type { PipelineSchema } from "@flowengine/shared";
import { validateNodeConfig } from "./configValidation.js";
import { validateDag, type DagValidationResult } from "./dag.js";

export const validatePipeline = (pipeline: PipelineSchema): DagValidationResult => {
  for (const node of pipeline.nodes) {
    validateNodeConfig(node);
  }

  return validateDag(pipeline.nodes, pipeline.edges);
};
