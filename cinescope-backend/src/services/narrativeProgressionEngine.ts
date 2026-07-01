export type NarrativeProgression = {
  summary: string;
  phases: Array<{
    label: string;
    description: string;
  }>;
};

export const NarrativeProgressionEngine = {
  build: (nodes: any[], targetTitle: string): NarrativeProgression => ({
    summary: `A continuity-first path into ${targetTitle}, balancing required story context with emotional momentum.`,
    phases: nodes.slice(0, 5).map((node, index) => ({
      label: `Phase ${index + 1}`,
      description: `${node.title} anchors ${node.emotionalRelevance || "crucial lore"} while clarifying ${node.continuityExplanation || "universe context"}.`,
    })),
  }),
};
