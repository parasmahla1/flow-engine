import type { Prisma, PrismaClient } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import type { NodeKind, PipelineNodeConfig, PipelineSchema } from "@flowengine/shared";
import { defaultConfigForKind, isNodeKind, labelForKind } from "@flowengine/shared";
import { parsePipelinePayload } from "../services/pipelinePayload.js";
import { validatePipeline } from "../services/pipelineValidation.js";

const pipelineInclude = {
  nodes: true,
  edges: true
} as const satisfies Prisma.PipelineInclude;

type PersistedPipeline = Prisma.PipelineGetPayload<{ include: typeof pipelineInclude }>;

interface PipelineParams {
  id: string;
}

const toInputJsonObject = (config: PipelineNodeConfig): Prisma.InputJsonObject =>
  config as unknown as Prisma.InputJsonObject;

const configFromJson = (kind: NodeKind, config: Prisma.JsonValue): PipelineNodeConfig => {
  if (typeof config === "object" && config !== null && !Array.isArray(config)) {
    return {
      ...defaultConfigForKind(kind),
      ...(config as Record<string, unknown>)
    } as PipelineNodeConfig;
  }

  return defaultConfigForKind(kind);
};

const mapPersistedPipeline = (pipeline: PersistedPipeline): PipelineSchema => ({
  id: pipeline.id,
  name: pipeline.name,
  nodes: pipeline.nodes.map((node) => {
    const kind = isNodeKind(node.type) ? node.type : "MOCK_SOURCE";

    return {
      id: node.id,
      type: "pipelineNode",
      kind,
      position: {
        x: node.positionX,
        y: node.positionY
      },
      data: {
        label: labelForKind(kind),
        kind,
        status: "idle",
        config: configFromJson(kind, node.config),
        preview: []
      }
    };
  }),
  edges: pipeline.edges.map((edge) => ({
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    sourceHandle: "output",
    targetHandle: "input"
  }))
});

export const pipelineRoutes = (prisma: PrismaClient): FastifyPluginAsync =>
  async (fastify) => {
    fastify.get("/api/pipelines", async () => {
      const pipelines = await prisma.pipeline.findMany({
        include: pipelineInclude,
        orderBy: { updatedAt: "desc" }
      });

      return pipelines.map(mapPersistedPipeline);
    });

    fastify.post<{ Body: unknown }>("/api/pipelines", async (request, reply) => {
      const payload = parsePipelinePayload(request.body);
      validatePipeline(payload);

      const pipeline = await prisma.pipeline.create({
        data: {
          name: payload.name,
          nodes: {
            create: payload.nodes.map((node) => ({
              id: node.id,
              type: node.kind,
              positionX: node.position.x,
              positionY: node.position.y,
              config: toInputJsonObject(node.data.config)
            }))
          },
          edges: {
            create: payload.edges.map((edge) => ({
              id: edge.id,
              sourceId: edge.source,
              targetId: edge.target
            }))
          }
        },
        include: pipelineInclude
      });

      reply.code(201);
      return mapPersistedPipeline(pipeline);
    });

    fastify.put<{ Params: PipelineParams; Body: unknown }>("/api/pipelines/:id", async (request) => {
      const payload = parsePipelinePayload({ ...parsePipelinePayload(request.body), id: request.params.id });
      validatePipeline(payload);

      const pipeline = await prisma.$transaction(async (transaction) => {
        await transaction.edge.deleteMany({ where: { pipelineId: request.params.id } });
        await transaction.node.deleteMany({ where: { pipelineId: request.params.id } });

        return transaction.pipeline.update({
          where: { id: request.params.id },
          data: {
            name: payload.name,
            nodes: {
              create: payload.nodes.map((node) => ({
                id: node.id,
                type: node.kind,
                positionX: node.position.x,
                positionY: node.position.y,
                config: toInputJsonObject(node.data.config)
              }))
            },
            edges: {
              create: payload.edges.map((edge) => ({
                id: edge.id,
                sourceId: edge.source,
                targetId: edge.target
              }))
            }
          },
          include: pipelineInclude
        });
      });

      return mapPersistedPipeline(pipeline);
    });

    fastify.delete<{ Params: PipelineParams }>("/api/pipelines/:id", async (request, reply) => {
      await prisma.pipeline.delete({ where: { id: request.params.id } });
      reply.code(204);
    });
  };
