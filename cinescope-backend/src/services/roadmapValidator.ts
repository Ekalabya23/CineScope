import { RoadmapNode } from "./timelineBuilder";

export const RoadmapValidator = {
  sanitizeNodes: (nodes: RoadmapNode[]) =>
    nodes.filter((node, index, list) => {
      const firstIndex = list.findIndex((item) => item.title === node.title);
      return firstIndex === index && Boolean(node.title);
    }),

  validateGeminiOrder: (
    orderedIds: unknown,
    nodes: RoadmapNode[],
    dependencyMap: Record<string, string[]>,
  ): RoadmapNode[] | null => {
    if (!Array.isArray(orderedIds)) return null;

    const ids = orderedIds.filter((id): id is string => typeof id === "string");
    const allowedIds = new Set(nodes.map((node) => node.id));
    const uniqueIds = new Set(ids);

    if (ids.length !== nodes.length || uniqueIds.size !== nodes.length) return null;
    if (ids.some((id) => !allowedIds.has(id))) return null;

    const position = new Map(ids.map((id, index) => [id, index]));
    const dependencyViolation = Object.entries(dependencyMap).some(
      ([entryId, dependencyIds]) =>
        dependencyIds.some((dependencyId) => {
          if (!position.has(entryId) || !position.has(dependencyId)) return false;
          return Number(position.get(dependencyId)) > Number(position.get(entryId));
        }),
    );

    if (dependencyViolation) return null;

    const byId = new Map(nodes.map((node) => [node.id, node]));
    return ids.map((id) => byId.get(id)).filter((node): node is RoadmapNode => Boolean(node));
  },
};
